/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import * as SIP from "sip.js";
import unmuteIcon from "../../../assets/phone/microphone.svg";
import muteIcon from "../../../assets/phone/muted.svg";
import { setMuted } from "../../../store/slices/callFeatureSlice";
import { updateLineState } from "../../../store/slices/sipSlice";

const MuteButton = ({ sessionRef,isPhoneModule=false }) => {
  const dispatch = useDispatch();
  
  const activeLineId = useSelector((state) => state.sip.activeLineId);
  const activeLine = useSelector((state) => 
    activeLineId !== null ? state.sip.lines[activeLineId] : null
  );
  const isLineMuted = activeLine?.muted || false;
  const isLineOnHold = activeLine?.held || false;

  const session = sessionRef?.current;
  const pc = session?.sessionDescriptionHandler?.peerConnection;
  const canMute =
    session &&
    session.state === SIP.SessionState.Established &&
    pc &&
    pc.getSenders().find((s) => s.track?.kind === "audio") &&
    !isLineOnHold;

  const applyMuteState = (mutedState) => {
    if (!pc) return;
    const audioSender = pc.getSenders().find((s) => s.track?.kind === "audio");
    if (audioSender?.track) {
      audioSender.track.enabled = !mutedState;
    }
  };
  React.useEffect(() => {
    if (session && pc && !isLineOnHold && isLineMuted) {
      applyMuteState(true);
    }
  }, [isLineOnHold, session, pc, isLineMuted]);

  const handleToggleMute = () => {
    if (!canMute) return;
    
    const newMutedState = !isLineMuted;
    applyMuteState(newMutedState);
    dispatch(setMuted(newMutedState));
    
    if (activeLineId !== null) {
      dispatch(updateLineState({
        lineId: activeLineId,
        data: { muted: newMutedState }
      }));
    }
  };

  const displayedMutedState = isLineMuted;
  return (
    <button
      type="button"
      className={`relative flex items-center justify-center ${
        isPhoneModule ? "sm:w-15 sm:h-15 w-12 h-12" : "w-12 h-12"
      } bg-[#aa93c752] rounded-full group`}
      onClick={handleToggleMute}
      disabled={!canMute}
      title={!canMute ? "Mute unavailable until call is established" : ""}
      style={{ opacity: canMute ? 1 : 0.5 }}
    >
      <img
        src={displayedMutedState ? muteIcon : unmuteIcon}
        alt={displayedMutedState ? "Muted" : "Unmuted"}
        className={`${
          isPhoneModule ? "sm:max-w-7 max-w-5" : "max-w-5"
        } h-auto transition-transform duration-200 ease-linear group-hover:scale-[1.2]`}
      />
      <span className="absolute left-[-10] top-[-15px] -translate-y-1/2 ml-2 z-50 bg-[#67308F] !text-[#fff] text-xs rounded px-3 py-1 shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {displayedMutedState ? "Unmute" : "Mute"}
      </span>
    </button>
  );
};

export default MuteButton;
