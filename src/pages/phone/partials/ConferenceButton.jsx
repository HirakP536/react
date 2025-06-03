import { useEffect, useState } from "react";
import * as SIP from "sip.js";
import confrenceIcon from "../../../assets/phone/users.svg";
import useSipAgentRef from "../../../hooks/useSipAgentRef";

const ConferenceButton = ({ session }) => {
  const [showConferenceDialog, setShowConferenceDialog] = useState(false);
  const [conferenceTarget, setConferenceTarget] = useState("");
  const [isConferencing, setIsConferencing] = useState(false);
  const [conferenceSession, setConferenceSession] = useState(null);
  const { userAgentRef } = useSipAgentRef();

  // Check if the session is established
  const canConference =
    session &&
    session.state === SIP.SessionState.Established;

  // Reset state when session changes
  useEffect(() => {
    if (!canConference) {
      setConferenceSession(null);
      setIsConferencing(false);
    }
  }, [canConference]);

  // Clean up conference session when component unmounts
  useEffect(() => {
    return () => {
      if (conferenceSession && conferenceSession.state !== SIP.SessionState.Terminated) {
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

      // First put the current call on hold
      console.log("Putting first call on hold...");
      await session.invite({
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: false,
          },
          hold: true,
        },
      });
      console.log("First call is now on hold");

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

      // Create new session for conference call
      const inviter = new SIP.Inviter(userAgentRef.current, target);

      // Create a new audio element for this call to ensure audio output works
      const audioElement = document.createElement('audio');
      audioElement.autoplay = true;
      audioElement.id = 'conference-audio';
      document.body.appendChild(audioElement);

      // Configure sessionDescriptionHandler to process remote tracks
      const delegate = {
        onSessionDescriptionHandler: (sdh) => {
          sdh.peerConnectionDelegate = {
            ontrack: (event) => {
              console.log("Conference track added:", event.track.kind);

              if (event.track.kind === 'audio') {
                // Create a stream from the track
                const stream = new MediaStream([event.track]);

                // Set the stream as the source for our audio element
                audioElement.srcObject = stream;
                audioElement.play()
                  .then(() => console.log("Conference audio playing"))
                  .catch(err => console.error("Failed to play conference audio:", err));
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
        console.log(`Conference call state: ${state}`);

        // When established, check if we have media
        if (state === SIP.SessionState.Established) {
          // Check if we have audio tracks in the session
          const sdh = inviter.sessionDescriptionHandler;
          if (sdh && sdh.peerConnection) {
            const receivers = sdh.peerConnection.getReceivers();
            console.log(`Found ${receivers.length} conference receivers`);

            receivers.forEach(receiver => {
              if (receiver.track && receiver.track.kind === 'audio') {
                console.log("Found conference audio track:", receiver.track);

                // Create a new stream with this track
                const stream = new MediaStream([receiver.track]);

                // Connect it to audio element
                audioElement.srcObject = stream;
                audioElement.play()
                  .then(() => console.log("Playing conference audio from receiver track"))
                  .catch(err => console.error("Error playing conference audio:", err));
              }
            });
          }
        }
      });

      // Initiate the call
      console.log("Initiating conference call...");
      await inviter.invite(inviteOptions);
      console.log("Connected to conference target");

      // Store the conference session
      setConferenceSession(inviter);

      // Clean up audio element when session ends
      inviter.stateChange.addListener((state) => {
        if (state === SIP.SessionState.Terminated) {
          console.log("Conference call terminated, removing audio element");
          if (audioElement && audioElement.parentNode) {
            audioElement.srcObject = null;
            audioElement.parentNode.removeChild(audioElement);
          }
        }
      });
    } catch (error) {
      console.error("Error initiating conference call:", error);
      alert(`Failed to start conference call: ${error.message}`);
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
        console.log("Recovered original call from hold");
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

      // Take the original call off hold (important for conference)
      await session.invite({
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: false,
          },
          hold: false,
        },
      });

      // At this point, both calls are active - this creates a basic 3-way conference
      // More sophisticated conference features would require a conference server/bridge

      console.log("Both calls are now active - conference established");

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
  };

  // End conference call
  const endConferenceCall = async () => {
    if (!conferenceSession) return;

    try {
      setIsConferencing(true);

      // End the conference session based on its state
      if (conferenceSession.state === SIP.SessionState.Established) {
        // If call is established, use bye()
        await conferenceSession.bye();
        console.log("Conference call ended with bye()");
      } else if (conferenceSession.state === SIP.SessionState.Establishing) {
        // If call is still being established, use cancel()
        await conferenceSession.cancel();
        console.log("Conference call cancelled");
      } else if (conferenceSession.state === SIP.SessionState.Initial) {
        // If call is in initial state, use cancel() as well
        await conferenceSession.cancel();
        console.log("Conference call cancelled in initial state");
      }

      // Clean up audio element
      const audioElement = document.getElementById('conference-audio');
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
        console.log("Original call resumed");
      }

      // Reset state
      setConferenceSession(null);
      setShowConferenceDialog(false);
      setConferenceTarget("");
    } catch (error) {
      console.error("Error ending conference call:", error);

      // Still try to clean up and reset state even if there was an error
      const audioElement = document.getElementById('conference-audio');
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

  return (
    <>
      <button
        type="button"
        className="relative flex items-center justify-center w-8 h-8 bg-[#aa93c752] rounded-full group"
        onClick={() => setShowConferenceDialog(true)}
        disabled={!canConference}
        title={!canConference ? "Conference unavailable until call is established" : ""}
        style={{ opacity: canConference ? 1 : 0.5 }}
      >
        <img
          src={confrenceIcon}
          alt=""
          className="max-w-4 h-auto transition-transform duration-200 ease-linear group-hover:scale-[1.2]"
        />
        <span className="absolute left-[-10] top-[-15px] -translate-y-1/2 ml-2 z-50 bg-[#67308F] !text-[#fff] text-xs rounded px-3 py-1 shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Conference
        </span>
      </button>

      {showConferenceDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded-md shadow-md w-80">
            <h3 className="text-lg font-medium mb-3">Conference Call</h3>

            {!conferenceSession ? (
              <>
                <div className="mb-4">
                  <label className="block mb-1">Add Participant:</label>
                  <input
                    type="text"
                    value={conferenceTarget}
                    onChange={(e) => setConferenceTarget(e.target.value)}
                    placeholder="Enter SIP address or phone number"
                    className="w-full p-2 border rounded"
                    disabled={isConferencing}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    className="px-3 py-1 bg-gray-200 rounded"
                    onClick={() => setShowConferenceDialog(false)}
                    disabled={isConferencing}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-3 py-1 bg-[#67308F] text-white rounded"
                    onClick={initiateConferenceCall}
                    disabled={!conferenceTarget || isConferencing}
                  >
                    {isConferencing ? "Calling..." : "Call Participant"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-3">Participant connected. Merge calls?</p>
                <div className="flex justify-end gap-2">
                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded"
                    onClick={endConferenceCall}
                    disabled={isConferencing}
                  >
                    End Conference Call
                  </button>
                  <button
                    className="px-3 py-1 bg-[#67308F] text-white rounded"
                    onClick={mergeCallsIntoConference}
                    disabled={isConferencing}
                  >
                    {isConferencing ? "Merging..." : "Merge Calls"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ConferenceButton;