import React from 'react';
import { useCallContext } from '../../contexts/CallContext';
import './FloatingCallControls.css';

// This component can be placed anywhere in the app to show floating call controls
const FloatingCallControls = () => {
  const { 
    activeCalls, 
    activeCallId, 
    setActiveCall, 
    endCall 
  } = useCallContext();
  
  // If no calls are active, don't render anything
  if (Object.keys(activeCalls).length === 0) {
    return null;
  }
  
  const activeCall = activeCallId ? activeCalls[activeCallId] : null;
  
  // Format call duration
  const formatDuration = (startTimeStr) => {
    if (!startTimeStr) return '00:00';
    
    const startTime = new Date(startTimeStr);
    const now = new Date();
    const durationSeconds = Math.floor((now - startTime) / 1000);
    
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Format phone number for display
  const formatPhone = (phone) => {
    if (!phone) return '';
    
    // Basic US formatting: (xxx) xxx-xxxx
    if (phone.length === 10) {
      return `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6)}`;
    }
    return phone;
  };
  
  return (
    <div className="floating-call-controls">
      <div className="call-info">
        {activeCall ? (
          <>
            <div className="call-header">
              <span className={`call-type ${activeCall.direction}`}>
                {activeCall.direction === 'incoming' ? 'Incoming' : 'Outgoing'}
              </span>
              <span className="call-duration">
                {formatDuration(activeCall.startTime)}
              </span>
            </div>
            <div className="caller-info">
              {activeCall.displayName || formatPhone(activeCall.phone)}
            </div>
            <div className="call-actions">
              <button className="btn-hang-up" onClick={() => endCall(activeCallId)}>
                Hang Up
              </button>
              {Object.keys(activeCalls).length > 1 && (
                <button className="btn-switch" onClick={() => {
                  // Find the next call ID to switch to
                  const callIds = Object.keys(activeCalls);
                  const currentIndex = callIds.indexOf(activeCallId);
                  const nextIndex = (currentIndex + 1) % callIds.length;
                  setActiveCall(callIds[nextIndex]);
                }}>
                  Switch Call ({Object.keys(activeCalls).length})
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="no-active-call">
            <span>{Object.keys(activeCalls).length} call(s)</span>
            <button onClick={() => {
              const firstCallId = Object.keys(activeCalls)[0];
              if (firstCallId) setActiveCall(firstCallId);
            }}>
              Show
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingCallControls;
