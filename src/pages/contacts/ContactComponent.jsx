import { Fragment, useEffect, useState } from "react";
import { getContact } from "../../api/contact";
import deleteIcon from "../../assets/dashboard/delete.png";
import addIcon from "../../assets/dashboard/plus.png";
import editIcon from "../../assets/dashboard/user-edit.png";
import searchIcon from "../../assets/layout/searchIcon.png";
import ContactModal from "./partials/ContactModal";
// import ProfileImage from "../../components/common/ProfileImage";
import ProfileImage from "../../components/common/ProfileImage ";
import useDebounce from "../../hooks/useDebounce";
import { TableSkeleton } from "../../skeleton/Skeleton";
import { formatUSPhone } from "../../utils/common";
import DeleteModal from "./partials/DeleteModal";

const ContactComponent = () => {
  const [search, setSearch] = useState("");
  const [contact, setContact] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const debouncedSearch = useDebounce(search);

  const contactHandler = async () => {
    setIsLoading(true);
    try {
      const response = await getContact();
      setContact(response?.data?.success);
      return response;
    } catch (error) {
      console.error("Error", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    contactHandler();
  }, []);
  const filteredContacts = debouncedSearch
    ? contact?.filter((item) =>
        `${item?.firstName || item?.user?.firstName || ""} ${
          item?.lastName || item?.user?.lastName || ""
        }`
          .toLowerCase()
          .includes(debouncedSearch?.toLowerCase())
      )
    : contact;
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

  const groupedContacts = groupContactsByAlphabet(filteredContacts);

  const handleCloseModal = () => {
    setIsOpen(false);
    setEditContact(null);
  };

  return (
    <section className="w-[calc(100%-32px)] m-4 rounded-2xl">
      <div className="relative block w-full">
        <div className="sticky pb-4 top-0 z-10 bg-[#f2f8ff] border-b-[1px] border-gray-200">
          <div className="flex items-center justify-between w-full">
            <div className="relative flex items-center justify-between sm:w-full w-[230px] max-w-96">
              <input
                type="search"
                placeholder="Search..."
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
              <img src={addIcon} alt="" /> Add Contact
            </button>
          </div>
        </div>
      </div>

      {/* Contact List Table */}
      <div
        className="mt-6 bg-white rounded-lg p-4 overflow-auto"
        style={{ boxShadow: "0px 0px 5px rgba(0,0,0,0.1)" }}
      >
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
              {Object.keys(groupedContacts).map((letter) => (
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
                      {" "}
                      <td className="border-b-[1px] border-gray-200 px-4 py-2">
                        <span className="flex items-center gap-2">
                          <ProfileImage
                            name={`${item?.firstName || "N"} ${
                              item?.lastName || ""
                            }`}
                          />
                          <p className="flex flex-col">
                            <span>{`${item?.firstName || "N/A"} ${
                              item?.lastName || ""
                            }`}</span>
                            {formatUSPhone(
                              item?.contactPhone || item?.formatcontact
                            ) || "N/A"}
                          </p>
                        </span>
                      </td>
                      <td className="border-b-[1px] border-gray-200 px-4 py-2">
                        {item.email || "N/A"}
                      </td>
                      <td className="border-b-[1px] border-gray-200 px-4 py-2">
                        {item.company?.companyName || "N/A"}
                      </td>
                      <td className="border-b-[1px] border-gray-200 px-4 py-2 text-right">
                        <button
                          className="inline-block mr-2 cursor-pointer"
                          title="Edit"
                          onClick={() => {
                            setEditContact(item);
                            setIsOpen(true);
                          }}
                        >
                          <img src={editIcon} alt="Edit" />
                        </button>
                        <button
                          className="inline-block cursor-pointer"
                          title="Delete"
                          onClick={() => {
                            setDeleteId(item.id);
                            setIsModalOpen(true);
                          }}
                        >
                          <img src={deleteIcon} alt="Delete" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
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
        contactHandler={contactHandler}
        editContact={editContact}
        onClose={handleCloseModal}
      />

      {isModalOpen && (
        <DeleteModal
          id={deleteId}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          contactHandler={contactHandler}
        />
      )}
    </section>
  );
};

export default ContactComponent;
