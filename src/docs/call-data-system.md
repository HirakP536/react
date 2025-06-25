# Call Data Management System

This system provides a way to store incoming and outgoing call data with audio channels in Redux (via Context API), making it accessible from any page in the application.

## Implementation Overview

The implementation consists of several key components:

### 1. CallContext (src/contexts/CallContext.jsx)

A React Context that manages:
- Active calls
- Call history
- Audio streams for each call
- Call control functions (answer, hangup, mute, etc.)

### 2. Components

- `FloatingCallControls.jsx`: A reusable component that can be placed on any page to display current call information and controls.
- `CallControls.jsx`: A component that demonstrates how to access call data from any part of the application.

### 3. Integration with SIP

The call context is integrated with the SIP.js library via:
- `useSip.jsx`: Updated to add incoming calls to the CallContext
- `useSipCallIntegration.js`: A hook that bridges SIP session events with our CallContext

## Usage Examples

### Accessing Call Data in Any Component

```jsx
import React from 'react';
import { useCallContext } from '../../contexts/CallContext';

const MyComponent = () => {
  const { 
    activeCalls,
    activeCallId,
    endCall,
    setActiveCall
  } = useCallContext();
  
  // Now you can use call data and functions
  const handleHangup = () => {
    if (activeCallId) {
      endCall(activeCallId);
    }
  };
  
  return (
    <div>
      {Object.keys(activeCalls).length > 0 ? (
        <div>
          <h3>Active Calls: {Object.keys(activeCalls).length}</h3>
          <button onClick={handleHangup}>Hang Up</button>
        </div>
      ) : (
        <p>No active calls</p>
      )}
    </div>
  );
};
```

### Showing Call Controls on Any Page

Simply add the `<FloatingCallControls />` component to any page where you want call controls to appear.

```jsx
import React from 'react';
import FloatingCallControls from '../../components/common/FloatingCallControls';

const MyPage = () => {
  return (
    <div>
      <h1>My Page Content</h1>
      
      {/* Call controls will appear when a call is active */}
      <FloatingCallControls />
    </div>
  );
};
```

## Benefits

1. **Centralized Call Management**: All call data is managed in one place
2. **Persistent Audio Channels**: Calls can continue even when navigating between pages
3. **Easy Access**: Any component can access call data and control functions
4. **Separation of Concerns**: SIP implementation details are abstracted away from UI components

## Architecture Notes

- The system uses React Context API for state management instead of directly using Redux
- Audio stream objects are managed separately since they can't be serialized to Redux
- Each call has a unique ID that can be used to reference it from any component
