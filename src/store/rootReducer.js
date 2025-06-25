import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import sipReducer from "./slices/sipSlice";
import extensionReducer from "./slices/extensionSlice";
import didReducer from "./slices/didSlice";
import userReducer from "./slices/userSlice";
import callDetailsReducer from "./slices/callDetailsSlice";
import voiceMailReducer from "./slices/voicemailSlice";
import chatListReducer from "./slices/chatListSlice";
import callDataReducer from "./slices/callDataSlice";
import contactReducer from "./slices/contactSlice";
import historyReducer from "./slices/historySlice";
import ipAddressReducer from "./slices/ipAddressSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  sip: sipReducer,
  extension: extensionReducer,
  did: didReducer,
  users: userReducer,
  callDetails: callDetailsReducer,
  voiceMail: voiceMailReducer,
  chatList: chatListReducer,
  callData: callDataReducer,
  contacts: contactReducer,
   history: historyReducer,
   ipAddress: ipAddressReducer,
});

export default rootReducer;
