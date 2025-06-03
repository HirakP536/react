let sharedUserAgentRef = null;

function useSipAgentRef() {
  if (!sharedUserAgentRef) {
    sharedUserAgentRef = { current: null };
  }
  return { userAgentRef: sharedUserAgentRef };
}


export default useSipAgentRef;