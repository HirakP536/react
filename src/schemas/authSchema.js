import * as Yup from "yup";

// This schema is used for validating the login form
// It checks if the email is a valid email format and if the password is at least 6 characters long
export const validationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

// This schema is used for validating the forgot password form
export const forgotValidationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
});

// This schema is used for validating the confirm password form
export const confirmSchema = Yup.object({
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm Password is required"),
});

// This schema is used for validating the contact form
export const contactSchema = Yup.object({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string(),
  email: Yup.string().email("Invalid email address"),
  contactPhone: Yup.string().required("Contact number is required"),
  deviceType: Yup.string().oneOf(["desktop", "ios","web","android"]),
});


