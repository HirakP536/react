import { useEffect, useRef } from "react";
import keyboardIcon from "../../../assets/phone/keyboard.svg";
import * as SIP from "sip.js";

const KeypadButton = ({ sessionRef,showDTMF, handleSendDTMF, setShowDTMF }) => {
  const popupRef = useRef(null);
   const session = sessionRef?.current;
    const pc = session?.sessionDescriptionHandler?.peerConnection;
    const canMute =
      session &&
      session.state === SIP.SessionState.Established &&
      pc &&
      pc.getSenders().find((s) => s.track?.kind === "audio");

  useEffect(() => {
    if (!showDTMF) return;
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowDTMF(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDTMF, setShowDTMF]);

  return (
    <>
      <button
        type="button"
        className="relative flex items-center justify-center w-16 h-16 bg-[#aa93c752] rounded-full group"
        onClick={() => setShowDTMF(true)}
        disabled={!canMute}
        style={{ opacity: canMute ? 1 : 0.5 }}
      >
        <img
          src={keyboardIcon}
          alt=""
          className="max-w-7 h-auto transition-transform duration-200 ease-linear group-hover:scale-[1.2]"
        />
        <span className="absolute left-[-10] top-[-15px] -translate-y-1/2 ml-2 z-50 bg-[#67308F] !text-[#fff] text-xs rounded px-3 py-1 shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Keypad
        </span>
      </button>
      {showDTMF && (
        <div
          ref={popupRef}
          className="absolute left-1/2 z-50 mt-2"
          style={{
            top: "110%",
            left: "50%",
            transform: "translateX(-50%)",
            minWidth: "180px",
          }}
        >
          <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200 relative">
            <button
              className="absolute top-1 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setShowDTMF(false)}
            >
              ×
            </button>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map(
                (key) => (
                  <button
                    key={key}
                    className="bg-[#f3f3f3] rounded text-xl py-2 hover:bg-[#e0e0e0] transition"
                    onClick={() => handleSendDTMF(key)}
                  >
                    {key}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KeypadButton;
