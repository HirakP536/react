import { useRef } from "react";
import { useSelector } from "react-redux";
import closeIcon from "../../../assets/dashboard/close-drawer.png";
import { formatUSPhone } from "../../../utils/common";
import userAvatar from "../../../assets/phone/user.svg";

const ProfileModal = ({ isOpen, onClose }) => {
  const modalRef = useRef(null);
  const userData = useSelector((state) => state?.auth?.user?.data);
  const userType = userData?.userType || "User";
  const phoneNumbers = userData?.extension?.[0]?.phones || [];

  if (!isOpen) return null;

  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto" onClick={handleOutsideClick}>
      <div ref={modalRef}
        className="fixed inset-0 backdrop-blur-sm transition-opacity"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 0 }}
        onClick={onClose}
      />
      
      <div className="flex items-center justify-center min-h-screen relative z-10">
        <div 
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-2 sm:mx-4 transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-primary">Profile Information</h2>
            <button onClick={onClose} className="p-1">
              <img src={closeIcon} alt="Close" className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="p-3 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 mb-4 sm:mb-8">
              {/* Profile Image Section */}
              <div className="flex flex-col items-center justify-center bg-gray-50 p-3 sm:p-6 rounded-xl">
                <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-3 sm:mb-4 overflow-hidden">
                    <img 
                      src={userAvatar} 
                      alt={`${userData.firstName} ${userData.lastName}`} 
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                    />
                </div>
                <h3 className="text-base sm:text-xl font-medium">{`${userData?.firstName || ''} ${userData?.lastName || ''}`}</h3>
                <p className="text-xs sm:text-sm text-gray-500 capitalize mt-1">{userType}</p>
                <div className="mt-3 sm:mt-4 text-center">
                  <h5 className="text-xs text-gray-500">Tenant Name</h5>
                  <p className="text-xs sm:text-sm font-medium">{userData?.company?.companyName || 'N/A'}</p>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-gray-50 p-3 sm:p-6 rounded-xl">
                <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-primary">Personal Information</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <h5 className="text-sm text-gray-500">Full Name</h5>
                    <p className="text-sm font-medium">
                      {userData?.firstName || "N/A"} {userData?.lastName || "N/A"}
                    </p>
                  </div>

                  <div>
                    <h5 className="text-sm text-gray-500">Email</h5>
                    <p className="text-sm font-medium">
                      {userData?.email || "N/A"}
                    </p>
                  </div>

                  <div>
                    <h5 className="text-sm text-gray-500">User Role</h5>
                    <p className="text-sm font-medium capitalize">{userType}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone Information - Full Width Row */}
            <div className="bg-gray-50 p-3 sm:p-6 rounded-xl w-full">
              <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-primary">Phone Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h5 className="text-xs sm:text-sm text-gray-500">Extension</h5>
                  <p className="text-xs sm:text-sm font-medium">{userData?.extension?.[0]?.username || 'N/A'}</p>
                </div>
                <div>
                  <h5 className="text-xs sm:text-sm mb-2 sm:mb-2.5 text-gray-500">Phone Numbers</h5>
                  <div className="max-h-[150px] sm:max-h-[200px] overflow-auto overflowScroll">
                    {phoneNumbers.length > 0 ? (
                      <ol className="space-y-1.5 sm:space-y-2">
                        {phoneNumbers.map((phone, index) => (
                          <li key={index} className="text-xs sm:text-sm font-medium">
                            {phone.label ? `${phone.label} - ${formatUSPhone(phone.formatedPhone)}` : formatUSPhone(phone.formatedPhone)}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-xs sm:text-sm font-medium">No phone numbers</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
