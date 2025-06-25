/* eslint-disable react-hooks/exhaustive-deps */
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router";
import { forgotPassword, resendApiHandler } from "../../api/authApi";
import AuthImg from "../../assets/auth/auth.gif";
import Logo from "../../assets/auth/logo.png";
import housetonLogo from "../../assets/houston.png";
import {
  InputComponent,
  OTPInputComponent,
} from "../../components/common/InputComponent";
// import LoginButton from "../../components/common/LoginButton";
import LoginButton from "../../components/common/LoginButton";
import ResendTimer from "../../components/common/ResendTimer";
import { errorToast } from "../../components/common/ToastContainer";
import { confirmSchema } from "../../schemas/authSchema";
import { setNewUser, setOTPVerified } from "../../store/slices/authSlice";
import SuccessModal from "./SuccessModal";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import { fetchIpAddress } from "../../store/slices/ipAddressSlice";

const ConfirmPasswordComponent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [touched, setTouched] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const email = useSelector((state) => state?.auth?.user?.data?.email);
  const otpEmail = useSelector((state) => state?.auth?.email);
  const OTPVerified = useSelector((state) => state.auth?.OTPVerified);
  const isNewUser = useSelector((state) => state?.auth?.newUser);
  const uuid = useSelector((state) => state.auth?.uuid);
  const dispatch = useDispatch();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const { ip } = useSelector((state) => state.ipAddress);

  useEffect(() => {
    if (!ip) {
      dispatch(fetchIpAddress());
    }
  }, [dispatch, ip]);

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

  const getValidEmail = () => {
    return email || otpEmail || "";
  };

  const verifyOtp = async () => {
    setIsLoading(true);
    try {
      const validEmail = getValidEmail();
      const otpValue = otp.join("");
      if (!executeRecaptcha) {
        console.warn("reCAPTCHA not yet available");
        errorToast("Error verifying security check. Please try again.");
        setIsLoading(false);
        return;
      }

      const recaptchaToken = await executeRecaptcha("login");
      let userIp = ip;
      let paylaod = {
        email: validEmail,
        otp: otpValue,
        recaptchaToken,
        ipAddress: userIp,
      };

      const response = await forgotPassword(paylaod);
      dispatch(setOTPVerified(true));
      dispatch(setNewUser(true));
      await resendApiHandler(uuid);
      return response;
    } catch (error) {
      errorToast(error?.response?.data?.error);
    } finally {
      setIsLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      email: getValidEmail(),
      password: "",
      confirmPassword: "",
    },
    enableReinitialize: true,
    validateOnChange: true,
    validateOnBlur: true,
    validationSchema: confirmSchema,
    onSubmit: async (values) => {
      const validEmail = getValidEmail();
      const { password } = values;
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
          email: validEmail,
          password: password,
          recaptchaToken,
          ipAddress: userIp,
        };
        const response = await forgotPassword(payload);
        dispatch(setOTPVerified(false));
        setIsOpen(true);
        dispatch(setNewUser(false));
        return response;
      } catch (error) {
        errorToast(error?.response?.data?.error || "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    },
  });

  useEffect(() => {
    const validEmail = getValidEmail();
    if (validEmail && validEmail !== formik.values.email) {
      formik.setFieldValue("email", validEmail);
    }
  }, [email, otpEmail]);

  const isFormValid = () => {
    if (!isNewUser) {
      return otp.join("").length === 6;
    }

    const passwordsMatch =
      formik.values.password === formik.values.confirmPassword;
    const passwordValid =
      formik.values.password && formik.values.password.length >= 6;
    const noErrors = !formik.errors.password && !formik.errors.confirmPassword;
    return passwordsMatch && passwordValid && noErrors;
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
            <h1 className="sm:text-3xl text-xl mb-1">
              Complete Your Account Setup
            </h1>
            <p className="sm:text-base text-sm mb-4">
              {isNewUser
                ? "Create a password to Get Started"
                : "Enter the OTP sent to your email"}
            </p>
            <div className="border-[1px] border-[#e0e7ff] rounded-lg p-5">
              <form
                onSubmit={(e) => {
                  if (isNewUser) {
                    e.preventDefault();
                    formik.handleSubmit(e);
                  } else {
                    e.preventDefault();
                  }
                }}
              >
                {!isNewUser ? (
                  <>
                    <OTPInputComponent
                      value={otp}
                      handleChange={handleOtpChange}
                      handleBlur={handleBlur}
                      error={
                        otp.join("").length < 6 && touched ? (
                          <p className="mt-1 !text-sm !text-red-500">
                            Invalid OTP
                          </p>
                        ) : (
                          ""
                        )
                      }
                      touched={touched}
                    />
                    <div className="flex items-center justify-between mt-4">
                      <LoginButton
                        type="button"
                        onClick={verifyOtp}
                        buttonText="Verify"
                        disabled={!isFormValid()}
                        isFormValid={isFormValid}
                        isLoading={isLoading}
                        className={
                          !isFormValid()
                            ? "bg-secondary-light disabled cursor-not-allowed"
                            : "bg-secondary cursor-pointer"
                        }
                      />
                      <ResendTimer />
                    </div>
                  </>
                ) : (
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

                    <div className="flex items-center justify-between mt-4">
                      {/* Regular submit button */}
                      <LoginButton
                        type="submit"
                        buttonText="Submit"
                        disabled={!isFormValid()}
                        isFormValid={isFormValid}
                        isLoading={isLoading}
                        className={
                          !isFormValid()
                            ? "bg-secondary-light disabled cursor-not-allowed"
                            : "bg-secondary cursor-pointer"
                        }
                      />
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
      {isOpen && <SuccessModal setIsOpen={setIsOpen} />}
    </section>
  );
};

const ConfirmPassword = () => {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={import.meta.env.VITE_GOOGLE_CAPTCHA_SITE_KEY}
    >
      <ConfirmPasswordComponent />
    </GoogleReCaptchaProvider>
  );
};

export default ConfirmPassword;
