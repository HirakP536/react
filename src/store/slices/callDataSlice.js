import { createSlice } from "@reduxjs/toolkit";

// This slice is designed to store complete call data including audio channels
// for both incoming and outgoing calls that can be accessed from any page
const initialState = {
  activeCalls: {},  // Map of call IDs to call data
  callHistory: [],  // Recently ended calls
  activeAudioStreams: {},  // Map of call IDs to MediaStream objects
  lastActiveCallId: null,
};

const callDataSlice = createSlice({
  name: "callData",
  initialState,
  reducers: {
    // Add a new call to the store (both incoming and outgoing)
    addCallData: (state, action) => {
      const { callId, callData } = action.payload;
      state.activeCalls[callId] = {
        ...callData,
        addedAt: new Date().toISOString(),
      };
      state.lastActiveCallId = callId;
    },
    
    // Update an existing call's data
    updateCallData: (state, action) => {
      const { callId, callData } = action.payload;
      if (state.activeCalls[callId]) {
        state.activeCalls[callId] = {
          ...state.activeCalls[callId],
          ...callData,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    
    // Set the audio stream for a call
    setCallAudioStream: (state, action) => {
      const { callId, streamId } = action.payload;
      // Note: We only store the streamId here as MediaStream objects can't be serialized
      // The actual stream mapping happens in a middleware or a helper function
      if (state.activeCalls[callId]) {
        state.activeCalls[callId].streamId = streamId;
        state.activeAudioStreams[callId] = streamId;
      }
    },
    
    // End/remove a call
    endCall: (state, action) => {
      const { callId, endReason } = action.payload;
      if (state.activeCalls[callId]) {
        // Move to history before deleting
        const endedCall = {
          ...state.activeCalls[callId],
          endedAt: new Date().toISOString(),
          endReason,
        };
        
        // Add to history (limited to last 20 calls)
        state.callHistory = [endedCall, ...state.callHistory.slice(0, 19)];
        
        // Clean up
        delete state.activeCalls[callId];
        delete state.activeAudioStreams[callId];
        
        // Update lastActiveCall if needed
        if (state.lastActiveCallId === callId) {
          const activeCallIds = Object.keys(state.activeCalls);
          state.lastActiveCallId = activeCallIds.length > 0 ? activeCallIds[0] : null;
        }
      }
    },
    
    // Set the currently active call (the one with focus)
    setActiveCall: (state, action) => {
      const { callId } = action.payload;
      if (callId && state.activeCalls[callId]) {
        state.lastActiveCallId = callId;
      }
    },
    
    // Clear all active calls (for instance when logging out)
    clearAllCalls: (state) => {
      state.activeCalls = {};
      state.activeAudioStreams = {};
      state.lastActiveCallId = null;
    },
  },
});

export const {
  addCallData,
  updateCallData,
  setCallAudioStream,
  endCall,
  setActiveCall,
  clearAllCalls,
} = callDataSlice.actions;

export default callDataSlice.reducer;
