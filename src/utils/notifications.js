/**
 * Utility functions for handling browser notifications
 */

// Global reference to hold the current call accept function
// This allows the notification click handler to accept the call
let currentAcceptCallFunction = null;

// Global reference to hold the ringtone stop function
// This allows the notification to stop ringtone when closed
let stopRingtoneFunction = null;

/**
 * Set the current accept call function
 * @param {Function} acceptCallFn - Function to call when accepting a call
 */
export const setAcceptCallFunction = (acceptCallFn) => {
  currentAcceptCallFunction = acceptCallFn;
};

/**
 * Clear the current accept call function
 */
export const clearAcceptCallFunction = () => {
  currentAcceptCallFunction = null;
};

/**
 * Set the function to stop ringtone
 * @param {Function} stopRingtoneFn - Function to stop ringtone
 */
export const setStopRingtoneFunction = (stopRingtoneFn) => {
  stopRingtoneFunction = stopRingtoneFn;
};

/**
 * Clear the ringtone stop function
 */
export const clearStopRingtoneFunction = () => {
  stopRingtoneFunction = null;
};

// Request permission for displaying notifications
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return false;
  let permission = Notification.permission;
  if (permission !== "granted" && permission !== "denied") {
    permission = await Notification.requestPermission();
  }
  return permission === "granted";
};

// Show a notification for incoming call
export const showIncomingCallNotification = async (callerName, callerNumber) => {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return null;

    // Default caller name if none provided
    const displayName = callerName || "Unknown caller";
    const displayNumber = callerNumber || ""; 
    const notification = new Notification("Incoming Call", {
      body: `${displayName} ${displayNumber ? `(${displayNumber})` : ""} is calling you. Click to answer.`,
      icon: "/src/assets/favicon-32x32.png",
      requireInteraction: true,
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
      
     
      if (typeof currentAcceptCallFunction === 'function') {
        currentAcceptCallFunction();
      } else {
        console.warn('No notification click handler available');
      }
    };
    if ('onclose' in notification) {
      notification.onclose = () => {
        if (typeof stopRingtoneFunction === 'function') {
          stopRingtoneFunction();
        }
      };
    }
    setTimeout(() => {
      notification.close();
    }, 30000);

    return notification;
  } catch (error) {
    console.error("Error showing notification:", error);
    return null;
  }
};

// Show a notification for missed call
export const showMissedCallNotification = async (callerName, callerNumber) => {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return null;

    const displayName = callerName || "Unknown caller";
    const displayNumber = callerNumber || "";

    const notification = new Notification("Missed Call", {
      body: `You missed a call from ${displayName} ${displayNumber ? `(${displayNumber})` : ""}`,
      icon: "/src/assets/favicon-32x32.png",
    });
    notification.onclick = () => {
      window.focus();
      
      try {
        const callbackNumber = callerNumber || "";
        if (callbackNumber) {
          const callbackEvent = new CustomEvent('missedCallClicked', { 
            detail: { 
              number: callbackNumber,
              name: displayName
            } 
          });
          window.dispatchEvent(callbackEvent);
        }
      } catch (err) {
        console.warn('Error handling missed call notification click:', err);
      }
      
      notification.close();
    };

    setTimeout(() => {
      notification.close();
    }, 10000);

    return notification;
  } catch (error) {
    console.error("Error showing notification:", error);
    return null;
  }
};
