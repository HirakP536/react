// Helper functions for SIP session management
import audioStreamManager from '../utils/AudioStreamManager';

// Updates call data with session state changes
export const updateCallWithSessionState = (sessionId, state, updateCall) => {
  if (!sessionId) return;
  
  let status = '';
  
  switch (state) {
    case 'Initial':
      status = 'ringing';
      break;
    case 'Establishing':
      status = 'connecting';
      break;
    case 'Established':
      status = 'connected';
      break;
    case 'Terminating':
      status = 'ending';
      break;
    case 'Terminated':
      status = 'ended';
      break;
    default:
      status = state.toLowerCase();
  }
  
  updateCall(sessionId, { status });
};

// Register call data from SIP session
export const registerCallFromSession = (session, registerCall) => {
  if (!session || !session.id) return null;
  
  const peerConnection = session.sessionDescriptionHandler?.peerConnection;
  const callDirection = session.direction || 'incoming';
  const phone = session.remoteIdentity?.uri?.user || '';
  const displayName = session.remoteIdentity?.displayName || '';
  
  // Register the call with the callData system
  if (peerConnection) {
    const streamId = audioStreamManager.attachPeerConnectionAudio(
      session.id,
      peerConnection
    );
    
    return registerCall({
      callId: session.id,
      direction: callDirection,
      phone,
      displayName,
      session,
      peerConnection,
      streamId
    });
  }
  
  return null;
};
