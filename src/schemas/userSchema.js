import * as Yup from "yup";

// Default export as a function with a mode parameter
export const getUserSchema = (mode = "add") => {
  const isEditMode = mode === "edit";

  return Yup.object().shape({
    firstName: Yup.string().required("First name is required"),
    lastName: Yup.string(),
    email: Yup.string().email("Invalid email").required("Email is required"),
    userType: Yup.string().required("User type is required"),
    company: Yup.string(),
    companyName: Yup.string(),
    timeZone: Yup.string().required("SIP Domain is required"),
    password: isEditMode
      ? Yup.string()
      : Yup.string(),
    extensions: Yup.array()
      .of(
        Yup.object().shape({
          extname: Yup.string().required("Extension is required"),
          password: Yup.string().required("Extension password is required"),
          phones: Yup.array().of(
            Yup.object().shape({
              label: Yup.string(),
              phone: Yup.string(),
              is_primary: Yup.boolean(),
            })
          ),
        })
      )
      .min(1, "At least one extension is required"),
    dids: Yup.array()
      .of(
        Yup.object().shape({
          label: Yup.string(),
          phone: Yup.string(),
        })
      )
      .min(1, "At least one DID is required") // Make DIDs required
      .required("Please select at least one DID"),
    is_active: Yup.boolean(),
  });
};

// Also export a default schema for direct use
export default getUserSchema;