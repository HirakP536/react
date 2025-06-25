import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router";
import { loginUser } from "../../api/authApi";
import AuthImg from "../../assets/auth/auth.gif";
import Logo from "../../assets/auth/logo.png";
import { InputComponent } from "../../components/common/InputComponent";
import LoginButton from "../../components/common/LoginButton";
import { errorToast } from "../../components/common/ToastContainer";
import { validationSchema } from "../../schemas/authSchema";
import {
  setCompanyCode,
  setCompanyExtension,
  setCompanyName,
  setNewUser,
  setUser,
} from "../../store/slices/authSlice";
import housetonLogo from "../../assets/houston.png";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import { fetchIpAddress } from "../../store/slices/ipAddressSlice";

const LoginComponent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const { ip } = useSelector((state) => state.ipAddress);

  useEffect(() => {
    if (!ip) {
      dispatch(fetchIpAddress());
    }
  }, [dispatch, ip]);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        if (!executeRecaptcha) {
          console.warn("reCAPTCHA not yet available");
          errorToast("Error verifying security check. Please try again.");
          setIsLoading(false);
          return;
        }

        const recaptchaToken = await executeRecaptcha("login");
        let userIp = ip;
        let payload = {
          ...values,
          recaptchaToken,
          ipAddress: userIp,
        };
        const res = await loginUser(payload);
        dispatch(setUser(res?.data));
        dispatch(setCompanyName(res?.data?.data?.company?.companyName));
        dispatch(setCompanyCode(res?.data?.data?.company?.code));
        dispatch(setCompanyExtension(res?.data?.data?.extension[0]?.extname));
        localStorage.setItem("token", res?.data?.data?.accessToken);
        const isNewUser = res?.data?.new_user;
        dispatch(setNewUser(isNewUser));
        if (isNewUser) {
          navigate("/confirm-password");
        } else {
          navigate("/");
        }
      } catch (err) {
        console.error(err);
        errorToast(err?.response?.data?.error);
      } finally {
        setIsLoading(false);
      }
    },
  });

  const isFormValid = () => {
    return (
      formik.values.email &&
      formik.values.password &&
      !Object.keys(formik.errors).length
    );
  };

  return (
    <section className="sm:bg-white bg-[#f2f8ff] sm:h-full h-screen overflow-hidden">
      <Link to="/" className="absolute sm:hidden block left-3.5 top-3.5">
        <img
          src={Logo}
          alt="Login"
          className="mix-blend-multiply max-w-28 h-auto"
        />
      </Link>
      <div className="w-full sm:h-screen h-full flex relative overflow-hidden">
        <div className="relative w-1/2 sm:flex hidden items-center justify-center bg-[#f2f8ff]">
          <Link to="/" className="absolute top-3.5 left-3.5">
            <img
              src={Logo}
              alt="Login"
              className="mix-blend-multiply max-w-28 h-auto"
            />
          </Link>
          <img
            src={AuthImg}
            alt="Login"
            className="mix-blend-multiply max-w-full h-auto"
          />
          <footer className="absolute bottom-0 left-0 w-full p-4">
            <small className="flex items-center justify-center text-xs text-gray-500 mt-4">
              Powered by{" "}
              <img
                src={housetonLogo}
                className="inline-block mx-1.5 max-w-4 h-auto"
                alt="Infotech Houston"
              />{" "}
              <b>Infotech Houston Solutions</b>
            </small>
          </footer>
        </div>
        <div className="sm:w-1/2 w-full flex items-center justify-center">
          <div className="relative max-w-lg w-full bg-white p-4">
            <h1 className="sm:text-3xl text-xl mb-1">Welcome Back</h1>
            <p className="sm:text-base text-sm mb-4">
              Login by entering the information below
            </p>
            <div className="border-[1px] border-[#e0e7ff] rounded-lg p-5">
              <form onSubmit={formik.handleSubmit}>
                <InputComponent
                  name="email"
                  type="email"
                  placeholder="Email"
                  label="Email Address"
                  value={formik.values.email}
                  handleChange={formik.handleChange}
                  handleBlur={formik.handleBlur}
                  touched={formik.touched.email}
                  error={formik.errors.email}
                />
                <InputComponent
                  name="password"
                  type="password"
                  placeholder="Password"
                  label="Password"
                  value={formik.values.password}
                  handleChange={formik.handleChange}
                  handleBlur={formik.handleBlur}
                  touched={formik.touched.password}
                  error={formik.errors.password}
                />
                <div className="flex items-center justify-between mt-4">
                  <LoginButton
                    disabled={!isFormValid()}
                    isFormValid={isFormValid}
                    isLoading={isLoading}
                    className={
                      !isFormValid()
                        ? "bg-secondary-light disabled cursor-not-allowed"
                        : "bg-secondary cursor-pointer"
                    }
                  />
                  <div className="flex items-center justify-between">
                    <Link
                      to="/forgot-password"
                      className="sm:text-sm text-xs !text-secondary"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Login = () => {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={import.meta.env.VITE_GOOGLE_CAPTCHA_SITE_KEY}
    >
      <LoginComponent />
    </GoogleReCaptchaProvider>
  );
};

export default Login;
