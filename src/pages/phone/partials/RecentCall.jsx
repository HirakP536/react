/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router";
import chatIcon from "../../../assets/dashboard/chat.png";
import incomingCall from "../../../assets/dashboard/incoming-green.svg";
import missedCall from "../../../assets/dashboard/missed3.svg";
import outgoingCall from "../../../assets/dashboard/outgoing-green.svg";
import phoneIcon from "../../../assets/dashboard/phone-call.png";
import searchIcon from "../../../assets/layout/searchIcon.png";
import useDebounce from "../../../hooks/useDebounce";
import { getDateRangeForFilter } from "../../../utils/dateFilters";
import {
  fetchHistoryData,
  selectAllCallDetails,
  selectDispositionTypes,
  selectHistoryLoading,
} from "../../../store/slices/historySlice";
import {
  convertCSTToLocalTime,
  formatTimeDuration,
  formatUSAPhoneNumber,
  normalizePhoneNumber,
} from "../../../utils/common";
import { TableSkeleton } from "../../../skeleton/Skeleton";

const RecentCall = ({ makeCall }) => {
  const [search, setSearch] = useState("");
  const [visibleCallDetails, setVisibleCallDetails] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const tableRef = useRef(null);
  const itemsToShow = 20;
  const debouncedSearch = useDebounce(search);
  const extensionTenant = useSelector((state) => state.auth?.user?.data?.city);
  const extensionNumber = extensionTenant?.split("-")[0];
  const tenant = useSelector((state) => state.auth?.user?.data?.company?.code);
  const userCompanyCode = useSelector(
    (state) => state.auth?.user?.data?.extension?.phone
  );
  const selectedCallerId = useSelector(
    (state) => state.callFeature.selectedCallerId
  );
  const myExtensionData = useSelector(
    (state) => state?.auth?.user?.data?.extension[0]
  );
  const dateRange = getDateRangeForFilter("week");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const allCallDetails = useSelector(selectAllCallDetails);
  const loading = useSelector(selectHistoryLoading);
  const dispositionTypes = useSelector(selectDispositionTypes);

  useEffect(() => {
    if (!extensionNumber || !extensionTenant || !tenant) return;
    dispatch(
      fetchHistoryData({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        extensionNumber,
        extensionTenant,
        tenant,
        userCompanyCode,
        userRole: "user",
      })
    );
  }, [extensionNumber, extensionTenant, tenant, dispatch]);

  const getCallStatusIcon = (call) => {
    const status = call?.status || "";
    const direction = call?.direction || "";
    if (status === "ANSWERED") {
      return direction === "Incoming" ? incomingCall : outgoingCall;
    }
    return missedCall;
  };

  const filterByStatusAndSearch = (calls, status, searchTerm) => {
    let filtered = [...calls];
    if (status !== "ALL") {
      filtered = filtered.filter((call) => {
        if (status === "ANSWERED") {
          return call.status === "ANSWERED" && call.duration > 0;
        }
        return call.status === status;
      });
    }
    
    if (searchTerm.trim()) {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (call) =>
          (call.callerNumber &&
           call.callerNumber.toLowerCase().includes(searchTermLower)) ||
          (call.receiver &&
           call.receiver.toLowerCase().includes(searchTermLower))
      );
    }
    filtered.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return filtered;
  };

  const getStatusCount = (status) => {
    if (status === "ALL") return allCallDetails.length;
    return allCallDetails.filter((call) => {
      if (status === "ANSWERED") {
        return call.status === "ANSWERED" && call.duration > 0;
      }
      return call.status === status;
    }).length;
  };

  useEffect(() => {
    if (!loading) {
      const filtered = filterByStatusAndSearch(
        allCallDetails,
        selectedStatus,
        debouncedSearch
      );
      setVisibleCallDetails(filtered.slice(0, itemsToShow));
    }
  }, [debouncedSearch, allCallDetails, selectedStatus, loading]);

  const handleScroll = () => {
    if (!tableRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      const currentLength = visibleCallDetails.length;
      const filteredData = filterByStatusAndSearch(
        allCallDetails,
        selectedStatus,
        debouncedSearch
      );
      if (currentLength < filteredData.length) {
        const nextBatch = filteredData.slice(
          currentLength,
          currentLength + itemsToShow
        );
        if (nextBatch.length > 0) {
          setVisibleCallDetails((prev) => [...prev, ...nextBatch]);
        }
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

  // Helper function to determine if a number belongs to the current user
  const isMyNumber = (number) => {
    if (!myExtensionData) return false;
    if (number === myExtensionData.phone) return true;
    return myExtensionData.phones?.some(
      (phone) => number === phone.formatedPhone
    );
  };

  // Helper function to get the external number (not the user's number)
  const getExternalNumber = (call) => {
    const callerIsMine = isMyNumber(call.callerNumber);
    const receiverIsMine = isMyNumber(call.receiver);

    if (callerIsMine) {
      return call.receiver;
    } else if (receiverIsMine) {
      return call.callerNumber;
    } else {
      return call.direction === "Incoming" ? call.callerNumber : call.receiver;
    }
  };

  // Helper function to check if a number is valid for chat (at least 10 digits)
  const isValidForChat = (number) => {
    if (!number) return false;
    const digits = number.replace(/\D/g, "");
    return digits.length >= 10;
  };

  const handleCall = (call) => {
    let numberToCall = normalizePhoneNumber(selectedCallerId);
    let dialedPhone = getExternalNumber(call);

    if (dialedPhone && typeof dialedPhone === "string") {
      const digits = dialedPhone.match(/\d+/g);
      if (digits && digits.length > 0) {
        dialedPhone = digits.join("");
      }
    }

    if (makeCall) {
      makeCall({ phone: dialedPhone, selectedNumber: numberToCall });
    }
  };

  return (
    <section className="relative flex w-full m-4 h-[calc(100%-40px)]">
      <div className="relative block w-full">
        <div className="sticky pb-4 my-4 top-0 z-10 border-b-[1px] border-gray-200">
          <div className="relative flex items-center justify-between w-full max-w-96">
            <input
              type="search"
              placeholder="Search recent calls"
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

        <div className="md:flex grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-4">
          {dispositionTypes?.map((status) => (
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
          ))}
        </div>

        <div
          className="relative block w-full bg-white rounded-lg p-4"
          style={{ boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.1)" }}
        >
          <div
            ref={tableRef}
            className="relative block w-full overflow-y-auto max-h-[calc(100vh-300px)] overflowScroll"
          >
            {loading ? (
              <TableSkeleton
                rows={8}
                columns={4}
                thdata={[
                  "Caller Number",
                  "Receiver Number",
                  "Date",
                  "Duration",
                  "Action",
                ]}
              />
            ) : visibleCallDetails?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-350px)]">
                <p className="text-gray-500 text-lg font-medium">
                  NO Recent Calls Found
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {debouncedSearch?.trim() || selectedStatus !== "ALL"
                    ? "Try changing your search or filter criteria"
                    : "No recent calls available for this week"}
                </p>
              </div>
            ) : (
              <table className="w-full border-collapse border border-gray-200 text-left text-sm">
                <thead className="sticky top-0 bg-secondary text-white z-10">
                  <tr>
                    <th className="border-b-[1px] border-gray-200 bg-secondary z-20 px-4 py-2 whitespace-nowrap">
                      Caller Number
                    </th>
                    <th className="border-b-[1px] border-gray-200 bg-secondary z-20 px-4 py-2 whitespace-nowrap">
                      Receiver Number
                    </th>
                    <th className="border-b-[1px] border-gray-200 bg-secondary z-20 px-4 py-2 whitespace-nowrap">
                      Date
                    </th>
                    <th className="border-b-[1px] border-gray-200 bg-secondary z-20 px-4 py-2 whitespace-nowrap">
                      Duration
                    </th>
                    <th className="border-b-[1px] border-gray-200 bg-secondary z-20 px-4 py-2 text-right whitespace-nowrap">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCallDetails?.map((call, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border-b-[1px] border-gray-200 px-4 py-2 whitespace-nowrap">
                        <span className="flex items-center gap-4">
                          <span>
                            <img
                              src={getCallStatusIcon(call)}
                              alt="Call Icon"
                              className="max-w-5 h-auto"
                            />
                          </span>
                          <span>
                            {call?.callerName}{" "}
                            {formatUSAPhoneNumber(call?.callerNumber)}
                          </span>
                        </span>
                      </td>
                      <td className="border-b-[1px] border-gray-200 px-4 py-2 whitespace-nowrap">
                        <span>{formatUSAPhoneNumber(call?.receiver)}</span>
                      </td>
                      <td className="border-b-[1px] border-gray-200 px-4 py-2 whitespace-nowrap">
                        {convertCSTToLocalTime(call?.date)}
                      </td>
                      <td className="border-b-[1px] border-gray-200 px-4 py-2 whitespace-nowrap">
                        {formatTimeDuration(call?.duration)}
                      </td>
                      <td className="border-b-[1px] border-gray-200 px-4 py-2 text-right whitespace-nowrap">
                        <span>
                          <ul className="flex items-center justify-end gap-2.5">
                            {isValidForChat(getExternalNumber(call)) && (
                              <li className="relative group chat-icon">
                                <Link
                                  to="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const chatNumber = getExternalNumber(call);
                                    navigate(
                                      `/chat?phoneNumber=${chatNumber}`,
                                      {
                                        state: {
                                          contact: call,
                                        },
                                      }
                                    );
                                  }}
                                >
                                  <img
                                    src={chatIcon}
                                    alt=""
                                    className="max-w-5"
                                  />
                                </Link>
                                <span
                                  className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-50 bg-secondary !text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-lg"
                                  style={{
                                    boxShadow:
                                      "0px 2px 8px rgba(103,48,143,0.15)",
                                  }}
                                >
                                  Chat
                                </span>
                              </li>
                            )}
                            <li className="relative group phone-icon">
                              <Link
                                to="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleCall(call);
                                }}
                              >
                                <img
                                  src={phoneIcon}
                                  alt=""
                                  className="max-w-5"
                                />
                              </Link>
                              <span
                                className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-50 bg-secondary !text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-lg"
                                style={{
                                  boxShadow:
                                    "0px 2px 8px rgba(103,48,143,0.15)",
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
      </div>
    </section>
  );
};

export default RecentCall;
