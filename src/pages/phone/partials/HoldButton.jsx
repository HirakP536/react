/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as SIP from "sip.js";
import pauseIcon from "../../../assets/phone/pause.svg";
import playIcon from "../../../assets/phone/play-button.svg";
import { setOnHold } from "../../../store/slices/callFeatureSlice";
import { updateLineState } from "../../../store/slices/sipSlice";

const HoldButton = ({ sessionRef, isPhoneModule }) => {
  const isOnHoldRedux =
    useSelector((state) => state.callFeature.isOnHold) || false;
  const [isActuallyOnHold, setIsActuallyOnHold] = useState(false);
  const dispatch = useDispatch();

  // Get the active line ID and line state from Redux
  const activeLineId = useSelector((state) => state.sip.activeLineId);
  const activeLine = useSelector((state) =>
    activeLineId !== null ? state.sip.lines[activeLineId] : null
  );
  const isLineOnHold = activeLine?.onHold || false;

  const session = sessionRef?.current;
  const pc = session?.sessionDescriptionHandler?.peerConnection;
  const canHold =
    session &&
    session.state === SIP.SessionState.Established &&
    pc &&
    pc.getSenders().find((s) => s.track?.kind === "audio");
  useEffect(() => {
    if (canHold && session) {
      const checkHoldState = () => {
        const senders = pc.getSenders();
        const isOnHold = senders.some(
          (sender) =>
            sender.track?.kind === "audio" &&
            pc.getTransceivers().find((t) => t.sender === sender)?.direction ===
              "sendonly"
        );

        setIsActuallyOnHold(isOnHold);

        // Update both Redux states to ensure sync
        if (isOnHold !== isOnHoldRedux) {
          dispatch(setOnHold(isOnHold));
        }

        // Update line-specific hold state in sipSlice if it differs
        if (activeLineId !== null && isOnHold !== isLineOnHold) {
          dispatch(
            updateLineState({
              lineId: activeLineId,
              data: { onHold: isOnHold },
            })
          );
        }
      };

      checkHoldState();
    } else if (!canHold) {
      setIsActuallyOnHold(false);
      if (isOnHoldRedux) {
        dispatch(setOnHold(false));
      }

      // Also reset the line-specific hold state
      if (activeLineId !== null && isLineOnHold) {
        dispatch(
          updateLineState({
            lineId: activeLineId,
            data: { onHold: false },
          })
        );
      }
    }
  }, [session, canHold, activeLineId, isLineOnHold]);

  const handleToggleHold = async () => {
    if (!canHold || !activeLineId) return;

    try {
      // Use line-specific hold state instead of global
      const currentHoldState = isLineOnHold;

      await session.invite({
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: false,
          },
          hold: !currentHoldState, // Toggle hold state
        },
      });

      // Update both Redux states for consistency
      dispatch(setOnHold(!currentHoldState));
      dispatch(
        updateLineState({
          lineId: activeLineId,
          data: { onHold: !currentHoldState },
        })
      );
    } catch (error) {
      console.error("❌ Error toggling hold:", error);
    }
  };

  // Prefer the line-specific hold state from sipSlice, but fall back to global state if needed
  const displayedHoldState = isLineOnHold || isOnHoldRedux || isActuallyOnHold;

  return (
    <button
      type="button"
      className={`relative flex items-center justify-center ${
        isPhoneModule ? "sm:w-15 sm:h-15 w-12 h-12" : "w-12 h-12"
      } bg-[#aa93c752] rounded-full group`}
      onClick={handleToggleHold}
      disabled={!canHold}
      title={!canHold ? "Hold unavailable until call is established" : ""}
      style={{ opacity: canHold ? 1 : 0.5 }}
    >
      <img
        src={displayedHoldState ? playIcon : pauseIcon}
        alt=""
        className={`${
          isPhoneModule ? "sm:max-w-7 max-w-5" : "max-w-5"
        } h-auto transition-transform duration-200 ease-linear group-hover:scale-[1.2]`}
      />
      <span className="absolute left-[-10] top-[-15px] -translate-y-1/2 ml-2 z-50 bg-[#67308F] !text-[#fff] text-xs rounded px-3 py-1 shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {displayedHoldState ? "Unhold" : "Hold"}
      </span>
    </button>
  );
};

export default HoldButton;
