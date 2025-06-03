/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { SessionState } from "sip.js";
import closeCallicon from "../../../assets/phone/hang.png";
import avtarIcon from "../../../assets/phone/profile-picture.png";
import useSipAgentRef from "../../../hooks/useSipAgentRef";
import useSipSession from "../../../hooks/useSipSession"; // Add this import
import { formatDuration } from "../../../utils/common";
import ConferenceButton from "./ConferenceButton";
import ForwardButton from "./ForwardButton";
import HoldButton from "./HoldButton";
import KeypadButton from "./KeypadButton";
import MuteButton from "./MuteButton";
import RecordButton from "./RecordButton";
import SpeakerSelector from "./SpeakerSelector ";

const DialPadModal = ({
  session,
  sessionRef,
  // audioRef,
  handleEndCall,
  performBlindTransfer,
  startAttendedTransfer,
  completeAttendedTransfer,
  cancelAttendedTransfer,
  // selectedNumber,
  dialedPhone
}) => {

  const { userAgent } = useSipSession();

  // Add this check
  console.log("UserAgent in DialPadModal:", userAgent);

  const [dragPos, setDragPos] = useState({ x: 100, y: 100 });
  const [dragging, setDragging] = useState(false);
  const [showDTMF, setShowDTMF] = useState(false);
  const [conferenceNumber, setConferenceNumber] = useState("");
  const [transferNumber, setTransferNumber] = useState("");
  const [attendedStep, setAttendedStep] = useState(false);
  const attendedSessionRef = useRef(null);
  // const callerID = useSelector((state) => state.auth?.user?.data?.response);
  // let callerIDArray = JSON.parse(callerID);
  // const defaultNumber = callerIDArray[0]?.split(" - ")[1]?.trim();
  const keypadBtnRef = useRef(null);
  const duration = useSelector((state) => state.sip.callDuration);
  const dragOffset = useRef({ x: 0, y: 0 });
  const { userAgentRef } = useSipAgentRef();

  //   dispatch(setDialPadModal(false));

  // Handler to send DTMF tone
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

  // Conference call handler
  // const handleConferenceInvite = async () => {
  //   if (!userAgentRef.current) {
  //     console.warn("User agent not initialized.");
  //     return;
  //   }

  //   const numberToCall = conferenceNumber.trim();
  //   if (!numberToCall) {
  //     alert("Please enter a valid conference number.");
  //     return;
  //   }

  //   const currentSession = sessionRef.current;

  //   // 1. Put the current call on hold if possible
  //   if (
  //     currentSession &&
  //     currentSession.state === SessionState.Established &&
  //     currentSession.sessionDescriptionHandler &&
  //     typeof currentSession.sessionDescriptionHandler.hold === "function"
  //   ) {
  //     try {
  //       await currentSession.sessionDescriptionHandler.hold();
  //       console.log("✅ Current call put on hold.");
  //     } catch (error) {
  //       console.error("❌ Failed to put current call on hold:", error);
  //     }
  //   }

  //   // 2. Use makeCall from useSipSession to initiate the conference call
  //   makeCall({ phone: numberToCall, selectedNumber: defaultNumber });
  // };

  // Handler to receive/accept incoming call
  const handleReceiveCall = () => {
    const sess = sessionRef.current;
    if (
      sess &&
      typeof sess.accept === "function" &&
      sess.state === SessionState.Initial
    ) {
      sess.accept();
    }
  };

  // Drag handlers for call window
  const handleDragStart = (e) => {
    setDragging(true);
    const clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
    dragOffset.current = {
      x: clientX - dragPos.x,
      y: clientY - dragPos.y,
    };
    document.body.style.userSelect = "none";
  };

  const handleDrag = (e) => {
    if (!dragging) return;
    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
    setDragPos({
      x: clientX - dragOffset.current.x,
      y: clientY - dragOffset.current.y,
    });
  };

  const handleDragEnd = () => {
    setDragging(false);
    document.body.style.userSelect = "";
  };

  // Attach/remove drag listeners
  React.useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleDrag);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDrag);
      window.addEventListener("touchend", handleDragEnd);
    } else {
      window.removeEventListener("mousemove", handleDrag);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDrag);
      window.removeEventListener("touchend", handleDragEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleDrag);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDrag);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [dragging]);

  // Handlers for transfer actions
  const handleBlindTransfer = async () => {
    try {
      await performBlindTransfer({ targetNumber: transferNumber });
      // Optionally reset phone input here if needed
    } catch (err) {
      console.error("❌ Blind transfer failed", err);
    }
  };

  const handleAttendedTransfer = async () => {
    console.warn("targetNumber", transferNumber);
    console.warn("dialedPhone", dialedPhone);
    try {
      const attended = await startAttendedTransfer({
        targetNumber: transferNumber,
        selectedNumber: dialedPhone,
      });
      setAttendedStep(true);
      attendedSessionRef.current = attended;
    } catch (err) {
      console.error("❌ Attended transfer failed", err);
      setAttendedStep(false);
    }
  };

  const handleCompleteAttendedTransfer = async () => {
    try {
      await completeAttendedTransfer({
        originalSession: sessionRef.current,
        attendedSession: attendedSessionRef.current,
      });
      setAttendedStep(false);
      attendedSessionRef.current = null;
    } catch (err) {
      console.error("❌ Completing attended transfer failed", err);
    }
  };

  return (
    <div
      className="fixed z-[9999] bg-white shadow-lg rounded-lg border border-gray-300"
      style={{
        top: dragPos.y,
        left: dragPos.x,
        width: 320,
        minHeight: 120,
        cursor: dragging ? "grabbing" : "grab",
        userSelect: "none",
      }}
    >
      <div
        className="w-full px-4 py-2 bg-secondary text-white rounded-t-lg flex justify-between items-center cursor-move"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <h5 className="text-sm !text-white leading-0.5">
          {sessionRef.current &&
            sessionRef.current.state === SessionState.Initial
            ? "Incoming Call"
            : `Calling ${session ? session.remoteIdentity?.uri?.user || "" : ""
            }`}
        </h5>
        <button className="cursor-pointer" onClick={handleEndCall}>
          <img src={closeCallicon} className="" alt="" />
        </button>
      </div>
      <div className="p-4 flex flex-col items-center justify-center gap-3">
        <div className="relative group">
          <img src={avtarIcon} alt="" />
          <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 bg-[#67308F] text-[#fff] text-xs rounded px-3 py-1 shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            User Avatar
          </span>
        </div>
        {/* Show Receive button only if incoming call and not yet answered */}
        {sessionRef.current &&
          sessionRef.current.state === SessionState.Initial && (
            <button
              className="bg-green-600 text-white px-4 py-1 rounded text-xs mt-2"
              onClick={handleReceiveCall}
            >
              Receive Call
            </button>
          )}
        <div className="relative group">
          <p>{formatDuration(duration || 0)}</p>
        </div>
        {/* --- Transfer Input and Buttons --- */}
        <div className="w-full flex flex-col items-center gap-2 mt-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            value={transferNumber}            onChange={(e) => {
              const value = e.target.value || "";
              setTransferNumber(value.replace(/\D/g, "").slice(0, 10));
            }}
            placeholder="Number to transfer"
            className="border rounded px-2 py-1 w-full max-w-[180px] text-center"
            disabled={attendedStep}
          />
          <div className="flex gap-2 w-full max-w-[180px]">
            <button
              className="flex-1 bg-[#67308F] text-white rounded px-2 py-1 text-xs"
              onClick={handleBlindTransfer}
              disabled={!transferNumber || attendedStep}
              type="button"
            >
              Blind Transfer
            </button>
            <button
              className="flex-1 bg-[#3b82f6] text-white rounded px-2 py-1 text-xs"
              onClick={handleAttendedTransfer}
              disabled={!transferNumber || attendedStep}
              type="button"
            >
              Attended Transfer
            </button>
          </div>
          {attendedStep && (
            <>
              <button
                className="w-full bg-green-600 text-white rounded px-2 py-1 text-xs mt-2"
                onClick={handleCompleteAttendedTransfer}
                type="button"
              >
                Complete Attended Transfer
              </button>
              <button onClick={cancelAttendedTransfer} className="w-full bg-red-600 text-white rounded px-2 py-1 text-xs mt-2">
                Cancel Attended Transfer
              </button>
            </>
          )}
        </div>
        {/* --- End Transfer Input and Buttons --- */}
        {/* Conference number input */}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={conferenceNumber}          onChange={(e) => {
            // Only allow numbers
            const value = e.target.value || "";
            const val = value.replace(/\D/g, "");
            setConferenceNumber(val);
          }}
          placeholder="Conference Number"
          className="border rounded px-2 py-1 w-full max-w-[180px] text-center mb-2"
        />
      </div>
      <div className="relative block w-full m-0 py-2 border-t-[1px] border-[#ebe6e7]">
        <ul className="flex flex-wrap items-center justify-center gap-2.5">
          <li>
            <MuteButton sessionRef={sessionRef} />
          </li>
          <li>
            <HoldButton sessionRef={sessionRef} />
          </li>
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
          {/* <li>
            <ConferenceButton
              session={session}
              sessionRef={sessionRef}
              onConference={(conferenceSession) => {
                // Optional callback when conference is established
              }}
            />
          </li> */}
          <li>
            <ForwardButton
              session={session}
              userAgent={userAgentRef.current} // Use this instead of userAgent
            />
          </li>
          <li>
            <SpeakerSelector session={session} sessionRef={sessionRef} />
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DialPadModal;
