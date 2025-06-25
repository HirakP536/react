import { useEffect, useState } from "react";
import * as SIP from "sip.js";
import forwordIcon from "../../../assets/phone/forward.svg";
import useSipAgentRef from "../../../hooks/useSipAgentRef";

const ForwardButton = ({ session }) => {
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferTarget, setTransferTarget] = useState("");
  const [transferType, setTransferType] = useState("blind");
  const [attendedSession, setAttendedSession] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const { userAgentRef } = useSipAgentRef();

  // Check if the session is established
  const canTransfer =
    session &&
    session.state === SIP.SessionState.Established;

  // Reset state when session changes
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
      if (transferTarget.includes('@')) {
        uriString = `sip:${transferTarget}`;
      } else {
        // Get domain from userAgentRef
        const domain = userAgentRef.current?.configuration?.uri?.host;
        if (!domain) {
          console.error("Cannot determine SIP domain");
          alert("Cannot determine SIP domain. Please enter full SIP address (user@domain)");
          setIsTransferring(false);
          return;
        }
        uriString = `sip:${transferTarget}@${domain}`;
      }

      // Use SIP.UserAgent.makeURI instead of userAgentRef.current.makeURI
      const target = SIP.UserAgent.makeURI(uriString);
      if (!target) {
        console.error("Failed to create URI for transfer target");
        setIsTransferring(false);
        return;
      }

      // Initiate blind transfer
      await session.refer(target);

      // Close dialog and reset
      setShowTransferDialog(false);
      setTransferTarget("");

      // Add a small delay before ending your session to ensure the transfer completes
      setTimeout(async () => {
        try {
          // End your session after the blind transfer
          if (session && session.state !== SIP.SessionState.Terminated) {
            await session.bye();
          }
        } catch (byeError) {
          console.error("Error ending session after blind transfer:", byeError);
        }
      }, 500); // 500ms delay to give the transfer time to complete
    } catch (error) {
      console.error("Error in blind transfer:", error);
      alert(`Transfer failed: ${error.message}`);
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

      // Create the SIP URI target
      let uriString;
      if (transferTarget.includes('@')) {
        uriString = `sip:${transferTarget}`;
      } else {
        // Get domain from userAgentRef
        const domain = userAgentRef.current?.configuration?.uri?.host;
        if (!domain) {
          console.error("Cannot determine SIP domain");
          alert("Cannot determine SIP domain. Please enter full SIP address (user@domain)");
          setIsTransferring(false);
          return;
        }
        uriString = `sip:${transferTarget}@${domain}`;
      }

      // Use SIP.UserAgent.makeURI instead of userAgentRef.current.makeURI
      const target = SIP.UserAgent.makeURI(uriString);
      if (!target) {
        console.error("Failed to create URI for transfer target");
        setIsTransferring(false);
        return;
      }

      // Create new session for attended transfer
      const inviter = new SIP.Inviter(userAgentRef.current, target);

      // Create a new audio element for this call to ensure audio output works
      const audioElement = document.createElement('audio');
      audioElement.autoplay = true;
      audioElement.id = 'attended-transfer-audio';
      document.body.appendChild(audioElement);

      inviter.delegate = {
        onTrack: (track) => {
          if (track.kind === 'audio') {
            const stream = new MediaStream([track]);
            audioElement.srcObject = stream;
            audioElement.play()
              .then(() => console.log("Audio playing successfully"))
              .catch(err => console.error("Error playing audio:", err));
          }
        }
      };

      // Configure sessionDescriptionHandler to process remote tracks
      const delegate = {
        onSessionDescriptionHandler: (sdh) => {
          sdh.peerConnectionDelegate = {
            ontrack: (event) => {
              if (event.track.kind === 'audio') {
                const stream = new MediaStream([event.track]);
                audioElement.srcObject = stream;
                audioElement.play()
                  .then(() => console.log("Audio playing"))
                  .catch(err => console.error("Failed to play:", err));
              }
            }
          };
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

      // Add state change listener
      inviter.stateChange.addListener((state) => {
        if (state === SIP.SessionState.Established) {
          const sdh = inviter.sessionDescriptionHandler;
          if (sdh && sdh.peerConnection) {
            const receivers = sdh.peerConnection.getReceivers();

            receivers.forEach(receiver => {
              if (receiver.track && receiver.track.kind === 'audio') {
                const stream = new MediaStream([receiver.track]);

                // Connect it to audio element
                audioElement.srcObject = stream;
                audioElement.play()
                  .then(() => console.log("Playing audio from receiver track"))
                  .catch(err => console.error("Error playing audio:", err));
              }
            });
          }
        }
      });
      await inviter.invite(inviteOptions);
      setAttendedSession(inviter);

      // Clean up audio element when session ends
      inviter.stateChange.addListener((state) => {
        if (state === SIP.SessionState.Terminated) {
          if (audioElement && audioElement.parentNode) {
            audioElement.srcObject = null;
            audioElement.parentNode.removeChild(audioElement);
          }
        }
      });
    } catch (error) {
      console.error("Error initiating attended transfer:", error);
      alert(`Failed to start attended transfer: ${error.message}`);
      setAttendedSession(null);

      // Clean up audio element on error
      const audioElement = document.getElementById('attended-transfer-audio');
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
      setIsTransferring(false);
    }
  };

  // Complete attended transfer
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
      console.error(`Failed to complete transfer: ${error.message}`);

      // In case of failure, try to take the original call off hold
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

  return (
    <>
      <button
        type="button"
        className="relative flex items-center justify-center w-16 h-16 bg-[#aa93c752] rounded-full group"
        onClick={() => setShowTransferDialog(true)}
        disabled={!canTransfer}
        title={!canTransfer ? "Transfer unavailable until call is established" : ""}
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

      {showTransferDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded-md shadow-md w-80">
            <h3 className="text-lg font-medium mb-3">Transfer Call</h3>

            <div className="mb-3">
              <label className="block mb-1">Transfer Type</label>
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
            </div>

            <div className="mb-4">
              <label className="block mb-1">Transfer To:</label>
              <input
                type="text"
                value={transferTarget}
                onChange={(e) => setTransferTarget(e.target.value)}
                placeholder="Enter SIP address or phone number"
                className="w-full p-2 border rounded"
                disabled={isTransferring || attendedSession}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 bg-gray-200 rounded"
                onClick={() => {
                  setShowTransferDialog(false);
                  setTransferTarget("");
                  if (attendedSession) {
                    cancelAttendedTransfer();
                  }
                }}
                disabled={isTransferring}
              >
                Cancel
              </button>

              {transferType === "blind" ? (
                <button
                  className="px-3 py-1 bg-[#67308F] text-white rounded"
                  onClick={handleBlindTransfer}
                  disabled={!transferTarget || isTransferring}
                >
                  {isTransferring ? "Transferring..." : "Transfer"}
                </button>
              ) : attendedSession ? (
                <button
                  className="px-3 py-1 bg-[#67308F] text-white rounded"
                  onClick={completeAttendedTransfer}
                  disabled={isTransferring}
                >
                  {isTransferring ? "Completing..." : "Complete Transfer"}
                </button>
              ) : (
                <button
                  className="px-3 py-1 bg-[#67308F] text-white rounded"
                  onClick={initiateAttendedTransfer}
                  disabled={!transferTarget || isTransferring}
                >
                  {isTransferring ? "Calling..." : "Call First"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ForwardButton;