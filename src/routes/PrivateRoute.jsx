import { useSelector } from "react-redux";
import { Navigate } from "react-router";

const PrivateRoute = ({ children }) => {
  // Get accessToken and new_user status from Redux store
  const accessToken = useSelector((state) => state?.auth?.user?.data?.accessToken);
  const isNewUser = useSelector((state) => state?.auth?.user?.new_user);

  // If no valid accessToken, redirect to login
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  
  // If user is new and has token, they should complete account setup
  if (isNewUser) {
    return <Navigate to="/confirm-password" replace />;
  }

  // If accessToken exists and not a new user, render the child components
  return children;
};

export default PrivateRoute;