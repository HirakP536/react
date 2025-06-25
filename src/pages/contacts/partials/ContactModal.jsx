import { useFormik } from "formik";
import { useState } from "react";
import { Link } from "react-router";
import { addContact, updateContact } from "../../../api/contact";
import closeIcon from "../../../assets/dashboard/close-drawer.png";
import {
  CommonDropdown,
  InputComponent,
} from "../../../components/common/InputComponent";
import LoginButton from "../../../components/common/LoginButton";
import {
  errorToast,
  successToast,
} from "../../../components/common/ToastContainer";
import { contactSchema } from "../../../schemas/authSchema";
import { formatUSPhone } from "../../../utils/common";

const ContactModal = ({
  setIsOpen,
  isOpen,
  contactHandler,
  editContact,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const initialValues = {
    firstName: editContact?.firstName || "",
    lastName: editContact?.lastName || "",
    contactPhone: editContact?.contactPhone || "",
    email: editContact?.email || "",
    deviceType: "web", // Default value,
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema: contactSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        let response;
        if (editContact) {
          response = await updateContact(editContact.id,values);
          successToast("Contact updated successfully");
        } else {
          response = await addContact(values);
          successToast("Contact added successfully");
        }
        formik.resetForm();
        setIsOpen(false);
        contactHandler();
        if (onClose) onClose();
        return response;
      } catch (error) {
        console.error("Error", error);
        errorToast(error?.response?.data?.error);
      } finally {
        setIsLoading(false);
      }
    },
  });

  const isFormValid = () => {
    return (
      formik.values.firstName &&
      formik.values.contactPhone &&
      !Object.keys(formik.errors)?.length
    );
  };

  const handleContactPhoneChange = (e) => {
    const formatted = formatUSPhone(e.target.value);
    formik.setFieldValue("contactPhone", formatted);
  };

  return (
    <div
      className={`fixed top-0 right-0 w-full max-w-[500px] h-full bg-white z-[999] rounded-l-2xl ${
        isOpen ? "translate-x-[0%]" : "translate-x-[100%]"
      } transition-transform duration-300 ease-in-out`}
      style={{
        boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.1)",
        pointerEvents: isOpen ? "auto" : "none",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4 border-b-[1px] border-gray-200 pb-2">
          <h2 className="text-lg font-semibold">
            {editContact ? "Edit Contact" : "Add Contact"}
          </h2>
          <Link
            to="#"
            onClick={() => {
              setIsOpen(false);
              if (onClose) onClose();
            }}
          >
            <img
              src={closeIcon}
              alt=""
              className="cursor-pointer"
              onClick={() => {
                setIsOpen(false);
                if (onClose) onClose();
              }}
            />
          </Link>
        </div>
        <form onSubmit={formik.handleSubmit}>
          <div className="flex gap-4 mb-4">
            <div className="mb-0">
              <InputComponent
                name="firstName"
                type="text"
                placeholder="Enter first name"
                label="First Name"
                value={formik.values.firstName}
                handleChange={formik.handleChange}
                handleBlur={formik.handleBlur}
                touched={formik.touched.firstName}
                error={formik.errors.firstName}
              />
            </div>
            <div className="mb-0">
              <InputComponent
                name="lastName"
                type="text"
                placeholder="Enter last name"
                label="Last Name"
                value={formik.values.lastName}
                handleChange={formik.handleChange}
                handleBlur={formik.handleBlur}
                touched={formik.touched.lastName}
                error={formik.errors.lastName}
              />
            </div>
          </div>
          <div className="flex gap-4 mb-4">
            <div className="mb-0">
              <InputComponent
                name="email"
                type="email"
                placeholder="Enter email"
                label="Email"
                value={formik.values.email}
                handleChange={formik.handleChange}
                handleBlur={formik.handleBlur}
                touched={formik.touched.email}
                error={formik.errors.email}
              />
            </div>
            <div className="mb-0">
              <InputComponent
                name="contactPhone"
                type="text"
                placeholder="Enter contact number"
                label="Contact Number"
                value={formik.values.contactPhone}
                handleChange={handleContactPhoneChange}
                handleBlur={formik.handleBlur}
                touched={formik.touched.contactPhone}
                error={formik.errors.contactPhone}
                maxLength={14}
              />
            </div>
          </div>
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
        </form>
      </div>
    </div>
  );
};

export default ContactModal;
