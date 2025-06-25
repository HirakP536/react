/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import useSipAgentRef from "../../hooks/useSipAgentRef";
import useSipSession from "../../hooks/useSipSession";
import {
  resetDialedPhone,
  setDialedPhone,
} from "../../store/slices/callFeatureSlice";
import { formatDuration, formatUSPhone } from "../../utils/common";
import HistoryComponent from "../history/HistoryComponent";
import HoldButton from "./partials/HoldButton";
import KeypadButton from "./partials/KeypadButton";
import MuteButton from "./partials/MuteButton";
import RecordButton from "./partials/RecordButton";
import SpeakerSelector from "./partials/SpeakerSelector ";
import MultiLineDisplay from "./partials/MultiLineDisplay";

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
  const defaultNumber = callerIDArray[0]?.split(" - ")[1]?.trim();
  const [selectedNumber, setSelectedNumber] = useState(defaultNumber);
  const duration = useSelector((state) => state.sip.callDuration); const {
    makeCall,
    hangup,
    sessionRef,
    acceptCall,
    handleIncomingSession,
    switchToLine,
    holdCall,
    unholdCall
  } = useSipSession(); const dispatch = useDispatch();
  const dialedPhone = useSelector((state) => state.callFeature.dialedPhone);
  const incomingCall = useSelector((state) => state.sip.incomingCall);
  // Get lines information for the multiline display
  const lines = useSelector((state) => state.sip.lines);
  const activeLineId = useSelector((state) => state.sip.activeLineId);
  const hasActiveLines = Object.keys(lines).length > 0;

  const session = sessionRef?.current;
  const pc = session?.sessionDescriptionHandler?.peerConnection;
  const canMute =
    session &&
    session.state === SIP.SessionState.Established &&
    pc &&
    pc.getSenders().find((s) => s.track?.kind === "audio");

  // manage conference and transfer
  const [showConferenceDialog, setShowConferenceDialog] = useState(false);
  const [conferenceTarget, setConferenceTarget] = useState("");
  const [isConferencing, setIsConferencing] = useState(false);
  const [conferenceSession, setConferenceSession] = useState(null);

  // Transfer calls status
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferTarget, setTransferTarget] = useState("");
  const [transferType, setTransferType] = useState("blind");
  const [attendedSession, setAttendedSession] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const canTransfer = session && session.state === SIP.SessionState.Established;
  const handleSelectChange = (selectedOption) => {
    if (selectedOption && selectedOption.value) {
      setSelectedNumber(selectedOption.value);
    }
  };
  const handleDial = (val) => {
    setPhone((prev) => (prev?.length < 10 ? prev + val : prev));
  };

  const handleBackspace = () => {
    setPhone((prev) => prev?.slice(0, -1));
  };
  const handleInputChange = (e) => {
    const value = e.target.value;
    setPhone(value);
  };  // Handle make call
  const handleCall = () => {
    // Check if we have an active call that will be put on hold
    const hasActiveCallThatWillBeHeld = activeLineId !== null && 
                                       lines[activeLineId] && 
                                       !lines[activeLineId].onHold &&
                                       !lines[activeLineId].ringing;
    
    // makeCall now returns the line ID (and puts any active call on hold)
    const lineId = makeCall({ phone, selectedNumber });
    
    if (lineId) {
      dispatch(setDialedPhone(phone));
      console.log(`Call started on line ${lineId}`);
      
      // Log that previous call was put on hold
      if (hasActiveCallThatWillBeHeld) {
        console.log(`Previous call on line ${activeLineId} was automatically put on hold`);
      }
    } else {
      console.warn("Could not make call - all lines may be in use");
      // Could show a notification here that all lines are in use
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

  // Modify handleHangup to reset the view
  const handleHangup = () => {
    if (sessionRef.current) {
      hangup(); // This will hang up the active line
      dispatch(resetDialedPhone());
      setPhone("");
    }
  };

  // Handle DTMF
  const handleSendDTMF = (tone) => {
    const session = sessionRef.current;
    if (!session || !session.sessionDescriptionHandler) {
      console.warn("Session or SDH is not available for DTMF.");
      return;
    }

    try {
      session.sessionDescriptionHandler.sendDtmf(tone);
      console.log(`Sent DTMF tone: ${tone}`);
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

  // Clean up conference session when component unmounts
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

  // Start conference call
  const initiateConferenceCall = async () => {
    if (!canConference || !conferenceTarget || !userAgentRef.current) return;

    try {
      setIsConferencing(true);
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
      if (conferenceTarget.includes("@")) {
        uriString = `sip:${conferenceTarget}`;
      } else {
        const domain = userAgentRef.current?.configuration?.uri?.host;
        if (!domain) {
          setIsConferencing(false);
          return;
        }
        uriString = `sip:${conferenceTarget}@${domain}`;
      }

      const target = SIP.UserAgent.makeURI(uriString);
      if (!target) {
        setIsConferencing(false);
        return;
      }
      const inviter = new SIP.Inviter(userAgentRef.current, target);
      const audioElement = document.createElement("audio");
      audioElement.autoplay = true;
      audioElement.id = "conference-audio";
      document.body.appendChild(audioElement);
      const delegate = {
        onSessionDescriptionHandler: (sdh) => {
          sdh.peerConnectionDelegate = {
            ontrack: (event) => {
              console.log("Conference track added:", event.track.kind);

              if (event.track.kind === "audio") {
                const stream = new MediaStream([event.track]);
                audioElement.srcObject = stream;
                audioElement
                  .play()
                  .then(() => console.log("Conference audio playing"))
                  .catch((err) =>
                    console.error("Failed to play conference audio:", err)
                  );
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
                audioElement
                  .play()
                  .then(() =>
                    console.log("Playing conference audio from receiver track")
                  )
                  .catch((err) =>
                    console.error("Error playing conference audio:", err)
                  );
              }
            });
          }
        }
      });

      await inviter.invite(inviteOptions);
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

      const audioElement = document.getElementById("conference-audio");
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
      setIsConferencing(false);
    }
  };

  // Join calls into conference
  const mergeCallsIntoConference = async () => {
    if (!canConference || !conferenceSession) return;

    try {
      setIsConferencing(true);
      await session.invite({
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: false,
          },
          hold: false,
        },
      });

      // Close dialog
      setShowConferenceDialog(false);
    } catch (error) {
      console.error("Error creating conference:", error);

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
  };

  const endConferenceCall = async () => {
    if (!conferenceSession) return;
    try {
      setIsConferencing(true);
      if (conferenceSession.state === SIP.SessionState.Established) {
        await conferenceSession.bye();
      } else if (conferenceSession.state === SIP.SessionState.Establishing) {
        await conferenceSession.cancel();
      } else if (conferenceSession.state === SIP.SessionState.Initial) {
        await conferenceSession.cancel();
      }

      // Clean up audio element
      const audioElement = document.getElementById("conference-audio");
      if (audioElement && audioElement.parentNode) {
        audioElement.srcObject = null;
        audioElement.parentNode.removeChild(audioElement);
      }

      // Make sure the original call is still active
      if (session && session.state === SIP.SessionState.Established) {
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

      // Reset state
      setConferenceSession(null);
      setShowConferenceDialog(false);
      setConferenceTarget("");
    } catch (error) {
      console.error("Error:", error);

      // Still try to clean up and reset state even if there was an error
      const audioElement = document.getElementById("conference-audio");
      if (audioElement && audioElement.parentNode) {
        audioElement.srcObject = null;
        audioElement.parentNode.removeChild(audioElement);
      }

      setConferenceSession(null);
      setShowConferenceDialog(false);
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
            audioElement
              .play()
              .then(() => console.log("Audio playing successfully"))
              .catch((err) => console.error("Error playing audio:", err));
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
                audioElement
                  .play()
                  .then(() => console.log("Audio playing"))
                  .catch((err) => console.error("Failed to play:", err));
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
                audioElement
                  .play()
                  .then(() => console.log("Playing audio from receiver track"))
                  .catch((err) => console.error("Error playing audio:", err));
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
        console.log("Incoming call session:", incomingSession);
      },
    };
  }, []);

  const hasActiveIncomingCall = Boolean(
    sessionRef.current &&
    sessionRef.current.state === SIP.SessionState.Initial &&
    incomingCall.caller &&
    incomingCall.displayName
  );

  const renderDialPad = () => (
    <div
      className={`relative flex flex-col w-full ${
        !isMobileView ? "max-w-[400px]" : ""
      } justify-end bg-white p-5 pt-8 ${
        !isMobileView ? "border-r-[1px] border-gray-200" : ""
      }`}
    >
      <>
        <div className="relative 2xl:mb-10 mb-5 flex flex-col w-full items-start">
          <h5 className="text-sm text-left font-semibold text-primary block mb-2.5">
            Caller ID
          </h5>
          <CustomDropdown
            name="callerId"
            label=""
            options={
              Array.isArray(callerIDArray)
                ? callerIDArray.map((entry) => {
                    const name = entry.split(" - ")[0]?.trim();
                    const number = entry.split(" - ")[1]?.trim();
                    return {
                      label: `${name} - ${formatUSPhone(number)}`,
                      value: number,
                    };
                  })
                : []
            }
            value={
              Array.isArray(callerIDArray)
                ? callerIDArray
                    .map((entry) => {
                      const number = entry.split(" - ")[1]?.trim();
                      const name = entry.split(" - ")[0]?.trim();
                      return {
                        label: `${name} - ${formatUSPhone(number)}`,
                        value: number,
                      };
                    })
                    .find((opt) => opt.value === selectedNumber) || null
                : null
            }
            onChange={(e) => handleSelectChange(e)}
            customClass="w-full max-w-full"
          />
        </div>
        <div className="relative block w-full mb-4">
          <input
            type="text"
            value={formatUSPhone(phone)}
            placeholder="Phone Number"
            onChange={handleInputChange}
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
                {btn.label.replace(btn.value, "").trim()}
              </span>
            </button>
          ))}
        </div>
        <div className="flex justify-center items-center gap-3">
          <button
            className="flex justify-center items-center bg-white rounded-full w-14 h-14 cursor-pointer"
            onClick={handleCall}
          >
            <img src={receiveCall} alt="" />
          </button>
        </div>
      </>
    </div>
  );

  const renderCallScreen = () => (
    <div
      className={`flex-1 flex flex-col justify-center items-center p-5 ${
        isMobileView ? "w-full" : ""
      }`}
    >
      <div
        className={`${
          isMobileView ? "w-32 h-32" : "w-40 h-40"
        } mb-4 rounded-full bg-gray-100 flex items-center justify-center`}
      >
        <img src={userAvatar} alt="User Avatar" className="w-full h-full p-4" />
      </div>

      <div className="text-center mb-10">
        <h5 className={`${isMobileView ? "text-lg" : "text-xl"} font-semibold`}>
          {sessionRef.current ? formatUSPhone(dialedPhone) : "No Active Call"}
        </h5>
        <h5
          className={`${
            isMobileView ? "text-2xl" : "text-3xl"
          } text-primary font-semibold mt-2`}
        >
          {incomingCall.displayName && `${incomingCall.displayName}`}
        </h5>
        <h5
          className={`${
            isMobileView ? "text-lg" : "text-xl"
          } text-primary mt-2`}
        >
          {incomingCall.caller && `${incomingCall.caller}`}
        </h5>
        {sessionRef.current && (
          <p className="mt-2 text-base !text-secondary">
            {duration > 0
              ? formatDuration(duration || 0)
              : incomingCall.displayName
              ? "Incoming..."
              : "Calling..."}
          </p>
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
        <ul className="relative flex justify-center items-center gap-3 mb-4">
          {hasActiveIncomingCall && (
            <li>
              <Link to="#" onClick={acceptCall} title="Accept Call">
                <img
                  src={receiveCall}
                  className="w-16 h-16"
                  alt="Accept call"
                />
              </Link>
            </li>
          )}

          {showConferenceDialog && conferenceSession && (
            <button
              type="button"
              className="relative flex items-center justify-center w-16 h-16 bg-[#aa93c752] rounded-full group"
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
                className="max-w-7 h-auto transition-transform duration-200 ease-linear group-hover:scale-[1.2]"
              />
              <span className="absolute left-[-10] top-[-15px] -translate-y-1/2 ml-2 z-50 bg-[#67308F] !text-[#fff] text-xs rounded px-3 py-1 shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Merge Calls
              </span>
            </button>
          )}
          {canMute && (
            <>
              <li>
                <MuteButton sessionRef={sessionRef} />
              </li>
              <li>
                <HoldButton sessionRef={sessionRef} />
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
                <img src={closeCallicon} className="w-16 h-16" alt="" />
              </Link>
            )}
          </li>
        </ul>
        {canMute && (
          <ul className="flex justify-center items-center gap-3">
            <li style={{ position: "relative" }}>
              <span ref={keypadBtnRef}>
                <KeypadButton
                  sessionRef={sessionRef}
                  setShowDTMF={setShowDTMF}
                  handleSendDTMF={handleSendDTMF}
                  showDTMF={showDTMF}
                />
              </span>
            </li>
            <li>
              <RecordButton sessionRef={sessionRef} />
            </li>
            <li>
              <button
                type="button"
                className="relative flex items-center justify-center w-16 h-16 bg-[#aa93c752] rounded-full group"
                onClick={() => setShowConferenceDialog(true)}
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
                  className="max-w-7 h-auto transition-transform duration-200 ease-linear group-hover:scale-[1.2]"
                />
                <span className="absolute left-[-10] top-[-15px] -translate-y-1/2 ml-2 z-50 bg-[#67308F] !text-[#fff] text-xs rounded px-3 py-1 shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Conference
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="relative flex items-center justify-center w-16 h-16 bg-[#aa93c752] rounded-full group"
                onClick={() => setShowTransferDialog(true)}
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
                  className="max-w-7 h-auto transition-transform duration-200 ease-linear group-hover:scale-[1.2]"
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
              />
            </li>
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div
        className={`relative flex bg-white rounded-2xl w-[calc(100%-32px)] h-[calc(100%-50px)] m-4 ${
          isMobileView && sessionRef.current ? "sm:block" : ""
        }`}
        style={{ boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.1)" }}
      >        <div className="relative flex flex-col w-full max-w-[400px] justify-end bg-white p-5 pt-8 border-r-[1px] border-gray-200">
          <>
            {/* Show multiline display above dialpad whenever there are active lines */}
            {hasActiveLines && (
              <div className="w-full mb-4">
                <MultiLineDisplay
                  switchToLine={switchToLine}
                  hangup={hangup}
                  holdCall={holdCall}
                  unholdCall={unholdCall}
                  acceptCall={acceptCall}
                />
              </div>
            )}

            <div className="relative 2xl:mb-10 mb-5 flex flex-col w-full items-start">
              <h5
                className="text-sm text-left font-semibold text-primary block mb-2.5"
              >
                Caller ID
              </h5>
              <CustomDropdown
                name="callerId"
                label=""
                options={
                  Array.isArray(callerIDArray)
                    ? callerIDArray.map((entry) => {
                      const name = entry.split(" - ")[0]?.trim();
                      const number = entry.split(" - ")[1]?.trim();
                      return {
                        label: `${name} - ${formatUSPhone(number)}`,
                        value: number,
                      };
                    })
                    : []
                }
                value={
                  Array.isArray(callerIDArray)
                    ? callerIDArray
                      .map((entry) => {
                        const number = entry.split(" - ")[1]?.trim();
                        const name = entry.split(" - ")[0]?.trim();
                        return {
                          label: `${name} - ${formatUSPhone(number)}`,
                          value: number,
                        };
                      })
                      .find((opt) => opt.value === selectedNumber) || null
                    : null
                }
                onChange={(e) => handleSelectChange(e)}
                customClass="w-full max-w-full"
              />
            </div>
            <div className="relative block w-full mb-4">
              <input
                type="text"
                value={phone}
                placeholder="Phone Number"
                onChange={handleInputChange}
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
                >                  <span className="text-black !group-hover:text-white transition-colors">
                    {btn.value}
                  </span>
                  <span className="text-xs font-normal text-black group-hover:text-white transition-colors">
                    {btn.label && btn.value ? btn.label.replace(btn.value, "").trim() : btn.label || ""}
                  </span>
                </button>
              ))}
            </div>
          </>
          <div className={`flex justify-center items-center gap-3`}>
            <button
              className="flex justify-center items-center bg-white rounded-full w-14 h-14 cursor-pointer"
              onClick={handleCall}
            >
              <img src={receiveCall} alt="" />
            </button>
          </div>
        </div>        {/* Always show phone UI, but conditionally show different content */}
        {sessionRef.current ? (<div className="flex-1 flex flex-col justify-center items-center p-5">          {/* MultiLineDisplay moved to left panel above the dialpad */}

          {/* Show avatar and caller info when there's a call or "No Active Call" when no call */}
          <div className="w-40 h-40 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <img src={userAvatar} alt="User Avatar" />
          </div>                <div className="text-center mb-10">
            {!sessionRef.current ? (
              <h5 className="text-xl font-semibold">No Active Call</h5>
            ) : (
              <>
                {/* Only show active line information based on activeLineId and lines data */}
                {activeLineId && lines[activeLineId] && (
                  <>
                    <h5 className="text-3xl text-primary font-semibold">
                      {lines[activeLineId].displayName || "Unknown"}
                    </h5>
                    <h5 className="text-xl text-primary mt-2">
                      {formatUSPhone(lines[activeLineId].phone) || ""}
                    </h5>
                    <div className="mt-2 flex items-center justify-center">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${lines[activeLineId].onHold ? 'bg-amber-500' : 'bg-green-500'
                        }`}></span>                      <p className="text-base !text-secondary">
                        {lines[activeLineId].onHold ? (
                          "On Hold"
                        ) : duration > 0 ? (
                          formatDuration(duration)
                        ) : lines[activeLineId].ringing ? (
                          "Ringing..."
                        ) : lines[activeLineId].muted ? (
                          "Muted"
                        ) : (
                          "Connected"
                        )}
                      </p>
                      {lines[activeLineId].onHold && lines[activeLineId].heldBy === "auto-hold" && (
                        <p className="text-xs text-amber-600 mt-1">
                          (Automatically held while on another call)
                        </p>
                      )}
                    </div>
                    {/* {lines[activeLineId].muted && (
                      <div className="mt-1 py-1 px-2 bg-red-500 text-white rounded-md inline-block">
                        <span className="text-xs">Muted</span>
                      </div>
                    )} */}
                  </>
                )}
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
                        console.log("cancelAttendedTransfer");
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
            <ul className="relative flex justify-center items-center gap-3 mb-4">
              {hasActiveIncomingCall && (
                <li>
                  <Link to="#" onClick={acceptCall} title="Accept Call">
                    <img
                      src={receiveCall}
                      className="w-16 h-16"
                      alt="Accept call"
                    />
                  </Link>
                </li>
              )}

              {showConferenceDialog && conferenceSession && (
                <button
                  type="button"
                  className="relative flex items-center justify-center w-16 h-16 bg-[#aa93c752] rounded-full group"
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
                    className="max-w-7 h-auto transition-transform duration-200 ease-linear group-hover:scale-[1.2]"
                  />
                  <span className="absolute left-[-10] top-[-15px] -translate-y-1/2 ml-2 z-50 bg-[#67308F] !text-[#fff] text-xs rounded px-3 py-1 shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Merge Calls
                  </span>
                </button>
              )}
              {canMute && (
                <>
                  <li>
                    <MuteButton sessionRef={sessionRef} />
                  </li>
                  <li>
                    <HoldButton sessionRef={sessionRef} />
                  </li>
                </>
              )}
              <li>
                {showConferenceDialog && conferenceSession ? (
                  <Link
                    to="#"
                    onClick={endConferenceCall}
                    className="relative"
                  >
                    <img src={closeCallicon} className="w-16 h-16" alt="" />
                    <span className="absolute left-[-10] top-[-15px] -translate-y-1/2 ml-2 z-50 bg-[#67308F] !text-[#fff] text-xs rounded px-3 py-1 shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Merge Calls
                    </span>
                  </Link>
                ) : (
                  <Link to="#" onClick={handleHangup}>
                    <img src={closeCallicon} className="w-16 h-16" alt="" />
                  </Link>
                )}
              </li>
            </ul>
            {canMute && (
              <ul className="flex justify-center items-center gap-3">
                <li style={{ position: "relative" }}>
                  <span ref={keypadBtnRef}>
                    <KeypadButton
                      sessionRef={sessionRef}
                      setShowDTMF={setShowDTMF}
                      handleSendDTMF={handleSendDTMF}
                      showDTMF={showDTMF}
                    />
                  </span>
                </li>
                <li>
                  <RecordButton sessionRef={sessionRef} />
                </li>
                <li>
                  <button
                    type="button"
                    className="relative flex items-center justify-center w-16 h-16 bg-[#aa93c752] rounded-full group"
                    onClick={() => setShowConferenceDialog(true)}
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
                      className="max-w-7 h-auto transition-transform duration-200 ease-linear group-hover:scale-[1.2]"
                    />
                    <span className="absolute left-[-10] top-[-15px] -translate-y-1/2 ml-2 z-50 bg-[#67308F] !text-[#fff] text-xs rounded px-3 py-1 shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Conference
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="relative flex items-center justify-center w-16 h-16 bg-[#aa93c752] rounded-full group"
                    onClick={() => setShowTransferDialog(true)}
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
                      className="max-w-7 h-auto transition-transform duration-200 ease-linear group-hover:scale-[1.2]"
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
                  />
                </li>
              </ul>
            )}
          </div>
        </div>
        ) : (
          <HistoryComponent />
        )}
        {isMobileView && (
          <>
            {!sessionRef.current ? (
              <>{renderDialPad()}</>
            ) : (
              <>{renderCallScreen()}</>
            )}
          </>
        )}
        {/* {sessionRef.current ? (
          <>
            {sessionRef.current && isMobileView
              ? renderCallScreen()
              : renderDialPad()}
          </>
        ) : (
          <>
            {renderDialPad()}
            {!isMobileView && <HistoryComponent />}
          </>
        )} */}
      </div>
      <audio ref={audioRef} autoPlay hidden playsInline />
    </>
  );
};

export default PhoneComponent;
