/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetUser } from "../../api/user";
import addIcon from "../../assets/dashboard/plus.png";
import searchIcon from "../../assets/layout/searchIcon.png";
import editIcon from "../../assets/phone/edit.svg";
import resetIcon from "../../assets/phone/reset.svg";
import {
  errorToast,
  successToast,
} from "../../components/common/ToastContainer";
import useDebounce from "../../hooks/useDebounce";
import { TableSkeleton } from "../../skeleton/Skeleton";
import { fetchUserList } from "../../store/slices/userSlice";
import UserModal from "./UserModal";

const User = () => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [resetLoadingId, setResetLoadingId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const debouncedSearch = useDebounce(search);

  // Get data from Redux store
  const companyName = useSelector(
    (state) => state.auth?.selectedOrganization?.code
  );
  const { users, status, error } = useSelector((state) => state.users);
  const isLoading = status === "loading";

  useEffect(() => {
    if (companyName) {
      dispatch(fetchUserList(companyName));
    }
  }, [companyName, dispatch]);

  useEffect(() => {
    if (debouncedSearch) {
      setFilteredData(
        users.filter(
          (item) =>
            item.firstName
              ?.toLowerCase()
              .includes(debouncedSearch.toLowerCase()) ||
            item.lastName?.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
      );
    } else {
      setFilteredData(users);
    }
  }, [debouncedSearch, users]);

  useEffect(() => {
    if (error && status === "failed") {
      errorToast(error);
    }
  }, [error, status]);

  const handleCloseModal = () => {
    setIsOpen(false);
    setIsEdit(false);
    setSelectedUser(null);
  };

  const resetUserHandler = async (id) => {
    if (resetLoadingId) return;
    setResetLoadingId(id);
    try {
      const response = await resetUser(id);
      successToast(response?.data?.success);
      // Refresh user list after reset
      dispatch(fetchUserList(companyName));
      return response;
    } catch (error) {
      console.error("Error", error);
      errorToast(error?.response?.data?.error);
    } finally {
      setResetLoadingId(null);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEdit(true);
    setIsOpen(true);
  };
  const refreshUsers = () => {
    dispatch(fetchUserList(companyName));
  };

  return (
    <section className="w-[calc(100%-32px)] m-4 rounded-2xl">
      <div className="relative block w-full">
        <div className="sticky pb-1 top-0 z-10 bg-[#f2f8ff] border-b-[1px] border-gray-200">
          <div className="flex my-4 items-center justify-between w-full">
            <div className="relative flex items-center justify-between sm:w-full w-[230px] max-w-96">
              <input
                type="search"
                placeholder="Search by name"
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 px-4 pl-10 py-2 bg-white rounded-lg text-sm focus:outline-none focus:border-secondary"
                style={{ boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.1)" }}
                value={search}
              />
              <img
                src={searchIcon}
                className="absolute inline-block w-4 left-3.5"
                alt=""
              />
            </div>
            <button
              className="bg-secondary text-sm cursor-pointer !text-white px-4 py-2 rounded flex items-center gap-2"
              onClick={() => setIsOpen(true)}
            >
              <img src={addIcon} alt="" /> Add User
            </button>
          </div>
        </div>
        <div
          className="relative block w-full bg-white rounded-lg p-4 overflow-y-auto max-h-[calc(100vh-200px)]"
          style={{ boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.1)" }}
        >
          {isLoading ? (
            <TableSkeleton
              rows={8}
              columns={8}
              thdata={[
                "First Name",
                "Last Name",
                "Email",
                "User Type",
                "Is Active",
                "Extension Name",
                "DID's",
                "Action",
              ]}
            />
          ) : filteredData?.length > 0 ? (
            <table className="w-full border-collapse border border-gray-200 text-left text-sm">
              <thead className="sticky top-0 bg-secondary text-white z-10">
                <tr>
                  <th className="border-b-[1px] border-gray-200 px-4 py-2">
                    First Name
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-4 py-2">
                    Last Name
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-4 py-2">
                    Email
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-4 py-2">
                    User Type
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-4 py-2">
                    Is Active
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-4 py-2">
                    Extension Name
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-4 py-2">
                    DID's
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-4 py-2">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData?.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-gray-50">
                    <td className="border-b-[1px] border-gray-200 px-4 py-2">
                      {item?.firstName}
                    </td>
                    <td className="border-b-[1px] border-gray-200 px-4 py-2">
                      {item?.lastName}
                    </td>
                    <td className="border-b-[1px] border-gray-200 px-4 py-2">
                      {item?.email}
                    </td>
                    <td className="border-b-[1px] border-gray-200 px-4 py-2">
                      {item?.userType}
                    </td>
                    <td className="border-b-[1px] border-gray-200 px-4 py-2">
                      {item.is_active ? (
                        <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-xs">
                          Active
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-700 text-xs">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="border-b-[1px] border-gray-200 px-4 py-2">
                      {item?.extension[0]?.extname || "N/A"}
                    </td>{" "}
                    <td className="border-b-[1px] border-gray-200 px-4 py-2">
                      {item?.extension[0]?.phones?.length > 0 ? (
                        <span className="text-blue-600 cursor-pointer group relative">
                          {item?.extension[0]?.phones?.length}
                          <span className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 bg-secondary !text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 min-w-fit">
                            {item?.extension[0]?.phones?.map((phone, idx) => (
                              <div key={idx} className="py-1">
                                {phone.label}
                              </div>
                            ))}
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-500">0</span>
                      )}
                    </td>
                    <td className="border-b-[1px] border-gray-200 px-4 py-2 text-right relative">
                      <span className="flex items-center gap-3 justify-end">
                        <button
                          className="cursor-pointer group relative"
                          onClick={() => resetUserHandler(item.id)}
                          disabled={!!resetLoadingId}
                        >
                          {resetLoadingId === item.id ? (
                            <div className="w-5 h-5 border-2 border-white border-t-secondary rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <img src={resetIcon} alt="" className="max-w-5" />
                              <span className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 bg-secondary !text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                Reset Password
                              </span>
                            </>
                          )}
                        </button>
                        <button
                          className="cursor-pointer group relative"
                          onClick={() => handleEditUser(item)}
                        >
                          <img src={editIcon} className="max-w-5" alt="" />
                          <span className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 bg-secondary !text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                            Edit User
                          </span>
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500 py-10">No Users Found.</p>
          )}
        </div>
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 z-[99] "
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
          onClick={handleCloseModal}
        />
      )}
      <UserModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        userDataHandler={refreshUsers}
        userData={selectedUser}
        editContact={isEdit}
        onClose={handleCloseModal}
      />
    </section>
  );
};

export default User;
