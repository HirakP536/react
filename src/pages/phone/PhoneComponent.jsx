/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { store } from "../../store/Index";
import { Link } from "react-router";
import * as SIP from "sip.js";
import dialRemove from "../../assets/dashboard/dialpad.png";
import backIcon from "../../assets/phone/back.svg";
import forwordIcon from "../../assets/phone/forward.svg";
import closeCallicon from "../../assets/phone/hang_phone.svg";
import mergeIcon from "../../assets/phone/merge.svg";
import receiveCall from "../../assets/phone/receivecall_green_new.svg";
import transferIcon from "../../assets/phone/transfer.svg";
import forwordWhiteIcon from "../../assets/phone/transfercall_white.svg";
import userAvatar from "../../assets/phone/user.svg";
import confrenceIcon from "../../assets/phone/users.svg";
import { CustomDropdown } from "../../components/common/InputComponent";
import { CallSessionManager } from "../../helpers/callSessionManager";
import { SipSessionRegistry } from "../../helpers/sipSessionRegistry";
import useSipAgentRef from "../../hooks/useSipAgentRef";
import useSipSession from "../../hooks/useSipSession";
import KeyboardShortcutsInfo from "./partials/KeyboardShortcutsInfo";
import {
  resetDialedPhone,
  setDialedPhone,
  setSelectedCallerId,
  setMuted,
} from "../../store/slices/callFeatureSlice";
import { updateLineState } from "../../store/slices/sipSlice";
import {
  formatDuration,
  formatUSAPhoneNumber,
  formatUSPhone,
  normalizePhoneNumber,
} from "../../utils/common";
import HoldButton from "./partials/HoldButton";
import KeypadButton from "./partials/KeypadButton";
import MultiLineDisplay from "./partials/MultiLineDisplay";
import MuteButton from "./partials/MuteButton";
import RecentCall from "./partials/RecentCall";
import RecordButton from "./partials/RecordButton";
import SpeakerSelector from "./partials/SpeakerSelector ";

const dialPad = [
  { value: "1", label: "1" },
  { value: "2", label: "2 ABC" },
  { value: "3", label: "3 DEF" },
  { value: "4", label: "4 GHI" },
  { value: "5", label: "5 JKL" },
  { value: "6", label: "6 MNO" },
  { value: "7", label: "7 PQRS" },
  { value: "8", label: "8 TUV" },
  { value: "9", label: "9 WXYZ" },
  { value: "*", label: "*" },
  { value: "0", label: "0" },
  { value: "#", label: "#" },
];

