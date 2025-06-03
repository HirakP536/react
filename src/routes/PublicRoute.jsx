import { useSelector } from "react-redux";
import { Navigate } from "react-router";

const PublicRoute = ({ children }) => {
  const accessToken = useSelector((state) => state?.auth?.user?.data?.accessToken);
  if (accessToken) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default PublicRoute;