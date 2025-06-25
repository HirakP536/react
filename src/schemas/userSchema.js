import * as Yup from "yup";

// Default export as a function with a mode parameter
export const getUserSchema = (mode = 'add') => {
  const isEdit = mode === 'edit';
  return Yup.object().shape({
    firstName: Yup.string().required("First name is required"),
    lastName: Yup.string(),
    email: isEdit 
      ? Yup.string().email("Invalid email")
      : Yup.string().email("Invalid email").required("Email is required"),
    userType: isEdit
      ? Yup.string()
      : Yup.string().required("User type is required"),
    company: Yup.mixed(), // Allow both string and object
    companyName: Yup.string(),
    timeZone: Yup.string().required("SIP Domain is required"),
    password: Yup.string(),
    extensions: Yup.array()
      .of(
        Yup.object().shape({
          extname: Yup.string().required("Extension is required"),
          password: Yup.string().required("Extension password is required"),
          phones: Yup.array()      .of(
            Yup.object().shape({
              id: Yup.number(),
              label: Yup.string(),
              phone: Yup.string(),
              formatedPhone: Yup.string(),
              is_primary: Yup.boolean(),
            })
          ),
        })
      )
      .min(1, isEdit ? 0 : 1, isEdit ? undefined : "At least one extension is required"),
    dids: Yup.array()
      .of(
        Yup.object().shape({
          id: Yup.number(),
          label: Yup.string(),
          phone: Yup.string(),
          formatedPhone: Yup.string(),
          is_primary: Yup.boolean(),
        })
      )
      .min(1, "At least one DID is required")
      .required("Please select at least one DID"),
    is_active: Yup.boolean(),
  });
};

// Also export a default schema for direct use
export default getUserSchema;