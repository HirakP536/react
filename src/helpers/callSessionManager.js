
let restoreCallback = null;

export const CallSessionManager = {
  setRestoreCallback(callback) {
    restoreCallback = callback;
  },
  
  restoreSessions() {
    if (typeof restoreCallback === 'function') {
      return restoreCallback();
    }
    return false;
  }
};
