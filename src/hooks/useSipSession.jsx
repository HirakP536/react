/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Inviter, SessionState, UserAgent } from "sip.js";
import ringtone from "../assets/phone/ringtone_1.mp3";
import earlytone from "../assets/phone/earlytone.mp3";
import { store } from "../store/Index";
import {
  addSession,
  resetSessions,
  setModalOpenFlag,
  setMuted,
  setOnHold,
} from "../store/slices/callFeatureSlice";
import {
  clearIncomingCall,
  removeLine,
  setActiveLine,
  setCallDuration,
  setCallType,
  setIncomingCall,
  updateLineState,
} from "../store/slices/sipSlice";
import { setHoldState } from "../utils/hold";
import useSipAgentRef from "./useSipAgentRef";
import { SipSessionRegistry } from "../helpers/sipSessionRegistry";
import { CallSessionManager } from "../helpers/callSessionManager";

const useSipSession = (audioRef) => {
  const dispatch = useDispatch();
  const { userAgentRef } = useSipAgentRef();
  const attendedSessionRef = useRef(null);
  const sessionRef = useRef(null);
  const linesRef = useRef({});
  const activeLineRef = useRef(null);
  const sessionMapRef = useRef({});
  const timerRef = useRef({});
  const sipDomain = useSelector((state) => state.auth?.user?.data?.timeZone);
  const isDNDActive = useSelector((state) => state.callFeature.isDNDActive);
  const maxLines = 3;
  const ringtoneRef = useRef(null);

  const earlyToneRef = useRef(null);

  const playRingtone = () => {
    if (!ringtoneRef.current) {
      ringtoneRef.current = document.createElement("audio");
      ringtoneRef.current.src = ringtone;
      ringtoneRef.current.loop = true;
      ringtoneRef.current.volume = 1.0;
      ringtoneRef.current.autoplay = true;
      ringtoneRef.current.play().catch((err) => {
        console.warn("Error playing ringtone:", err);
      });
    } else {
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current.play().catch((err) => {
        console.warn("Error playing ringtone:", err);
      });
    }
  };
  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current.remove();
      ringtoneRef.current = null;
    }
  };

  const playEarlyTone = () => {
    if (!earlyToneRef.current) {
      earlyToneRef.current = document.createElement("audio");
      earlyToneRef.current.src = earlytone;
      earlyToneRef.current.loop = true;
      earlyToneRef.current.volume = 0.7;
      earlyToneRef.current.autoplay = true;
      earlyToneRef.current.play().catch((err) => {
        console.warn("Error playing early tone:", err);
      });
    } else {
      earlyToneRef.current.currentTime = 0;
      earlyToneRef.current.play().catch((err) => {
        console.warn("Error playing early tone:", err);
      });
    }
  };

  const stopEarlyTone = () => {
    if (earlyToneRef.current) {
      earlyToneRef.current.pause();
      earlyToneRef.current.currentTime = 0;
      earlyToneRef.current.remove();
      earlyToneRef.current = null;
    }
  };

  const getNextAvailableLineId = () => {
    const currentLines = Object.keys(linesRef.current).map(Number);
    for (let i = 1; i <= maxLines; i++) {
      if (!currentLines.includes(i)) return i;
    }
    return null;
  };

  const switchToLine = async (lineId) => {
    if (!lineId || !linesRef.current[lineId]) {
      console.warn("❌ Cannot switch to nonexistent line:", lineId);
      return false;
    }
    if (
      activeLineRef.current &&
      linesRef.current[activeLineRef.current] &&
      linesRef.current[activeLineRef.current].session &&
      !linesRef.current[activeLineRef.current].onHold
    ) {
      try {
        const currentSession = linesRef.current[activeLineRef.current].session;
        if (currentSession.state === SessionState.Established) {
          await setHoldState(currentSession, true);
          linesRef.current[activeLineRef.current].onHold = true;
          dispatch(
            updateLineState({
              lineId: activeLineRef.current,
              data: { onHold: true },
            })
          );
        }
      } catch (err) {
        console.error(
          `❌ Failed to put line ${activeLineRef.current} on hold:`,
          err
        );
      }
    }

    activeLineRef.current = lineId;
    sessionRef.current = linesRef.current[lineId].session;
    if (linesRef.current[lineId].onHold) {
      try {
        await setHoldState(sessionRef.current, false);
        linesRef.current[lineId].onHold = false;
        dispatch(
          updateLineState({
            lineId: lineId,
            data: { onHold: false },
          })
        );
      } catch (err) {
        console.error(`❌ Failed to take line ${lineId} off hold:`, err);
      }
    }
    if (sessionRef.current?.sessionDescriptionHandler?.peerConnection) {
      const pc = sessionRef.current.sessionDescriptionHandler.peerConnection;
      attachAudioStream(pc);

      const lineData = linesRef.current[lineId];
      const audioSender = pc
        .getSenders()
        .find((s) => s.track?.kind === "audio");
      if (audioSender?.track && lineData && lineData.muted !== undefined) {
        audioSender.track.enabled = !lineData.muted;
        dispatch(setMuted(lineData.muted));
      }
    }

    dispatch(setActiveLine(lineId));
    const lineData = linesRef.current[lineId];
    if (lineData && lineData.startTime) {
      const elapsed = Math.floor((Date.now() - lineData.startTime) / 1000);
      dispatch(setCallDuration(elapsed));
    }

    return true;
  };

  const getActiveLines = () => {
    return Object.entries(linesRef.current).map(([lineId, data]) => ({
      lineId: Number(lineId),
      active: activeLineRef.current === Number(lineId),
      onHold: data.onHold,
      direction: data.direction,
      phone: data.phone,
      displayName: data.displayName,
      startTime: data.startTime,
      state: data.session?.state,
    }));
  };

  const attachAudioStream = (pc) => {
    if (!audioRef?.current) return;

    const remoteStream = new MediaStream();

    pc.getReceivers().forEach((receiver) => {
      if (receiver.track && receiver.track.kind === "audio") {
        remoteStream.addTrack(receiver.track);
      }
    });

    pc.ontrack = (event) => {
      if (event.track.kind === "audio") {
        remoteStream.addTrack(event.track);
      }
      audioRef.current.srcObject = remoteStream;
      audioRef.current
        .play()
        .catch((err) =>
          console.warn("Audio play error (autoplay blocked?)", err)
        );
    };

    audioRef.current.srcObject = remoteStream;
  };

  const attachSessionEvents = (sipSession, lineId) => {
    if (!lineId) {
      for (const [id, data] of Object.entries(linesRef.current)) {
        if (data.session === sipSession) {
          lineId = Number(id);
          break;
        }
      }
    }

    // Store in global registry for persistence
    SipSessionRegistry.set(sipSession.id, sipSession);
    sipSession.stateChange.addListener((state) => {
      // Get the call direction (incoming or outgoing)
      const callDirection = linesRef.current[lineId]?.direction || "unknown";

      if (state === SessionState.Established) {
        const pc = sipSession.sessionDescriptionHandler?.peerConnection;
        attachAudioStream(pc);

        if (lineId) {
          if (timerRef.current[lineId]) {
            clearInterval(timerRef.current[lineId]);
          }
          timerRef.current[lineId] = setInterval(() => {
            if (activeLineRef.current === lineId) {
              dispatch(setCallDuration());
            }
          }, 1000);

          dispatch(
            updateLineState({
              lineId: lineId,
              data: { ringing: false, active: true },
            })
          );
        }

        stopRingtone(); // Stop incoming call ringtone

        // Stop early tone when call is established (for outgoing calls)
        if (callDirection === "outgoing") {
          console.log("📞 Outgoing call established, stopping early tone");
          stopEarlyTone();
        }
      } else if (
        state === SessionState.Terminating ||
        state === SessionState.Terminated ||
        state === SessionState.Failed
      ) {
        // Handle call termination (either in progress, failed, or completed)

        SipSessionRegistry.remove(sipSession.id);

        // Stop early tone if this was an outgoing call
        if (callDirection === "outgoing") {
          console.log(
            `📞 Outgoing call ${state.toLowerCase()}, stopping early tone`
          );
          stopEarlyTone();
        }

        if (lineId && timerRef.current[lineId]) {
          clearInterval(timerRef.current[lineId]);
          delete timerRef.current[lineId];
          if (activeLineRef.current === lineId) {
            dispatch(setCallDuration(0));
          }
        }

        if (lineId) {
          dispatch(removeLine(lineId));
          delete linesRef.current[lineId];

          if (activeLineRef.current === lineId) {
            activeLineRef.current = null;
            sessionRef.current = null;

            const remainingLines = Object.keys(linesRef.current);
            if (remainingLines.length > 0) {
              switchToLine(Number(remainingLines[0]));
            } else {
              dispatch(clearIncomingCall());
              dispatch(resetSessions());
            }
          }
        } else if (sessionRef.current === sipSession) {
          sessionRef.current = null;
          dispatch(clearIncomingCall());
          dispatch(resetSessions());
        }

        stopRingtone();
      }
    });

    sipSession.delegate = {
      onTrack: () => {
        const pc = sipSession.sessionDescriptionHandler?.peerConnection;
        if (pc) {
          attachAudioStream(pc);
        }
      },
    };
  };

  const makeCall = ({ phone, selectedNumber, onSession }) => {
    if (!userAgentRef.current) {
      console.warn("User agent not ready");
      return null;
    }
    if (!sipDomain) {
      console.warn("sipDomain is not available");
      return null;
    }

    // Check if we have an available line
    const lineId = getNextAvailableLineId();
    if (lineId === null) {
      console.warn("❌ All lines are in use, cannot make call");
      return null;
    }

    const target = UserAgent.makeURI(`sip:${phone}@${sipDomain}`);
    const inviter = new Inviter(userAgentRef.current, target, {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false },
      },
      extraHeaders: [`X-OverrideCID: ${selectedNumber}`],
    });

    // Store in the registry for persistence
    SipSessionRegistry.set(inviter.id, inviter);

    linesRef.current[lineId] = {
      session: inviter,
      active: true,
      onHold: false,
      muted: false,
      direction: "outgoing",
      phone: phone,
      displayName: "",
      startTime: new Date(),
    };

    // Update the line state in Redux for UI reflection
    dispatch(
      updateLineState({
        lineId: lineId,
        data: {
          phone: phone,
          displayName: phone,
          onHold: false,
          muted: false,
          direction: "outgoing",
          active: true,
          ringing: false,
        },
      })
    ); // Put any currently active calls on hold before making this the active session
    const prevActiveLineId = activeLineRef.current;
    if (
      prevActiveLineId !== null &&
      linesRef.current[prevActiveLineId]?.session?.state ===
        SessionState.Established &&
      !linesRef.current[prevActiveLineId]?.ringing
    ) {
      try {
        linesRef.current[prevActiveLineId].onHold = true;

        dispatch(
          updateLineState({
            lineId: prevActiveLineId,
            data: {
              onHold: true,
              heldBy: "auto-hold",
            },
          })
        );
        dispatch(setOnHold(true));
        setHoldState(linesRef.current[prevActiveLineId].session, true);
      } catch (err) {
        console.warn(
          `❗ Failed to hold line ${prevActiveLineId} before switching`,
          err
        );
      }
    }
    activeLineRef.current = lineId;
    sessionRef.current = inviter;
    sessionMapRef.current[inviter.id] = inviter;
    dispatch(setActiveLine(lineId));
    dispatch(setMuted(false));
    dispatch(setCallType("outgoing"));
    dispatch(
      addSession({
        id: inviter.id,
        data: {
          session: inviter,
          direction: "outgoing",
          phone,
          lineId,
          startedAt: new Date().toISOString(),
        },
      })
    ); // Play early tone for outgoing call
    playEarlyTone();

    inviter
      .invite()
      .then(() => {
        attachSessionEvents(inviter, lineId);
        if (typeof onSession === "function") onSession(inviter);
      })
      .catch((err) => {
        console.error("❌ Call failed", err);
        stopEarlyTone(); // Stop early tone if call fails
        delete linesRef.current[lineId];
        if (activeLineRef.current === lineId) {
          activeLineRef.current = null;
          sessionRef.current = null;
        }
      });

    return lineId;
  };

  const acceptCall = async () => {
    let session = null;
    let lineId = null;

    const incomingCallData = store.getState().sip.incomingCall;
    if (incomingCallData && incomingCallData.sessionId) {
      // First check in the global registry
      session = SipSessionRegistry.get(incomingCallData.sessionId);

      if (sessionMapRef.current[incomingCallData.sessionId]) {
        const sessionData = sessionMapRef.current[incomingCallData.sessionId];
        session = sessionData.session;
        lineId = sessionData.lineId;
      }
    }

    if (!session) {
      for (const [id, lineData] of Object.entries(linesRef.current)) {
        if (lineData.ringing && lineData.session) {
          session = lineData.session;
          lineId = Number(id);
          break;
        }
      }
    }

    if (!session && sessionRef.current) {
      session = sessionRef.current;
    }

    if (!session) {
      const sessionEntry = Object.entries(sessionMapRef.current).find(
        ([, data]) => data.session?.state === SessionState.Initial
      );

      if (sessionEntry) {
        const [data] = sessionEntry;
        session = data.session;
        lineId = data.lineId;
      }
    }

    if (!session) {
      console.warn("🚫 No session to accept");
      return;
    }

    try {
      stopRingtone();
      const caller = session.remoteIdentity?.uri?.user || "";
      const displayName = session.remoteIdentity?.displayName || "";

      if (lineId === null) {
        lineId = getNextAvailableLineId();
        if (lineId === null) {
          console.error(`📞 No available line to accept call, rejecting`);
          session?.reject();
          return;
        }
      }

      if (
        activeLineRef.current !== null &&
        activeLineRef.current !== lineId &&
        linesRef.current[activeLineRef.current] &&
        linesRef.current[activeLineRef.current].session
      ) {
        try {
          const currentSession =
            linesRef.current[activeLineRef.current].session;
          if (currentSession.state === SessionState.Established) {
            await setHoldState(currentSession, true);
            linesRef.current[activeLineRef.current].onHold = true;
            dispatch(
              updateLineState({
                lineId: activeLineRef.current,
                data: { onHold: true },
              })
            );
          }
        } catch (err) {
          console.warn(
            `❗ Failed to hold line ${activeLineRef.current} before accepting call`,
            err
          );
        }
      }
      await session.accept({
        sessionDescriptionHandlerOptions: {
          constraints: { audio: true, video: false },
        },
      });

      SipSessionRegistry.set(session.id, session);

      if (linesRef.current[lineId]) {
        linesRef.current[lineId].active = true;
        linesRef.current[lineId].onHold = false;
        linesRef.current[lineId].muted = false;
        linesRef.current[lineId].ringing = false;
      } else {
        linesRef.current[lineId] = {
          session: session,
          active: true,
          onHold: false,
          muted: false,
          direction: "incoming",
          phone: caller,
          displayName: displayName,
          startTime: new Date(),
          ringing: false,
        };
      }

      activeLineRef.current = lineId;
      sessionRef.current = session;

      dispatch(
        addSession({
          id: session.id,
          data: {
            direction: "incoming",
            phone: caller,
            lineId: lineId,
            startedAt: new Date().toISOString(),
          },
        })
      );

      dispatch(setActiveLine(lineId));
      const lineStateUpdate = {
        lineId: lineId,
        data: {
          phone: caller,
          displayName: displayName,
          onHold: false,
          muted: false,
          direction: "incoming",
          ringing: false,
        },
      };
      dispatch(setCallType("unknown"));
      dispatch(updateLineState(lineStateUpdate));
      dispatch(clearIncomingCall());
      attachSessionEvents(session, lineId);
      if (timerRef.current[lineId]) {
        clearInterval(timerRef.current[lineId]);
      }

      timerRef.current[lineId] = setInterval(() => {
        if (activeLineRef.current === lineId) {
          dispatch(setCallDuration());
        }
      }, 1000);

      if (session.sessionDescriptionHandler?.peerConnection) {
        const pc = session.sessionDescriptionHandler.peerConnection;
        attachAudioStream(pc);
      }
    } catch (error) {
      console.error("❌ Failed to accept call:", error);
      stopRingtone();
    }
  };
  const holdCall = async (specificLineId = null) => {
    const lineId =
      specificLineId !== null ? specificLineId : activeLineRef.current;

    if (lineId === null || !linesRef.current[lineId]) {
      console.warn("🚫 No active line to put on hold");
      return;
    }

    const session = linesRef.current[lineId].session;
    if (!session) {
      console.warn(`🚫 No session on line ${lineId}`);
      return;
    }

    try {
      await setHoldState(session, true);
      linesRef.current[lineId].onHold = true;
      dispatch(
        updateLineState({
          lineId: lineId,
          data: { onHold: true },
        })
      );
      if (activeLineRef.current === lineId) {
        dispatch(setOnHold(true));
      }
    } catch (err) {
      console.error(`❌ Failed to hold call on line ${lineId}:`, err);
    }
  };
  const unholdCall = async (specificLineId = null) => {
    const lineId =
      specificLineId !== null ? specificLineId : activeLineRef.current;

    if (lineId === null || !linesRef.current[lineId]) {
      console.warn("🚫 No active line to take off hold");
      return;
    }

    const session = linesRef.current[lineId].session;
    if (!session) {
      console.warn(`🚫 No session on line ${lineId}`);
      return;
    }

    try {
      await setHoldState(session, false);
      linesRef.current[lineId].onHold = false;
      dispatch(
        updateLineState({
          lineId: lineId,
          data: { onHold: false },
        })
      );
      if (activeLineRef.current === lineId) {
        dispatch(setOnHold(false));
      }
    } catch (err) {
      console.error(`❌ Failed to unhold call on line ${lineId}:`, err);
    }
  };

  // Blind transfer (REFER)
  const performBlindTransfer = async ({ targetNumber }) => {
    const sess = sessionRef.current;
    if (!sess || sess.state !== SessionState.Established) {
      throw new Error("No active session to transfer");
    }
    try {
      const targetURI = UserAgent.makeURI(`sip:${targetNumber}@${sipDomain}`);
      if (!targetURI) {
        throw new Error("Invalid target URI");
      }
      await sess.refer(targetURI);
      if (sess.state === SessionState.Established) {
        sess.bye();
      }
    } catch (err) {
      console.error("Blind transfer error:", err);
    }
  };

  const startAttendedTransfer = async ({ targetNumber, selectedNumber }) => {
    const originalSession = sessionRef.current;

    if (
      !originalSession ||
      originalSession.state !== SessionState.Established
    ) {
      throw new Error("Original call is not active.");
    }

    await holdCall();

    return new Promise((resolve, reject) => {
      makeCall({
        phone: targetNumber,
        selectedNumber,
        assignToSessionRef: false,
        onSession: (attendedSession) => {
          attendedSessionRef.current = attendedSession;
          sessionMapRef.current[attendedSession.id] = attendedSession;

          dispatch(
            addSession({
              id: attendedSession.id,
              data: {
                direction: "attendedTransfer",
                phone: targetNumber,
                startedAt: new Date().toISOString(),
              },
            })
          );

          const timeout = setTimeout(() => {
            console.warn("Attended transfer timed out");
            attendedSession.bye();
            unholdCall();
            reject(new Error("Attended transfer timed out"));
          }, 15000);

          attendedSession.stateChange.addListener((state) => {
            if (state === SessionState.Established) {
              clearTimeout(timeout);
              resolve(attendedSession);
            } else if (state === SessionState.Terminated) {
              clearTimeout(timeout);
              reject(new Error("Attended call ended before completion"));
              unholdCall();
            }
          });
        },
      });
    });
  };

  const completeAttendedTransfer = async () => {
    const originalSession = sessionRef.current;
    const attendedSession = attendedSessionRef.current;

    if (!originalSession || !attendedSession) {
      throw new Error("Missing original or attended session");
    }

    if (attendedSession.state !== SessionState.Established) {
      throw new Error("Attended session is not established");
    }

    const targetURI = attendedSession.remoteIdentity.uri;

    return new Promise((resolve, reject) => {
      try {
        originalSession.refer(targetURI, {
          requestDelegate: {
            onAccept: async () => {
              try {
                await setHoldState(attendedSession, false);
              } catch (err) {
                console.warn("❗ Failed to unhold attended session", err);
              }

              try {
                await originalSession.bye();
                dispatch(resetSessions());
              } catch (err) {
                console.warn("Failed to hang up original session", err);
              }
              sessionRef.current = null;
              attendedSessionRef.current = null;
              resolve();
            },
          },
        });
      } catch (err) {
        console.error("❌ Failed to complete attended transfer", err);
        reject(err);
      }
    });
  };

  const cancelAttendedTransfer = async () => {
    const attendedSession = attendedSessionRef.current;

    if (!attendedSession) {
      console.warn("🚫 No attended session to cancel");
      return;
    }

    const attendedIsActive = attendedSession.state === SessionState.Established;

    if (attendedIsActive) {
      try {
        await attendedSession.bye();
      } catch (err) {
        console.warn("Error while ending attended session:", err);
      }
    }
    dispatch(resetSessions());
    attendedSessionRef.current = null;
    const sessionsInStore = store.getState().callFeature.sessions;
    const originalEntry = Object.entries(sessionsInStore).find(
      ([, sessionData]) => sessionData.direction === "outgoing"
    );

    if (!originalEntry) return;

    const [originalId] = originalEntry;

    let originalSession = sessionRef.current;
    if (!originalSession || originalSession.id !== originalId) {
      originalSession = sessionMapRef.current[originalId];
    }

    if (!originalSession) return;

    if (originalSession.state === SessionState.Established) {
      try {
        await setHoldState(originalSession, false);
      } catch (err) {
        console.warn("❗ Failed to unhold original session", err);
      }
    } else {
      console.warn("🚫 Original session not established, can't unhold");
    }
  };

  const hangup = (specificLineId = null) => {
    stopRingtone();
    stopEarlyTone();
    dispatch(setModalOpenFlag(false));

    const lineId =
      specificLineId !== null ? specificLineId : activeLineRef.current;
    const incomingCallData = store.getState().sip.incomingCall;
    if (lineId === null && incomingCallData && incomingCallData.sessionId) {
      // Try to get the session from the registry first
      let sessionToReject = SipSessionRegistry.get(incomingCallData.sessionId);

      if (sessionToReject) {
        try {
          sessionToReject
            ?.reject()
            .then(() => {
              dispatch(clearIncomingCall());
              // Remove from registry
              SipSessionRegistry.remove(incomingCallData.sessionId);
            })
            .catch((err) => {
              console.error(
                `❌ Error rejecting incoming call with session ID ${incomingCallData.sessionId}:`,
                err
              );
            });
          return;
        } catch (err) {
          console.error(
            `❌ Critical error rejecting incoming call with session ID ${incomingCallData.sessionId}:`,
            err
          );
        }
      } else if (sessionMapRef.current[incomingCallData.sessionId]) {
        // Fallback to local map
        try {
          const sessionData = sessionMapRef.current[incomingCallData.sessionId];
          sessionData.session
            ?.reject()
            .then(() => {
              dispatch(clearIncomingCall());
              delete sessionMapRef.current[incomingCallData.sessionId];
            })
            .catch((err) => {
              console.error(
                `❌ Error rejecting incoming call with session ID ${incomingCallData.sessionId}:`,
                err
              );
            });
          return;
        } catch (err) {
          console.error(
            `❌ Critical error rejecting incoming call with session ID ${incomingCallData.sessionId}:`,
            err
          );
        }
      }
    }

    if (
      lineId === null &&
      sessionRef.current &&
      sessionRef.current.state === SessionState.Initial
    ) {
      const session = sessionRef.current;

      try {
        session
          ?.reject()
          .then(() => {
            dispatch(clearIncomingCall());
            sessionRef.current = null;
          })
          .catch((err) => {
            console.error("❌ Error rejecting incoming call:", err);
          });
        return;
      } catch (err) {
        console.error("❌ Critical error rejecting incoming call:", err);
      }
    }

    if (lineId === null || !linesRef.current[lineId]) {
      console.warn(
        `❌ Cannot hang up - line ${lineId} doesn't exist or is null`
      );
      return;
    }

    const session = linesRef.current[lineId].session;
    if (!session) {
      console.warn(`❌ Cannot hang up - no session for line ${lineId}`);
      return;
    }

    // After hanging up, remove from registry
    if (session.id) {
      SipSessionRegistry.remove(session.id);
    }

    switch (session.state) {
      case SessionState.Initial:
        session
          ?.reject()
          .then(() => {
            dispatch(clearIncomingCall());
            dispatch(removeLine(lineId));
          })
          .catch((err) =>
            console.error(
              `❌ Failed to reject incoming call on line ${lineId}:`,
              err
            )
          );
        break;
      case SessionState.Establishing:
        session.cancel();
        break;

      case SessionState.Established:
        session.bye();
        break;

      default:
        try {
          session.terminate();
        } catch (err) {
          console.error(`❌ Error terminating session:`, err);
        }
        break;
    }

    if (timerRef.current[lineId]) {
      clearInterval(timerRef.current[lineId]);
      delete timerRef.current[lineId];
    }
    dispatch(
      updateLineState({
        lineId: lineId,
        data: { terminated: true },
      })
    );
    dispatch(removeLine(lineId));
    delete linesRef.current[lineId];

    if (activeLineRef.current === lineId) {
      sessionRef.current = null;
      activeLineRef.current = null;

      // Check if there are any remaining lines we should switch to
      const remainingLines = Object.keys(linesRef.current);
      if (remainingLines.length > 0) {
        switchToLine(Number(remainingLines[0]));
      } else {
        dispatch(resetSessions());
        dispatch(setCallDuration(0));
      }
    }

    // Make sure ringtone is stopped if there are no more lines
    if (Object.keys(linesRef.current).length === 0) {
      stopRingtone();
    }
  };

  const getPeerConnection = () => {
    const pc = sessionRef.current?.sessionDescriptionHandler?.peerConnection;
    return pc || null;
  };
  useEffect(() => {
    const handleBeforeUnload = () => {
      Object.entries(linesRef.current).forEach(([lineData]) => {
        const session = lineData.session;
        if (session) {
          if (session.state === SessionState.Established) {
            session.bye();
          } else if (
            session.state === SessionState.Initial ||
            session.state === SessionState.Establishing
          ) {
            session.cancel();
          }
        }
      });

      // Clear all timers
      Object.keys(timerRef.current).forEach((lineId) => {
        clearInterval(timerRef.current[lineId]);
      });

      // Reset Redux state
      dispatch(resetSessions());
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleIncomingSession = async (session) => {
    if (isDNDActive) {
      return;
    }
    // Always play ringtone for incoming calls
    playRingtone();
    // Store session in the global registry immediately
    SipSessionRegistry.set(session.id, session);
    // Store in the session map immediately for reliable lookup, regardless of line assignment
    sessionMapRef.current[session.id] = {
      session: session,
      lineId: null,
      isIncoming: true,
    };
    dispatch(setCallType("incoming"));

    if (!sessionRef.current) {
      sessionRef.current = session;
    }

    const notificationRef = { current: null };
    let tempLineId = null;

    session.delegate = {
      onTrack: () => {
        const pc = session.sessionDescriptionHandler?.peerConnection;
        if (pc) {
          attachAudioStream(pc);
        }
      },
    };
    session.stateChange.addListener((state) => {
      if (state === SessionState.Established) {
        if (notificationRef.current) {
          notificationRef.current.close();
        }
        stopRingtone();
        if (tempLineId !== null) {
          dispatch(
            updateLineState({
              lineId: tempLineId,
              data: { ringing: false },
            })
          );
        }

        import("../utils/notifications").then(
          ({ clearAcceptCallFunction, clearStopRingtoneFunction }) => {
            clearAcceptCallFunction();
            clearStopRingtoneFunction();
          }
        );
      }
      if (state === SessionState.Terminated) {
        if (notificationRef.current) {
          notificationRef.current.close();
        }
        stopRingtone();
        dispatch(setModalOpenFlag(false));

        // Remove from session map if it was stored there
        if (sessionMapRef.current[session.id]) {
          delete sessionMapRef.current[session.id];
        }

        import("../utils/notifications").then(
          ({ clearAcceptCallFunction, clearStopRingtoneFunction }) => {
            clearAcceptCallFunction();
            clearStopRingtoneFunction();
          }
        );

        // Only show missed call notification if the call was not answered
        if (session.endTime && !session.answerTime) {
          import("../utils/notifications").then(
            ({ showMissedCallNotification }) => {
              showMissedCallNotification(
                session.remoteIdentity?.displayName,
                session.remoteIdentity?.uri?.user
              );
            }
          );
        } // If this session had a line assigned, clean it up
        if (tempLineId !== null) {
          dispatch(removeLine(tempLineId));

          if (linesRef.current[tempLineId]) {
            delete linesRef.current[tempLineId];
          }

          // If this was the active line, we need to switch to another line or reset
          if (activeLineRef.current === tempLineId) {
            activeLineRef.current = null;
            sessionRef.current = null;

            const remainingLines = Object.keys(linesRef.current);
            if (remainingLines.length > 0) {
              switchToLine(Number(remainingLines[0]));
            } else {
              dispatch(setCallDuration(0));
              dispatch(clearIncomingCall());
            }
          }
        }

        if (sessionRef.current === session) {
          sessionRef.current = null;
          dispatch(clearIncomingCall());
          dispatch(setModalOpenFlag(false));
        }
      }
    });
    const caller = session.remoteIdentity?.uri?.user || "";
    const displayName = session.remoteIdentity?.displayName || "";

    const lineId = getNextAvailableLineId();
    dispatch(
      setIncomingCall({
        caller: caller,
        displayName: displayName,
        lineId: lineId,
        sessionId: session.id,
      })
    );

    if (lineId !== null) {
      const lineData = {
        session: session,
        active: false,
        onHold: false,
        muted: false,
        direction: "incoming",
        phone: caller,
        displayName: displayName,
        startTime: new Date(),
        ringing: session.state === SessionState.Initial,
        sessionId: session.id,
      };

      linesRef.current[lineId] = lineData;
      tempLineId = lineId;

      sessionMapRef.current[session.id] = {
        session,
        lineId,
      };
      dispatch(
        updateLineState({
          lineId: lineId,
          data: {
            phone: caller,
            displayName: displayName,
            onHold: false,
            muted: false,
            direction: "incoming",
            ringing: session.state === SessionState.Initial,
            sessionId: session.id,
          },
        })
      );
    } else {
      console.warn(
        "❌ All lines are in use, no line reserved for incoming call"
      );
      sessionMapRef.current[session.id] = {
        session,
        lineId: null,
      };
    }
    dispatch(
      setIncomingCall({
        caller: caller,
        displayName: displayName,
        lineId: lineId,
      })
    );
    dispatch(
      setIncomingCall({
        caller: caller,
        displayName: displayName,
        lineId: lineId,
        sessionId: session.id,
      })
    );

    import("../utils/notifications").then(
      ({ setAcceptCallFunction, setStopRingtoneFunction }) => {
        setAcceptCallFunction(() => {
          acceptCall();
        });

        setStopRingtoneFunction(() => {
          stopRingtone();
        });
      }
    );
    try {
      const { showIncomingCallNotification } = await import(
        "../utils/notifications"
      );
      notificationRef.current = await showIncomingCallNotification(
        displayName,
        caller
      );
    } catch (error) {
      console.error("Error showing notification:", error);
    }

    playRingtone();
  };

  const restoreSessionsFromRegistry = () => {
    const allSessions = SipSessionRegistry.getAll();
    let restoredAny = false;

    Object.entries(allSessions).forEach(([sessionId, session]) => {
      if (session.state === SessionState.Terminated) {
        SipSessionRegistry.remove(sessionId);
        return;
      }

      const isTracked = Object.values(linesRef.current).some(
        (lineData) =>
          lineData.session === session || lineData.session?.id === sessionId
      );

      if (!isTracked) {
        const lineId = getNextAvailableLineId();
        if (!lineId) return;

        const caller = session.remoteIdentity?.uri?.user || "";
        const displayName = session.remoteIdentity?.displayName || "";

        linesRef.current[lineId] = {
          session,
          active: false,
          onHold: false,
          muted: false,
          direction: session.direction || "unknown",
          phone: caller,
          displayName: displayName || caller,
          startTime: new Date(),
          ringing: session.state === SessionState.Initial,
        };

        sessionMapRef.current[sessionId] = { session, lineId };

        attachSessionEvents(session, lineId);

        dispatch(
          updateLineState({
            lineId,
            data: {
              phone: caller,
              displayName: displayName || caller,
              onHold: false,
              muted: false,
              direction: session.direction || "unknown",
              ringing: session.state === SessionState.Initial,
            },
          })
        );

        restoredAny = true;
      }
    });

    if (
      restoredAny &&
      Object.keys(linesRef.current).length > 0 &&
      !activeLineRef.current
    ) {
      const firstLineId = Number(Object.keys(linesRef.current)[0]);
      activeLineRef.current = firstLineId;
      sessionRef.current = linesRef.current[firstLineId].session;
      dispatch(setActiveLine(firstLineId));

      if (sessionRef.current.state === SessionState.Established) {
        if (timerRef.current[firstLineId]) {
          clearInterval(timerRef.current[firstLineId]);
        }
        timerRef.current[firstLineId] = setInterval(() => {
          dispatch(setCallDuration());
        }, 1000);
      }
    }

    return restoredAny;
  };

  useEffect(() => {
    CallSessionManager.setRestoreCallback(() => restoreSessionsFromRegistry());

    restoreSessionsFromRegistry();
  }, []);
  return {
    makeCall,
    hangup,
    attachSessionEvents,
    getPeerConnection,
    handleIncomingSession,
    sessionRef,
    performBlindTransfer,
    startAttendedTransfer,
    completeAttendedTransfer,
    cancelAttendedTransfer,
    holdCall,
    unholdCall,
    acceptCall,
    getNextAvailableLineId,
    switchToLine,
    getActiveLines,
    activeLineRef,
    linesRef,
    maxLines,
    restoreSessionsFromRegistry,
    playEarlyTone,
    stopEarlyTone,
  };
};

export default useSipSession;
