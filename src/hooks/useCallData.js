// useCallData.js - Custom hook to work with the callData slice
import { useDispatch, useSelector } from 'react-redux';
import {
  addCallData,
  endCall,
  setActiveCall,
  setCallAudioStream,
  updateCallData
} from '../store/slices/callDataSlice';
import audioStreamManager from '../utils/AudioStreamManager';

const useCallData = () => {
  const dispatch = useDispatch();
  const activeCalls = useSelector((state) => state.callData.activeCalls);
  const lastActiveCallId = useSelector((state) => state.callData.lastActiveCallId);
  const callHistory = useSelector((state) => state.callData.callHistory);

  // Add a new call (both incoming and outgoing)
  const registerCall = (callInfo) => {
    const { 
      callId, 
      direction,  // 'incoming' or 'outgoing'
      phone,      // phone number
      displayName, 
      session,    // SIP session object
      peerConnection // WebRTC peer connection
    } = callInfo;

    // Register the call in Redux
    dispatch(addCallData({
      callId,
      callData: {
        direction,
        phone,
        displayName,
        startedAt: new Date().toISOString(),
        status: 'connecting', // initial status
        sessionId: session?.id // Store session ID for reference
      }
    }));

    // If a peer connection is provided, attach the audio
    if (peerConnection) {
      const streamId = audioStreamManager.attachPeerConnectionAudio(callId, peerConnection);
      if (streamId) {
        dispatch(setCallAudioStream({ callId, streamId }));
      }
    }

    return callId;
  };

  // Update an existing call
  const updateCall = (callId, updatedData) => {
    if (activeCalls[callId]) {
      dispatch(updateCallData({ callId, callData: updatedData }));
    }
  };

  // Set a call as active (focus)
  const activateCall = (callId) => {
    if (activeCalls[callId]) {
      dispatch(setActiveCall({ callId }));
      // Ensure audio is playing for this call
      audioStreamManager.playCallAudio(callId);
    }
  };

  // End a call
  const terminateCall = (callId, reason = 'normal') => {
    if (activeCalls[callId]) {
      dispatch(endCall({ callId, endReason: reason }));
      // Clean up audio
      audioStreamManager.removeStream(callId);
    }
  };

  // Get the active call
  const getActiveCall = () => {
    return lastActiveCallId ? activeCalls[lastActiveCallId] : null;
  };

  // Attach audio to an existing call
  const attachCallAudio = (callId, peerConnection) => {
    if (activeCalls[callId] && peerConnection) {
      const streamId = audioStreamManager.attachPeerConnectionAudio(callId, peerConnection);
      if (streamId) {
        dispatch(setCallAudioStream({ callId, streamId }));
      }
    }
  };

  return {
    activeCalls,
    lastActiveCallId,
    callHistory,
    registerCall,
    updateCall,
    activateCall,
    terminateCall,
    getActiveCall,
    attachCallAudio
  };
};

export default useCallData;
