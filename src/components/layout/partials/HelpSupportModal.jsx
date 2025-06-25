/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef } from "react";
import { helpSupportSchema } from "../../../schemas/authSchema";
import { ErrorMessage, Field, Form, Formik } from "formik";
import closeIcon from "../../../assets/dashboard/close-drawer.png";
import { useDispatch, useSelector } from "react-redux";
import contactLight from "../../../assets/layout/phonelight.png";
import { Link } from "react-router";
import useSipSession from "../../../hooks/useSipSession";
import {
  resetDialedPhone,
  setDialedPhone,
  setModalOpenFlag,
} from "../../../store/slices/callFeatureSlice";
import { formatUSPhone, normalizePhoneNumber } from "../../../utils/common";
import { getSupportContact } from "../../../api/contact";
import { errorToast, successToast } from "../../common/ToastContainer";

const HelpSupportModal = ({ show, onClose }) => {
  const modalRef = useRef(null);
  const userData = useSelector((state) => state?.auth?.user?.data);
  const selectedCallerId = useSelector(
    (state) => state.callFeature.selectedCallerId
  );
  const activeLineId = useSelector((state) => state.sip.activeLineId);
  const lines = useSelector((state) => state.sip.lines);
  const { makeCall, sessionRef } = useSipSession();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!sessionRef.current) {
      dispatch(resetDialedPhone());
      dispatch(setModalOpenFlag(false));
    }
  }, [sessionRef.current, dispatch]);

  if (!show) return null;

  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const handleCall = (phoneNumber) => {
    let numberToCall = normalizePhoneNumber(selectedCallerId);
    let dialedPhone = phoneNumber;
    const hasActiveCallThatWillBeHeld =
      activeLineId !== null &&
      lines[activeLineId] &&
      !lines[activeLineId].onHold &&
      !lines[activeLineId].ringing;
    const lineId = makeCall({
      phone: dialedPhone,
      selectedNumber: numberToCall,
    });
    onClose();

    if (lineId) {
      dispatch(setDialedPhone(dialedPhone));
      if (hasActiveCallThatWillBeHeld) {
        console.warn(
          `Previous call on line ${activeLineId} was automatically put on hold`
        );
      }
    } else {
      console.warn("Could not make call - all lines may be in use");
    }
    dispatch(setModalOpenFlag(true));
  };

  return (
    <div
      className="fixed inset-0 z-[1000] overflow-y-auto"
      onClick={handleOutsideClick}
    >
      <div
        ref={modalRef}
        className="fixed inset-0 backdrop-blur-sm transition-opacity"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 0 }}
        onClick={onClose}
      />

      <div className="flex items-center justify-center min-h-screen relative z-10">
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-primary">
              Help & Support
            </h2>
            <button onClick={onClose} className="p-1">
              <img
                src={closeIcon}
                alt="Close"
                className="w-4 h-4 sm:w-5 sm:h-5"
              />
            </button>
          </div>

          <div className="p-3 sm:p-6">
            {/* Contact Info */}
            <div className="bg-gray-50 p-3 sm:p-6 rounded-xl mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-primary mb-3 sm:mb-4">
                Contact Us
              </h2>
              <div className="flex items-center gap-2">
                <p className="text-sm sm:text-base text-gray-700">
                  <strong>Phone:</strong> +1 (281) 909-1020
                </p>
                <Link
                  to="#"
                  onClick={() => handleCall("2819091020")}
                  className="bg-secondary h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center"
                >
                  <img
                    src={contactLight}
                    alt=""
                    className="w-3 h-3 sm:w-4 sm:h-4"
                  />
                </Link>
              </div>
              <p className="text-sm sm:text-base text-gray-700">
                <strong>Email:</strong>
                <Link to="#" className="text-secondary ml-1">
                  support@infotechhouston.com
                </Link>
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1.5 sm:mt-2 mb-2.5">
                Available 24×7 — we usually respond within a few hours.
              </p>
                <Link
                className="text-xs sm:text-sm !text-secondary mt-1.5 sm:mt-2"
                  to="#"
                  onClick={() =>
                    window.open(
                      "https://houstonsupport.com/help-and-support/",
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                >
                  <strong>Watch our Help & Support Video</strong>
                </Link>
            </div>

            {/* Support Form */}
            <div className="bg-gray-50 p-3 sm:p-6 rounded-xl">
              <h2 className="text-base sm:text-lg font-semibold text-primary mb-3 sm:mb-4">
                Submit a Request
              </h2>
              <Formik
                initialValues={{
                  firstname: userData?.firstName || "",
                  lastname: userData?.lastName || "",
                  email: userData?.email || "",
                  contact: "",
                  message: "",
                }}
                validationSchema={helpSupportSchema}
                onSubmit={async (values, actions) => {
                  try {
                    const requestData = await getSupportContact(values);
                    successToast(
                      requestData?.data?.success ||
                        "Request submitted successfully"
                    );
                    actions.setSubmitting(false);
                    actions.resetForm();
                    onClose();
                    return requestData;
                  } catch (error) {
                    console.log("Error submitting request:", error);
                    errorToast(
                      error?.response?.data?.message ||
                        "Failed to submit request"
                    );
                  }
                }}
              >
                {({ isSubmitting, values, errors }) => {
                  const isFormValid =
                    values.firstname &&
                    values.lastname &&
                    values.email &&
                    values.message &&
                    Object.keys(errors).length === 0;

                  return (
                    <Form className="space-y-3 sm:space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Field
                            name="firstname"
                            placeholder="First Name"
                            className="w-full border border-gray-300 rounded-md px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base focus:ring-2 focus:ring-secondary"
                          />
                          <ErrorMessage
                            name="firstname"
                            component="div"
                            className="text-xs sm:text-sm text-red-600 mt-1"
                          />
                        </div>

                        <div>
                          <Field
                            name="lastname"
                            placeholder="Last Name"
                            className="w-full border border-gray-300 rounded-md px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base focus:ring-2 focus:ring-secondary"
                          />
                          <ErrorMessage
                            name="lastname"
                            component="div"
                            className="text-xs sm:text-sm text-red-600 mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Field
                          name="email"
                          type="email"
                          placeholder="Email"
                          className="w-full border border-gray-300 rounded-md px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base focus:ring-2 focus:ring-secondary"
                        />
                        <ErrorMessage
                          name="email"
                          component="div"
                          className="text-xs sm:text-sm text-red-600 mt-1"
                        />
                      </div>

                      <div>
                        <Field
                          name="contact"
                          type="tel"
                          value={formatUSPhone(values.contact)}
                          placeholder="Contact Number (optional)"
                          className="w-full border border-gray-300 rounded-md px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base focus:ring-2 focus:ring-secondary"
                        />
                      </div>

                      <div>
                        <Field
                          name="message"
                          as="textarea"
                          placeholder="Message"
                          rows={4}
                          className="w-full border border-gray-300 rounded-md px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base focus:ring-2 focus:ring-secondary"
                        />
                        <ErrorMessage
                          name="message"
                          component="div"
                          className="text-xs sm:text-sm text-red-600 mt-1"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || !isFormValid}
                        className={`w-full py-1.5 sm:py-2 px-3 sm:px-4 text-sm sm:text-base rounded-md transition bg-secondary !text-white ${
                          isFormValid
                            ? "cursor-pointer opacity-100"
                            : "opacity-50 cursor-not-allowed"
                        }`}
                      >
                        {isSubmitting ? "Submitting..." : "Submit"}
                      </button>
                    </Form>
                  );
                }}
              </Formik>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupportModal;
