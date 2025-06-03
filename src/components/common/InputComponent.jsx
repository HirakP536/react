import { useEffect, useRef, useState } from "react";
import EyeIcon from "../../assets/auth/view.svg";
import EyeOffIcon from "../../assets/auth/hide.svg";

export const InputComponent = ({
  name,
  type,
  handleChange,
  value,
  placeholder,
  handleBlur,
  label,
  touched,
  error,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  const togglePassword = () => setShowPassword((prev) => !prev);
  return (
    <div className="mb-0 block w-full">
      <label className="block w-full sm:text-sm text-xs !font-semibold">
        {label}
      </label>
      <div className="relative mb-3 flex items-center">
        <input
          id={name}
          name={name}
          type={inputType}
          onChange={handleChange}
          value={value}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`mt-2 block w-full rounded-md border px-3 py-2 sm:text-base text-xs text-gray-900 placeholder-gray-500 focus:outline-none ${
            error && touched
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-[#e0e7ff] focus:border-secondary focus:ring-secondary"
          }`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={togglePassword}
            className="absolute right-3 top-[30px] transform -translate-y-1/2 text-gray-500 focus:outline-none"
          >
            {showPassword ? (
              <img src={EyeOffIcon} alt="" className="w-5" />
            ) : (
              <img src={EyeIcon} alt="" className="w-5" />
            )}
          </button>
        )}
      </div>
      {error && touched && (
        <p className="mt-1 sm:text-sm text-xs !text-red-500">{error}</p>
      )}
    </div>
  );
};

export const OTPInputComponent = ({
  value,
  handleChange,
  handleBlur,
  error,
  touched,
}) => {
  const inputRefs = useRef([]);

  const handleInputChange = (e, index) => {
    const { value } = e.target;
    if (!/^\d*$/.test(value)) return;

    const otp = value.slice(0, 1);
    handleChange(index, otp);
    if (otp && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d{6}$/.test(pastedData)) {
      handleChange(null, pastedData.split(""));
    }
  };

  return (
    <div className="relative mb-3 flex w-full flex-col">
      <label className="block w-full sm:text-sm text-xs !font-semibold mb-3">
        Enter the OTP
      </label>
      <div className="mb-0 flex items-center gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            maxLength="1"
            value={value[index] || ""}
            onChange={(e) => handleInputChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onBlur={handleBlur}
            onPaste={handlePaste}
            className={`w-10 h-10 text-center border rounded-md focus:outline-none sm:text-base text-sm ${
              error && touched
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-secondary focus:ring-secondary"
            }`}
          />
        ))}
      </div>
      {error && touched && (
        <p className="mt-1 sm:text-sm text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export const CommonDropdown = ({
  name,
  label,
  options = [],
  value = [],
  multiple = false,
  onChange,
  error,
  touched,
  customClass = "",
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const isSameValue = (a, b) => {
    if (!a || !b) return false;
    if (typeof a === "object" && typeof b === "object") {
      return a?.phone === b?.phone && a?.label === b?.label;
    }
    return a === b;
  };

  const isSelected = (val) => {
    if (!val) return false;
    if (multiple) {
      return Array.isArray(value) && value.some((v) => isSameValue(v, val));
    }
    return isSameValue(value, val);
  };

  const handleOptionClick = (optionValue) => {
    if (multiple) {
      let newValue = Array.isArray(value) ? [...value] : [];

      if (newValue.some((v) => isSameValue(v, optionValue))) {
        newValue = newValue.filter((v) => !isSameValue(v, optionValue));
      } else {
        newValue.push(optionValue);
      }
      onChange({
        target: {
          name,
          value: newValue,
        },
      });
    } else {
      onChange({
        target: {
          name,
          value: optionValue,
        },
      });
      setOpen(false);
    }
  };

  const displayLabel = () => {
    if (multiple) {
      if (!Array.isArray(value) || value.length === 0) return "Select " + name;
      return value.map((v) => v?.label).join(", ");
    } else {
      return value?.label || "Select " + name;
    }
  };

  return (
    <div className={`relative sm:mb-4 mb-2.5 w-full ${customClass}`} ref={dropdownRef}>
      {label && (
        <label className="block sm:text-sm text-xs font-semibold mb-1">
          {label}
        </label>
      )}

      <div
        className={`w-full border px-3 py-2 rounded-md sm:text-base text-xs cursor-pointer ${
          error && touched
            ? "border-red-500"
            : "border-[#e0e7ff] focus-within:border-secondary"
        }`}
        onClick={() => setOpen(!open)}
      >
        <span className="block truncate text-gray-800">{displayLabel()}</span>
      </div>

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md max-h-60 overflow-auto shadow">
          {options.map((opt) => (
            <div
              key={`${opt.value.phone || opt.value}-${opt.label}`}
              onClick={() => handleOptionClick(opt.value)}
              className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between ${
                isSelected(opt.value)
                  ? "bg-secondary text-white"
                  : "hover:bg-blue-100"
              }`}
            >
              <span className={isSelected(opt.value) && "!text-white"}>
                {opt.label}
              </span>
              {isSelected(opt.value) && (
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}

      {error && touched && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export const CustomDropdown = ({
  name,
  label,
  options,
  value,
  onChange,
  onBlur,
  error,
  touched,
  multiple = false,
  customClass= "",
}) => (
  <CommonDropdown
    name={name}
    label={label}
    options={options}
    value={multiple ? (Array.isArray(value) ? value : []) : value}
    onChange={onChange}
    onBlur={onBlur}
    error={error}
    touched={touched}
    multiple={multiple}
    customClass={customClass}
  />
);
