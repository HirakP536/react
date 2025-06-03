import React, { useEffect, useRef, useState } from "react";
import speakerIcon from "../../../assets/phone/low-volume.svg";
import * as SIP from "sip.js";

const SpeakerSelector = ({ session, sessionRef }) => {
  const audioRef = useRef(null);
  const selectorRef = useRef(null);
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [selectedOutput, setSelectedOutput] = useState("");
  const [open, setOpen] = useState(false);
  const sessionCheck = sessionRef?.current;
  const pc = sessionCheck?.sessionDescriptionHandler?.peerConnection;
  const canMute =
    session &&
    session.state === SIP.SessionState.Established &&
    pc &&
    pc.getSenders().find((s) => s.track?.kind === "audio");

  // Attach remote stream to audio element (robust version)
  useEffect(() => {
    if (!session?.sessionDescriptionHandler?.peerConnection) return;
    const pc = session.sessionDescriptionHandler.peerConnection;

    // Collect all remote audio tracks
    const remoteStream = new MediaStream();
    pc.getReceivers().forEach((receiver) => {
      if (receiver.track && receiver.track.kind === "audio") {
        remoteStream.addTrack(receiver.track);
      }
    });

    if (audioRef.current) {
      audioRef.current.srcObject = remoteStream;
      audioRef.current.muted = false;
      audioRef.current.play().catch((e) => {
        console.warn("Playback error:", e);
      });
    }

    // Also listen for new tracks (for dynamic cases)
    const handleTrack = (event) => {
      if (event.track.kind === "audio" && audioRef.current) {
        const stream =
          audioRef.current.srcObject instanceof MediaStream
            ? audioRef.current.srcObject
            : new MediaStream();
        stream.addTrack(event.track);
        audioRef.current.srcObject = stream;
        audioRef.current.muted = false;
        audioRef.current.play().catch((e) => {
          console.warn("Playback error:", e);
        });
      }
    };
    pc.addEventListener("track", handleTrack);

    return () => {
      pc.removeEventListener("track", handleTrack);
    };
  }, [session, session?.sessionDescriptionHandler?.peerConnection]);

  // Fetch available audio output devices
  const fetchAudioOutputs = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const outputs = devices.filter((d) => d.kind === "audiooutput");

      setAudioOutputs(outputs);

      // Set default if not already selected
      if (!selectedOutput && outputs.length > 0) {
        setSelectedOutput(outputs[0].deviceId);
      }
    } catch (err) {
      console.error("Failed to fetch audio outputs:", err);
    }
  };

  // Change output device of audio element
  const changeOutputDevice = async (deviceId) => {
    try {
      if (
        audioRef.current &&
        typeof audioRef.current.setSinkId === "function"
      ) {
        await audioRef.current.setSinkId(deviceId);
        setSelectedOutput(deviceId);
        console.log(`🔈 Output device set to: ${deviceId}`);
      } else {
        console.warn("setSinkId is not supported in this browser.");
      }
    } catch (error) {
      console.error("Failed to set audio output device:", error);
    }
  };

  // Handle outside click to close selector
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSpeakerClick = async () => {
    await fetchAudioOutputs();
    setOpen((prev) => !prev);
  };

  return (
    <div ref={selectorRef} className="relative flex items-center justify-center">

      <audio
        ref={audioRef}
        autoPlay style={{ display: "none" }}
      />
      <button
        onClick={handleSpeakerClick}
        className="relative flex items-center justify-center w-16 h-16 bg-[#aa93c752] rounded-full group"
        disabled={!canMute}
        style={{ opacity: canMute ? 1 : 0.5 }}
      >
        <img
          src={speakerIcon}
          alt=""
          className="max-w-7 h-auto transition-transform duration-200 ease-linear group-hover:scale-[1.2]"
        />
      </button>

      {open && audioOutputs.length > 0 && (
        <div className="absolute z-10 flex flex-col items-start right-0 w-full max-w-[400px] p-2 mt-2 bg-white border border-gray-300">
          <select
            value={selectedOutput}
            onChange={(e) => changeOutputDevice(e.target.value)}
          >
            {audioOutputs.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || "Unknown Output"}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default SpeakerSelector;
