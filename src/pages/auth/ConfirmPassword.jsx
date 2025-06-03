import { useFormik } from "formik";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router";
import { forgotPassword, resendApiHandler } from "../../api/authApi";
import AuthImg from "../../assets/auth/auth.gif";
import Logo from "../../assets/auth/logo.png";
import {
  InputComponent,
  OTPInputComponent,
} from "../../components/common/InputComponent";
import LoginButton from "../../components/common/LoginButton";
import ResendTimer from "../../components/common/ResendTimer";
import {
  errorToast,
  successToast,
} from "../../components/common/ToastContainer";
import { confirmSchema } from "../../schemas/authSchema";
import { setOTPVerified } from "../../store/slices/authSlice";
import housetonLogo from "../../assets/houston.png";

const ConfirmPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [touched, setTouched] = useState(false);
  const email = useSelector((state) => state.auth?.email);
  const OTPVerified = useSelector((state) => state.auth?.OTPVerified);
  const uuid = useSelector((state) => state.auth?.uuid);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    if (index === null) {
      setOtp(value);
    } else {
      newOtp[index] = value;
      setOtp(newOtp);
    }
  };
  const handleBlur = () => {
    setTouched(true);
  };

  const verifyOtp = async () => {
    setIsLoading(true);
    try {
      const otpValue = otp.join("");
      let paylaod = {
        email: email,
        otp: otpValue,
      };
      const response = await forgotPassword(paylaod);
      await resendApiHandler(uuid);
      dispatch(setOTPVerified(true));
      return response;
    } catch (error) {
      console.error(error);
      errorToast(error?.response?.data?.error);
    } finally {
      setIsLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      email: email,
      password: "",
    },
    validationSchema: confirmSchema,
    onSubmit: async (values) => {
      const { email, password } = values;
      setIsLoading(true);
      try {
        const response = await forgotPassword({ email, password });
        successToast("Password changed successfully");
        setTimeout(() => {
          dispatch(setOTPVerified(false));
          navigate("/login");
        }, 3000);
        return response;
      } catch (error) {
        console.error(error);
        errorToast(error?.response?.data?.error);
      } finally {
        setIsLoading(false);
      }
    },
  });

  const isFormValid = () => {
    if (!OTPVerified) {
      return otp.join("").length === 6;
    }
    return (
      formik.values.password &&
      formik.values.confirmPassword &&
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
              <b>Infotech Houston</b>
            </small>
          </footer>
        </div>
        <div className="sm:w-1/2 w-full flex items-center justify-center">
          <div className="relative max-w-lg w-full bg-white p-4">
            <h1 className="sm:text-3xl text-xl mb-1">
              Complete Your Account Setup
            </h1>
            <p className="sm:text-base text-sm mb-4">
              {OTPVerified
                ? "Create a password to Get Started"
                : "Enter the OTP sent to your email"}
            </p>
            <div className="border-[1px] border-[#e0e7ff] rounded-lg p-5">
              <form
                onSubmit={
                  OTPVerified ? formik.handleSubmit : (e) => e.preventDefault()
                }
              >
                {!OTPVerified && (
                  <OTPInputComponent
                    value={otp}
                    handleChange={handleOtpChange}
                    handleBlur={handleBlur}
                    error={
                      otp.join("").length < 6 ? (
                        <p className="mt-1 !text-sm !text-red-500">
                          Invalid OTP
                        </p>
                      ) : (
                        ""
                      )
                    }
                    touched={touched}
                  />
                )}

                {OTPVerified && (
                  <>
                    <InputComponent
                      name="password"
                      type="password"
                      placeholder="New password"
                      label="New Password"
                      value={formik.values.password}
                      handleChange={formik.handleChange}
                      handleBlur={formik.handleBlur}
                      touched={formik.touched.password}
                      error={formik.errors.password}
                    />
                    <InputComponent
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm Password"
                      label="Confirm Password"
                      value={formik.values.confirmPassword}
                      handleChange={formik.handleChange}
                      handleBlur={formik.handleBlur}
                      touched={formik.touched.confirmPassword}
                      error={formik.errors.confirmPassword}
                    />
                  </>
                )}

                <div className="flex items-center justify-between mt-4">
                  <LoginButton
                    type={OTPVerified ? "submit" : "button"}
                    onClick={!OTPVerified ? verifyOtp : undefined}
                    buttonText={OTPVerified ? "Submit" : "Verify"}
                    disabled={!isFormValid()}
                    isFormValid={isFormValid}
                    isLoading={isLoading}
                    className={
                      !isFormValid()
                        ? "bg-secondary-light disabled cursor-not-allowed"
                        : "bg-secondary cursor-pointer"
                    }
                  />
                  {!OTPVerified && (
                    <div className="flex items-center justify-between mt-4">
                      <ResendTimer />
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConfirmPassword;
