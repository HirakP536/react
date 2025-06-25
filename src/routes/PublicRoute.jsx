import { useSelector } from "react-redux";
import { Navigate } from "react-router";

const PublicRoute = ({ children }) => {
  const accessToken = useSelector((state) => state?.auth?.user?.data?.accessToken);
  const isNewUser = useSelector((state) => state?.auth?.user?.new_user);
  const path = window.location.pathname;
  
  // If user has token and is not a new user, redirect to dashboard
  if (accessToken && !isNewUser) {
    return <Navigate to="/" replace />;
  }
  
  // If user has token, is a new user, but not on confirm-password page
  if (accessToken && isNewUser && path !== "/confirm-password") {
    return <Navigate to="/confirm-password" replace />;
  }
  
  return children;
};

export default PublicRoute;