import { useEffect } from 'react';
import { useCallContext } from '../contexts/CallContext';

// Integration hook to connect SIP session events to our CallContext
const useSipCallIntegration = (sipSession, audioRef) => {
  const { 
    addCall, 
    updateCall, 
    endCall, 
    setActiveCall, 
    attachMediaStream 
  } = useCallContext();
  
  useEffect(() => {
    if (!sipSession || !sipSession.current) return;
    
    // Create a handler for incoming calls
    const handleIncoming = (session) => {
      const callerId = session.remoteIdentity?.uri?.user || 'unknown';
      const callerName = session.remoteIdentity?.displayName || callerId;
      
      // Add the call to our context
      const callId = session.id || `call_${Date.now()}`;
      
      addCall({
        id: callId,
        direction: 'incoming',
        phone: callerId,
        displayName: callerName,
        status: 'ringing',
        sessionId: session.id
      });
      
      // Set up audio when the call is established
      const handleSessionAudio = () => {
        if (session.sessionDescriptionHandler?.peerConnection) {
          const pc = session.sessionDescriptionHandler.peerConnection;
          
          // Create a MediaStream for the audio
          const remoteStream = new MediaStream();
          
          // Add existing audio tracks
          pc.getReceivers().forEach(receiver => {
            if (receiver.track && receiver.track.kind === 'audio') {
              remoteStream.addTrack(receiver.track);
            }
          });
          
          // Listen for new audio tracks
          pc.ontrack = (event) => {
            if (event.track.kind === 'audio') {
              remoteStream.addTrack(event.track);
              // Update the call's audio stream
              attachMediaStream(callId, remoteStream);
            }
          };
          
          // Initial attachment if we already have tracks
          if (remoteStream.getTracks().length > 0) {
            attachMediaStream(callId, remoteStream);
          }
        }
      };
      
      // Set up state change listeners
      session.stateChange.addListener((state) => {
        updateCall(callId, { status: state.toLowerCase() });
        
        if (state === 'Established') {
          updateCall(callId, { 
            status: 'connected',
            startTime: new Date().toISOString()
          });
          handleSessionAudio();
          setActiveCall(callId);
        } else if (state === 'Terminated') {
          endCall(callId, 'ended');
        }
      });
    };
    
    // Create a handler for outgoing calls
    const handleOutgoing = (session, phoneNumber) => {
      const callId = session.id || `call_${Date.now()}`;
      
      addCall({
        id: callId,
        direction: 'outgoing',
        phone: phoneNumber,
        status: 'dialing',
        sessionId: session.id
      });
      
      // Set up state change listeners similar to incoming calls
      session.stateChange.addListener((state) => {
        updateCall(callId, { status: state.toLowerCase() });
        
        if (state === 'Established') {
          updateCall(callId, { 
            status: 'connected',
            startTime: new Date().toISOString()
          });
          
          // Set up audio
          if (session.sessionDescriptionHandler?.peerConnection) {
            const pc = session.sessionDescriptionHandler.peerConnection;
            const remoteStream = new MediaStream();
            
            pc.getReceivers().forEach(receiver => {
              if (receiver.track && receiver.track.kind === 'audio') {
                remoteStream.addTrack(receiver.track);
              }
            });
            
            pc.ontrack = (event) => {
              if (event.track.kind === 'audio') {
                remoteStream.addTrack(event.track);
                attachMediaStream(callId, remoteStream);
              }
            };
            
            if (remoteStream.getTracks().length > 0) {
              attachMediaStream(callId, remoteStream);
            }
          }
          
          setActiveCall(callId);
        } else if (state === 'Terminated') {
          endCall(callId, 'ended');
        }
      });
    };
    
    // Expose these handlers to be called from useSipSession
    return {
      handleIncoming,
      handleOutgoing
    };
  }, [sipSession, audioRef, addCall, updateCall, endCall, setActiveCall, attachMediaStream]);
};

export default useSipCallIntegration;
