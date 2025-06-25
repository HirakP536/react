/**
 * In-memory registry for SIP sessions that persists for the lifetime of the application
 */
const sipSessionRegistry = {};

/**
 * Utility object to manage SIP sessions
 */
export const SipSessionRegistry = {
  /**
   * Store a session in the registry
   * @param {string} sessionId - Unique identifier for the session
   * @param {Object} session - SIP.js Session object
   */
  set(sessionId, session) {
    sipSessionRegistry[sessionId] = session;
  },
  
  /**
   * Retrieve a session from the registry
   * @param {string} sessionId - Unique identifier for the session
   * @returns {Object|undefined} The SIP.js Session or undefined if not found
   */
  get(sessionId) {
    return sipSessionRegistry[sessionId];
  },
  
  /**
   * Remove a session from the registry
   * @param {string} sessionId - Unique identifier for the session
   */
  remove(sessionId) {
    delete sipSessionRegistry[sessionId];
  },
  
  /**
   * Clear all sessions from the registry
   */
  clear() {
    Object.keys(sipSessionRegistry).forEach(key => delete sipSessionRegistry[key]);
  },
  
  /**
   * Get all sessions from the registry
   * @returns {Object} A copy of all sessions
   */
  getAll() {
    return { ...sipSessionRegistry };
  }
};
