import React from "react";
import muteIcon from "../../../assets/phone/muted.svg";
import unmuteIcon from "../../../assets/phone/microphone.svg";
import { useSelector, useDispatch } from "react-redux";
import { setMuted } from "../../../store/slices/callFeatureSlice";
import { updateLineState } from "../../../store/slices/sipSlice";
import * as SIP from "sip.js";

const MuteButton = ({ sessionRef }) => {
  const isMuted = useSelector((state) => state.callFeature.isMuted);
  const dispatch = useDispatch();
  
  // Get the active line ID and line state from Redux
  const activeLineId = useSelector((state) => state.sip.activeLineId);
  const activeLine = useSelector((state) => 
    activeLineId !== null ? state.sip.lines[activeLineId] : null
  );
  const isLineMuted = activeLine?.muted || false;

  const session = sessionRef?.current;
  const pc = session?.sessionDescriptionHandler?.peerConnection;
  const canMute =
    session &&
    session.state === SIP.SessionState.Established &&
    pc &&
    pc.getSenders().find((s) => s.track?.kind === "audio");
  const handleToggleMute = () => {
    if (!canMute) return;
    const audioSender = pc.getSenders().find((s) => s.track?.kind === "audio");
    if (audioSender?.track) {
      audioSender.track.enabled = !isMuted;
    }
    
    // Update both Redux states for consistency
    const newMutedState = !isMuted;
    dispatch(setMuted(newMutedState));
    
    // Also update line-specific mute state if we have an active line
    if (activeLineId !== null) {
      dispatch(updateLineState({
        lineId: activeLineId,
        data: { muted: newMutedState }
      }));
    }
  };
    // Prefer line-specific mute state if available
  const displayedMutedState = isLineMuted || isMuted;
  return (
    <button
      type="button"
      className="relative flex items-center justify-center w-16 h-16 bg-[#aa93c752] rounded-full group cursor-pointer"
      onClick={handleToggleMute}
      disabled={!canMute}
      title={!canMute ? "Mute unavailable until call is established" : ""}
      style={{ opacity: canMute ? 1 : 0.5 }}
    >
      <img
        src={displayedMutedState ? muteIcon : unmuteIcon}
        alt={displayedMutedState ? "Muted" : "Unmuted"}
        className="max-w-7 h-auto transition-transform duration-200 ease-linear group-hover:scale-[1.2]"
      />
      <span className="absolute left-[-10] top-[-15px] -translate-y-1/2 ml-2 z-50 bg-[#67308F] !text-[#fff] text-xs rounded px-3 py-1 shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {displayedMutedState ? "Unmute" : "Mute"}
      </span>
    </button>
  );
};

export default MuteButton;
