import React from 'react';
import { useCallContext } from '../../contexts/CallContext';

// This component shows how to use the CallContext from any page
const CallControls = () => {
  const { 
    activeCalls,
    activeCallId, 
    setActiveCall, 
    endCall 
  } = useCallContext();
  
  // Format phone number for display
  const formatPhone = (phone) => {
    if (!phone) return '';
    
    // Basic US formatting: (xxx) xxx-xxxx
    if (phone.length === 10) {
      return `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6)}`;
    }
    return phone;
  };

  // Current active call
  const activeCall = activeCallId ? activeCalls[activeCallId] : null;
  
  // Handle switching between calls
  const handleSwitchCall = (callId) => {
    setActiveCall(callId);
  };
  
  // Handle ending a call
  const handleHangup = (callId) => {
    endCall(callId);
  };
  
  return (
    <div className="call-controls">
      <h3>Call Controls</h3>
      
      {Object.keys(activeCalls).length === 0 ? (
        <div className="no-calls">
          <p>No active calls</p>
        </div>
      ) : (
        <>
          {/* Active Call Display */}
          <div className="current-call">
            <h4>Current Call</h4>
            {activeCall ? (
              <div className="call-info">
                <p className="caller">
                  {activeCall.direction === 'incoming' ? 'From: ' : 'To: '}
                  <span className="phone-number">
                    {activeCall.displayName || formatPhone(activeCall.phone)}
                  </span>
                </p>
                <p className="status">Status: {activeCall.status || 'connected'}</p>
                <div className="call-actions">
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleHangup(activeCallId)}
                  >
                    Hang up
                  </button>
                </div>
              </div>
            ) : (
              <p>No active call selected</p>
            )}
          </div>
          
          {/* Other Calls Display */}
          {Object.keys(activeCalls).length > 1 && (
            <div className="other-calls">
              <h4>Other Calls</h4>
              {Object.entries(activeCalls)
                .filter(([callId]) => callId !== activeCallId)
                .map(([callId, call]) => (
                  <div key={callId} className="other-call">
                    <p className="caller">
                      {call.direction === 'incoming' ? 'From: ' : 'To: '}
                      <span className="phone-number">
                        {call.displayName || formatPhone(call.phone)}
                      </span>
                    </p>
                    <div className="call-actions">
                      <button 
                        className="btn btn-primary mr-2" 
                        onClick={() => handleSwitchCall(callId)}
                      >
                        Switch
                      </button>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => handleHangup(callId)}
                      >
                        Hang up
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CallControls;