const PhoneComponent = () => {
  const [phone, setPhone] = useState("");
  const [showDTMF, setShowDTMF] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 767);
  const audioRef = useRef(null);
  const keypadBtnRef = useRef(null);
  const { userAgentRef } = useSipAgentRef();
  const callerID = useSelector((state) => state.auth?.user?.data?.response);
  let callerIDArray = JSON.parse(callerID);
  const parts = callerIDArray[0]?.split(" - ");
  const defaultNumber = parts ? parts[parts.length - 1]?.trim() : "";
  const selectedCallerId = useSelector(
    (state) => state.callFeature.selectedCallerId
  );
  const [selectedNumber, setSelectedNumber] = useState(
    selectedCallerId || defaultNumber || ""
  );
  const duration = useSelector((state) => state.sip.callDuration);
  const {
    makeCall,
    hangup,
    sessionRef,
    acceptCall,
    handleIncomingSession,
    switchToLine,
    holdCall,
    unholdCall,
  } = useSipSession();
  const dispatch = useDispatch();
  const dialedPhone = useSelector((state) => state.callFeature.dialedPhone);
  const incomingCall = useSelector((state) => state.sip.incomingCall);
  const isRegistered = useSelector((state) => state.sip.isRegistered);
  const lines = useSelector((state) => state.sip.lines);
  const callType = useSelector((state) => state.sip.callType);
  const activeLineId = useSelector((state) => state.sip.activeLineId);
  const hasActiveLines = Object.keys(lines).length > 0;
  const sessionID = useSelector((state) => state.callFeature?.sessions);
  const sessionIds = Object.keys(sessionID)[0];

  const session = sessionRef
    ? sessionRef.current
    : SipSessionRegistry.get(sessionIds);
  const pc = session?.sessionDescriptionHandler?.peerConnection;
  const canMute =
    session &&
    session.state === SIP.SessionState.Established &&
    pc &&
    pc.getSenders().find((s) => s.track?.kind === "audio");

  const [showConferenceDialog, setShowConferenceDialog] = useState(false);
  const [conferenceTarget, setConferenceTarget] = useState("");
  const [isConferencing, setIsConferencing] = useState(false);
  const [conferenceSession, setConferenceSession] = useState(null);

  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferTarget, setTransferTarget] = useState("");
  const [transferType, setTransferType] = useState("blind");
  const [attendedSession, setAttendedSession] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);

  const canTransfer = session && session.state === SIP.SessionState.Established;

  useEffect(() => {
    if (selectedNumber && selectedNumber !== selectedCallerId) {
      dispatch(setSelectedCallerId(selectedNumber));
    }
  }, [selectedNumber, selectedCallerId, dispatch]);

  const handleSelectChange = (e) => {
    if (e && e.target && e.target.value) {
      setSelectedNumber(e.target.value);
    }
  };
  const handleDial = (val) => {
    setPhone((prev) => {
      const next = (prev || "") + val;
      if (next.includes("*") || next.includes("#")) {
        return next.slice(0, 16);
      }
      return next.slice(0, 10);
    });
  };

  const handleBackspace = () => {
    setPhone((prev) => prev?.slice(0, -1));
  };
  const handleInputChange = (e) => {
    let value = e.target.value.replace(/[^0-9*#]/g, "");
    if (value.includes("*") || value.includes("#")) {
      value = value.slice(0, 16);
    } else {
      value = value.slice(0, 10);
    }
    setPhone(value);
  };
  // Add this function to your PhoneComponent

  const handleBlur = () => {
    setPhone(normalizePhoneNumber(phone));
  };

  let numberToCall = normalizePhoneNumber(selectedCallerId);

  const handleCall = () => {
    const lineId = makeCall({
      phone: phone,
      selectedNumber: numberToCall,
    });

    setPhone("");

    if (lineId) {
      dispatch(setDialedPhone(phone));
    } else {
      console.warn("Could not make call - all lines may be in use");
    }
  };

  // Add resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 767);
    };
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyboardShortcuts = (event) => {
      // Only process if meta keys (Ctrl/Cmd) are pressed
      if (!event.ctrlKey) return;

      // Prevent shortcuts from firing when in input fields
      if (
        event.target.tagName === 'INPUT' || 
        event.target.tagName === 'TEXTAREA' || 
        event.target.isContentEditable
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'a':
          // Answer Call: Ctrl+A
          if (!event.shiftKey && incomingCall) {
            event.preventDefault();
            acceptCall();
          }
          // Attended Transfer: Ctrl+Shift+A
          else if (event.shiftKey && canTransfer) {
            event.preventDefault();
            setShowTransferDialog(true);
            setTransferType("attended");
          }
          break;

        case 'e':
          // End Call: Ctrl+E
          if (!event.shiftKey) {
            event.preventDefault();
            handleHangup();
          }
          break;

        case 'm':
          // Mute/Unmute: Ctrl+Shift+M
          if (event.shiftKey && canMute) {
            event.preventDefault();
            const activeLine = store.getState().sip.lines[activeLineId];
            const isLineMuted = activeLine?.muted || false;
            
            // Toggle mute state
            const newMutedState = !isLineMuted;
            
            // Apply mute state to audio track
            const pc = sessionRef.current?.sessionDescriptionHandler?.peerConnection;
            if (pc) {
              const audioSender = pc.getSenders().find((s) => s.track?.kind === "audio");
              if (audioSender?.track) {
                audioSender.track.enabled = !newMutedState;
              }
            }
            
            // Update Redux state
            dispatch(setMuted(newMutedState));
            if (activeLineId !== null) {
              dispatch(updateLineState({
                lineId: activeLineId,
                data: { muted: newMutedState }
              }));
            }
          }
          break;

        case 'd':
          // Decline Call: Ctrl+D
          if (!event.shiftKey && incomingCall) {
            event.preventDefault();
            hangup();
          }
          break;

        case 'b':
          // Blind Transfer: Ctrl+Shift+B
          if (event.shiftKey && canTransfer) {
            event.preventDefault();
            setShowTransferDialog(true);
            setTransferType("blind");
          }
          break;

        case 'h':
          // Hold Call: Ctrl+Shift+H
          if (event.shiftKey && canHold) {
            event.preventDefault();
            const activeLine = store.getState().sip.lines[activeLineId];
            const isLineOnHold = activeLine?.onHold || false;
            
            if (isLineOnHold) {
              unholdCall(activeLineId);
            } else {
              holdCall(activeLineId);
            }
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => {
      window.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, [incomingCall, canMute, canHold, canTransfer, activeLineId]);

  const handleHangup = () => {
    try {
      if (incomingCall) {
        hangup();
      } else if (activeLineId !== null) {
        hangup(activeLineId);
      } else if (sessionRef.current) {
        hangup();
      } else {
        return;
      }
      dispatch(resetDialedPhone());
      setShowTransferDialog(false);
      setShowConferenceDialog(false);
      setShowDTMF(false);
      setPhone("");
    } catch (err) {
      console.error("Error during hangup:", err);
    }
  };

  const toggleDialog = (dialogType) => {
    if (dialogType === "transfer") {
      // If transfer dialog is already open, close it
      if (showTransferDialog) {
        setShowTransferDialog(false);
        setTransferTarget("");
        if (attendedSession) {
          cancelAttendedTransfer();
        }
      } else {
        // Close conference dialog if open
        if (showConferenceDialog) {
          setShowConferenceDialog(false);
          setConferenceTarget("");
          if (conferenceSession) {
            endConferenceCall();
          }
        }
        // Open transfer dialog
        setShowTransferDialog(true);
      }
    } else if (dialogType === "conference") {
      // If conference dialog is already open, close it
      if (showConferenceDialog) {
        setShowConferenceDialog(false);
        setConferenceTarget("");
      } else {
        // Close transfer dialog if open
        if (showTransferDialog) {
          setShowTransferDialog(false);
          setTransferTarget("");
          if (attendedSession) {
            cancelAttendedTransfer();
          }
        }
        // Open conference dialog
        setShowConferenceDialog(true);
      }
    }
  };

  const handleSendDTMF = (tone) => {
    const session = sessionRef.current;
    if (!session || !session.sessionDescriptionHandler) return;

    try {
      session.sessionDescriptionHandler.sendDtmf(tone);
    } catch (error) {
      console.error("Error sending DTMF:", error);
    }
  };

  useEffect(() => {
    if (!sessionRef.current) {
      setPhone("");
      dispatch(resetDialedPhone());
    }
  }, [sessionRef.current, dispatch]);

  const canConference =
    session && session.state === SIP.SessionState.Established;

  useEffect(() => {
    if (!canConference) {
      setConferenceSession(null);
      setIsConferencing(false);
    }
  }, [canConference]);

  useEffect(() => {
    return () => {
      if (
        conferenceSession &&
        conferenceSession.state !== SIP.SessionState.Terminated
      ) {
        try {
          conferenceSession.bye();
        } catch (e) {
          console.error("Error cleaning up conference session:", e);
        }
      }
    };
  }, [conferenceSession]);

  const initiateConferenceCall = async () => {
    if (!canConference || !conferenceTarget || !userAgentRef.current) return;

    try {
      setIsConferencing(true);
      console.log("Initiating conference call sequence");

      // Put the current call on hold before initiating the second call
      console.log("Placing original call on hold");
      await session.invite({
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: false,
          },
          hold: true,
        },
      });
      console.log("Original call placed on hold successfully");

      // Create the SIP URI target
      let uriString;
      if (conferenceTarget.includes('@')) {
        uriString = `sip:${conferenceTarget}`;
      } else {
        // Get domain from userAgentRef
        const domain = userAgentRef.current?.configuration?.uri?.host;
        if (!domain) {
          console.error("Cannot determine SIP domain");
          alert("Cannot determine SIP domain. Please enter full SIP address (user@domain)");
          setIsConferencing(false);
          return;
        }
        uriString = `sip:${conferenceTarget}@${domain}`;
      }

      // Use SIP.UserAgent.makeURI instead of userAgentRef.current.makeURI
      const target = SIP.UserAgent.makeURI(uriString);
      if (!target) {
        console.error("Failed to create URI for conference target");
        setIsConferencing(false);
        return;
      }

      console.log(`Calling conference target: ${uriString}`);
      const inviter = new SIP.Inviter(userAgentRef.current, target);

      // Setup audio element for the conference
      const audioElement = document.createElement('audio');
      audioElement.autoplay = true;
      audioElement.id = 'conference-audio';
      document.body.appendChild(audioElement);

      // Create audio context for conference mixing
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      // Track this audio context for proper cleanup
      window.audioContextList.push(audioContext);

      // Create a media stream destination for mixed audio
      const destination = audioContext.createMediaStreamDestination();

      // Create a delegate with enhanced audio handling
      const delegate = {
        onSessionDescriptionHandler: (sdh) => {
          console.log("Setting up session description handler for conference call");
          sdh.peerConnectionDelegate = {
            ontrack: (event) => {
              if (event.track.kind === 'audio') {
                console.log("Received audio track from conference participant");
                const stream = new MediaStream([event.track]);

                // Connect this audio to the audio context for later mixing
                const source = audioContext.createMediaStreamSource(stream);
                source.connect(destination);

                // For now, also play it directly in the audio element
                audioElement.srcObject = stream;
                audioElement.play()
                  .then(() => console.log("Conference audio playing"))
                  .catch(err => console.error("Failed to play conference audio:", err));

                // Store the stream and source for later clean up and mixing
                if (!window.conferenceData) {
                  window.conferenceData = {
                    streams: [],
                    sources: [],
                    destination: destination
                  };
                }
                window.conferenceData.streams.push(stream);
                window.conferenceData.sources.push(source);
              }
            }
          };
        },
        onConnect: () => {
          console.log("Conference call connecting - preparing bidirectional audio paths");
        }
      };

      // Apply delegate
      inviter.delegate = delegate;

      // Configure proper audio constraints
      const inviteOptions = {
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            },
            video: false
          },
          offerOptions: {
            offerToReceiveAudio: true,
            offerToReceiveVideo: false
          }
        }
      };

      // Add comprehensive state change listener for the conference call
      inviter.stateChange.addListener((state) => {
        console.log(`Conference call state changed to: ${state}`);

        if (state === SIP.SessionState.Established) {
          console.log("Conference call established - ready for merging");
          const sdh = inviter.sessionDescriptionHandler;
          if (sdh && sdh.peerConnection) {
            console.log("Ensuring audio path from second participant is ready");
            const receivers = sdh.peerConnection.getReceivers();
            receivers.forEach(receiver => {
              if (receiver.track && receiver.track.kind === 'audio') {
                console.log("Conference audio track identified and ready for mixing");
              }
            });
          }
        }
      });

      // Start the call
      console.log("Initiating conference call");
      await inviter.invite(inviteOptions);
      console.log("Conference call initiated successfully");
      setConferenceSession(inviter);
      inviter.stateChange.addListener((state) => {
        if (state === SIP.SessionState.Terminated) {
          if (audioElement && audioElement.parentNode) {
            audioElement.srcObject = null;
            audioElement.parentNode.removeChild(audioElement);
          }
        }
      });
    } catch (error) {
      console.error("Error initiating conference call:", error);
      setConferenceSession(null);

      // Clean up audio element on error
      const audioElement = document.getElementById('conference-audio');
      if (audioElement && audioElement.parentNode) {
        audioElement.srcObject = null;
        audioElement.parentNode.removeChild(audioElement);
      }

      // Take original call off hold
      try {
        await session.invite({
          sessionDescriptionHandlerOptions: {
            constraints: {
              audio: true,
              video: false,
            },
            hold: false,
          },
        });
      } catch (holdError) {
        console.error("Failed to take call off hold after error:", holdError);
      }
    } finally {
      setIsConferencing(false);
    }
  };  // Join calls into conference
  const mergeCallsIntoConference = async () => {
    if (!canConference || !conferenceSession) return;

    try {
      setIsConferencing(true);
      console.log("Merging calls into conference - creating bidirectional audio bridge");

      // Create an audio context for the conference bridge
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      // Track this audio context for proper cleanup
      window.audioContextList.push(audioContext);

      // Create a main destination for the mixed audio
      const mainDestination = audioContext.createMediaStreamDestination();

      // Create a gain node for each participant to control volume if needed
      const originalGain = audioContext.createGain();
      originalGain.gain.value = 1.0; // Normal volume

      const conferenceGain = audioContext.createGain();
      conferenceGain.gain.value = 1.0; // Normal volume

      // Store audio nodes and streams for proper cleanup later
      const audioNodes = [];
      const tracksToCleanup = [];

      console.log("Setting up bidirectional audio paths between participants");

      // Get audio from the original call (first participant)
      let originalStream = null;
      if (session && session.sessionDescriptionHandler?.peerConnection) {
        const originalPC = session.sessionDescriptionHandler.peerConnection;
        originalPC.getReceivers().forEach(receiver => {
          if (receiver.track && receiver.track.kind === 'audio') {
            // Create a stream from the original call
            originalStream = new MediaStream([receiver.track]);
            tracksToCleanup.push(receiver.track);

            // Create a source from the first participant's audio
            const originalSource = audioContext.createMediaStreamSource(originalStream);
            audioNodes.push(originalSource);

            // Connect the first participant to the main mix through the gain node
            originalSource.connect(originalGain);
            originalGain.connect(mainDestination);

            console.log("Connected first participant's audio to the conference mix");
          }
        });
      }

      // Get audio from the conference call (second participant)
      let conferenceStream = null;
      if (conferenceSession && conferenceSession.sessionDescriptionHandler?.peerConnection) {
        const conferencePC = conferenceSession.sessionDescriptionHandler.peerConnection;
        conferencePC.getReceivers().forEach(receiver => {
          if (receiver.track && receiver.track.kind === 'audio') {
            // Create a stream from the conference call
            conferenceStream = new MediaStream([receiver.track]);
            tracksToCleanup.push(receiver.track);

            // Create a source for the second participant's audio
            const conferenceSource = audioContext.createMediaStreamSource(conferenceStream);
            audioNodes.push(conferenceSource);

            // Connect the second participant to the main mix through the gain node
            conferenceSource.connect(conferenceGain);
            conferenceGain.connect(mainDestination);

            console.log("Connected second participant's audio to the conference mix");
          }
        });
      }

      // Create a shared audio element for the conference
      const conferenceAudioElement = document.getElementById('conference-audio') || document.createElement('audio');
      conferenceAudioElement.id = 'conference-audio';
      conferenceAudioElement.autoplay = true;
      if (!conferenceAudioElement.parentNode) {
        document.body.appendChild(conferenceAudioElement);
      }

      // Route the mixed audio (containing both participants) to the audio element
      // This allows everyone to hear everyone
      conferenceAudioElement.srcObject = mainDestination.stream;
      console.log("Created combined audio stream with all participants mixed");

      // Begin playing the mixed audio
      await conferenceAudioElement.play()
        .then(() => console.log("Successfully playing mixed conference audio"))
        .catch(err => console.error("Error playing mixed conference audio:", err));

      // Also send the mixed audio back to both call participants
      // This is crucial for the complete bidirectional audio flow
      if (session && session.sessionDescriptionHandler?.peerConnection) {
        // Take the original call off hold
        await session.invite({
          sessionDescriptionHandlerOptions: {
            constraints: {
              audio: true,
              video: false,
            },
            hold: false,
          },
        });
        console.log("Original call taken off hold - audio path established");
      }

      console.log("Conference successfully merged - all participants should now hear each other");

      // Store conference data in window for access from other functions
      window.conferenceData = {
        audioContext,
        mainDestination,
        originalGain,
        conferenceGain,
        audioNodes,
        tracksToCleanup,
        conferenceAudioElement
      };

      // Close dialog
      setShowConferenceDialog(false);
    } catch (error) {
      console.error("Error creating conference:", error);
      alert(`Failed to create conference: ${error.message}`);

      // Try to recover the calls
      try {
        // Make sure original call is active
        await session.invite({
          sessionDescriptionHandlerOptions: {
            constraints: {
              audio: true,
              video: false,
            },
            hold: false,
          },
        });
      } catch (recoverError) {
        console.error("Failed to recover calls:", recoverError);
      }
    } finally {
      setIsConferencing(false);
    }
  };  // End conference call
  const endConferenceCall = async () => {
    if (!conferenceSession) return;

    try {
      setIsConferencing(true);
      console.log("Ending conference call and performing comprehensive cleanup");

      // End the conference call based on its current state
      if (conferenceSession.state === SIP.SessionState.Established) {
        console.log("Sending BYE to terminate established conference call");
        await conferenceSession.bye();
      } else if (conferenceSession.state === SIP.SessionState.Establishing) {
        console.log("Sending CANCEL to terminate establishing conference call");
        await conferenceSession.cancel();
      } else if (conferenceSession.state === SIP.SessionState.Initial) {
        console.log("Sending CANCEL to terminate initial conference call");
        await conferenceSession.cancel();
      }

      // Perform thorough cleanup of all audio resources
      console.log("Cleaning up audio resources");

      // 1. Stop and remove the audio element
      const audioElement = document.getElementById('conference-audio');
      if (audioElement && audioElement.parentNode) {
        console.log("Stopping audio playback and removing element");
        // Stop all tracks in the srcObject if they exist
        if (audioElement.srcObject) {
          const tracks = audioElement.srcObject.getTracks();
          tracks.forEach(track => {
            console.log(`Stopping audio track: ${track.id}`);
            track.stop();
          });
        }
        audioElement.srcObject = null;
        audioElement.pause();
        audioElement.parentNode.removeChild(audioElement);
      }

      // 2. Clean up conference data from the window object
      if (window.conferenceData) {
        console.log("Cleaning up conference data structures");

        // Stop all recorded tracks
        if (window.conferenceData.tracksToCleanup) {
          window.conferenceData.tracksToCleanup.forEach(track => {
            if (track.readyState === 'live') {
              console.log(`Stopping track ${track.id}`);
              track.stop();
            }
          });
        }

        // Disconnect any audio nodes
        if (window.conferenceData.audioNodes) {
          window.conferenceData.audioNodes.forEach(node => {
            try {
              console.log("Disconnecting audio node");
              node.disconnect();
            } catch (e) {
              console.warn("Error disconnecting audio node:", e);
            }
          });
        }

        // Clean up any streams
        if (window.conferenceData.streams) {
          window.conferenceData.streams.forEach(stream => {
            stream.getTracks().forEach(track => {
              console.log(`Stopping stream track: ${track.id}`);
              track.stop();
            });
          });
        }

        // Clean up any sources
        if (window.conferenceData.sources) {
          window.conferenceData.sources.forEach(source => {
            try {
              console.log("Disconnecting audio source");
              source.disconnect();
            } catch (e) {
              console.warn("Error disconnecting audio source:", e);
            }
          });
        }

        // Delete the conference data
        window.conferenceData = null;
      }

      // 3. Close all audio contexts
      try {
        const audioContexts = window.audioContextList || [];
        console.log(`Closing ${audioContexts.length} audio contexts`);
        audioContexts.forEach((ctx, index) => {
          if (ctx && typeof ctx.close === 'function' && ctx.state !== 'closed') {
            console.log(`Closing audio context #${index}`);
            ctx.close();
          }
        });
        // Clear the list
        window.audioContextList = [];
      } catch (audioErr) {
        console.warn("Could not close all audio contexts:", audioErr);
      }

      // 4. Make sure the original call is still active and take it off hold
      if (session && session.state === SIP.SessionState.Established) {
        console.log("Re-establishing original call audio");
        await session.invite({
          sessionDescriptionHandlerOptions: {
            constraints: {
              audio: true,
              video: false,
            },
            hold: false,
          },
        });
        console.log("Original call taken off hold and audio re-established");
      }

      // Reset all state variables
      console.log("Resetting conference call state");
      setConferenceSession(null);
      setShowConferenceDialog(false);
      setConferenceTarget("");
    } catch (error) {
      console.error("Error ending conference call:", error);

      // Still try to clean up and reset state even if there was an error
      const audioElement = document.getElementById('conference-audio');
      if (audioElement && audioElement.parentNode) {
        if (audioElement.srcObject) {
          audioElement.srcObject.getTracks().forEach(track => track.stop());
        }
        audioElement.srcObject = null;
        audioElement.parentNode.removeChild(audioElement);
      }

      // Make sure original call is recovered
      try {
        if (session && session.state === SIP.SessionState.Established) {
          console.log("Error recovery: Taking original call off hold");
          await session.invite({
            sessionDescriptionHandlerOptions: {
              constraints: {
                audio: true,
                video: false,
              },
              hold: false,
            },
          });
        }
      } catch (recoverError) {
        console.error("Failed to recover original call after error:", recoverError);
      }

      setConferenceSession(null);
      setShowConferenceDialog(false);
      setConferenceTarget("");
    } finally {
      setIsConferencing(false);
    }
  };

  // Transfer calls logic
  useEffect(() => {
    if (!canTransfer) {
      setAttendedSession(null);
      setIsTransferring(false);
    }
  }, [canTransfer]);

  // Handle blind transfer
  const handleBlindTransfer = async () => {
    if (!canTransfer || !transferTarget || !userAgentRef.current) return;

    try {
      setIsTransferring(true);

      // Create the SIP URI target
      let uriString;
      if (transferTarget.includes("@")) {
        uriString = `sip:${transferTarget}`;
      } else {
        // Get domain from userAgentRef
        const domain = userAgentRef.current?.configuration?.uri?.host;
        if (!domain) {
          setIsTransferring(false);
          return;
        }
        uriString = `sip:${transferTarget}@${domain}`;
      }

      // Use SIP.UserAgent.makeURI instead of userAgentRef.current.makeURI
      const target = SIP.UserAgent.makeURI(uriString);
      if (!target) {
        setIsTransferring(false);
        return;
      }

      // Initiate blind transfer
      await session.refer(target);

      setShowTransferDialog(false);
      setTransferTarget("");

      setTimeout(async () => {
        try {
          if (session && session.state !== SIP.SessionState.Terminated) {
            await session.bye();
          }
        } catch (byeError) {
          console.error("Error ending session after blind transfer:", byeError);
        }
      }, 500);
    } catch (error) {
      console.error("Error in blind transfer:", error);
    } finally {
      setIsTransferring(false);
    }
  };

  // Start attended transfer
  const initiateAttendedTransfer = async () => {
    if (!canTransfer || !transferTarget || !userAgentRef.current) return;

    try {
      setIsTransferring(true);
      await session.invite({
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: false,
          },
          hold: true,
        },
      });
      let uriString;
      if (transferTarget.includes("@")) {
        uriString = `sip:${transferTarget}`;
      } else {
        const domain = userAgentRef.current?.configuration?.uri?.host;
        if (!domain) {
          setIsTransferring(false);
          return;
        }
        uriString = `sip:${transferTarget}@${domain}`;
      }

      const target = SIP.UserAgent.makeURI(uriString);
      if (!target) {
        setIsTransferring(false);
        return;
      }

      const inviter = new SIP.Inviter(userAgentRef.current, target);
      const audioElement = document.createElement("audio");
      audioElement.autoplay = true;
      audioElement.id = "attended-transfer-audio";
      document.body.appendChild(audioElement);

      inviter.delegate = {
        onTrack: (track) => {
          if (track.kind === "audio") {
            const stream = new MediaStream([track]);
            audioElement.srcObject = stream;
            audioElement.play();
          }
        },
      };

      const delegate = {
        onSessionDescriptionHandler: (sdh) => {
          sdh.peerConnectionDelegate = {
            ontrack: (event) => {
              if (event.track.kind === "audio") {
                const stream = new MediaStream([event.track]);
                audioElement.srcObject = stream;
                audioElement.play();
              }
            },
          };
        },
      };

      inviter.delegate = delegate;

      const inviteOptions = {
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: false,
          },
          offerOptions: {
            offerToReceiveAudio: true,
            offerToReceiveVideo: false,
          },
        },
      };

      inviter.stateChange.addListener((state) => {
        if (state === SIP.SessionState.Established) {
          const sdh = inviter.sessionDescriptionHandler;
          if (sdh && sdh.peerConnection) {
            const receivers = sdh.peerConnection.getReceivers();

            receivers.forEach((receiver) => {
              if (receiver.track && receiver.track.kind === "audio") {
                const stream = new MediaStream([receiver.track]);
                audioElement.srcObject = stream;
                audioElement.play();
              }
            });
          }
        }
      });

      await inviter.invite(inviteOptions);
      setAttendedSession(inviter);
      inviter.stateChange.addListener((state) => {
        if (state === SIP.SessionState.Terminated) {
          if (audioElement && audioElement.parentNode) {
            audioElement.srcObject = null;
            audioElement.parentNode.removeChild(audioElement);
          }
        }
      });
    } catch (error) {
      console.error("Error:", error);
      setAttendedSession(null);

      const audioElement = document.getElementById("attended-transfer-audio");
      if (audioElement && audioElement.parentNode) {
        audioElement.srcObject = null;
        audioElement.parentNode.removeChild(audioElement);
      }

      try {
        await session.invite({
          sessionDescriptionHandlerOptions: {
            constraints: {
              audio: true,
              video: false,
            },
            hold: false,
          },
        });
      } catch (holdError) {
        console.error("Failed to take call off hold after error:", holdError);
      }
    } finally {
      setIsTransferring(false);
    }
  };

  const completeAttendedTransfer = async () => {
    if (!canTransfer || !attendedSession) return;

    try {
      setIsTransferring(true);
      await session.refer(attendedSession);
      await attendedSession.bye();
      setTimeout(async () => {
        try {
          if (session && session.state !== SIP.SessionState.Terminated) {
            await session.bye();
          }
        } catch (byeError) {
          console.error("Error ending original call:", byeError);
        }
      }, 500);

      // Reset state
      setAttendedSession(null);
      setShowTransferDialog(false);
      setTransferTarget("");
    } catch (error) {
      console.error("Error", error);

      try {
        await session.invite({
          sessionDescriptionHandlerOptions: {
            constraints: {
              audio: true,
              video: false,
            },
            hold: false,
          },
        });
      } catch (holdError) {
        console.error("Failed to take call off hold after error:", holdError);
      }
    } finally {
      setIsTransferring(false);
    }
  };

  // Cancel attended transfer
  const cancelAttendedTransfer = async () => {
    if (!attendedSession) return;

    try {
      await attendedSession.bye();
      await session.invite({
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: false,
          },
          hold: false,
        },
      });
    } catch (error) {
      console.error("Error cancelling attended transfer:", error);
    } finally {
      setAttendedSession(null);
    }
  };

  useEffect(() => {
    if (!userAgentRef.current) return;
    userAgentRef.current.delegate = {
      onInvite: (incomingSession) => {
        handleIncomingSession(incomingSession);
      },
    };
  }, []);

  const renderDialPad = () => (
    <div
      className={`relative flex flex-col w-full ${!isMobileView ? "max-w-[400px]" : ""
        } justify-end bg-white p-5 pt-8 ${!isMobileView ? "border-r-[1px] border-gray-200" : ""
        }`}
    >
      <div
        className={`${Object.keys(lines).length > 1
            ? "max-h-[calc(100vh-220px)]"
            : "max-h-full"
          } overflow-y-auto overflowScroll`}
      >
        {hasActiveLines && Object.keys(lines).length > 1 && (
          <MultiLineDisplay
            switchToLine={switchToLine}
            hangup={hangup}
            holdCall={holdCall}
            unholdCall={unholdCall}
            acceptCall={acceptCall}
          />
        )}
        <div className="relative 2xl:mb-10 mb-5 bg-white z-10 flex flex-col w-full items-start">
          <h5 className="text-sm text-left font-semibold text-primary block mb-2.5">
            Caller ID
          </h5>
          <CustomDropdown
            name="callerId"
            label=""
            options={
              Array.isArray(callerIDArray)
                ? callerIDArray?.map((entry) => {
                  const parts = entry.split(" - ");
                  const number = parts[parts.length - 1]?.trim();
                  const name = parts
                    .slice(0, parts.length - 1)
                    .join(" - ")
                    .trim();
                  return {
                    label: name
                      ? `${name} - ${formatUSPhone(number)}`
                      : formatUSPhone(number),
                    value: number,
                  };
                })
                : []
            }
            value={
              Array.isArray(callerIDArray)
                ? callerIDArray
                  .map((entry) => {
                    const parts = entry.split(" - ");
                    const number = parts[parts.length - 1]?.trim();
                    const name = parts
                      .slice(0, parts.length - 1)
                      .join(" - ")
                      .trim();
                    return {
                      label: name
                        ? `${name} - ${formatUSPhone(number)}`
                        : formatUSPhone(number),
                      value: number,
                    };
                  })
                  .find((opt) => opt.value === selectedCallerId) || ""
                : ""
            }
            onChange={handleSelectChange}
            customClass="w-full max-w-full"
          />
        </div>
        <div className="relative block w-full mb-4">
          <input
            type="text"
            value={formatUSAPhoneNumber(phone)}
            placeholder="Phone Number"
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="w-full h-11 px-4 py-2 border-[1px] border-[#ebe6e7] text-primary rounded-lg text-base text-center"
          />
          <button
            onClick={handleBackspace}
            className="absolute top-1 right-2 cursor-pointer"
          >
            <img src={dialRemove} alt="" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4 dialpad">
          {dialPad.map((btn, idx) => (
            <button
              key={idx}
              className="bg-gray-100 hover:bg-secondary rounded-lg py-1.5 2xl:py- cursor-pointer text-xl font-bold flex flex-col items-center justify-center transition-colors group"
              onClick={() => handleDial(btn.value)}
              type="button"
            >
              <span className="text-black !group-hover:text-white transition-colors">
                {btn.value}
              </span>
              <span className="text-xs font-normal text-black group-hover:text-white transition-colors">
                {btn.label && btn.value
                  ? btn.label.replace(btn.value, "").trim()
                  : btn.label || ""}
              </span>
            </button>
          ))}
        </div>
        <div className="flex justify-center items-center gap-3">
          <button
            className={`flex justify-center items-center bg-white rounded-full w-14 h-14 cursor-pointer  ${phone && isRegistered ? "opacity-100" : "opacity-50"
              }`}
            onClick={handleCall}
            disabled={!(phone && isRegistered)}
          >
            <img src={receiveCall} alt="" />
          </button>
        </div>
      </div>
    </div>
  );

  // Add a shared renderCallScreen function
  const renderCallScreen = () => (
    <div className="relative flex-1 flex flex-col justify-center items-center p-5">
      {isMobileView && hasActiveLines && Object.keys(lines).length > 1 && (
        <MultiLineDisplay
          switchToLine={switchToLine}
          hangup={hangup}
          holdCall={holdCall}
          unholdCall={unholdCall}
          acceptCall={acceptCall}
        />
      )}
      <div
        className={`${isMobileView ? "w-24 h-24" : "w-40 h-40"
          } mb-4 rounded-full bg-gray-100 flex items-center justify-center`}
      >
        <img src={userAvatar} alt="User Avatar" className="w-full h-full p-4" />
      </div>

      <div className="text-center sm:mb-10 mb-5">
        {!hasActiveLines && !canMute ? (
          <h5
            className={`${isMobileView ? "text-lg" : "text-xl"} font-semibold`}
          >
            No Active Call
          </h5>
        ) : (
          <>
            {(() => {
              const effectiveLineId =
                activeLineId > 1 ? String(activeLineId) : "1";
              const activeLine = lines[effectiveLineId];
              return (
                activeLine && (
                  <>
                    <h5
                      className={`${isMobileView ? "text-lg" : "text-xl"
                        } font-semibold`}
                    >
                      {activeLine.displayName || `Line ${effectiveLineId}`}
                    </h5>
                    <h5
                      className={`${isMobileView ? "text-lg" : "text-xl"
                        } font-semibold`}
                    >
                      {formatUSPhone(activeLine.phone || dialedPhone)}
                    </h5>
                  </>
                )
              );
            })()}

            <p className="mt-2 text-base !text-secondary">
              {duration > 0
                ? formatDuration(duration || 0)
                : incomingCall.displayName
                  ? "Incoming..."
                  : "Calling..."}
            </p>
          </>
        )}
      </div>
      {showConferenceDialog && (
        <div className="flex items-center justify-center w-full">
          <div className="bg-white w-full flex items-center gap-2.5 max-w-[400px] mb-8">
            {!conferenceSession ? (
              <>
                <input
                  type="text"
                  value={conferenceTarget}
                  onChange={(e) => setConferenceTarget(e.target.value)}
                  placeholder="Add Participant SIP Address"
                  className="w-full max-w-[270px] h-10 px-4 py-2 border-[1px] border-[#ebe6e7] text-primary rounded-lg text-base text-center"
                  disabled={isConferencing}
                />

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowConferenceDialog(false)}
                    disabled={isConferencing}
                  >
                    <img src={backIcon} className="w-10 h-10" alt="" />
                  </button>
                  <button
                    onClick={initiateConferenceCall}
                    disabled={!conferenceTarget || isConferencing}
                  >
                    <img src={receiveCall} className="w-10 h-10" alt="" />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center block w-full">
                <h5 className="text-xs">Participant connected.</h5>
              </div>
            )}
          </div>
        </div>
      )}
      {showTransferDialog && (
        <div className="flex flex-col items-center justify-center mb-10">
          <h3 className="text-lg font-medium mb-3">Transfer Type</h3>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="blind"
                checked={transferType === "blind"}
                onChange={() => setTransferType("blind")}
                className="mr-1"
                disabled={isTransferring}
              />
              Blind
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="attended"
                checked={transferType === "attended"}
                onChange={() => setTransferType("attended")}
                className="mr-1"
                disabled={isTransferring}
              />
              Attended
            </label>
          </div>

          <div className="flex items-center justify-center gap-2 mt-4">
            {!attendedSession && (
              <input
                type="text"
                value={transferTarget}
                onChange={(e) => setTransferTarget(e.target.value)}
                placeholder="Transfer Target SIP"
                className="w-full max-w-[200px] p-2 border rounded"
                disabled={isTransferring || attendedSession}
              />
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowTransferDialog(false);
                  setTransferTarget("");
                  if (attendedSession) {
                    cancelAttendedTransfer();
                  }
                }}
                disabled={isTransferring}
              >
                <img src={backIcon} className="w-10 h-10" alt="" />
              </button>

              {transferType === "blind" ? (
                <button
                  className="w-10 h-10 flex items-center justify-center bg-secondary rounded-full"
                  onClick={handleBlindTransfer}
                  disabled={!transferTarget || isTransferring}
                >
                  <img src={forwordWhiteIcon} className="w-5" alt="" />
                </button>
              ) : attendedSession ? (
                <button
                  className="w-10 h-10 flex items-center justify-center bg-secondary rounded-full"
                  onClick={completeAttendedTransfer}
                  disabled={isTransferring}
                >
                  <img src={transferIcon} className="w-5" alt="" />
                </button>
              ) : (
                <button
                  onClick={initiateAttendedTransfer}
                  disabled={!transferTarget || isTransferring}
                >
                  <img src={receiveCall} className="w-10 h-10" alt="" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col justify-center items-center gap-3">
        <ul className="relative flex justify-center items-center gap-3 sm:mb-4 mb-1">
          {callType === "incoming" && Object.entries(lines)?.length == 1 && (
            <li>
              <Link to="#" onClick={acceptCall} title="Accept Call">
                <img
                  src={receiveCall}
                  className={"sm:w-15 sm:h-15 w-12 h-12"}
                  alt="Accept call"
                />
              </Link>
            </li>
          )}

          {showConferenceDialog && conferenceSession && (
            <button
              type="button"
              className={"sm:w-15 sm:h-15 w-12 h-12"}
              onClick={mergeCallsIntoConference}
              disabled={isConferencing}
              title={
                !canConference
                  ? "Conference unavailable until call is established"
                  : ""
              }
              style={{ opacity: canConference ? 1 : 0.5 }}
            >
              <img
                src={mergeIcon}
                alt=""
                className={"sm:max-w-7 max-w-5"}
              />
              <span className="absolute left-[-10] top-[-15px] -translate-y-1/2 ml-2 z-50 bg-[#67308F] !text-[#fff] text-xs rounded px-3 py-1 shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Merge Calls
              </span>
            </button>
          )}
          {hasActiveLines && canMute && (
            <>
              <li>
                <MuteButton sessionRef={sessionRef} isPhoneModule={true} />
              </li>
              <li>
                <HoldButton sessionRef={sessionRef} isPhoneModule={true} />
              </li>
            </>
          )}
          <li>
            {showConferenceDialog && conferenceSession ? (
              <Link to="#" onClick={endConferenceCall} className="relative">
                <img src={closeCallicon} className="w-16 h-16" alt="" />
                <span className="absolute left-[-10] top-[-15px] -translate-y-1/2 ml-2 z-50 bg-[#67308F] !text-[#fff] text-xs rounded px-3 py-1 shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Merge Calls
                </span>
              </Link>
            ) : (
              <Link to="#" onClick={handleHangup}>
                <img src={closeCallicon} className="sm:w-15 sm:h-15 w-12 h-12" alt="" />
              </Link>
            )}
          </li>
        </ul>
        {hasActiveLines && canMute && (
          <ul className="flex justify-center flex-wrap items-center gap-3">
            <li style={{ position: "relative" }}>
              <span ref={keypadBtnRef}>
                <KeypadButton
                  sessionRef={sessionRef}
                  setShowDTMF={setShowDTMF}
                  handleSendDTMF={handleSendDTMF}
                  showDTMF={showDTMF}
                  isPhoneModule={true}
                />
              </span>
            </li>
            <li>
              <RecordButton sessionRef={sessionRef} isPhoneModule={true} />
            </li>
            <li>
              <button
                type="button"
                className="relative flex items-center justify-center sm:w-15 sm:h-15 w-12 h-12 bg-[#aa93c752] rounded-full group"
                onClick={() => toggleDialog("conference")}
                disabled={!canConference}
                title={
                  !canConference
                    ? "Conference unavailable until call is established"
                    : ""
                }
                style={{ opacity: canConference ? 1 : 0.5 }}
              >
                <img
                  src={confrenceIcon}
                  alt=""
                  className="sm:max-w-7 max-w-5 h-auto transition-transform duration-200 ease-linear group-hover:scale-[1.2]"
                />
                <span className="absolute left-[-10] top-[-15px] -translate-y-1/2 ml-2 z-50 bg-[#67308F] !text-[#fff] text-xs rounded px-3 py-1 shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Conference
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="relative flex items-center justify-center sm:w-15 w-12 sm:h-15 h-12 bg-[#aa93c752] rounded-full group"
                onClick={() => toggleDialog("transfer")}
                disabled={!canTransfer}
                title={
                  !canTransfer
                    ? "Transfer unavailable until call is established"
                    : ""
                }
                style={{ opacity: canTransfer ? 1 : 0.5 }}
              >
                <img
                  src={forwordIcon}
                  alt=""
                  className="sm:max-w-7 max-w-5 h-auto transition-transform duration-200 ease-linear group-hover:scale-[1.2]"
                />
                <span className="absolute left-[-10] top-[-15px] -translate-y-1/2 ml-2 z-50 bg-[#67308F] !text-[#fff] text-xs rounded px-3 py-1 shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Transfer
                </span>
              </button>
            </li>
            <li>
              <SpeakerSelector
                session={sessionRef.current}
                sessionRef={sessionRef}
                isPhoneModule={true}
              />
            </li>
          </ul>
        )}
      </div>
    </div>
  );

  useEffect(() => {
    if (sessionRef.current) return;
    CallSessionManager.restoreSessions();

    if (sessionRef.current?.sessionDescriptionHandler?.peerConnection) {
      const pc = sessionRef.current.sessionDescriptionHandler.peerConnection;
      attachAudioStream(pc);
    }
  }, []);

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
      audioRef.current.play();
    };

    audioRef.current.srcObject = remoteStream;
    audioRef.current.play();
  };

  useEffect(() => {
    if (!canTransfer && showTransferDialog) {
      setShowTransferDialog(false);
      setTransferTarget("");
      setAttendedSession(null);
    }

    if (!canConference && showConferenceDialog) {
      setShowConferenceDialog(false);
      setConferenceTarget("");
      setConferenceSession(null);
    }
  }, [canTransfer, canConference, showTransferDialog, showConferenceDialog]);

  return (
    <>
      <div
        className={`relative flex bg-white rounded-2xl w-[calc(100%-32px)] [@media(min-height:850px)]:h-[calc(100%-50px)] m-4 ${isMobileView && hasActiveLines ? "sm:block" : ""
          }`}
        style={{ boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.1)" }}
      >
        {!isMobileView ? (
          <>
            {renderDialPad()}
            {hasActiveLines ? (
              renderCallScreen()
            ) : (
              <RecentCall makeCall={makeCall} />
            )}
          </>
        ) : hasActiveLines ? (
          <>{renderCallScreen()}</>        ) : (
          renderDialPad()
        )}
        
        {/* Keyboard Shortcuts Info */}
        <div className="absolute bottom-4 right-4">
          <KeyboardShortcutsInfo />
        </div>
      </div>
      <audio
        ref={audioRef}
        autoPlay
        hidden
        playsInline
        onError={(e) => console.warn("Audio element error:", e)}
      />
    </>
  );
};

export default PhoneComponent;
