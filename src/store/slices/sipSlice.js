import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  incomingCall: {
    caller: "",
    displayName: "",
    lineId: null,
  },
  isRegistered: false,
  callDuration: 0,
  callStatus: null,
  callType: "unknown", // 'incoming', 'outgoing', 'missed', 'voicemail'
  callDirection: null,
  callStartTime: null,
  callEndTime: null,
  activeLineId: null,
  currentReference: null,
  lines: {},
};

const sipSlice = createSlice({
  name: "sip",
  initialState,  reducers: {
    setIncomingCall: (state, action) => {
      const caller = action.payload?.caller || "";
      const displayName = action.payload?.displayName || "";
      const lineId = action.payload?.lineId || null;
      state.incomingCall = {
        caller,
        displayName,
        lineId,
      };
    },
    clearIncomingCall: (state) => {
      state.incomingCall = { caller: "", displayName: "", lineId: null };
    },
    setRegistered: (state, action) => {
      state.isRegistered = action.payload;
    },
    setCallDuration: (state, action) => {
      if (typeof action.payload === "number") {
        state.callDuration = action.payload;
      } else {
        state.callDuration += 1;
      }
    },
    setCallType: (state, action) => {
      state.callType = action.payload;
    },
    setCurrentReference: (state, action) => {
      state.currentReference = action.payload;
    },
    setActiveLine: (state, action) => {
      state.activeLineId = action.payload;
    },
    updateLineState: (state, action) => {
      const { lineId, data } = action.payload;
      if (!state.lines[lineId]) {
        state.lines[lineId] = {};
      }
      state.lines[lineId] = {
        ...state.lines[lineId],
        ...data
      };
    },
    removeLine: (state, action) => {
      const lineId = action.payload;
      if (state.lines[lineId]) {
        delete state.lines[lineId];
        console.log(`Line ${lineId} removed`);
        
        // If this was the active line, set activeLineId to null
        if (state.activeLineId === lineId) {
          state.activeLineId = null;
        }
      }
    },
    clearSIP: () => initialState,
  },
});

export const {
  setIncomingCall,
  clearIncomingCall,
  setRegistered,
  clearSIP,
  setCallDuration,
  setActiveLine,
  updateLineState,
  setCurrentReference,
  removeLine,
  setCallType
} = sipSlice.actions;

export default sipSlice.reducer;
