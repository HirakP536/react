import { useSelector } from "react-redux";
import { Navigate } from "react-router";

const PrivateRoute = ({ children }) => {
  // Get accessToken from Redux store
  const accessToken = useSelector((state) => state?.auth?.user?.data?.accessToken);

  // If no valid accessToken, redirect to login
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  // If accessToken exists, render the child components
  return children;
};

export default PrivateRoute;