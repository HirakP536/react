// This is a simple component that demonstrates how to use the CallContext
// to access call data and control from any page in the app

import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Create a context for our call data
const CallContext = createContext();

// Initial state for our call data
const initialState = {
  activeCalls: {},  // Map of call IDs to call data
  activeCallId: null, // ID of the currently active call
  callHistory: [] // Recently ended calls
};

// Reducer to manage call data state
function callReducer(state, action) {
  switch (action.type) {
    case 'ADD_CALL':
      return {
        ...state,
        activeCalls: {
          ...state.activeCalls,
          [action.payload.id]: {
            ...action.payload,
            startTime: new Date().toISOString(),
            status: action.payload.status || 'connecting'
          }
        },
        activeCallId: state.activeCallId || action.payload.id // Set as active if no other active call
      };
    
    case 'UPDATE_CALL':
      return {
        ...state,
        activeCalls: {
          ...state.activeCalls,
          [action.payload.id]: {
            ...state.activeCalls[action.payload.id],
            ...action.payload,
            updatedAt: new Date().toISOString()
          }
        }
      };
    
    case 'SET_ACTIVE_CALL':
      return {
        ...state,
        activeCallId: action.payload
      };
    
    case 'END_CALL': {
      const { [action.payload]: endedCall, ...remainingCalls } = state.activeCalls;
      if (!endedCall) return state;
      
      const newActiveCallId = state.activeCallId === action.payload 
        ? Object.keys(remainingCalls)[0] || null 
        : state.activeCallId;
      
      return {
        ...state,
        activeCalls: remainingCalls,
        activeCallId: newActiveCallId,
        callHistory: [
          {
            ...endedCall,
            endTime: new Date().toISOString(),
            endReason: action.reason || 'ended'
          },
          ...state.callHistory.slice(0, 19) // Keep last 20 calls
        ]
      };
    }
    
    case 'CLEAR_CALLS':
      return {
        ...state,
        activeCalls: {},
        activeCallId: null
      };
    
    default:
      return state;
  }
}

// Provider component to wrap our app
export function CallProvider({ children }) {
  const [state, dispatch] = useReducer(callReducer, initialState);
  
  // Audio elements for each call
  const audioElements = React.useRef(new Map()).current;
  
  // Clean up audio elements when component unmounts
  useEffect(() => {
    return () => {
      audioElements.forEach((audioEl) => {
        if (audioEl) {
          audioEl.pause();
          audioEl.remove();
        }
      });
      audioElements.clear();
    };
  }, [audioElements]);
  
  // Action creators
  const addCall = (callData) => {
    dispatch({ type: 'ADD_CALL', payload: callData });
    
    // Create audio element if we have a stream
    if (callData.stream) {
      const audioEl = document.createElement('audio');
      audioEl.srcObject = callData.stream;
      audioEl.autoplay = true;
      document.body.appendChild(audioEl);
      audioElements.set(callData.id, audioEl);
    }
    
    return callData.id;
  };
  
  const updateCall = (id, updateData) => {
    if (state.activeCalls[id]) {
      dispatch({ type: 'UPDATE_CALL', payload: { id, ...updateData } });
      
      // Update audio stream if provided
      if (updateData.stream && audioElements.has(id)) {
        const audioEl = audioElements.get(id);
        audioEl.srcObject = updateData.stream;
      }
    }
  };
  
  const endCall = (id, reason = 'normal') => {
    if (state.activeCalls[id]) {
      dispatch({ type: 'END_CALL', payload: id, reason });
      
      // Clean up audio element
      if (audioElements.has(id)) {
        const audioEl = audioElements.get(id);
        audioEl.pause();
        audioEl.srcObject = null;
        audioEl.remove();
        audioElements.delete(id);
      }
    }
  };
  
  const setActiveCall = (id) => {
    if (state.activeCalls[id] || id === null) {
      dispatch({ type: 'SET_ACTIVE_CALL', payload: id });
      
      // Ensure this call's audio is playing
      if (id && audioElements.has(id)) {
        audioElements.get(id).play().catch(err => console.warn('Error playing audio:', err));
      }
    }
  };
  
  const clearCalls = () => {
    dispatch({ type: 'CLEAR_CALLS' });
    
    // Clean up all audio elements
    audioElements.forEach((audioEl) => {
      audioEl.pause();
      audioEl.srcObject = null;
      audioEl.remove();
    });
    audioElements.clear();
  };
  
  const attachMediaStream = (id, stream) => {
    if (!id || !stream) return;
    
    // Create or update audio element
    let audioEl = audioElements.get(id);
    
    if (!audioEl) {
      audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      document.body.appendChild(audioEl);
      audioElements.set(id, audioEl);
    }
    
    audioEl.srcObject = stream;
    audioEl.play().catch(err => console.warn('Error playing audio:', err));
    
    // Update call state with stream info
    updateCall(id, { hasAudio: true });
  };
  
  // Value object to pass through the context
  const value = {
    activeCalls: state.activeCalls,
    activeCallId: state.activeCallId,
    callHistory: state.callHistory,
    addCall,
    updateCall,
    endCall,
    setActiveCall,
    clearCalls,
    attachMediaStream,
    getActiveCall: () => state.activeCallId ? state.activeCalls[state.activeCallId] : null
  };
  
  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
}

// Custom hook to use the call context
export function useCallContext() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCallContext must be used within a CallProvider');
  }
  return context;
}

// Usage example:
// 1. Wrap your app with CallProvider
// 2. Use useCallContext() in any component to access call data and control functions
