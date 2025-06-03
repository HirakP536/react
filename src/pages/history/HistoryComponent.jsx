/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import missedCall from "../../assets/dashboard/call.png";
import chatIcon from "../../assets/dashboard/chat.png";
import dialIcon from "../../assets/dashboard/dial.png";
import outgoingCall from "../../assets/dashboard/outcoming-call.png";
import phoneIcon from "../../assets/dashboard/phone-call.png";
import incomingCall from "../../assets/dashboard/phone.png";
import searchIcon from "../../assets/layout/searchIcon.png";
import { transformApiData } from "../../helpers/transformApiData";
import useDebounce from "../../hooks/useDebounce";
import { formatTimeDuration } from "../../utils/common";
import { getDateRangeForFilter } from "../../utils/dateFilters";
import Skeleton from "../../skeleton/Skeleton";

const HistoryComponent = () => {
  const [search, setSearch] = useState("");
  const [allCallDetails, setAllCallDetails] = useState([]);
  const [visibleCallDetails, setVisibleCallDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const tableRef = useRef(null);
  const itemsToShow = 20;

  const debouncedSearch = useDebounce(search, 500);

  // Get user data from Redux store
  const extensionTenant = useSelector((state) => state.auth?.user?.data?.city);
  const extensionNumber = extensionTenant?.split("-")[0];
  const tenant = useSelector(
    (state) => state.auth?.selectedOrganization?.companyName
  );
const userCompanyCode = useSelector(
    (state) => state.auth?.user?.data?.extension?.phone
  );
  const userRole = useSelector((state) => state.auth.user?.data?.userType);

  // Get current week's date range
  const dateRange = getDateRangeForFilter("week");

  const fetchCallData = async () => {
    try {
      setLoading(true);
      const response = await transformApiData(
        {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          extensionNumber,
          extensionTenant,
          tenant,
        },
        userCompanyCode,
        userRole
      );
      setAllCallDetails(response);
      setVisibleCallDetails(response.slice(0, itemsToShow));
    } catch (error) {
      console.error("Error fetching call data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallData();
  }, [extensionNumber, extensionTenant, tenant]);

  const filterByStatusAndSearch = (calls, status, searchTerm) => {
    let filtered = [...calls];

    // Apply status filter
    if (status !== "ALL") {
      filtered = filtered.filter((call) => call.status === status);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (call) =>
          call.callerNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          call.callerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          call.extension?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // Handle both status and search filters
  useEffect(() => {
    if (!loading) {
      const filtered = filterByStatusAndSearch(
        allCallDetails,
        selectedStatus,
        debouncedSearch
      );
      setVisibleCallDetails(filtered.slice(0, itemsToShow));
    }
  }, [debouncedSearch, allCallDetails, selectedStatus]);

  const getStatusCount = (status) => {
    if (status === "ALL") return allCallDetails.length;
    return allCallDetails.filter((call) => call.status === status).length;
  };

  // Handle scroll for infinite loading
  const handleScroll = () => {
    if (!tableRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      const currentLength = visibleCallDetails.length;
      const nextBatch = allCallDetails.slice(
        currentLength,
        currentLength + itemsToShow
      );
      if (nextBatch.length > 0) {
        setVisibleCallDetails((prev) => [...prev, ...nextBatch]);
      }
    }
  };

  useEffect(() => {
    const tableElement = tableRef.current;
    if (tableElement) {
      tableElement.addEventListener("scroll", handleScroll);
      return () => tableElement.removeEventListener("scroll", handleScroll);
    }
  }, [visibleCallDetails, allCallDetails]);

  return (
    <section className="relative flex w-[calc(100%-32px)] m-4 h-[calc(100%-40px)]">
      <div className="relative block w-full">
        <div className="sticky pb-4 my-4 top-0 z-10 border-b-[1px] border-gray-200">
          <div className="relative flex items-center justify-between w-full max-w-96">
            <input
              type="search"
              placeholder="Search history"
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

        <div className="flex gap-4 mb-4 px-4">
          {["ALL", "ANSWERED", "MISSED", "FAILED", "BUSY", "NO ANSWER"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium border-[1px] border-secondary transition-colors duration-200 
                ${
                  selectedStatus === status
                    ? "bg-secondary !text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status} ({getStatusCount(status)})
              </button>
            )
          )}
        </div>

        <div
          ref={tableRef}
          className="relative block w-full bg-white rounded-lg p-4 overflow-y-auto max-h-[calc(100vh-280px)] overflowScroll"
          style={{ boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.1)" }}
        >
          {loading ? (
            <Skeleton
              rows={8}
              columns={4}
              th={["Caller Number", "Date", "Duration", "Action"]}
            />
          ) : visibleCallDetails?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-350px)]">
              <p className="text-gray-500 text-lg font-medium">
                NO History Found
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {debouncedSearch.trim() || selectedStatus !== "ALL"
                  ? "Try changing your search or filter criteria"
                  : "No call history available for this week"}
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse border border-gray-200 text-left text-sm">
              <thead className="sticky top-0 bg-secondary text-white z-10">
                <tr>
                  <th className="border-b-[1px] border-gray-200 px-4 py-2">
                    Caller Number{" "}
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-4 py-2">
                    Date
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-4 py-2">
                    Duration
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-4 py-2 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleCallDetails?.map((call, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border-b-[1px] border-gray-200 px-4 py-2">
                      <span className="flex items-center gap-4">
                        <span>
                          <img
                            src={
                              call?.status === "ANSWERED" &&
                              call.direction === "Incoming"
                                ? incomingCall
                                : call?.status === "ANSWERED" &&
                                  call.direction === "Outgoing"
                                ? outgoingCall
                                : missedCall
                            }
                            alt="Call Icon"
                            className="max-w-5 h-auto"
                          />
                        </span>
                        <span>{call.callerNumber}</span>
                      </span>
                    </td>
                    <td className="border-b-[1px] border-gray-200 px-4 py-2">
                      {call.date}
                    </td>
                    <td className="border-b-[1px] border-gray-200 px-4 py-2">
                      {formatTimeDuration(call.duration)}
                    </td>
                    <td className="border-b-[1px] border-gray-200 px-4 py-2 text-right">
                      <span>
                        <ul className="flex items-center justify-end gap-2.5">
                          <li className="relative group dial-icon">
                            <img src={dialIcon} alt="" className="max-w-5" />
                            <span
                              className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-50 bg-secondary !text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-lg"
                              style={{
                                boxShadow: "0px 2px 8px rgba(103,48,143,0.15)",
                              }}
                            >
                              Edit before calling
                            </span>
                          </li>
                          <li className="relative group chat-icon">
                            <img src={chatIcon} alt="" className="max-w-5" />
                            <span
                              className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-50 bg-secondary !text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-lg"
                              style={{
                                boxShadow: "0px 2px 8px rgba(103,48,143,0.15)",
                              }}
                            >
                              Chat
                            </span>
                          </li>
                          <li className="relative group phone-icon">
                            <img src={phoneIcon} alt="" className="max-w-5" />
                            <span
                              className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-50 bg-secondary !text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-lg"
                              style={{
                                boxShadow: "0px 2px 8px rgba(103,48,143,0.15)",
                              }}
                            >
                              Call
                            </span>
                          </li>
                        </ul>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
};

export default HistoryComponent;
