import { Link } from "react-router";
import ErrorImg from "../../assets/auth/Error.svg";
import Logo from "../../assets/auth/logo.png";
const Error = () => {
  return (
    <div className="relative flex w-full flex-col items-center justify-center bg-[#f2f8ff] h-screen">
      <Link to="/" className="absolute top-3.5 left-3.5">
        <img
          src={Logo}
          alt="Login"
          className="mix-blend-multiply max-w-28 h-auto"
        />
      </Link>
      <div className="max-w-[400px] w-full">
        <img src={ErrorImg} alt="error" className="max-w-full h-auto" />
      </div>
      <Link to="/login" className="text-base !font-semibold !text-secondary">
        Back to Login
      </Link>
    </div>
  );
};

export default Error;
