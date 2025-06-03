import { useEffect, useState } from 'react';
import { requestNotificationPermission } from '../../utils/notifications';

/**
 * Component to handle notification permissions
 * This should be included in the app's main layout
 */
const NotificationPermissionHandler = () => {
  const [permissionRequested, setPermissionRequested] = useState(false);

  useEffect(() => {
    // Check if permission has already been requested in this session
    if (!permissionRequested) {
      const requestPermission = async () => {
        try {
          // Only request permission after user has interacted with the page
          // This is to comply with browser autoplay and notification policies
          const handleUserInteraction = async () => {
            await requestNotificationPermission();
            setPermissionRequested(true);
            
            // Remove event listeners after permission has been requested
            window.removeEventListener('click', handleUserInteraction);
            window.removeEventListener('touchstart', handleUserInteraction);
          };
          
          window.addEventListener('click', handleUserInteraction);
          window.addEventListener('touchstart', handleUserInteraction);
          
          // Clean up event listeners if component unmounts before user interacts
          return () => {
            window.removeEventListener('click', handleUserInteraction);
            window.removeEventListener('touchstart', handleUserInteraction);
          };
        } catch (error) {
          console.error('Error requesting notification permission:', error);
        }
      };
      
      requestPermission();
    }
  }, [permissionRequested]);

  // This component doesn't render anything
  return null;
};

export default NotificationPermissionHandler;
