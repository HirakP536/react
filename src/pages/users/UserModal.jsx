/* eslint-disable react-hooks/exhaustive-deps */
import { useFormik } from "formik";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router";
import { addUser, updateUser } from "../../api/user";
import closeIcon from "../../assets/dashboard/close-drawer.png";
import {
  CommonDropdown,
  CustomDropdown,
  InputComponent,
} from "../../components/common/InputComponent";
import LoginButton from "../../components/common/LoginButton";
import {
  errorToast,
  successToast,
} from "../../components/common/ToastContainer";
import { fetchDidList } from "../../store/slices/didSlice";
import { fetchExtension } from "../../store/slices/extensionSlice";
import { getUserSchema } from "../../schemas/userSchema";

const userTypeOptions = [
  { value: "superadmin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "user", label: "User" },
];

const UserModal = ({
  setIsOpen,
  isOpen,
  userDataHandler,
  userData,
  editContact,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [extensionData, setExtensionData] = useState([]);
  const [didData, setDidData] = useState([]);
  const [showAllDIDs, setShowAllDIDs] = useState(false);
  
  const dispatch = useDispatch();
  const apiKey = import.meta.env.VITE_API_KEY;
  const companyTenant = useSelector(
    (state) => state.auth?.selectedOrganization?.code
  );
  const companyId = useSelector(
    (state) => state.auth?.selectedOrganization?.id
  );
  
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[]|:;<>,.?/~`";

  // Data fetching handlers
  const fetchExtensionData = () => {
    if (!companyTenant) return;
    dispatch(fetchExtension({ key: apiKey, companyTenant }))
      .unwrap()
      .then(setExtensionData)
      .catch((error) => {
        console.error("Error fetching extensions:", error);
      });
  };

  const fetchDidData = () => {
    if (!companyTenant) return;
    dispatch(fetchDidList({ key: apiKey, companyTenant }))
      .unwrap()
      .then(setDidData)
      .catch((error) => {
        console.error("Error fetching DIDs:", error);
      });
  };

  useEffect(() => {
    fetchExtensionData();
    fetchDidData();
  }, [dispatch, companyTenant]);

  const mapUserToInitialValues = (user) => ({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    userType: user?.userType || "",
    company: user?.company || companyId,
    companyName: user?.companyName || companyTenant,
    timeZone: user?.timeZone || "sip2.houstonsupport.com",
    extensions: [
      {
        extname: user?.extension?.[0]?.extname || "",
        password: user?.extension?.[0]?.password || "",
        phones: user?.extension?.[0]?.phones || [
          { label: "", phone: "", is_primary: false },
          { label: "", phone: "", is_primary: false },
        ],
      },
    ],
    dids: user?.extension?.[0]?.phones || [],
    is_active: user?.is_active ?? true,
  });

  // Store original values for edit
  const originalValuesRef = useRef(null);
  useEffect(() => {
    if (editContact && userData) {
      originalValuesRef.current = mapUserToInitialValues(userData);
    } else {
      originalValuesRef.current = null;
    }
  }, [editContact, userData]);

  const initialValues = editContact && userData
    ? mapUserToInitialValues(userData)
    : {
        firstName: "",
        lastName: "",
        email: "",
        userType: "",
        company: companyId,
        companyName: companyTenant,
        timeZone: "sip2.houstonsupport.com",
        extensions: [
          {
            extname: "",
            password: "",
            phones: [
              { label: "", phone: "", is_primary: false },
              { label: "", phone: "", is_primary: false },
            ],
          },
        ],
        dids: [],
        is_active: true,
      };

  const generateRandomPassword = (length = 8) => {
    let password = "";
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema: getUserSchema("add"),
    onSubmit: async (values) => {
      setIsLoading(true);

      const submitValues = {
        ...values,
        city: values?.extensions[0]?.extname,
        state: values?.extensions[0]?.password,
        password: generateRandomPassword(),
        response: JSON.stringify(
          Array.isArray(values.dids)
            ? values.dids.map((d) => `${d.label}-${d.phone}`)
            : []
        ),
        extensions: [
          {
            ...values.extensions[0],
            phones: Array.isArray(values.dids) ? values.dids : [],
          },
        ],
      };
      delete submitValues.dids;

      try {
        let response;
        if (editContact && userData?.id) {
          const original = originalValuesRef.current || {};
          const changedFields = {};
          
          Object.keys(submitValues).forEach((key) => {
            let originalValue = original[key];
            
            if (key === "city") {
              originalValue = original?.extensions?.[0]?.extname;
            } else if (key === "state") {
              originalValue = original?.extensions?.[0]?.password;
            } else if (key === "response") {
              originalValue = JSON.stringify(
                Array.isArray(original?.dids)
                  ? original.dids.map((d) => `${d.label}-${d.phone}`)
                  : []
              );
            } else if (key === "extensions") {
              originalValue = [
                {
                  ...original?.extensions?.[0],
                  phones: Array.isArray(original?.dids) ? original.dids : [],
                },
              ];
            }
            
            if (JSON.stringify(submitValues[key]) !== JSON.stringify(originalValue)) {
              changedFields[key] = submitValues[key];
            }
          });
          
          Object.keys(changedFields).forEach(
            (k) => changedFields[k] === undefined && delete changedFields[k]
          );
          
          const payload = {
            ...changedFields,
            userid: userData?.uuid,
          };
          delete payload.password;
          
          response = await updateUser(payload);
          successToast("User updated successfully");
        } else {
          response = await addUser(submitValues);
          successToast("Contact added successfully");
        }
        
        formik.resetForm();
        setIsOpen(false);
        userDataHandler();
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
    // For edit mode, ensure basic fields and at least one DID
    if (editContact) {
      return (
        formik.values.firstName &&
        formik.values.lastName &&
        formik.values.dids?.length > 0
      );
    }
    
    // For add mode, check all validations including errors
    return (
      formik.values.firstName &&
      formik.values.lastName &&
      formik.values.dids?.length > 0 &&
      !Object.keys(formik.errors).length
    );
  };

  // Reset form when drawer closes
  useEffect(() => {
    if (!isOpen) {
      formik.resetForm({ values: initialValues });
      
      if (editContact && onClose) {
        onClose();
      }
    }
  }, [isOpen]);

  // Handle close with form reset
  const handleModalClose = () => {
    setIsOpen(false);
  };

  // Prepare DID data for display
  const availableDIDs = Array.isArray(didData)
    ? didData.map((item) => ({
        label: `${item["5"]} - ${item["3"]}${item["4"]}`,
        value: {
          label: item["5"],
          phone: `${item["3"]}${item["4"]}`,
        },
      }))
    : [];

  const didItemsToShow = showAllDIDs
    ? availableDIDs
    : availableDIDs.slice(0, 10);
  const hasMoreDIDs = availableDIDs.length > 10;

  // DID selection matching function
  const isDIDSelected = (did) => {
    if (!formik.values.dids?.length) return false;
    
    return formik.values.dids.some((selectedDid) => {
      // Extract the numeric part from phone numbers
      const selectedPhone = selectedDid.phone?.replace(/\D/g, "");
      const didPhone = did.value.phone?.replace(/\D/g, "");
      
      // Extract the name part from labels
      const selectedLabelName = selectedDid.label?.split(" - ")[0]?.trim();
      const didLabelName = did.value.label?.trim();
      
      // Match if both label name and phone match
      const labelNameMatch = selectedLabelName === didLabelName;
      const phoneMatch =
        selectedPhone === didPhone ||
        selectedPhone === "1" + didPhone ||
        "1" + selectedPhone === didPhone;
      
      return labelNameMatch && phoneMatch;
    });
  };

  // Show all DIDs in edit mode
  useEffect(() => {
    if (editContact && userData) {
      setShowAllDIDs(true);
    }
  }, [editContact, userData]);

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
            {editContact ? "Edit User" : "Add User"}
          </h2>
          <Link to="#" onClick={handleModalClose}>
            <img src={closeIcon} alt="" className="cursor-pointer" />
          </Link>
        </div>
        <form onSubmit={formik.handleSubmit}>
          <div className="flex gap-4 mb-2">
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
          
          {/* Email and User Type */}
          <div className="flex gap-2 mb-4 w-full">
            <div className="mb-0  w-1/2">
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
            <div className="mb-0 w-1/2">
              <label
                className="block w-full sm:text-sm text-xs !font-semibold mb-1.5"
                htmlFor="userType"
              >
                User Type
              </label>
              <CustomDropdown
                name="userType"
                label=""
                options={userTypeOptions}
                value={
                  userTypeOptions.find(
                    (opt) => opt.value === formik.values.userType
                  ) || ""
                }
                onChange={(e) => {
                  formik.setFieldValue("userType", e.target.value);
                }}
                onBlur={formik.handleBlur}
                error={formik.errors.userType}
                touched={formik.touched.userType}
              />

              {formik.errors.userType && formik.touched.userType && (
                <div className="text-xs text-red-500">
                  {formik.errors.userType}
                </div>
              )}
            </div>
          </div>
          
          {/* SIP Domain and Extension */}
          <div className="flex gap-4 mb-2 w-full">
            <div className="mb-0 w-1/2">
              <label
                className="block w-full sm:text-sm text-xs !font-semibold mb-1.5"
                htmlFor="timeZone"
              >
                SIP Domain
              </label>
              <CustomDropdown
                name="timeZone"
                label=""
                options={[
                  { value: "sip2.houstonsupport.com", label: "SIP2" },
                  { value: "sip5.houstonsupport.com", label: "SIP5" },
                ]}
                value={
                  [
                    { value: "sip2.houstonsupport.com", label: "SIP2" },
                    { value: "sip5.houstonsupport.com", label: "SIP5" },
                  ].find((opt) => opt.value === formik.values.timeZone) || null
                }
                onChange={(e) => {
                  formik.setFieldValue("timeZone", e.target.value);
                }}
                onBlur={formik.handleBlur}
                error={formik.errors.timeZone}
                touched={formik.touched.timeZone}
              />

              {formik.errors.timeZone && formik.touched.timeZone && (
                <div className="text-xs text-red-500">
                  {formik.errors.timeZone}
                </div>
              )}
            </div>
            <div className="mb-0 w-1/2">
              <label
                className="block w-full sm:text-sm text-xs !font-semibold mb-1.5"
                htmlFor="extensions"
              >
                Select Extension
              </label>
              <CommonDropdown
                name="extensions"
                label=""
                options={
                  Array.isArray(extensionData)
                    ? extensionData?.map((ext) => ({
                        label: ext["135"],
                        value: {
                          extname: ext["135"],
                          password: ext["136"],
                        },
                      }))
                    : []
                }
                value={
                  extensionData
                    ?.map((ext) => ({
                      label: ext["135"],
                      value: {
                        extname: ext["135"],
                        password: ext["136"],
                      },
                    }))
                    .find(
                      (opt) =>
                        opt.value.extname ===
                          formik.values.extensions?.[0]?.extname &&
                        opt.value.password ===
                          formik.values.extensions?.[0]?.password
                    ) || null
                }
                onChange={(e) => {
                  const selected = e.target.value;
                  formik.setFieldValue(
                    "extensions[0].extname",
                    selected.extname
                  );
                  formik.setFieldValue(
                    "extensions[0].password",
                    selected.password
                  );
                }}
                onBlur={formik.handleBlur}
                error={formik.errors?.extensions?.[0]?.extname}
                touched={formik.touched?.extensions?.[0]?.extname}
              />
            </div>
          </div>
          
          {/* DIDs Selection */}
          <div className="flex gap-4 mb-2 w-full">
            <div className="mb-0 w-full">
              <label
                className="block w-full sm:text-sm text-xs !font-semibold mb-1.5"
                htmlFor="dids"
              >
                Select DID's <span className="text-red-500">*</span>
                {formik.values.dids?.length > 0 && (
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    ({formik.values.dids.length} selected)
                  </span>
                )}
              </label>
              <div className="border border-gray-200 rounded-lg p-2 max-h-[200px] overflow-y-auto">
                {didItemsToShow.length > 0 ? (
                  <div>
                    {didItemsToShow.map((did, index) => {
                      const isSelected = isDIDSelected(did);
                      
                      return (
                        <div
                          key={index}
                          className={`flex items-center py-2 px-1 border-b border-gray-100 hover:bg-gray-50 ${
                            isSelected ? "bg-purple-50" : ""
                          }`}
                          onClick={() => {
                            const currentDids = [...(formik.values.dids || [])];

                            if (isSelected) {
                              formik.setFieldValue(
                                "dids",
                                currentDids.filter(
                                  (d) => !(d.label === did.value.label)
                                )
                              );
                            } else {
                              formik.setFieldValue("dids", [
                                ...currentDids,
                                did.value,
                              ]);
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            id={`did-${index}`}
                            checked={isSelected}
                            readOnly
                            className="mr-2 h-4 w-4 accent-[#67308F] text-[#67308F] border-[#67308F] focus:ring-[#67308F]"
                          />
                          <label
                            htmlFor={`did-${index}`}
                            className={`text-sm cursor-pointer flex-grow ${
                              isSelected ? "font-medium text-[#67308F]" : ""
                            }`}
                          >
                            {did.label}
                          </label>
                        </div>
                      );
                    })}
                    
                    {/* Show More/Less button */}
                    {hasMoreDIDs && (
                      <div className="text-center mt-2">
                        <button
                          type="button"
                          onClick={() => setShowAllDIDs(!showAllDIDs)}
                          className="text-secondary text-xs hover:text-primary font-medium"
                        >
                          {showAllDIDs ? (
                            <span className="bg-secondary p-1 !text-white rounded-sm">
                              Show Less
                            </span>
                          ) : (
                            <>
                              <span className="bg-secondary p-1 !text-white rounded-sm">
                                Show More
                              </span>{" "}
                              <span className="!text-primary">
                                ({availableDIDs.length - 10} more)
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-2">
                    No DIDs available
                  </p>
                )}
              </div>

              {formik.errors.dids && formik.touched.dids && (
                <div className="text-xs text-red-500 mt-1">
                  {formik.errors.dids}
                </div>
              )}
            </div>
          </div>

          {/* User Status Toggle (edit mode only) */}
          {editContact && (
            <div className="flex items-center mb-4">
              <label className="mr-3 text-primary text-sm !font-semibold">
                User status:
              </label>
              <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  checked={formik.values.is_active}
                  onChange={() =>
                    formik.setFieldValue("is_active", !formik.values.is_active)
                  }
                  className="toggle-checkbox absolute block w-5 h-5 top-0.5 rounded-full bg-white appearance-none cursor-pointer transition"
                  style={{
                    left: formik.values.is_active ? "25px" : "2px",
                    transition: "left 0.2s",
                  }}
                />
                <label
                  htmlFor="is_active"
                  className={`block overflow-hidden h-6 rounded-full cursor-pointer
                    ${formik.values.is_active ? "bg-secondary" : "bg-gray-300"}
                  `}
                  style={{ transition: "background 0.2s" }}
                ></label>
              </div>
              <h5 className="ml-3 text-sm text-gray-600">
                {formik.values.is_active ? "User Active" : "User Inactive"}
              </h5>
            </div>
          )}
          
          {/* Submit Button */}
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

export default UserModal;
