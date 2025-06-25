import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isMuted: false,
  isOnHold: false,
  isRecording: false,
  dialedPhone: "",
  isDNDActive: false,
  modalOpenFlag: false,
  selectedCallerId: null,
  sessions: {},
};

const callFeatureSlice = createSlice({
  name: "callFeature",
  initialState,
  reducers: {
    setMuted: (state, action) => {
      state.isMuted = action.payload;
    },
    setOnHold: (state, action) => {
      state.isOnHold = action.payload;
    },
    setRecording: (state, action) => {
      state.isRecording = action.payload;
    },
    setDialedPhone: (state, action) => {
      state.dialedPhone = action.payload;
    },
    setModalOpenFlag: (state, action) => {
      state.modalOpenFlag = action.payload;
    },
    setSelectedCallerId: (state, action) => {
      state.selectedCallerId = action.payload;
    },
    resetDialedPhone: (state) => {
      state.dialedPhone = "";
    },
    setIsDNDActive: (state, action) => {
      state.isDNDActive = action.payload;
    },
    addSession: (state, action) => {
      const { id, data } = action.payload;
      if (!id) {
        console.error("addSession: Missing session ID");
        return;
      }
      if (!state.sessions) {
        state.sessions = {};
      }
      state.sessions[id] = data;
    },
    resetCallFeatures: () => initialState,
    resetSessions: (state) => {
      state.sessions = {};
    },
  },
});

export const {
  setMuted,
  setOnHold,
  setRecording,
  setDialedPhone,
  resetDialedPhone,
  addSession,
  removeSession,
  resetCallFeatures,
  setModalOpenFlag,
  setSelectedCallerId,
  setIsDNDActive,
  resetSessions,
} = callFeatureSlice.actions;
export default callFeatureSlice.reducer;
