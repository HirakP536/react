import React from 'react';
import { useSelector } from 'react-redux';
import useCallData from '../../hooks/useCallData';

// This component shows how to use the callData anywhere in your app
const CallDataAccessDemo = () => {
  const { activeCalls, lastActiveCallId, activateCall, terminateCall } = useCallData();
  
  // Check if we have any active calls
  const hasActiveCalls = Object.keys(activeCalls).length > 0;
  
  // Get the active call
  const activeCall = lastActiveCallId ? activeCalls[lastActiveCallId] : null;
  
  // Handle switching between calls
  const handleSwitchCall = (callId) => {
    activateCall(callId);
  };
  
  // Handle ending a call
  const handleHangup = (callId) => {
    terminateCall(callId);
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
  
  // Component to display when no calls are active
  const NoCallsView = () => (
    <div className="no-calls-container">
      <p>No active calls</p>
    </div>
  );
  
  // Component to display when calls are active
  const ActiveCallsView = () => (
    <div className="active-calls-container">
      <div className="active-call">
        <h3>Current Call</h3>
        {activeCall ? (
          <div className="call-info">
            <p>
              <strong>{activeCall.direction === 'incoming' ? 'From: ' : 'To: '}</strong>
              {activeCall.displayName || formatPhone(activeCall.phone)}
            </p>
            <p>
              <strong>Status: </strong>
              {activeCall.status || 'connected'}
            </p>
            <button onClick={() => handleHangup(lastActiveCallId)}>Hang up</button>
          </div>
        ) : (
          <p>No active call selected</p>
        )}
      </div>
      
      {Object.keys(activeCalls).length > 1 && (
        <div className="other-calls">
          <h3>Other Calls</h3>
          {Object.entries(activeCalls)
            .filter(([callId]) => callId !== lastActiveCallId)
            .map(([callId, call]) => (
              <div key={callId} className="other-call">
                <p>
                  {call.direction === 'incoming' ? 'From: ' : 'To: '}
                  {call.displayName || formatPhone(call.phone)}
                </p>
                <div className="call-actions">
                  <button onClick={() => handleSwitchCall(callId)}>Switch to</button>
                  <button onClick={() => handleHangup(callId)}>Hang up</button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
  
  return (
    <div className="call-data-demo">
      <h2>Call Controls</h2>
      {hasActiveCalls ? <ActiveCallsView /> : <NoCallsView />}
    </div>
  );
};

export default CallDataAccessDemo;