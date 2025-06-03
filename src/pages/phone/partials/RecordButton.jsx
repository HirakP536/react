import React, { useRef } from "react";
import recordicon from "../../../assets/phone/circle1.svg";
import unrecordIcon from "../../../assets/phone/dot-circle.svg";
import { useSelector, useDispatch } from "react-redux";
import { setRecording } from "../../../store/slices/callFeatureSlice";
import * as SIP from "sip.js";

const RecordButton = ({ sessionRef }) => {
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const isRecording = useSelector((state) => state.callFeature.isRecording);
  const dispatch = useDispatch();
  const session = sessionRef?.current;
  const pc = session?.sessionDescriptionHandler?.peerConnection;
  const canMute =
    session &&
    session.state === SIP.SessionState.Established &&
    pc &&
    pc.getSenders().find((s) => s.track?.kind === "audio");

  const startRecording = async () => {
    const pc = sessionRef.current?.sessionDescriptionHandler?.peerConnection;
    if (!pc) return;

    try {
      const localTracks = pc
        .getSenders()
        .filter((s) => s.track?.kind === "audio")
        .map((s) => s.track);
      const remoteTracks = pc
        .getReceivers()
        .filter((r) => r.track?.kind === "audio")
        .map((r) => r.track);

      const localStream = new MediaStream(localTracks);
      const remoteStream = new MediaStream(remoteTracks);

      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      audioContext.createMediaStreamSource(localStream).connect(destination);
      audioContext.createMediaStreamSource(remoteStream).connect(destination);

      const combinedStream = destination.stream;

      const mediaRecorder = new MediaRecorder(combinedStream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "call-recording.webm";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
      };

      mediaRecorder.start();
    } catch (err) {
      console.error("❌ Failed to start recording:", err);
    }
  };

  // ✅ Stop Recording
  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      console.log("🛑 Recording stopped");
    }
  };

  const handleRecord = (e) => {
    e.preventDefault();
    if (isRecording) {
      stopRecording();
      setRecording(false);
      dispatch(setRecording(!isRecording));
    } else {
      startRecording();
      dispatch(setRecording(!isRecording));
    }
  };

  return (
    <button
      type="button"
      className="relative flex items-center justify-center w-16 h-16 bg-[#aa93c752] rounded-full group"
      onClick={handleRecord}
      disabled={!canMute}
      style={{ opacity: canMute ? 1 : 0.5 }}
    >
      <img
        src={isRecording ? recordicon : unrecordIcon}
        alt=""
        className="max-w-7 h-auto transition-transform duration-200 ease-linear group-hover:scale-[1.2]"
      />
      <span className="absolute left-[-10] top-[-15px] -translate-y-1/2 ml-2 z-50 bg-[#67308F] !text-[#fff] text-xs rounded px-3 py-1 shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {isRecording ? "Stop" : "Record"}
      </span>
    </button>
  );
};

export default RecordButton;
