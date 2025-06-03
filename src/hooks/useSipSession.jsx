/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Inviter, SessionState, UserAgent } from "sip.js";
import { store } from "../store/Index";
import { 
  addSession, 
  resetSessions,
  setMuted,
  setOnHold
} from "../store/slices/callFeatureSlice";
import {
  setCallDuration,
  setIncomingCall,
  clearIncomingCall,
  setActiveLine,
  updateLineState,
  removeLine,
} from "../store/slices/sipSlice";
import { setHoldState } from "../utils/hold";
import useSipAgentRef from "./useSipAgentRef";
import ringtone from "../assets/phone/ringtone_1.mp3";

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
  const sessions = useSelector((state) => state.callFeature.sessions);
  
  // Track number of available lines (default to 3)
  const maxLines = 3;
  
  console.log("sessions", sessions);
  // Add a ref for the ringtone audio element
  const ringtoneRef = useRef(null);  // Helper to play ringtone in loop
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
    if (activeLineRef.current && 
        linesRef.current[activeLineRef.current] && 
        linesRef.current[activeLineRef.current].session &&
        !linesRef.current[activeLineRef.current].onHold) {
      try {
        const currentSession = linesRef.current[activeLineRef.current].session;
        if (currentSession.state === SessionState.Established) {
          await setHoldState(currentSession, true);
          linesRef.current[activeLineRef.current].onHold = true;
          console.log(`✅ Line ${activeLineRef.current} put on hold`);
          
          // Update Redux state for the line being put on hold
          dispatch(updateLineState({
            lineId: activeLineRef.current,
            data: { onHold: true }
          }));
        }
      } catch (err) {
        console.error(`❌ Failed to put line ${activeLineRef.current} on hold:`, err);
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
        console.log(`✅ Line ${lineId} taken off hold`);
        
        // Update Redux state for the line being taken off hold
        dispatch(updateLineState({
          lineId: lineId,
          data: { onHold: false }
        }));
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
      const audioSender = pc.getSenders().find((s) => s.track?.kind === "audio");
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
      state: data.session?.state
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
  };  const attachSessionEvents = (sipSession, lineId) => {
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
      console.warn("❗ attachSessionEvents called without lineId and couldn't find matching line");
    }
    
    sipSession.stateChange.addListener((state) => {
      console.log(`Line ${lineId} state changed to: ${state}`);
      
      if (state === SessionState.Established) {
        console.log(`✅ SIP call established on line ${lineId}`);
        const pc = sipSession.sessionDescriptionHandler?.peerConnection;
        console.log("🎤 PeerConnection", pc);
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
          dispatch(updateLineState({
            lineId: lineId,
            data: { 
              ringing: false,
              active: true
            }
          }));
        }
        
        // Always stop ringtone when a call is established
        stopRingtone();
      }

      if (state === SessionState.Terminated) {
        console.log(`❌ Call terminated on line ${lineId}`);
        
        // Clear line-specific timer if it exists
        if (lineId && timerRef.current[lineId]) {
          clearInterval(timerRef.current[lineId]);
          delete timerRef.current[lineId];
          
          // If this was the active line, reset call duration display
          if (activeLineRef.current === lineId) {
            dispatch(setCallDuration(0));
          }
        }
        
        // Clean up line in Redux and local state
        if (lineId) {
          // Remove the line from Redux state
          dispatch(removeLine(lineId));
          
          // Clean up local line state
          if (linesRef.current[lineId]) {
            delete linesRef.current[lineId];
          }
          
          // If we're terminating the active line, find a new active line
          if (activeLineRef.current === lineId) {
            // Reset active line reference
            activeLineRef.current = null;
            sessionRef.current = null;
            
            // Find the first available line to make active
            const remainingLines = Object.keys(linesRef.current);
            if (remainingLines.length > 0) {
              switchToLine(Number(remainingLines[0]));
            } else {
              // No more lines, clear call state completely
              dispatch(clearIncomingCall());
              dispatch(resetSessions());
            }
          }
        } else {
          // No line ID, just do standard cleanup
          if (sessionRef.current === sipSession) sessionRef.current = null;
          dispatch(clearIncomingCall());
          dispatch(resetSessions());
        }
        
        // Always stop ringtone when a call is terminated
        stopRingtone();
      }
    });

    sipSession.delegate = {
      onTrack: () => {
        const pc = sipSession.sessionDescriptionHandler?.peerConnection;
        if (pc) {
          attachAudioStream(pc);
          console.log("🎧 Media track added. PC ready.");
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
    });    // Store session in our line management system
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
    dispatch(updateLineState({
      lineId: lineId,
      data: {
        phone: phone,
        displayName: phone, // Default display name to phone number until updated
        onHold: false,
        muted: false, // Initialize muted state in Redux
        direction: "outgoing",
        active: true,
        ringing: false
      }
    }));
    
    // Put any currently active calls on hold before making this the active session
    if (activeLineRef.current !== null && 
        linesRef.current[activeLineRef.current]?.session?.state === SessionState.Established) {
      try {
        setHoldState(linesRef.current[activeLineRef.current].session, true);
        linesRef.current[activeLineRef.current].onHold = true;
      } catch (err) {
        console.warn(`❗ Failed to hold line ${activeLineRef.current} before switching`, err);
      }
    }
      // Make this the active line
    activeLineRef.current = lineId;
    sessionRef.current = inviter;
    sessionMapRef.current[inviter.id] = inviter;
    
    console.log(`📞 Making call to: ${phone} on line ${lineId}`);
    // Update Redux state to reflect current active line
    dispatch(setActiveLine(lineId));
    
    // Update Redux with session information
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
  };  // accept incoming call
  const acceptCall = async () => {
    // Get the incoming call data from Redux state
    const incomingCallData = store.getState().sip.incomingCall;
    let session = null;
    let lineId = null;
    
    // Find the ringing session from our lines
    for (const [id, lineData] of Object.entries(linesRef.current)) {
      if (lineData.ringing && lineData.session) {
        session = lineData.session;
        lineId = Number(id);
        break;
      }
    }
    
    // If no ringing line was found, use sessionRef.current as fallback
    if (!session) {
      session = sessionRef.current;
    }

    if (!session) {
      console.warn("🚫 No session to accept");
      return;
    }
    console.log("👉 Accepting call for session ID:", session.id);
    
    try {
      // First, stop ringtone immediately to ensure it doesn't continue playing
      stopRingtone();
      
      // Get caller information for line tracking
      const caller = session.remoteIdentity?.uri?.user || "";
      const displayName = session.remoteIdentity?.displayName || "";
      
      // If lineId wasn't found, we need to get one
      if (lineId === null) {
        lineId = getNextAvailableLineId();
        if (lineId === null) {
          console.warn("❌ All lines are in use, cannot accept call");
          // Reject the call since all lines are occupied
          session.reject();
          return;
        }
      }

      // NOW put any currently active calls on hold, only when accepting the new call
      if (activeLineRef.current !== null && 
          activeLineRef.current !== lineId && 
          linesRef.current[activeLineRef.current] && 
          linesRef.current[activeLineRef.current].session) {
        try {
          const currentSession = linesRef.current[activeLineRef.current].session;
          if (currentSession.state === SessionState.Established) {
            // Put the current active call on hold
            await setHoldState(currentSession, true);
            linesRef.current[activeLineRef.current].onHold = true;
            
            // Update Redux state for the line being put on hold
            dispatch(updateLineState({
              lineId: activeLineRef.current,
              data: { onHold: true }
            }));
            
            console.log(`✅ Line ${activeLineRef.current} put on hold before accepting new call`);
          }
        } catch (err) {
          console.warn(`❗ Failed to hold line ${activeLineRef.current} before accepting call`, err);
        }
      }
        // Accept the call
      await session.accept({
        sessionDescriptionHandlerOptions: {
          constraints: { audio: true, video: false },
        },
      });
        // Update the line data or create it if it doesn't exist
      if (linesRef.current[lineId]) {        // Update existing line data
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
          ringing: false // Ensure ringing state is turned off when accepting
        }
      };
      
      console.log("Updating line state in acceptCall:", lineStateUpdate);
      dispatch(updateLineState(lineStateUpdate));
        // Clear the incoming call state after accepting
      dispatch(clearIncomingCall());
      
      console.log(`📞 Call accepted on line ${lineId}`);
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
  };  const holdCall = async (specificLineId = null) => {
    // If specificLineId is provided, use that line; otherwise use activeLineRef
    const lineId = specificLineId !== null ? specificLineId : activeLineRef.current;
    
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
      console.log(`✅ Line ${lineId} put on hold`);
      
      // Update Redux state for the held line (sipSlice)
      dispatch(updateLineState({
        lineId: lineId,
        data: { onHold: true }
      }));
      
      // Also update global hold state if this is the active line (callFeatureSlice)
      if (activeLineRef.current === lineId) {
        dispatch(setOnHold(true));
      }
      
    } catch (err) {
      console.error(`❌ Failed to hold call on line ${lineId}:`, err);
    }
  };
  const unholdCall = async (specificLineId = null) => {
    // If specificLineId is provided, use that line; otherwise use activeLineRef
    const lineId = specificLineId !== null ? specificLineId : activeLineRef.current;
    
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
      console.log(`✅ Line ${lineId} taken off hold`);
      
      // Update Redux state for the unheld line (sipSlice)
      dispatch(updateLineState({
        lineId: lineId,
        data: { onHold: false }
      }));
      
      // Also update global hold state if this is the active line (callFeatureSlice)
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
              console.log("✅ REFER accepted by attended party");

              // Unhold attended session (B)
              try {
                await setHoldState(attendedSession, false);
                console.log("🎧 Attended session unheld");
              } catch (err) {
                console.warn("❗ Failed to unhold attended session", err);
              }

              // Hang up original session (A)
              try {
                await originalSession.bye();
                dispatch(resetSessions());
                console.log("📴 Original session ended");
              } catch (err) {
                console.warn("❗ Failed to hang up original session", err);
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
        console.log("📴 Hanging up attended call");
        await attendedSession.bye();
      } catch (err) {
        console.warn("❗ Error while ending attended session:", err);
      }
    }
    dispatch(resetSessions());
    attendedSessionRef.current = null;

    // Step 2: Ensure we get original session (direction === "outgoing")
    const sessionsInStore = store.getState().callFeature.sessions;
    console.log("sessionsInStore", sessionsInStore);
    const originalEntry = Object.entries(sessionsInStore).find(
      ([, sessionData]) => sessionData.direction === "outgoing"
    );

    console.log("originalEntry", originalEntry);

    if (!originalEntry) {
      console.warn(
        "❌ Could not find original session with direction: outgoing"
      );
      return;
    }

    const [originalId] = originalEntry;

    // Try to get from sessionRef first, then fall back to map
    let originalSession = sessionRef.current;
    if (!originalSession || originalSession.id !== originalId) {
      originalSession = sessionMapRef.current[originalId];
    }

    if (!originalSession) {
      console.warn(
        "❌ No SIP session object found for original session ID:",
        originalId
      );
      return;
    }

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
  // const hangup = () => {
  //   const session = sessionRef.current;
  //   if (!session) return;
  //   session.bye();
  //   switch (session.state) {
  //     case SessionState.Initial:
  //     case SessionState.Establishing:
  //       session.cancel();
  //       break;
  //     case SessionState.Established:
  //       session.bye();
  //       break;
  //     default:
  //       session.terminate();
  //       break;
  //   }
  //   dispatch(resetSessions());
  // };
    const hangup = (specificLineId = null) => {
    // Always stop the ringtone when hanging up any call
    stopRingtone();
    
    // If specificLineId is provided, hang up that line; otherwise use activeLineRef
    const lineId = specificLineId !== null ? specificLineId : activeLineRef.current;
    
    if (lineId === null || !linesRef.current[lineId]) {
      console.warn("🚫 No active line to hang up");
      return;
    }
    
    const session = linesRef.current[lineId].session;
    if (!session) {
      console.warn(`🚫 No session on line ${lineId}`);
      return;
    }

    console.log(`📴 Hanging up call on line ${lineId}`);
    
    switch (session.state) {
      case SessionState.Initial:
        // This means the call is incoming and ringing
        console.log("🚫 Rejecting incoming call");
        
        session
          .reject()
          .then(() => {
            dispatch(clearIncomingCall());
            
            // Remove line from Redux state for UI updating
            dispatch(removeLine(lineId));
          })
          .catch((err) =>
            console.error("❌ Failed to reject incoming call", err)
          );
        break;

      case SessionState.Establishing:
        console.log("📴 Canceling outgoing call in progress");
        session.cancel();
        break;

      case SessionState.Established:
        console.log("📴 Hanging up established call");
        session.bye();
        break;

      default:
        console.log("⚠️ Terminating session in unknown state");
        session.terminate();
        break;
    }
    
    // Clear interval timer for this line
    if (timerRef.current[lineId]) {
      clearInterval(timerRef.current[lineId]);
      delete timerRef.current[lineId];
    }
    
    // Update line state to ensure the UI reflects this change immediately
    dispatch(updateLineState({
      lineId: lineId,
      data: { terminated: true }
    }));

    // Remove the line from Redux state
    dispatch(removeLine(lineId));
    
    // Clean up line information from local state
    delete linesRef.current[lineId];
    
    // If we're hanging up the active line, need to find a new active line if any
    if (activeLineRef.current === lineId) {
      // Clear the current active line reference
      sessionRef.current = null;
      activeLineRef.current = null;
      
      // Find the first available line to make active
      const remainingLines = Object.keys(linesRef.current);
      if (remainingLines.length > 0) {
        // Switch to the first remaining line
        switchToLine(Number(remainingLines[0]));
      } else {
        // No more calls - reset call features in Redux
        dispatch(resetSessions());
        dispatch(setCallDuration(0));
      }
    }

    // If this was the last call, stop ringtone
    if (Object.keys(linesRef.current).length === 0) {
      stopRingtone();
    }
  };

  const getPeerConnection = () => {
    const pc = sessionRef.current?.sessionDescriptionHandler?.peerConnection;
    if (!pc) console.warn("⚠️ PeerConnection not ready.");
    return pc || null;
  };  useEffect(() => {
    const handleBeforeUnload = () => {
      // Hang up all active lines
      Object.entries(linesRef.current).forEach(([lineId, lineData]) => {
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
  }, []);    const handleIncomingSession = async (session) => {
    // Store session in sessionRef for acceptCall to use
    // Important: Don't replace the current active session if it exists
    // This ensures we don't put the first call on hold when a second call comes in
    if (!sessionRef.current) {
      sessionRef.current = session;
    } else {
      // If there's an existing active session, we'll store the incoming one
      // but won't make it the active session until user accepts it
      console.log("📱 Another call is coming in while already on a call");
      // DO NOT change sessionRef.current here - wait for explicit acceptance
    }

    // Start playing ringtone for incoming call
    playRingtone();

    // Store notification reference for later dismissal
    const notificationRef = { current: null };
    
    // For tracking this specific session termination - will be set after we assign lineId
    let tempLineId = null;

    session.delegate = {
      onTrack: () => {
        const pc = session.sessionDescriptionHandler?.peerConnection;
        if (pc) console.log("📡 Incoming call: PeerConnection is ready.");
      },
    };

    session.stateChange.addListener((state) => {
      console.log(`📞 Incoming call state changed to: ${state}`);
    
      if (state === SessionState.Established) {
        console.warn("📞 Incoming call answered");
        // Close notification if call is answered
        if (notificationRef.current) {
          notificationRef.current.close();
        }
        
        // Explicitly stop the ringtone
        stopRingtone();
        
        // Update line state to reflect that it's no longer ringing
        if (tempLineId !== null) {
          dispatch(updateLineState({
            lineId: tempLineId,
            data: { ringing: false }
          }));
        }
        
        // Clear accept call function and ringtone function once call is established
        import('../utils/notifications').then(({ clearAcceptCallFunction, clearStopRingtoneFunction }) => {
          clearAcceptCallFunction();
          clearStopRingtoneFunction();
        });
      }
      
      if (state === SessionState.Terminated) {
        console.warn("📴 Call ended");
        // Close notification
        if (notificationRef.current) {
          notificationRef.current.close();
        }
        
        // Explicitly stop the ringtone
        stopRingtone();
        
        // Clear accept call function and ringtone function when call ends
        import('../utils/notifications').then(({ clearAcceptCallFunction, clearStopRingtoneFunction }) => {
          clearAcceptCallFunction();
          clearStopRingtoneFunction();
        });

        // Show missed call notification if the call wasn't established
        if (session.endTime && !session.answerTime) {
          import('../utils/notifications').then(({ showMissedCallNotification }) => {
            showMissedCallNotification(
              session.remoteIdentity?.displayName,
              session.remoteIdentity?.uri?.user
            );
          });
        }

        // Clean up line if it was assigned
        if (tempLineId !== null) {
          // Remove the line from Redux state
          dispatch(removeLine(tempLineId));
          
          // The call was rejected or terminated - clear up the line
          if (linesRef.current[tempLineId]) {
            delete linesRef.current[tempLineId];
          }
          
          // If we're terminating the active line, find a new active line
          if (activeLineRef.current === tempLineId) {
            activeLineRef.current = null;
            sessionRef.current = null;
            
            // Find the first available line to make active
            const remainingLines = Object.keys(linesRef.current);
            if (remainingLines.length > 0) {
              // Switch to the first remaining line
              switchToLine(Number(remainingLines[0]));
            } else {
              // No more active lines, reset the call duration display
              dispatch(setCallDuration(0));
              dispatch(clearIncomingCall());
            }
          }
        }

        // Only clear if this is the current session
        if (sessionRef.current === session) {
          sessionRef.current = null;
        }
      }
    });    // Get caller information correctly
    const caller = session.remoteIdentity?.uri?.user || "";
    const displayName = session.remoteIdentity?.displayName || "";

    console.log("Incoming call details:", {
      caller,
      displayName,
      remoteIdentity: session.remoteIdentity
    });
      // Reserve a line for this incoming call
    // Only reserve if we have an available line
    const lineId = getNextAvailableLineId();
    if (lineId !== null) {      // Store in our lines tracking system as an incoming call that hasn't been accepted yet
      const lineData = {
        session: session,
        active: false,
        onHold: false,
        muted: false, // Initialize muted state
        direction: "incoming",
        phone: caller,
        displayName: displayName,
        startTime: new Date(),
        ringing: true, // Mark it as ringing
      };
      
      // Store the session in our line management system but DO NOT make it active yet
      linesRef.current[lineId] = lineData;
      tempLineId = lineId;
      
      // Add this line to Redux state immediately so UI shows it
      dispatch(updateLineState({
        lineId: lineId,
        data: {
          phone: caller,
          displayName: displayName,
          onHold: false,
          muted: false, // Initialize muted state in Redux
          direction: "incoming",
          ringing: true
        }
      }));
    } else {
      console.warn("❌ All lines are in use, no line reserved for incoming call");
      // Optional: Could auto-reject the call here if no lines are available
    }

    // Make sure we're dispatching with the correct structure
    dispatch(
      setIncomingCall({
        caller: caller,
        displayName: displayName,
        lineId: lineId, // Include lineId in the incoming call data
      })
    );
    
    console.log("Dispatched to Redux:", { caller, displayName, lineId });
    
    // Register the acceptCall function and stopRingtone function for notification access
    import('../utils/notifications').then(({ setAcceptCallFunction, setStopRingtoneFunction }) => {
      // Set the function to accept calls
      setAcceptCallFunction(() => {
        console.log('Accepting call from notification click handler');
        acceptCall(); // Direct call acceptance
      });
      
      // Set the function to stop ringtone when notification is closed
      setStopRingtoneFunction(() => {
        console.log('Stopping ringtone from notification close handler');
        stopRingtone();
      });
    });    // Show browser notification for incoming call
    try {
      const { showIncomingCallNotification } = await import('../utils/notifications');
      notificationRef.current = await showIncomingCallNotification(displayName, caller);
    } catch (error) {
      console.error("Error showing notification:", error);
    }
    
    playRingtone(); // Play ringtone on incoming call
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
    // Expose multiline capabilities
    getNextAvailableLineId,
    switchToLine,
    getActiveLines,
    activeLineRef,
    linesRef,
    maxLines,
  };
};

export default useSipSession;
