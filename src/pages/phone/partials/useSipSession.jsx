/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Inviter, SessionState, UserAgent } from "sip.js";
import ringtone from "../assets/phone/ringtone_1.mp3";
import { store } from "../store/Index";
import {
  addSession,
  resetSessions,
  setMuted,
  setOnHold,
} from "../store/slices/callFeatureSlice";
import {
  clearIncomingCall,
  removeLine,
  setActiveLine,
  setCallDuration,
  setIncomingCall,
  updateLineState,
} from "../store/slices/sipSlice";
import { setHoldState } from "../utils/hold";
import useSipAgentRef from "./useSipAgentRef";

const useSipSession = (audioRef) => {
  const dispatch = useDispatch();
  const { userAgentRef } = useSipAgentRef();
  const attendedSessionRef = useRef(null);
  // Modified to support multiple lines - sessionRef now points to the currently active session
  const sessionRef = useRef(null);
  // Store all active sessions by line number
  const linesRef = useRef({
    // Structure: { lineId: { session, active, onHold, direction, phone, startTime } }
  });
  // Track the currently active line
  const activeLineRef = useRef(null);
  const sessionMapRef = useRef({});
  const timerRef = useRef({});
  const sipDomain = useSelector((state) => state.auth?.user?.data?.timeZone);

  // Track number of available lines (default to 3)
  const maxLines = 3;
  // Add a ref for the ringtone audio element
  const ringtoneRef = useRef(null); // Helper to play ringtone in loop
  const playRingtone = () => {
    if (!ringtoneRef.current) {
      ringtoneRef.current = document.createElement("audio");
      // Use the imported ringtone asset
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

  // Helper to stop ringtone
  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current.remove();
      ringtoneRef.current = null;
    }
  };

  // Multiline helpers

  // Get next available line ID
  const getNextAvailableLineId = () => {
    const currentLines = Object.keys(linesRef.current).map(Number);
    for (let i = 1; i <= maxLines; i++) {
      if (!currentLines.includes(i)) return i;
    }
    return null; // All lines are in use
  };
  // Switch to a specific line
  const switchToLine = async (lineId) => {
    if (!lineId || !linesRef.current[lineId]) {
      console.warn("❌ Cannot switch to nonexistent line:", lineId);
      return false;
    }

    // Put current active call on hold if exists
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

          // Update Redux state for the line being put on hold
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

    // Set new active line
    activeLineRef.current = lineId;
    sessionRef.current = linesRef.current[lineId].session;

    // If the new line is on hold, take it off hold
    if (linesRef.current[lineId].onHold) {
      try {
        await setHoldState(sessionRef.current, false);
        linesRef.current[lineId].onHold = false;

        // Update Redux state for the line being taken off hold
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
    // Switch audio to the current call
    if (sessionRef.current?.sessionDescriptionHandler?.peerConnection) {
      const pc = sessionRef.current.sessionDescriptionHandler.peerConnection;
      attachAudioStream(pc);

      // Sync mute state with the selected line
      const lineData = linesRef.current[lineId];
      const audioSender = pc
        .getSenders()
        .find((s) => s.track?.kind === "audio");
      if (audioSender?.track && lineData && lineData.muted !== undefined) {
        // Update track enabled based on the line's mute state
        audioSender.track.enabled = !lineData.muted;
        // Sync with global state
        dispatch(setMuted(lineData.muted));
      }
    }

    // Update Redux state to reflect current line status
    dispatch(setActiveLine(lineId));

    // Update call duration display to show current line's duration
    const lineData = linesRef.current[lineId];
    if (lineData && lineData.startTime) {
      const elapsed = Math.floor((Date.now() - lineData.startTime) / 1000);
      dispatch(setCallDuration(elapsed));
    }

    return true;
  };

  // Get all active lines information
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

      // Handle autoplay errors
      audioRef.current
        .play()
        .catch((err) =>
          console.warn("Audio play error (autoplay blocked?)", err)
        );
    };

    audioRef.current.srcObject = remoteStream;
  };
  const attachSessionEvents = (sipSession, lineId) => {
    // If lineId isn't provided, try to find it from our tracking system
    if (!lineId) {
      // Find the lineId that corresponds to this session
      for (const [id, data] of Object.entries(linesRef.current)) {
        if (data.session === sipSession) {
          lineId = Number(id);
          break;
        }
      }
    }

    if (!lineId) {
      console.warn(
        "❗ attachSessionEvents called without lineId and couldn't find matching line"
      );
    }

    sipSession.stateChange.addListener((state) => {
      if (state === SessionState.Established) {
        const pc = sipSession.sessionDescriptionHandler?.peerConnection;
        attachAudioStream(pc);

        // Track call duration for this specific line
        if (lineId) {
          // Clear any existing timer for this line
          if (timerRef.current[lineId]) {
            clearInterval(timerRef.current[lineId]);
          }

          // Start a new timer for this line
          timerRef.current[lineId] = setInterval(() => {
            // Only update UI call duration if this is the active line
            if (activeLineRef.current === lineId) {
              dispatch(setCallDuration());
            }
          }, 1000);

          // Update Redux line state to ensure it's marked as not ringing and active
          dispatch(
            updateLineState({
              lineId: lineId,
              data: {
                ringing: false,
                active: true,
              },
            })
          );
        }
        stopRingtone();
      }

      if (state === SessionState.Terminated) {
        if (lineId && timerRef.current[lineId]) {
          clearInterval(timerRef.current[lineId]);
          delete timerRef.current[lineId];
          if (activeLineRef.current === lineId) {
            dispatch(setCallDuration(0));
          }
        }
        if (lineId) {
          dispatch(removeLine(lineId));
          if (linesRef.current[lineId]) {
            delete linesRef.current[lineId];
          }
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
        } else {
          if (sessionRef.current === sipSession) sessionRef.current = null;
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
      requestOptions: {
        extraHeaders: [`X-OverrideCID: ${selectedNumber}`],
      },
    }); // Store session in our line management system
    linesRef.current[lineId] = {
      session: inviter,
      active: true, // Mark this line as active
      onHold: false,
      muted: false, // Initialize muted state
      direction: "outgoing",
      phone: phone,
      displayName: "", // Will be updated from remote info if available
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
        // First update the local reference to mark it as on hold
        linesRef.current[prevActiveLineId].onHold = true;

        // Then update Redux state - this ensures the UI updates quickly
        dispatch(
          updateLineState({
            lineId: prevActiveLineId,
            data: {
              onHold: true,
              heldBy: "auto-hold", // Indicate this was automatically held when making a new call
            },
          })
        );

        // Also update global hold state since we're moving away from this line
        dispatch(setOnHold(true));
        // Now perform the hold operation on the session (without awaiting since this isn't an async function)
        setHoldState(linesRef.current[prevActiveLineId].session, true)
          .then(() =>
            console.log(
              `✅ Put previous active line ${prevActiveLineId} on hold before dialing new call`
            )
          )
          .catch((error) =>
            console.warn(
              `❗ Failed hold operation on line ${prevActiveLineId}:`,
              error
            )
          );
      } catch (err) {
        console.warn(
          `❗ Failed to hold line ${prevActiveLineId} before switching`,
          err
        );
        // Even if the hold operation fails, we keep the line marked as on hold in the UI
      }
    } // Make this the active line
    activeLineRef.current = lineId;
    sessionRef.current = inviter;
    sessionMapRef.current[inviter.id] = inviter;
    dispatch(setActiveLine(lineId));
    dispatch(setMuted(false));
    dispatch(
      addSession({
        id: inviter.id,
        data: {
          direction: "outgoing",
          phone,
          lineId,
          startedAt: new Date().toISOString(),
        },
      })
    );

    inviter
      .invite()
      .then(() => {
        attachSessionEvents(inviter, lineId);
        if (typeof onSession === "function") onSession(inviter);
      })
      .catch((err) => {
        console.error("❌ Call failed", err);
        // Clean up line if call fails
        delete linesRef.current[lineId];
        if (activeLineRef.current === lineId) {
          activeLineRef.current = null;
          sessionRef.current = null;
        }
      });

    return lineId; // Return the line ID for UI to track
  }; 
  
  // accept incoming call  
  const acceptCall = async () => {
    console.log(`📞 acceptCall() called`);
    let session = null;
    let lineId = null;

    // First, try to find a ringing line in our line tracking system
    for (const [id, lineData] of Object.entries(linesRef.current)) {
      if (lineData.ringing && lineData.session) {
        console.log(`📞 Found ringing session on line ${id}`);
        session = lineData.session;
        lineId = Number(id);
        break;
      }
    }

    // If no ringing line was found but we have a sessionRef, use that
    if (!session && sessionRef.current) {
      console.log(`📞 Using sessionRef.current as fallback`);
      session = sessionRef.current;
    }
    
    // Search sessionMapRef as a last resort for unmapped sessions
    if (!session) {
      console.log(`📞 Searching sessionMapRef for ringing sessions`);
      // Find any session in the Initial state (ringing)
      const sessionEntry = Object.entries(sessionMapRef.current).find(
        ([, data]) => data.session?.state === SessionState.Initial
      );
      
      if (sessionEntry) {
        const [sessionId, data] = sessionEntry;
        console.log(`📞 Found unmapped session ${sessionId} in sessionMapRef`);
        session = data.session;
        lineId = data.lineId; // Might be null
      }
    }

    if (!session) {
      console.warn("🚫 No session to accept");
      return;
    }
    
    try {
      console.log(`📞 Accepting call for session ${session.id}`);
      stopRingtone();
      const caller = session.remoteIdentity?.uri?.user || "";
      const displayName = session.remoteIdentity?.displayName || "";
      
      // If we don't have a line ID yet, try to get one
      if (lineId === null) {
        lineId = getNextAvailableLineId();
        console.log(`📞 Assigning new line ID ${lineId} for accepted call`);
        
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
            // Put the current active call on hold
            await setHoldState(currentSession, true);
            linesRef.current[activeLineRef.current].onHold = true;

            // Update Redux state for the line being put on hold
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
      // Accept the call
      await session.accept({
        sessionDescriptionHandlerOptions: {
          constraints: { audio: true, video: false },
        },
      });
      // Update the line data or create it if it doesn't exist
      if (linesRef.current[lineId]) {
        // Update existing line data
        linesRef.current[lineId].active = true;
        linesRef.current[lineId].onHold = false;
        linesRef.current[lineId].muted = false; // Initialize muted state
        linesRef.current[lineId].ringing = false;
      } else {
        // Create new line data
        linesRef.current[lineId] = {
          session: session,
          active: true,
          onHold: false,
          muted: false, // Initialize muted state
          direction: "incoming",
          phone: caller,
          displayName: displayName,
          startTime: new Date(),
          ringing: false, // Explicitly mark as not ringing
        };
      }

      // Make this the active line
      activeLineRef.current = lineId;
      sessionRef.current = session;

      // Update Redux with line ID
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

      // Set as active line in Redux
      dispatch(setActiveLine(lineId));
      // Update Redux store with new line information to ensure MultiLineDisplay shows immediately
      const lineStateUpdate = {
        lineId: lineId,
        data: {
          phone: caller,
          displayName: displayName,
          onHold: false,
          muted: false, // Initialize muted state in Redux
          direction: "incoming",
          ringing: false, // Ensure ringing state is turned off when accepting
        },
      };

      dispatch(updateLineState(lineStateUpdate));
      // Clear the incoming call state after accepting
      dispatch(clearIncomingCall());
      attachSessionEvents(session, lineId);

      // Start the timer immediately for accepted incoming calls
      // This ensures the timer works even if the Established state event was already triggered
      if (timerRef.current[lineId]) {
        clearInterval(timerRef.current[lineId]);
      }

      timerRef.current[lineId] = setInterval(() => {
        // Only update UI call duration if this is the active line
        if (activeLineRef.current === lineId) {
          dispatch(setCallDuration());
        }
      }, 1000);

      // Make sure audio is attached to this call
      if (session.sessionDescriptionHandler?.peerConnection) {
        const pc = session.sessionDescriptionHandler.peerConnection;
        attachAudioStream(pc);
      }
    } catch (error) {
      console.error("❌ Failed to accept call:", error);
      stopRingtone(); // Ensure ringtone is stopped even if there's an error
    }
  };
  const holdCall = async (specificLineId = null) => {
    // If specificLineId is provided, use that line; otherwise use activeLineRef
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
    // If specificLineId is provided, use that line; otherwise use activeLineRef
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

              // Hang up original session (A)
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

    // Step 1: Hang up attended call
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
    }  };  const hangup = (specificLineId = null) => {
    console.log(`📞 Hangup called for line: ${specificLineId !== null ? specificLineId : 'current active line'}`);
    stopRingtone();

    const lineId =
      specificLineId !== null ? specificLineId : activeLineRef.current;
    
    // Check if we need to handle direct session reference for incoming calls that haven't been allocated a line yet
    if (lineId === null && sessionRef.current && sessionRef.current.state === SessionState.Initial) {
      console.log(`📞 Handling special case: hanging up incoming call with no line ID`);
      const session = sessionRef.current;
      
      try {
        // Reject the call
        session?.reject().then(() => {
          console.log('📞 Successfully rejected incoming call with no assigned line');
          dispatch(clearIncomingCall());
          // Reset session reference
          sessionRef.current = null;
        }).catch(err => {
          console.error('❌ Error rejecting incoming call:', err);
        });
        return; // Exit the function after handling this special case
      } catch (err) {
        console.error('❌ Critical error rejecting incoming call:', err);
      }
    }

    if (lineId === null || !linesRef.current[lineId]) {
      console.warn(`❌ Cannot hang up - line ${lineId} doesn't exist or is null`);
      return;
    }

    const session = linesRef.current[lineId].session;
    if (!session) {
      console.warn(`❌ Cannot hang up - no session for line ${lineId}`);
      return;
    }
    
    console.log(`📞 Hanging up line ${lineId}, session state: ${session.state}`);

    switch (session.state) {
      case SessionState.Initial:
        console.log(`📞 Rejecting initial session on line ${lineId}`);
        session?.reject()
          .then(() => {
            console.log(`📞 Successfully rejected call on line ${lineId}`);
            dispatch(clearIncomingCall());

            // Remove line from Redux state for UI updating
            dispatch(removeLine(lineId));
          })
          .catch((err) =>
            console.error(`❌ Failed to reject incoming call on line ${lineId}:`, err)
          );
        break;      case SessionState.Establishing:
        console.log(`📞 Cancelling establishing session on line ${lineId}`);
        session.cancel()
          .then(() => console.log(`📞 Successfully cancelled call on line ${lineId}`))
          .catch(err => console.error(`❌ Error cancelling call:`, err));
        break;

      case SessionState.Established:
        console.log(`📞 Ending established call on line ${lineId}`);
        session.bye()
          .then(() => console.log(`📞 Successfully ended call on line ${lineId}`))
          .catch(err => console.error(`❌ Error ending call:`, err));
        break;

      default:
        console.log(`📞 Terminating session in state ${session.state} on line ${lineId}`);
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

    console.log(`📞 Marking line ${lineId} as terminated in Redux`);
    dispatch(
      updateLineState({
        lineId: lineId,
        data: { terminated: true },
      })
    );

    console.log(`📞 Removing line ${lineId} from Redux state`);
    dispatch(removeLine(lineId));    console.log(`📞 Removing line ${lineId} from internal tracking`);
    delete linesRef.current[lineId];

    if (activeLineRef.current === lineId) {
      console.log(`📞 Removing active line reference for line ${lineId}`);
      sessionRef.current = null;
      activeLineRef.current = null;

      // Check if there are any remaining lines we should switch to
      const remainingLines = Object.keys(linesRef.current);
      if (remainingLines.length > 0) {
        console.log(`📞 Switching to remaining line ${remainingLines[0]}`);
        switchToLine(Number(remainingLines[0]));
      } else {
        console.log(`📞 No lines remaining, resetting session state`);
        dispatch(resetSessions());
        dispatch(setCallDuration(0));
      }
    }
    
    // Make sure ringtone is stopped if there are no more lines
    if (Object.keys(linesRef.current).length === 0) {
      console.log(`📞 No more active lines, stopping ringtone`);
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
    console.log("📞 Incoming call received:", session.id, "- state:", session.state);
    // Always play ringtone for incoming calls
    playRingtone();

    // Set this as the pending incoming session to allow hangup to work
    // even if we haven't assigned a line ID yet
    if (!sessionRef.current) {
      console.log("📞 Setting as primary session ref");
      sessionRef.current = session;
    } else {
      console.log("📞 Incoming call while on another call - handling as multi-line");
      // Store it in the session map so we can find it later even if not assigned to a line
      sessionMapRef.current[session.id] = session;
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
    };    session.stateChange.addListener((state) => {
      console.log(`📞 Session ${session.id} state changed to: ${state}`);
      if (state === SessionState.Established) {
        console.log(`📞 Call established for session ${session.id}`);
        if (notificationRef.current) {
          notificationRef.current.close();
        }
        stopRingtone();
        if (tempLineId !== null) {
          console.log(`📞 Updating line ${tempLineId} to not ringing`);
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
      }      if (state === SessionState.Terminated) {
        console.log(`📞 Call terminated for session ${session.id}`);
        if (notificationRef.current) {
          notificationRef.current.close();
        }
        stopRingtone();

        // Remove from session map if it was stored there
        if (sessionMapRef.current[session.id]) {
          console.log(`📞 Removing session ${session.id} from session map`);
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
          console.log(`📞 Showing missed call notification for session ${session.id}`);
          import("../utils/notifications").then(
            ({ showMissedCallNotification }) => {
              showMissedCallNotification(
                session.remoteIdentity?.displayName,
                session.remoteIdentity?.uri?.user
              );
            }
          );
        }        // If this session had a line assigned, clean it up
        if (tempLineId !== null) {
          console.log(`📞 Removing line ${tempLineId} for terminated session ${session.id}`);
          dispatch(removeLine(tempLineId));
          
          if (linesRef.current[tempLineId]) {
            delete linesRef.current[tempLineId];
          }
          
          // If this was the active line, we need to switch to another line or reset
          if (activeLineRef.current === tempLineId) {
            console.log(`📞 Terminated session was the active line, finding another line to switch to`);
            activeLineRef.current = null;
            sessionRef.current = null;
            
            const remainingLines = Object.keys(linesRef.current);
            if (remainingLines.length > 0) {
              console.log(`📞 Switching to remaining line ${remainingLines[0]}`);
              switchToLine(Number(remainingLines[0]));
            } else {
              console.log(`📞 No remaining lines, resetting call state`);
              dispatch(setCallDuration(0));
              dispatch(clearIncomingCall());
            }
          }
        }
        
        // If this was our main session, clear the reference
        if (sessionRef.current === session) {
          console.log(`📞 Clearing main session reference for terminated session ${session.id}`);
          sessionRef.current = null;
          dispatch(clearIncomingCall());
        }
      }
    });    const caller = session.remoteIdentity?.uri?.user || "";
    const displayName = session.remoteIdentity?.displayName || "";
    
    console.log(`📞 Incoming call from ${caller || displayName} with session ID ${session.id}`);
    
    // Try to get a line for this call
    const lineId = getNextAvailableLineId();
      // Dispatch the incoming call notification to Redux
    dispatch(
      setIncomingCall({
        caller: caller,
        displayName: displayName,
        lineId: lineId, // This could be null if no lines available
        sessionId: session.id, // Store session ID for easier reference
      })
    );
    
    if (lineId !== null) {
      console.log(`📞 Assigned line ID ${lineId} to incoming call session ${session.id}`);
      
      // Create line data structure
      const lineData = {
        session: session,
        active: false,
        onHold: false,
        muted: false,
        direction: "incoming",
        phone: caller,
        displayName: displayName,
        startTime: new Date(),
        ringing: true,
        sessionId: session.id, // Store session ID for easier lookup
      };

      // Store in our line tracking system
      linesRef.current[lineId] = lineData;
      tempLineId = lineId;
      
      // Store in session map with line ID for quick lookup
      sessionMapRef.current[session.id] = {
        session,
        lineId
      };      // Update Redux state with the new line information
      dispatch(
        updateLineState({
          lineId: lineId,
          data: {
            phone: caller,
            displayName: displayName,
            onHold: false,
            muted: false,
            direction: "incoming",
            ringing: true,
            sessionId: session.id, // Store session ID in Redux for easier debugging
          },
        })
      );
    } else {
      console.warn(
        "❌ All lines are in use, no line reserved for incoming call"
      );
      
      // Even without a line ID assignment, we need to keep track of this session
      // so we can still reject it if needed
      sessionMapRef.current[session.id] = {
        session,
        lineId: null
      };
    }

    // Make sure we're dispatching with the correct structure
    dispatch(
      setIncomingCall({
        caller: caller,
        displayName: displayName,
        lineId: lineId,
      })
    );    // Save the session ID in the incoming call data for easier reference
    dispatch(
      setIncomingCall({
        caller: caller,
        displayName: displayName,
        lineId: lineId,
        sessionId: session.id,
      })
    );

    // Register the acceptCall function and stopRingtone function for notification access
    import("../utils/notifications").then(
      ({ setAcceptCallFunction, setStopRingtoneFunction }) => {
        setAcceptCallFunction(() => {
          console.log(`📞 Accept call from notification: session ${session.id}`);
          acceptCall();
        });

        setStopRingtoneFunction(() => {
          console.log(`📞 Stop ringtone from notification: session ${session.id}`);
          stopRingtone();
        });
      }
    ); // Show browser notification for incoming call
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
  };
};

export default useSipSession;
