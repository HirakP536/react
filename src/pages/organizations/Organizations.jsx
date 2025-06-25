import { useEffect, useState } from "react";
import { getCompanyList } from "../../api/dashboard";
import searchIcon from "../../assets/layout/searchIcon.png";
import editIcon from "../../assets/phone/edit.svg";
import { TableSkeleton } from "../../skeleton/Skeleton";
import OrganizationDrawer from "./partials/OrganizationDrawer";
import { Link } from "react-router";

const Organizations = () => {
  const [companyList, setCompanyList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOranisation, setSelectedOranisation] = useState(null);

  const fetchCompanyList = async () => {
    setIsLoading(true);
    try {
      const response = await getCompanyList();
      const companies = response?.data?.success || [];
      setCompanyList(companies);
      setFilteredCompanies(companies);
      return response;
    } catch (error) {
      console.error("Error fetching company list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyList();
  }, []);

  // Filter companies when search changes
  useEffect(() => {
    if (companyList.length > 0) {
      const filtered = companyList.filter((company) =>
        company.companyName?.toLowerCase().includes(search.toLowerCase())
      );

      const sortedCompanies = [...filtered].sort((a, b) => {
        const nameA = (a.companyName || "").toLowerCase();
        const nameB = (b.companyName || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setFilteredCompanies(sortedCompanies);
    }
  }, [search, companyList]);

  const handleEditOrasation = (data) => {
    setSelectedOranisation(data);
    setIsOpen(true);
  };

  const updateLocalCompanyData = (updatedCompany) => {
    const updatedList = companyList.map((company) =>
      company.id === updatedCompany.id
        ? { ...company, ...updatedCompany }
        : company
    );
    setCompanyList(updatedList);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  return (
    <>
      <section className="w-[calc(100%-32px)] m-4 rounded-2xl">
        <div className="relative block w-full">
          <div className="sticky pb-1 top-0 z-10 bg-[#f2f8ff] border-b-[1px] border-gray-200">
            <div className="flex my-4 items-center justify-between w-full">
              <div className="relative flex items-center justify-between sm:w-full w-[230px] max-w-96">
                <input
                  type="search"
                  placeholder="Search by company name"
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
            </div>
          </div>
          <div
            className="relative block w-full p-4 bg-white rounded-lg"
            style={{ boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.1)" }}
          >
            <div className="relative block w-full max-h-[calc(100vh-200px)] overflow-auto overflowScroll">
              {isLoading ? (
                <TableSkeleton
                  rows={6}
                  columns={7}
                  thdata={[
                    "Company Name",
                    "Company Code",
                    "Status",
                    "Fax",
                    "SMS",
                    "Voice",
                    "Actions",
                  ]}
                />
              ) : filteredCompanies?.length > 0 ? (
                <table className="w-full border-collapse border border-gray-200 text-left text-sm">
                  <thead className="sticky top-0 bg-secondary text-white z-10">
                    <tr>
                      <th
                        scope="col"
                        className="border-b-[1px] border-gray-200 px-4 py-2 whitespace-nowrap"
                      >
                        Company Name
                      </th>
                      <th
                        scope="col"
                        className="border-b-[1px] border-gray-200 px-4 py-2 whitespace-nowrap"
                      >
                        Company Code
                      </th>
                      <th
                        scope="col"
                        className="border-b-[1px] border-gray-200 px-4 py-2 whitespace-nowrap"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="border-b-[1px] border-gray-200 px-4 py-2 whitespace-nowrap"
                      >
                        Fax
                      </th>
                      <th
                        scope="col"
                        className="border-b-[1px] border-gray-200 px-4 py-2 whitespace-nowrap"
                      >
                        SMS
                      </th>
                      <th
                        scope="col"
                        className="border-b-[1px] border-gray-200 px-4 py-2 whitespace-nowrap"
                      >
                        Voice
                      </th>
                      <th
                        scope="col"
                        className="border-b-[1px] border-gray-200 px-4 py-2 text-right whitespace-nowrap"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCompanies?.map((company, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border-b-[1px] border-gray-200 px-4 py-2">
                          <div className="text-sm font-medium text-gray-900">
                            {company?.companyName || "N/A"}
                          </div>
                        </td>
                        <td className="border-b-[1px] border-gray-200 px-4 py-2">
                          <div className="text-sm text-gray-500">
                            {company?.code || "N/A"}
                          </div>
                        </td>
                        <td className="border-b-[1px] border-gray-200 px-4 py-2">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              company?.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {company?.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="border-b-[1px] border-gray-200 px-4 py-2">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              company?.faxenable
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {company?.faxenable ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="border-b-[1px] border-gray-200 px-4 py-2">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              company.smsenable
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {company.smsenable ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="border-b-[1px] border-gray-200 px-4 py-2">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              company.voiceenable
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {company.voiceenable ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="border-b-[1px] border-gray-200 px-4 py-2 text-right">
                          <Link
                            to="#"
                            className="flex items-center justify-end"
                            onClick={() => handleEditOrasation(company)}
                          >
                            <img src={editIcon} className="max-w-5" alt="" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center text-gray-500">
                    {search
                      ? `No companies found matching "${search}"`
                      : "No companies found"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <OrganizationDrawer
        onClose={handleCloseModal}
        datahandler={fetchCompanyList}
        updateLocalCompanyData={updateLocalCompanyData}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        selectedOranisation={selectedOranisation}
      />
    </>
  );
};

export default Organizations;
