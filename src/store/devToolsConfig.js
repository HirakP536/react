/**
 * Redux DevTools configuration for Vite
 */
const devToolsConfig = {
  // Enable DevTools in all environments for debugging
  enabled: true,
  // Set trace to true for more detailed action traces
  trace: true,
  // Limit the history to prevent memory issues
  maxAge: 25,
  // You can customize more options here
  // See: https://github.com/reduxjs/redux-devtools-extension/blob/master/docs/API/Arguments.md
};

export default devToolsConfig;
