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
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notifications");
    return false;
  }

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
    const displayNumber = callerNumber || "";    // Create and return the notification
    const notification = new Notification("Incoming Call", {
      body: `${displayName} ${displayNumber ? `(${displayNumber})` : ""} is calling you. Click to answer.`,
      icon: "/favicon.ico", // Use your app logo
      requireInteraction: true, // Keep notification visible until user dismisses it
    });    // Handle notification click - answer the call
    notification.onclick = () => {
      window.focus(); // Focus the window when the notification is clicked
      notification.close();
      
      // Call the accept function directly if available
      // No navigation, just answer the call
      if (typeof currentAcceptCallFunction === 'function') {
        console.log('Executing notification click handler');
        currentAcceptCallFunction();
      } else {
        console.warn('No notification click handler available');
      }
    };

    // Stop ringtone when notification is closed
    if ('onclose' in notification) {
      // Some browsers support onclose event
      notification.onclose = () => {
        console.log('Notification closed, stopping ringtone');
        if (typeof stopRingtoneFunction === 'function') {
          stopRingtoneFunction();
        }
      };
    }

    // Auto close after 30 seconds in case call is missed or handled
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
      icon: "/favicon.ico", // Use your app logo
    });

    // Clicking on a missed call notification could open the call history
    // or dial back the caller directly, depending on your app's functionality
    notification.onclick = () => {
      window.focus();
      
      // Navigate to call history or directly initiate a callback
      // This part depends on your app's navigation or state management
      // For example, you could dispatch a Redux action or navigate to a specific route
      try {
        // If the app has a callback function for handling missed call clicks
        const callbackNumber = callerNumber || "";
        if (callbackNumber) {
          // Dispatch an event that app components can listen for
          const callbackEvent = new CustomEvent('missedCallClicked', { 
            detail: { 
              number: callbackNumber,
              name: displayName
            } 
          });
          window.dispatchEvent(callbackEvent);
          console.log('Dispatched missedCallClicked event with number:', callbackNumber);
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
