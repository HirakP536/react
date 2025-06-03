import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { formatDuration, formatUSPhone } from "../../../utils/common";
import callActive from "../../../assets/phone/active-call.svg";
import callHold from "../../../assets/phone/hold-call.svg";
// Use receivecall_green_new as the ringing indicator since ringing-call.svg doesn't exist
import receiveCall from "../../../assets/phone/receivecall_green_new.svg";
import closeCallicon from "../../../assets/phone/hang_phone.svg";
import "./MultiLineDisplay.css";

const MultiLineDisplay = ({
  switchToLine,
  hangup,
  holdCall,
  unholdCall,
  acceptCall
}) => {
  const dispatch = useDispatch();
  const [expandedView, setExpandedView] = useState(false);
  
  // Get lines information from Redux
  const activeLineId = useSelector((state) => state.sip.activeLineId);
  const lines = useSelector((state) => state.sip.lines);
  const callDuration = useSelector((state) => state.sip.callDuration);
  
  // Auto-expand the view when multiple lines are active
  useEffect(() => {
    const linesCount = Object.keys(lines).length;
    if (linesCount > 1 && !expandedView) {
      setExpandedView(true);
    }
  }, [lines]);
    // Handle switching between lines and click-to-hold functionality
  const handleLineSwitch = (lineId, lineData) => {
    if (lineId !== activeLineId) {
      // Switch to this line if it's not the active one
      console.log(`Switching to line ${lineId}`);
      try {
        switchToLine(lineId);
      } catch (error) {
        console.error(`Error switching to line ${lineId}:`, error);
      }
    } else if (!lineData.ringing) {
      // Toggle hold state if clicking on the already active line (click-to-hold functionality)
      // This replaces the need for a separate hold button in the UI
      console.log(`Toggle hold state for active line ${lineId}, currently ${lineData.onHold ? 'on hold' : 'active'}`);
      if (lineData.onHold) {
        unholdCall(lineId);
      } else {
        holdCall(lineId);
      }
    }
  };
    
  // These functions are now implemented directly in the button click handlers
  // Handle accepting a ringing call
  const handleAcceptCall = (e) => {
    e.stopPropagation(); // Prevent triggering the line switch
    console.log("Accepting call from handleAcceptCall function");
    acceptCall();
  };
  
  // Toggle expanded view
  const toggleExpandView = () => {
    setExpandedView(prev => !prev);
  };
  
  // Check if there are any active lines
  const hasActiveLines = Object.keys(lines).length > 0;
  const linesCount = Object.keys(lines).length;
  
  console.log("MultiLineDisplay - Active lines:", Object.keys(lines), "Active line ID:", activeLineId);
  
  if (!hasActiveLines) {
    return null; // Don't render anything if there are no active lines
  }
  
  return (
    <div className={`multiline-display ${expandedView ? 'expanded' : ''}`}>
      <div className="multiline-header">
        <h3 className="text-sm font-medium">Active Lines ({linesCount})</h3>
        <button 
          onClick={toggleExpandView} 
          className="expand-toggle"
        >
          {expandedView ? 'Collapse' : 'Expand'}
        </button>
      </div>
      <div className={`multiline-container ${expandedView ? 'multiline-container-expanded' : 'multiline-container-collapsed'}`}>
        {Object.entries(lines).map(([lineId, lineData]) => {
          const isActive = Number(lineId) === activeLineId;
          const formattedNumber = lineData.phone ? formatUSPhone(lineData.phone) : "Unknown";
          const displayName = lineData.displayName || "Unkowmn";
          const numLineId = Number(lineId);
          const isRinging = lineData.ringing === true;
          
          return (            <div 
              key={lineId} 
              className={`line-item ${isActive ? 'active' : ''} ${lineData.onHold ? 'on-hold' : ''} ${isRinging ? 'ringing' : ''}`}
              onClick={() => handleLineSwitch(numLineId, lineData)}
              title={isActive && !isRinging ? "Click to toggle hold state" : "Click to select line"}
            >
              <div className="line-content">
                <div className="line-indicator">
                  <span className={`line-badge ${isActive ? 'active-badge' : ''}`}>
                    Line {lineId}
                  </span>
                  <div className="line-status">
                    <span className={`status-dot ${
                      isRinging ? 'ringing-dot' : lineData.onHold ? 'hold-dot' : 'active-dot'
                    }`}></span>
                    <span className="status-text">
                      {isRinging ? 'Ringing' : lineData.onHold ? 'On Hold' : 'Active'}
                    </span>
                  </div>
                  <img 
                    src={isRinging ? receiveCall : (lineData.onHold ? callHold : callActive)} 
                    alt={isRinging ? "Ringing" : (lineData.onHold ? "On Hold" : "Active Call")} 
                    title={isRinging ? "Ringing" : (lineData.onHold ? "On Hold" : "Active Call")}
                    className={isRinging ? "ringing-icon" : ""}
                  />
                </div>
                <div className="line-details">
                  <span className="line-name"></span>
                  {/* <span className="line-number"></span> */}
                  <div className="line-status-indicators">
                    <span className="line-direction">{lineData.direction === "incoming" ? "Incoming" : "Outgoing"}</span>
                    {lineData.muted && <span className="line-muted-indicator">Muted</span>}
                  {isActive && !isRinging && <span className="line-duration">{formatDuration(callDuration)}</span>}
                  </div>
                </div>
              </div>
              <div className="line-actions">
                {isRinging ? (
                  <>
                    <button 
                      className="line-answer-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("Accepting call from MultiLineDisplay");
                        acceptCall();
                      }}
                      aria-label="Answer"
                      title="Answer call"
                    >
                      <img src={receiveCall} alt="Answer" width="20" />
                    </button>
                    <button 
                      className="line-hangup-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(`Rejecting incoming call on line ${numLineId}`);
                        hangup(numLineId);
                      }}
                      aria-label="Reject"
                      title="Reject call"
                    >
                      <img src={closeCallicon} alt="Reject" width="20" />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="line-hangup-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(`Hanging up line ${numLineId}`);
                        hangup(numLineId);
                      }}
                      aria-label="Hang up"
                      title="Hang up"
                    >
                      <img src={closeCallicon} alt="Hang up" width="20" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <style>
        {`
        .multiline-display {
          margin-bottom: 1rem;
          background-color: #f8f9fa;
          padding: 1rem;
          border-radius: 0.75rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border: 1px solid #e0e0e0;
          position: relative;
          overflow: hidden;
        }
        
        .multiline-display::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(to right, #1976d2, #64b5f6);
        }
        
        .multiline-display.expanded .line-item {
          padding: 0.75rem;
        }
        
        .multiline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .expand-toggle {
          font-size: 0.75rem;
          color: #1976d2;
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px 8px;
          border-radius: 4px;
        }
        
        .expand-toggle:hover {
          background-color: #e3f2fd;
        }
        
        .multiline-container {
          overflow-y: auto;
          transition: max-height 0.3s ease;
        }
        
        .multiline-container-expanded {
          max-height: 300px;
        }
        
        .multiline-container-collapsed {
          max-height: 150px;
        }
     
        
        .line-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          border-radius: 0.25rem;
          background-color: white;
          cursor: pointer;
          border: 1px solid #e5e5e5;
          transition: all 0.2s ease;
        }
        
        .line-item:hover {
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .line-item.active {
          border-color: #1976d2;
          background-color: #e3f2fd;
        }
        
        .line-item.on-hold {
          border-style: dashed;
          background-color: #fff9e6;
          border-color: #FFA000;
        }
        
        .line-content {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        
        .line-indicator {
          display: flex;
          align-items: center;
          font-size: 0.75rem;
          font-weight: 500;
          color: #666;
          margin-bottom: 0.25rem;
        }
          .line-badge {
          background-color: #f0f0f0;
          padding: 2px 8px;
          border-radius: 10px;
          margin-right: 8px;
          font-size: 0.7rem;
        }
        
        .line-badge.active-badge {
          background-color: #1976d2;
          color: white;
        }
        
        .line-status {
          display: flex;
          align-items: center;
          margin-right: 8px;
          font-size: 0.7rem;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 4px;
        }
        
        .active-dot {
          background-color: #4caf50;
          box-shadow: 0 0 4px rgba(76, 175, 80, 0.5);
        }
        
        .hold-dot {
          background-color: #ff9800;
          box-shadow: 0 0 4px rgba(255, 152, 0, 0.5);
        }
        
        .ringing-dot {
          background-color: #2196f3;
          box-shadow: 0 0 4px rgba(33, 150, 243, 0.5);
          animation: pulse 1s infinite;
        }
        
        .status-text {
          color: #666;
          font-weight: 500;
        }
        
        .line-indicator img {
          width: 12px;
          height: 12px;
          margin-left: 0.5rem;
        }
        
        .line-details {
          display: flex;
          flex-direction: column;
        }
        
        .line-name {
          font-weight: 500;
        }
          .line-number {
          font-size: 0.75rem;
          color: #666;
        }
          .line-status-indicators {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }
        
        .line-direction {
          font-size: 0.7rem;
          color: #757575;
          padding: 2px 6px;
          background-color: #f5f5f5;
          border-radius: 4px;
          display: inline-block;
        }
        
        .line-muted-indicator {
          font-size: 0.7rem;
          color: #ffffff;
          padding: 2px 6px;
          background-color: #e53935;
          border-radius: 4px;
          display: inline-block;
        }
        
        .line-duration {
          font-size: 0.75rem;
          color: #1976d2;
          margin-top: 0.25rem;
          font-weight: bold;
        }
        
        .line-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .line-hangup-btn {
          
          color: white;
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .line-hangup-btn:hover {
          
          transform: scale(1.5);
        }
        
        .line-answer-btn {
          color: white;
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .line-answer-btn:hover {
          transform: scale(1.5);
        }
        `}
      </style>
    </div>
  );
};

export default MultiLineDisplay;
