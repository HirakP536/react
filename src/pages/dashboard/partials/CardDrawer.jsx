import { useRef } from "react";
import { useSelector } from "react-redux";
import closeIcon from "../../../assets/dashboard/close-drawer.png";
import useOutsideClick from "../../../hooks/useOutsideClick";
import { formatUSPhone } from "../../../utils/common";

const CardDrawer = ({ title, data, isOpen, setIsOpen }) => {
  const drawerRef = useRef(null);
  const users = useSelector((state) => state.users.users);

  useOutsideClick(drawerRef, () => {
    if (isOpen) {
      setIsOpen(false);
    }
  });

  const dataArray = Array.isArray(data) ? data : data ? [data] : [];
  const filteredDataArray =
    title === "DID's"
      ? dataArray.filter((item) => item)
      : dataArray;

  const findUserByExtension = (extension) => {
    if (!users || !users.length || !extension) return null;
    return users.find((user) => user.city === extension);
  };

  return (
    <div
      ref={drawerRef}
      className={`fixed block w-full bg-white h-screen top-0 z-50 rounded-2xl max-w-[500px] p-6`}
      style={{
        boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.1)",
        transition: "right 0.3s ease-in-out",
        right: isOpen ? "0" : "-100%",
        visibility: isOpen ? "visible" : "hidden",
        opacity: isOpen ? 1 : 0,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-secondary">{title}</h2>
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={() => setIsOpen(false)}
        >
          <img src={closeIcon} alt="" />
        </button>
      </div>
      <div className="overflow-y-auto max-h-[calc(100vh-150px)] overflowScroll">
        {filteredDataArray.length > 0 ? (
          <>
            <ul className="list-none p-0 m-0">
              {filteredDataArray.map((item, index) => {
                let displayValue;

                if (title === "Extensions") {
                  const extension = item?.[135] || "";
                  const matchedUser = findUserByExtension(extension);

                  if (matchedUser) {
                    // If we found a matching user, display their name with extension
                    displayValue = (
                      <div className="flex items-center gap-2">
                        <h5 className="text-base font-medium">
                          {matchedUser.firstName} {matchedUser.lastName}
                        </h5>
                        <span>-</span>
                        <p className="text-base">{extension}</p>
                      </div>
                    );
                  } else {
                    // Otherwise just show the extension
                    displayValue = (
                      <div className="flex items-center gap-2">
                        <h5 className="text-base font-medium">No Allocated</h5>
                        <span>-</span>
                        <p className="text-base">{extension}</p>
                      </div>
                    );
                  }
                } else if (title === "DID's") {
                  const didNumber = item?.[5] || "N/A";
                  let field2 = item?.[2] || "";
                  let field3 = item?.[3] || "";
                  let field4 = item?.[4] || "";

                  const combinedDescription = [field2, field3, field4]
                    .filter(
                      (field) =>
                        field && field !== "undefined" && field !== "null"
                    )
                    .join("");

                  displayValue = (
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium">{didNumber}</h5>
                      <span>-</span>
                      {combinedDescription && (
                        <div className="text-sm text-gray-600">
                          {formatUSPhone(combinedDescription)}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  displayValue = item?.toString() || "N/A";
                }

                return (
                  <li
                    key={index}
                    className="p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer rounded"
                  >
                    {displayValue}
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="text-gray-500">No data available</p>
        )}
      </div>
    </div>
  );
};

export default CardDrawer;
