/* eslint-disable react-hooks/exhaustive-deps */
import { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import deleteIcon from "../../assets/dashboard/delete.svg";
import addIcon from "../../assets/dashboard/plus.png";
import editIcon from "../../assets/dashboard/edituser.svg";
import chatIcon from "../../assets/layout/chat.svg";
import phoneIcon from "../../assets/layout/phone.png";
import searchIcon from "../../assets/layout/searchIcon.png";
import ProfileImage from "../../components/common/ProfileImage ";
import useDebounce from "../../hooks/useDebounce";
import useSipSession from "../../hooks/useSipSession";
import { TableSkeleton } from "../../skeleton/Skeleton";
import {
  resetDialedPhone,
  setDialedPhone,
  setModalOpenFlag,
} from "../../store/slices/callFeatureSlice";
import {
  deleteExistingContact,
  fetchContactsList,
  setFilteredContacts,
} from "../../store/slices/contactsManagementSlice";
import { formatUSPhone, normalizePhoneNumber } from "../../utils/common";
import ContactModal from "./partials/ContactModal";
import DeleteModal from "./partials/DeleteModal";

const ContactComponent = () => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const debouncedSearch = useDebounce(search);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { makeCall, sessionRef } = useSipSession();

  const selectedCallerId = useSelector(
    (state) => state.callFeature.selectedCallerId
  );
  const activeLineId = useSelector((state) => state.sip.activeLineId);
  const lines = useSelector((state) => state.sip.lines);

  // Get data from Redux store
  const { filteredContactsList, status } = useSelector(
    (state) => state.contactsManagement
  );
  const isLoading = status === "loading";

  useEffect(() => {
    dispatch(fetchContactsList());
  }, [dispatch]);

  useEffect(() => {
    dispatch(setFilteredContacts(debouncedSearch));
  }, [debouncedSearch, dispatch]);

  const groupContactsByAlphabet = (contacts) => {
    const grouped = {};
    contacts?.forEach((item) => {
      const name = item?.firstName || item?.user?.firstName || "N/A";
      if (!name) return;
      const letter = name[0]?.toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter]?.push(item);
    });
    return Object.keys(grouped)
      ?.sort()
      ?.reduce((acc, key) => {
        acc[key] = grouped[key].sort((a, b) => {
          const aName =
            (a?.firstName?.user?.firstName || "") +
            (a?.lastName?.user?.lastName || "");
          const bName =
            (b?.firstName?.user?.firstName || "") +
            (b?.lastName?.user?.lastName || "");
          return aName?.localeCompare(bName);
        });
        return acc;
      }, {});
  };

  const groupedContacts = groupContactsByAlphabet(filteredContactsList);

  const handleCloseModal = () => {
    setIsOpen(false);
    setEditContact(null);
  };

  const handleDeleteContact = async (id) => {
    await dispatch(deleteExistingContact(id));
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (!sessionRef.current) {
      dispatch(resetDialedPhone());
      dispatch(setModalOpenFlag(false));
    }
  }, [sessionRef.current, dispatch]);

  const handleCall = (call) => {
    let numberToCall = normalizePhoneNumber(selectedCallerId);
    let dialedPhone = "";
    dialedPhone = call?.formatcontact;
    const hasActiveCallThatWillBeHeld =
      activeLineId !== null &&
      lines[activeLineId] &&
      !lines[activeLineId].onHold &&
      !lines[activeLineId].ringing;

    const lineId = makeCall({
      phone: dialedPhone,
      selectedNumber: numberToCall,
    });

    if (lineId) {
      dispatch(setDialedPhone(dialedPhone));
      if (hasActiveCallThatWillBeHeld) {
        console.log(
          `Previous call on line ${activeLineId} was automatically put on hold`
        );
      }
    } else {
      console.warn("Could not make call - all lines may be in use");
    }
    dispatch(setModalOpenFlag(true));
  };

  return (
    <section className="w-[calc(100%-32px)] m-4 rounded-2xl">
      <div className="relative block w-full">
        <div className="sticky pb-4 top-0 z-10 bg-[#f2f8ff] border-b-[1px] border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center items-start justify-between w-full">
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
              className="bg-secondary text-sm sm:mt-0 mt-2.5 cursor-pointer !text-white px-4 py-2 rounded flex items-center gap-2"
              onClick={() => setIsOpen(true)}
            >
              <img src={addIcon} alt="" /> Add Contact
            </button>
          </div>
        </div>
      </div>

      {/* Contact List Table */}
      <div
        className="relative block w-full p-4 bg-white rounded-lg"
        style={{ boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.1)" }}
      >
        <div className="bg-white rounded-lg overflow-auto">
          {isLoading ? (
            <TableSkeleton
              rows={8}
              columns={4}
              thdata={["Name", "Email", "Company", "Action"]}
            />
          ) : (
            <table className="w-full border-collapse border border-gray-200 text-left text-sm">
              <thead className="sticky top-0 bg-secondary text-white z-10">
                <tr>
                  <th className="border-b-[1px] border-gray-200 px-4 py-2">
                    Name
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-4 py-2">
                    Email
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-4 py-2">
                    Company
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-4 py-2 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedContacts)?.map((letter) => (
                  <Fragment key={letter}>
                    <tr>
                      <td
                        colSpan={4}
                        className="bg-gray-100 text-secondary font-bold px-2 py-2"
                      >
                        {letter}
                      </td>
                    </tr>
                    {groupedContacts[letter]?.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-gray-50">
                        <td className="border-b-[1px] border-gray-200 px-4 py-2">
                          <span className="flex items-center gap-2">
                            <ProfileImage
                              name={`${item?.firstName || "N"} ${
                                item?.lastName || ""
                              }`}
                            />
                            <span className="flex flex-col">
                              <span className="whitespace-nowrap">{`${
                                item?.firstName || "N/A"
                              } ${item?.lastName || ""}`}</span>
                              {formatUSPhone(
                                item?.contactPhone || item?.formatcontact
                              ) || "N/A"}
                            </span>
                          </span>
                        </td>
                        <td className="border-b-[1px] border-gray-200 px-4 py-2">
                          {item.email || "N/A"}
                        </td>
                        <td className="border-b-[1px] border-gray-200 px-4 py-2">
                          {item.company?.companyName || "N/A"}
                        </td>
                        <td className="border-b-[1px] border-gray-200 px-4 py-2 text-right">
                          <span className="flex items-center justify-end gap-2">
                            <button
                              className="inline-block mr-2 cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                handleCall(item);
                              }}
                            >
                              <img
                                src={phoneIcon}
                                alt="Edit"
                                className="max-w-6"
                              />
                            </button>
                            <button
                              className="inline-block mr-2 cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(
                                  `/chat?phoneNumber=${item?.formatcontact}`,
                                  {
                                    state: {
                                      contact: item,
                                    },
                                  }
                                );
                              }}
                            >
                              <img
                                src={chatIcon}
                                alt="Edit"
                                className="max-w-5"
                              />
                            </button>
                            <button
                              className="inline-block mr-2 cursor-pointer"
                              title="Edit"
                              onClick={() => {
                                setEditContact(item);
                                setIsOpen(true);
                              }}
                            >
                              <img src={editIcon} alt="Edit" className="max-w-5" />
                            </button>
                            <button
                              className="inline-block cursor-pointer"
                              title="Delete"
                              onClick={() => {
                                setDeleteId(item.id);
                                setIsModalOpen(true);
                              }}
                            >
                              <img src={deleteIcon} alt="Delete" className="max-w-5" />
                            </button>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {/* add contact drawer with overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[99] "
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
          onClick={handleCloseModal}
        />
      )}
      <ContactModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        contactHandler={() => dispatch(fetchContactsList())}
        editContact={editContact}
        onClose={handleCloseModal}
      />

      {isModalOpen && (
        <DeleteModal
          id={deleteId}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          contactHandler={() => handleDeleteContact(deleteId)}
        />
      )}
    </section>
  );
};

export default ContactComponent;
