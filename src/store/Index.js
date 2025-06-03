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
// import callDetails from "./slices/callDetailsSlice";

const persistConfig = {
  key: 'root',
  storage,
  blacklist: ['sip','callDetails'],
};

const rootReducer = combineReducers({
  auth: authReducer,
  extension: extensionReducer,
  did: didReducer,
  sip: sipReducer,
  callFeature: callFeatureReducer,
  users: userReducer,
  // callDetails: callDetails,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable serializable check to avoid slowdown warning
      immutableCheck: false,
    }),
});

export const persistor = persistStore(store);