/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import closeCallicon from "../../../assets/phone/hang_phone.svg";
import pauseIcon from "../../../assets/phone/pause.svg";
import playIcon from "../../../assets/phone/play-button.svg";
import receiveCall from "../../../assets/phone/receivecall_green_new.svg";
import userAvatar from "../../../assets/phone/user.svg";
import { store } from "../../../store/Index";
import {
  clearIncomingCall,
  updateLineState,
} from "../../../store/slices/sipSlice";
import { formatDuration } from "../../../utils/common";

const MultiLineDisplay = ({
  switchToLine,
  hangup,
  holdCall,
  unholdCall,
  acceptCall,
}) => {
  const [expandedView, setExpandedView] = useState(false);
  const activeLineId = useSelector((state) => state.sip.activeLineId);
  const lines = useSelector((state) => state.sip.lines);
  const callDuration = useSelector((state) => state.sip.callDuration);
  const dispatch = useDispatch();
  console.log(lines);

  useEffect(() => {
    const linesCount = Object.keys(lines).length;
    if (linesCount > 1 && !expandedView) {
      setExpandedView(true);
    }
  }, [lines]);
  const handleLineSwitch = (lineId, lineData) => {
    if (lineId !== activeLineId) {
      try {
        switchToLine(lineId);
        if (lineData.onHold) {
          unholdCall(lineId);
        }
        Object.entries(lines).forEach(([otherLineId, otherLineData]) => {
          const numOtherLineId = Number(otherLineId);
          if (
            numOtherLineId !== lineId &&
            !otherLineData.onHold &&
            !otherLineData.ringing
          ) {
            holdCall(numOtherLineId);
          }
        });
      } catch (error) {
        console.error(`Error switching to line ${lineId}:`, error);
      }
    } else if (!lineData.ringing) {
      if (lineData.onHold) {
        unholdCall(lineId);
      } else {
        holdCall(lineId);
      }
    }
  };
  const hasActiveLines = Object.keys(lines).length > 0;
  const linesCount = Object.keys(lines).length;

  if (!hasActiveLines) {
    return null;
  }

  return (
    <div
      className={`[@media(max-height:900px)]:relative absolute w-[calc(100%-32px)] top-0 left-0 m-4`}
    >
      <div className="mb-3">
        <h3 className="text-sm font-medium">Active Lines ({linesCount})</h3>
      </div>
      <div className={`multiline-container`}>
        {Object.entries(lines).map(([lineId, lineData]) => {
          const isActive = Number(lineId) === activeLineId;
          const numLineId = Number(lineId);
          const isRinging = lineData.ringing === true;

          return (
            <div
              key={lineId}
              className="flex w-full justify-between items-center mb-2 z-[999] rounded-xl px-4 py-2 bg-white cursor-pointer border-[1px] border-gray-200"
              style={{ boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" }}
              onClick={() => handleLineSwitch(numLineId, lineData)}
            >
              <div className="flex w-full items-center gap-2">
                <img src={userAvatar} alt="User Avatar" className="w-7" />
                <div className="relative block w-full">
                  <div className="flex items-center gap-2">
                    <h5 className="text-base text-secondary">
                      {lineData?.displayName}{" "}
                    </h5>
                    <p className="text-base">{lineData?.phone}</p>
                    {lineData.onHold && (
                      <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                        On Hold
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mt-1">
                      {isRinging && (
                        <p className="text-xs !text-white bg-[#008000] px-2 py-0.5 rounded-2xl">
                          {lineData.direction === "incoming"
                            ? "Incoming"
                            : "Outgoing"}
                        </p>
                      )}
                      {isActive && !isRinging && (
                        <p className="text-base">
                          {formatDuration(callDuration)}
                        </p>
                      )}
                      {!isActive && !isRinging && (
                        <p className="text-xs !text-white bg-[#008000] px-2 py-0.5 rounded-2xl">
                          {lineData.onHold
                            ? "Click to resume"
                            : "Active on another line"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isRinging ? (
                  <>
                    <button
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        acceptCall();
                      }}
                      aria-label="Answer"
                      title="Answer call"
                    >
                      <img src={receiveCall} alt="Answer" className="w-10" />
                    </button>
                    <button
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        try {
                          dispatch(
                            updateLineState({
                              lineId: numLineId,
                              data: { rejecting: true },
                            })
                          );
                          hangup(numLineId);
                          const currentIncomingCall =
                            store.getState().sip.incomingCall;
                          if (
                            currentIncomingCall &&
                            currentIncomingCall.lineId === numLineId
                          ) {
                            dispatch(clearIncomingCall());
                          }
                        } catch (err) {
                          console.error(
                            `Error rejecting call on line ${numLineId}:`,
                            err
                          );
                        }
                      }}
                      aria-label="Reject"
                      title="Reject call"
                    >
                      <img src={closeCallicon} alt="Reject" className="w-10" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (lineData.onHold) {
                          unholdCall(numLineId);
                          switchToLine(numLineId);

                          // Hold all other active lines
                          Object.entries(lines).forEach(
                            ([otherLineId, otherLineData]) => {
                              const numOtherLineId = Number(otherLineId);
                              if (
                                numOtherLineId !== numLineId &&
                                !otherLineData.onHold &&
                                !otherLineData.ringing
                              ) {
                                holdCall(numOtherLineId);
                              }
                            }
                          );
                        } else if (isActive) {
                          holdCall(numLineId);
                        } else {
                          switchToLine(numLineId);

                          // Hold all other active lines
                          Object.entries(lines).forEach(
                            ([otherLineId, otherLineData]) => {
                              const numOtherLineId = Number(otherLineId);
                              if (
                                numOtherLineId !== numLineId &&
                                !otherLineData.onHold &&
                                !otherLineData.ringing
                              ) {
                                holdCall(numOtherLineId);
                              }
                            }
                          );
                        }
                      }}
                      aria-label={lineData.onHold ? "Resume call" : "Hold call"}
                      title={lineData.onHold ? "Resume call" : "Hold call"}
                    >
                      <img
                        src={lineData.onHold ? playIcon : pauseIcon}
                        alt={lineData.onHold ? "Resume" : "Hold"}
                        className="w-10"
                      />
                    </button>
                    <button
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        try {
                          hangup(numLineId);
                        } catch (err) {
                          console.error(
                            `Error hanging up call on line ${numLineId}:`,
                            err
                          );
                        }
                      }}
                      aria-label="Hang up"
                      title="Hang up"
                    >
                      <img src={closeCallicon} alt="Hang up" className="w-10" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MultiLineDisplay;
