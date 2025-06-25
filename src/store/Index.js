import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import persistReducer from "redux-persist/es/persistReducer";
import persistStore from "redux-persist/es/persistStore";
import storage from 'redux-persist/lib/storage';

import extensionReducer from "./slices/extensionSlice";
import authReducer from "./slices/authSlice";
import didReducer from "./slices/didSlice";
import sipReducer from "./slices/sipSlice";
import callFeatureReducer from "./slices/callFeatureSlice";
import userReducer from "./slices/userSlice";
import voiceMailReducer from "./slices/voicemailSlice";
import chatListReducer from "./slices/chatListSlice";
import contactReducer from "./slices/contactSlice";
import contactsManagementReducer from "./slices/contactsManagementSlice";
import historyReducer from "./slices/historySlice";
import ipAddressReducer from "./slices/ipAddressSlice";

const persistConfig = {
  key: 'root',
  storage,
  blacklist: ['sip','callDetails','callData'],
};

const rootReducer = combineReducers({
  auth: authReducer,
  extension: extensionReducer,
  did: didReducer,
  sip: sipReducer,
  callFeature: callFeatureReducer,
  users: userReducer,
  voiceMail: voiceMailReducer,
  chatList: chatListReducer,
  contacts: contactReducer,
  contactsManagement: contactsManagementReducer,
  history: historyReducer,
  ipAddress: ipAddressReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

export const persistor = persistStore(store);