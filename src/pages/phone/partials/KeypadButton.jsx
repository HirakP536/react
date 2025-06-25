/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import keyboardIcon from "../../../assets/phone/keyboard.svg";
import * as SIP from "sip.js";

const KeypadButton = ({
  sessionRef,
  showDTMF,
  handleSendDTMF,
  setShowDTMF,
  isPhoneModule = false,
}) => {
  const popupRef = useRef(null);
  const [dtmfInput, setDtmfInput] = useState("");
  const session = sessionRef?.current;
  const pc = session?.sessionDescriptionHandler?.peerConnection;
  const canMute =
    session &&
    session.state === SIP.SessionState.Established &&
    pc &&
    pc.getSenders().find((s) => s.track?.kind === "audio");

  useEffect(() => {
    if (!showDTMF) return;

    const handleKeyDown = (event) => {
      const key = event.key;
      if (/^[0-9*#]$/.test(key)) {
        handleDtmfClick(key);
      } else if (key === "Backspace" || key === "Delete") {
        setDtmfInput((prev) => prev.slice(0, -1));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showDTMF, handleSendDTMF]);

  useEffect(() => {
    if (showDTMF) {
      setShowDTMF(false);
    }
  }, []);

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

  useEffect(() => {
    if (!showDTMF) {
      setDtmfInput("");
    }
  }, [showDTMF]);

  const handleDtmfClick = (key) => {
    handleSendDTMF(key);
    setDtmfInput((prev) => prev + key);
  };

  return (
    <>
      <button
        type="button"
        className={`relative flex items-center justify-center ${
        isPhoneModule ? "sm:w-15 sm:h-15 w-12 h-12" : "w-12 h-12"
      } bg-[#aa93c752] rounded-full group`}
        onClick={() => setShowDTMF(true)}
        disabled={!canMute}
        style={{ opacity: canMute ? 1 : 0.5 }}
      >
        <img
          src={keyboardIcon}
          alt=""
          className={`${
          isPhoneModule ? "sm:max-w-7 max-w-5" : "max-w-5"
        } h-auto transition-transform duration-200 ease-linear group-hover:scale-[1.2]`}
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
            top: "-120px",
            left: "50%",
            transform: "translateX(-50%)",
            minWidth: "250px",
          }}
        >
          <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200 relative">
            <div className="relative">
              <input
                type="text"
                value={dtmfInput}
                readOnly
                placeholder="DTMF Tones (Use keyboard to input)"
                className="w-full mb-3 h-10 px-4 py-2 border-[1px] border-[#ebe6e7] text-primary rounded-lg text-base text-center"
              />
              {dtmfInput && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                  onClick={() => setDtmfInput((prev) => prev.slice(0, -1))}
                ></button>
              )}
            </div>
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
                    onClick={() => handleDtmfClick(key)}
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
