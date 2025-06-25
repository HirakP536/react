import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import sipReducer from "./slices/sipSlice";
import extensionReducer from "./slices/extensionSlice";
import didReducer from "./slices/didSlice";
import userReducer from "./slices/userSlice";
import callDetailsReducer from "./slices/callDetailsSlice";
import voiceMailReducer from "./slices/voicemailSlice";
import chatListReducer from "./slices/chatListSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  sip: sipReducer,
  extension: extensionReducer,
  did: didReducer,
  users: userReducer,
  callDetails: callDetailsReducer,
  voiceMail: voiceMailReducer,
  chatList: chatListReducer
});

export default rootReducer;
