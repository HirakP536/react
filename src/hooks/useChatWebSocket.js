/* eslint-disable react-hooks/exhaustive-deps */
// useChatWebSocket.js
import { useEffect, useRef } from "react";

const globalSocketRef = { current: null };

export const getSocket = () => globalSocketRef.current;

const useChatWebSocket = (uuid, onMessageHandler, setNewSocketData) => {
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (!uuid || globalSocketRef.current) return; // Don't reconnect if already exists

    const connect = () => {
      const socket = new WebSocket(
        `${import.meta.env.VITE_SOCKET_BASRE_URL}/ws/chatroom/${uuid}/`
      );
      globalSocketRef.current = socket;

      socket.onopen = () => {
        console.log("✅ WebSocket connected");
      };

      socket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log("📬 WebSocket message received:", data);
          onMessageHandler?.(data);
          setNewSocketData?.(data);
        } catch (err) {
          console.warn("WebSocket parse error", err);
        }
      };

      socket.onclose = () => {
        console.error("❌ WebSocket disconnected. Attempting reconnect...");
        globalSocketRef.current = null;
        reconnectTimeoutRef.current = setTimeout(() => connect(), 4000);
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
        socket.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      globalSocketRef.current?.close();
      globalSocketRef.current = null;
    };
  }, [uuid]);

  const sendMessage = (msgData) => {
    if (globalSocketRef.current?.readyState === WebSocket.OPEN) {
      globalSocketRef.current.send(JSON.stringify(msgData));
    } else {
      console.warn("❌ WebSocket not open. Cannot send message.");
    }
  };

  return { sendMessage };
};

export default useChatWebSocket;
