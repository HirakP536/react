import { useEffect } from "react";
import { SipSessionRegistry } from "./sipSessionRegistry";

export const UseWindowUnloadHangup = () => {
  useEffect(() => {
    const handleBeforeUnload = () => {
      const sessions = SipSessionRegistry.getAll();
      for (const sessionId in sessions) {
        const session = sessions[sessionId];
        if (session && session.state !== "terminated") {
          try {
            session.bye();
          } catch (err) {
            console.warn(`Failed to send BYE for session ${sessionId}:`, err);
            session.terminate();
          }
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);
};