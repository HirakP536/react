import { axiosClient } from "./axiosClient";
import endpoints from "./endpoints";


export const getChatList = () => axiosClient.get(`${endpoints.chat.getChatList}`);
export const getChatMessages = (roomId, config = {}) => axiosClient.get(`${endpoints.chat.getChatMessages}${roomId}`,config);
export const getReadMessages = (roomId) => axiosClient.get(`${endpoints.chat.getReadMessages}${roomId}`);