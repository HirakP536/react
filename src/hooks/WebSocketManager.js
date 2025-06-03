// components/socket/WebSocketManager.js
import { useSelector } from "react-redux";
import useChatWebSocket from "./useChatWebSocket";

const WebSocketManager = () => {
  const uuid = useSelector((state) => state.auth?.user?.data?.uuid);
  useChatWebSocket(uuid,null, null);
  return null;
};

export default WebSocketManager;
