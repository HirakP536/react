/* eslint-disable react-hooks/exhaustive-deps */
import { useFormik } from "formik";
import { useState, useEffect } from "react";
import closeIcon from "../../../assets/dashboard/close-drawer.png";
import { Link } from "react-router";
import Loader from "../../../skeleton/Loader";
import { updateCompanyPermission } from "../../../api/dashboard";
import {
  errorToast,
  successToast,
} from "../../../components/common/ToastContainer";

const OrganizationDrawer = ({
  setIsOpen,
  isOpen,
  datahandler,
  selectedOranisation,
  updateLocalCompanyData,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleModalClose = () => {
    setIsOpen(false);
  };

  const initialValues = {
    faxenable: false,
    smsenable: false,
    voiceenable: false,
    is_active: true,
  };
  const formik = useFormik({
    initialValues,
    onSubmit: async (values) => {
      let updatedValues = { ...values, selectmessageType: "bandwidth" };
      setIsLoading(true);
      try {
        const response = await updateCompanyPermission(
          selectedOranisation?.id,
          updatedValues
        );
        if (response?.data?.success) {
          const updatedCompany = {
            ...selectedOranisation,
            ...updatedValues,
          };
          updateLocalCompanyData(updatedCompany);
        } else {
          datahandler();
        }

        successToast(response?.data?.message);
        setIsOpen(false);
        formik.resetForm();
        return response;
      } catch (error) {
        errorToast(error?.response?.data?.message);
      } finally {
        setIsLoading(false);
      }
    },
  });
  useEffect(() => {
    if (selectedOranisation) {
      formik.setValues({
        faxenable: selectedOranisation.faxenable ?? false,
        smsenable: selectedOranisation.smsenable ?? false,
        voiceenable: selectedOranisation.voiceenable ?? false,
        is_active: selectedOranisation.is_active ?? true,
      });
    }
  }, [selectedOranisation]);

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
          {selectedOranisation && (
            <h2 className="text-xl font-semibold">
              {selectedOranisation.companyName || "Organization"} Permissions
            </h2>
          )}
          <Link to="#" onClick={handleModalClose}>
            <img src={closeIcon} alt="" className="cursor-pointer" />
          </Link>
        </div>
        <div>
          <form onSubmit={formik.handleSubmit}>
            <div className="space-y-6">
              {/* Permission Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label
                    className="text-primary text-sm font-semibold"
                    htmlFor="faxenable"
                  >
                    Fax {formik.values.faxenable ? "Active" : "Inactive"}
                  </label>
                  <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                    <input
                      type="checkbox"
                      name="faxenable"
                      id="faxenable"
                      checked={formik.values.faxenable}
                      onChange={formik.handleChange}
                      className="toggle-checkbox absolute block w-5 h-5 top-0.5 rounded-full bg-white appearance-none cursor-pointer transition"
                      style={{
                        left: formik.values.faxenable ? "25px" : "2px",
                        transition: "left 0.2s",
                      }}
                    />
                    <label
                      htmlFor="faxenable"
                      className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                        formik.values.faxenable ? "bg-secondary" : "bg-gray-300"
                      }`}
                      style={{ transition: "background 0.2s" }}
                    ></label>
                  </div>
                </div>{" "}
                {/* SMS Permission Toggle */}
                <div className="flex items-center justify-between">
                  <label
                    className="text-primary text-sm font-semibold"
                    htmlFor="smsenable"
                  >
                    SMS {formik.values.smsenable ? "Active" : "Inactive"}
                  </label>
                  <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                    <input
                      type="checkbox"
                      name="smsenable"
                      id="smsenable"
                      checked={formik.values.smsenable}
                      onChange={formik.handleChange}
                      className="toggle-checkbox absolute block w-5 h-5 top-0.5 rounded-full bg-white appearance-none cursor-pointer transition"
                      style={{
                        left: formik.values.smsenable ? "25px" : "2px",
                        transition: "left 0.2s",
                      }}
                    />
                    <label
                      htmlFor="smsenable"
                      className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                        formik.values.smsenable ? "bg-secondary" : "bg-gray-300"
                      }`}
                      style={{ transition: "background 0.2s" }}
                    ></label>
                  </div>
                </div>{" "}
                <div className="flex items-center justify-between">
                  <label
                    className="text-primary text-sm font-semibold"
                    htmlFor="voiceenable"
                  >
                    Voice {formik.values.voiceenable ? "Active" : "Inactive"}
                  </label>
                  <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                    <input
                      type="checkbox"
                      name="voiceenable"
                      id="voiceenable"
                      checked={formik.values.voiceenable}
                      onChange={formik.handleChange}
                      className="toggle-checkbox absolute block w-5 h-5 top-0.5 rounded-full bg-white appearance-none cursor-pointer transition"
                      style={{
                        left: formik.values.voiceenable ? "25px" : "2px",
                        transition: "left 0.2s",
                      }}
                    />
                    <label
                      htmlFor="voiceenable"
                      className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                        formik.values.voiceenable
                          ? "bg-secondary"
                          : "bg-gray-300"
                      }`}
                      style={{ transition: "background 0.2s" }}
                    ></label>
                  </div>
                </div>{" "}
                {/* Active/Inactive Toggle */}
                <div className="flex items-center justify-between">
                  <label
                    className="text-primary text-sm font-semibold"
                    htmlFor="is_active"
                  >
                    Organization{" "}
                    {formik.values.is_active ? "Active" : "Inactive"}
                  </label>
                  <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                    <input
                      type="checkbox"
                      name="is_active"
                      id="is_active"
                      checked={formik.values.is_active}
                      onChange={formik.handleChange}
                      className="toggle-checkbox absolute block w-5 h-5 top-0.5 rounded-full bg-white appearance-none cursor-pointer transition"
                      style={{
                        left: formik.values.is_active ? "25px" : "2px",
                        transition: "left 0.2s",
                      }}
                    />
                    <label
                      htmlFor="is_active"
                      className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                        formik.values.is_active ? "bg-secondary" : "bg-gray-300"
                      }`}
                      style={{ transition: "background 0.2s" }}
                    ></label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className={`w-full py-2 h-10 !text-white font-medium rounded-lg transition-all ${
                    isLoading
                      ? "bg-secondary opacity-70 cursor-not-allowed"
                      : "bg-secondary hover:bg-secondary-dark opacity-100 cursor-pointer"
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader /> : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrganizationDrawer;
