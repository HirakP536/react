import RightArrow from "../../assets/auth/righticon.svg";
import Loader from "../../skeleton/Loader";

const LoginButton = ({
  disabled,
  type = "submit",
  buttonText = "Submit",
  onClick = () => {},
  className,
  isLoading,
  isFormValid,
}) => {
  // Safely handle isFormValid function
  const checkFormValid = () => {
    if (typeof isFormValid === "function") {
      return isFormValid();
    }
    return true;
  };


  // Handle button click for both button and submit types
  const handleButtonClick = (e) => {
    if (type === "button") {
      onClick(e);
    } else {
      console.log("Submit button clicked - form will handle submission");
      // For submit buttons, the form's onSubmit will handle it
    }
  };

  return (
    <button
      type={type}
      onClick={handleButtonClick}
      disabled={disabled || isLoading}
      className={`relative flex items-center justify-between w-full sm:h-[50px] h-9 sm:max-w-36 max-w-28 ${className} !text-white sm:text-sm text-xs !font-medium pl-5 pr-1.5 rounded-3xl`}
    >
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {buttonText}
          <span
            className={`flex items-center justify-center rounded-full bg-secondary w-7 h-7 ${
              !checkFormValid() ? "bg-secondary" : "bg-secondary-light"
            }`}
          >
            <img src={RightArrow} alt="ihs" className="max-w-4" />
          </span>
        </>
      )}
    </button>
  );
};

export default LoginButton;
