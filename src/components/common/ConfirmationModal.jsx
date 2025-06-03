import { Link } from "react-router";
import closeIcon from "../../assets/dashboard/close-drawer.png";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Yes",
  cancelText = "No",
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[999]"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-md mx-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4 border-b-[1px] border-gray-200 pb-2">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Link to="#" onClick={onClose}>
              <img
                src={closeIcon}
                alt="Close"
                className="cursor-pointer w-5 h-5"
              />
            </Link>
          </div>

          <div className="mb-6">
            <p className="text-gray-700">{message}</p>
          </div>

          <div className="flex items-center justify-end gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-700 cursor-pointer !text-white rounded-lg hover:bg-opacity-90"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
