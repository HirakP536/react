/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { forgotPassword, resendApiHandler } from "../../api/authApi";
import { Link } from "react-router";

const ResendTimer = () => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isApiCalled, setIsApiCalled] = useState(false);
  const uuid = useSelector((state) => state.auth?.uuid);

  useEffect(() => {
    if (timeLeft === 0 && !isApiCalled) {
      resendApiHandler(uuid);
      setIsApiCalled(true);
      return;
    }

    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, isApiCalled]);

  const email = useSelector((state) => state.auth?.email);
  const handleResend = async () => {
    let payload = {
      email: email,
    };
    try {
      const response = await forgotPassword(payload);
      setTimeLeft(60); // Reset the timer to 60 seconds
      setIsApiCalled(false); // Allow API to be called again
      return response;
    } catch (error) {
      console.error(error);
    }
  };

  return timeLeft > 0 ? (
    <p className="!font-semibold !text-secondary">{timeLeft}s</p>
  ):(
    <Link
      to="#"
      className="text-sm !text-secondary flex items-center"
      onClick={handleResend}
    >Resend OTP</Link>
  );
};

export default ResendTimer;
