/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import allCallsIcon from "../../assets/dashboard/allcall1.svg";
import answeredCallIcon from "../../assets/dashboard/answer.svg";
import busyIcon from "../../assets/dashboard/busy.svg";
import didicon from "../../assets/dashboard/did1.svg";
import extensionicon from "../../assets/dashboard/extension.svg";
import missedCallsIcon from "../../assets/dashboard/missedcall.svg";
import noanswerIcon from "../../assets/dashboard/noanswer.svg";
import userIcon from "../../assets/dashboard/user.svg";
import DateFilterDropdown from "../../components/common/DateFilterDropdown";
import DirectionFilterDropdown from "../../components/common/DirectionFilterDropdown";
import ExtensionFilterDropdown from "../../components/common/ExtensionFilterDropdown";
import PieChart from "../../components/common/PieChart";
import StatusFilterDropdown from "../../components/common/StatusFilterDropdown";
import { getChartDataByDirection } from "../../helpers/getChartDataByDirection";
import {
  getCallDetailHandler,
  transformApiData,
} from "../../helpers/transformApiData";
import DashboardSkeleton from "../../skeleton/DashboardSkeleton";
import { fetchDidList } from "../../store/slices/didSlice";
import { fetchExtension } from "../../store/slices/extensionSlice";
import { fetchUserList } from "../../store/slices/userSlice";
import {
  convertCSTToLocalTime,
  convertCSTToLocalTimeReport,
  formatTimeDuration,
  formatUSAPhoneNumber,
} from "../../utils/common";
import { getDateRangeForFilter } from "../../utils/dateFilters";
import Card from "./partials/Card";

const Dashboard = () => {
  const [filteredCallData, setFilteredCallData] = useState([]);
  const [originalCallData, setOriginalCallData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [apiInitLoading, setApiInitLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("today");
  const [dateRange, setDateRange] = useState(() =>
    getDateRangeForFilter("today")
  );
  const userExtension = useSelector(
    (state) => state?.auth?.user?.data?.extension[0].extname
  );
  const [selectedExtension, setSelectedExtension] = useState(userExtension);
  const [filteredExtensions, setFilteredExtensions] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [filteredStatuses, setFilteredStatuses] = useState([]);
  const [selectedDirection, setSelectedDirection] = useState("");
  const [filteredDirections, setFilteredDirections] = useState([]);
  const tableRef = useRef(null);
  const itemsToShow = 20;
  const dispatch = useDispatch();
  const companyTenant = useSelector((state) => state?.auth?.companyCode);
  const incomingChart = getChartDataByDirection(filteredCallData, "Incoming");
  const outgoingChart = getChartDataByDirection(filteredCallData, "Outgoing");

  const userRole = useSelector((state) => state.auth.user?.data?.userType);
  const apiKey = import.meta.env.VITE_API_KEY;
  const extensionData = useSelector((state) => state.extension.data);
  const didData = useSelector((state) => state.did.data);
  const users = useSelector((state) => state?.users);
  const userStatus = useSelector((state) => state?.users?.status);

  const filterDataCache = useRef({ tenant: null, data: null });

  useEffect(() => {
    if (!companyTenant) return;
    filterDataCache.current = { tenant: companyTenant, data: null };
    setInitialLoading(true);
    setSelectedExtension(userExtension);
    setSelectedStatus("");
    setSelectedDirection("");
    setFilteredCallData([]);
    setOriginalCallData([]);
    // Fetch and cache filter data
    (async () => {
      setLoading(true);
      try {
        const filterData = await getCallDetailHandler(
          {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            tenant: companyTenant,
          },
          companyTenant
        );
        filterDataCache.current = { tenant: companyTenant, data: filterData };
        // Set filter options from filterData
        if (filterData && filterData.length > 0) {
          const uniqueExtensions = [
            ...new Set(filterData.map((item) => item.extension)),
          ].filter(Boolean);

          const uniqueDirections = [
            ...new Set(filterData.map((item) => item.direction)),
          ].filter(Boolean);

          const uniqueStatuses = [
            ...new Set(filterData.map((item) => item.status)),
          ]
            .filter(Boolean)
            .filter((status) => status !== "CONGESTION");

          setFilteredExtensions(uniqueExtensions);
          setFilteredDirections(uniqueDirections);
          setFilteredStatuses(uniqueStatuses);
        } else {
          setFilteredExtensions([]);
          setFilteredDirections([]);
          setFilteredStatuses([]);
        }
      } catch (error) {
        console.log("Error fetching call details:", error);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    })();
  }, [companyTenant]);

  useEffect(() => {
    if (!companyTenant) return;
    if (apiInitLoading) return;
    if (!filterDataCache.current.data) return;
    userFilterHandler();
  }, [selectedExtension, companyTenant, apiInitLoading]);

  useEffect(() => {
    if (!companyTenant) return;
    if (
      filterDataCache.current.tenant === companyTenant &&
      filterDataCache.current.data
    ) {
      const filterData = filterDataCache.current.data;
      const uniqueExtensions = [
        ...new Set(filterData.map((item) => item.extension)),
      ].filter(Boolean);

      const uniqueDirections = [
        ...new Set(filterData.map((item) => item.direction)),
      ].filter(Boolean);

      const uniqueStatuses = [...new Set(filterData.map((item) => item.status))]
        .filter(Boolean)
        .filter((status) => status !== "CONGESTION");

      setFilteredExtensions(uniqueExtensions);
      setFilteredDirections(uniqueDirections);
      setFilteredStatuses(uniqueStatuses);
    }
  }, [dateRange.startDate, dateRange.endDate, companyTenant]);

  const handleFilterChange = (filterId) => {
    setDateFilter(filterId);
    const newDateRange = getDateRangeForFilter(filterId);
    setDateRange(newDateRange);
  };
  const handleCustomDateChange = (customDates) => {
    setDateFilter("custom");
    setDateRange(customDates);
  };

  const handleExtensionChange = (extension) => {
    setSelectedExtension(extension);
  };

  const userFilterHandler = async () => {
    try {
      setLoading(true);
      let transformedData = [];
      if (selectedExtension && userRole !== "user") {
        const extensionTenant = selectedExtension;
        const extensionNumber = selectedExtension.split("-")[0];
        const data = await transformApiData({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          extensionNumber,
          extensionTenant,
          tenant: companyTenant,
        });
        transformedData = data;
      } else {
        const extensionTenant = userExtension;
        const extensionNumber = userExtension.split("-")[0];
        const data = await transformApiData({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          extensionNumber,
          extensionTenant,
          tenant: companyTenant,
        });
        transformedData = data;
      }
      setOriginalCallData(transformedData);
      setFilteredCallData(transformedData);
      return transformedData;
    } catch (error) {
      console.log("Error fetching call details:", error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    applyFilters(status, selectedDirection);
  };

  const handleDirectionChange = (direction) => {
    setSelectedDirection(direction);
    applyFilters(selectedStatus, direction);
  };

  const applyFilters = (status, direction) => {
    let filtered = [...originalCallData];

    if (status) {
      filtered = filtered.filter(
        (call) => call.status && call.status === status
      );
    }

    if (direction) {
      filtered = filtered.filter(
        (call) => call.direction && call.direction === direction
      );
    }

    setFilteredCallData(filtered);
  };
  const handleScroll = () => {
    if (!tableRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      const currentLength = filteredCallData.length;

      let sourceData = filteredCallData;
      if (selectedExtension || selectedStatus || selectedDirection) {
        sourceData = filteredCallData?.filter((call) => {
          let matchesExtension = true;
          let matchesStatus = true;
          let matchesDirection = true;

          if (selectedExtension) {
            matchesExtension =
              call.extension && call.extension === selectedExtension;
          }

          if (selectedStatus) {
            matchesStatus = call.status && call.status === selectedStatus;
          }

          if (selectedDirection) {
            matchesDirection =
              call.direction && call.direction === selectedDirection;
          }

          return matchesExtension && matchesStatus && matchesDirection;
        });
      }

      const moreData = sourceData.slice(
        currentLength,
        currentLength + itemsToShow
      );

      if (moreData.length > 0) {
        setFilteredCallData((prev) => [...prev, ...moreData]);
      }
    }
  };
  let isMounted = true;
  const loadAll = async () => {
    try {
      await Promise.all([
        dispatch(fetchExtension({ key: apiKey, companyTenant })),
        dispatch(fetchDidList({ key: apiKey, companyTenant })),
        dispatch(fetchUserList(companyTenant)),
      ]);
      const filterData = await getCallDetailHandler(
        {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          tenant: companyTenant,
        },
        companyTenant
      );
      if (isMounted) {
        filterDataCache.current = { tenant: companyTenant, data: filterData };
        // Set filter options from filterData
        if (filterData && filterData.length > 0) {
          const uniqueExtensions = [
            ...new Set(filterData.map((item) => item.extension)),
          ].filter(Boolean);

          const uniqueDirections = [
            ...new Set(filterData.map((item) => item.direction)),
          ].filter(Boolean);

          const uniqueStatuses = [
            ...new Set(filterData.map((item) => item.status)),
          ]
            .filter(Boolean)
            .filter((status) => status !== "CONGESTION");

          setFilteredExtensions(uniqueExtensions);
          setFilteredDirections(uniqueDirections);
          setFilteredStatuses(uniqueStatuses);
        } else {
          setFilteredExtensions([]);
          setFilteredDirections([]);
          setFilteredStatuses([]);
        }
      }
    } catch (error) {
      console.log("Error loading dashboard data:", error);
    } finally {
      if (isMounted) {
        setApiInitLoading(false);
        setInitialLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!companyTenant) return;
    setApiInitLoading(true);
    loadAll();
    return () => {
      isMounted = false;
    };
  }, [companyTenant, dateRange.startDate, dateRange.endDate]);

  const handleDownloadReport = () => {
    if (!filteredCallData || filteredCallData.length === 0) {
      alert("No data available to download");
      return;
    }

    const headers = [
      "Extension",
      "Caller Name",
      "Caller Number",
      "Receiver",
      "Date & Time",
      "Duration",
      "Direction",
      "Status",
    ];

    const rows = filteredCallData.map((call) => [
      call?.extension || "N/A",
      call?.callerName || "N/A",
      call?.callerNumber || "N/A",
      call?.receiver || "N/A",
      convertCSTToLocalTimeReport(call?.date) || "N/A",
      formatTimeDuration(call?.duration) || "0",
      call?.direction || "N/A",
      call?.status || "N/A",
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) =>
            typeof cell === "string" &&
            (cell.includes(",") || cell.includes('"'))
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          )
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const now = new Date();
    const fileName = `Call_Report_${selectedExtension}_${now.toISOString().split("T")[0]}.csv`;

    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);

    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  };

  if (apiInitLoading) {
    return <DashboardSkeleton userRole={userRole} />;
  }

  return (
    <>
      <section className="w-[calc(100%-32px)] m-4">
        {userRole !== "user" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mb-4">
            <Card
              icon={false}
              title="User"
              imgIcon={userIcon}
              number={userStatus === "failed" ? 0 : users?.users?.length || 0}
            />
            <Card
              icon={false}
              title="Extensions"
              imgIcon={extensionicon}
              number={extensionData || 0}
            />
            <Card
              icon={false}
              title="DID's"
              imgIcon={didicon}
              number={didData}
            />
          </div>
        )}{" "}
        {/* filterBox */}{" "}
        <div
          className="relative flex sm:flex-row flex-col sm:items-center items-start justify-between bg-white rounded-2xl py-2 sm:py-4 px-3 sm:px-6 mb-4"
          style={{ boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)" }}
        >
          {/* Filters Container */}
          <div className=" flex flex-col sm:flex-row flex-wrap sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-0">
            <div className="w-full sm:w-[250px] flex items-center gap-2">
              <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-700 whitespace-nowrap min-w-[85px]">
                Date Range:
              </h3>
              <div className="w-full">
                <DateFilterDropdown
                  selectedFilter={dateFilter}
                  onFilterChange={handleFilterChange}
                  onCustomDateChange={handleCustomDateChange}
                  isLoading={loading}
                />
              </div>
            </div>

            {userRole !== "user" && (
              <div className="w-full sm:w-[250px] flex items-center gap-2">
                <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-700 whitespace-nowrap min-w-[85px]">
                  Extension:
                </h3>
                <div className="w-full">
                  <ExtensionFilterDropdown
                    extensions={filteredExtensions}
                    selectedExtension={selectedExtension}
                    onExtensionChange={handleExtensionChange}
                    isLoading={loading}
                  />
                </div>
              </div>
            )}

            <div className="w-full sm:w-[250px] flex items-center gap-2">
              <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-700 whitespace-nowrap min-w-[85px]">
                Direction:
              </h3>
              <div className="w-full">
                <DirectionFilterDropdown
                  directions={filteredDirections}
                  selectedDirection={selectedDirection}
                  onDirectionChange={handleDirectionChange}
                  isLoading={loading}
                />
              </div>
            </div>

            <div className="w-full sm:w-[250px] flex items-center gap-2">
              <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-700 whitespace-nowrap min-w-[85px]">
                Status:
              </h3>
              <div className="w-full">
                <StatusFilterDropdown
                  statuses={filteredStatuses}
                  selectedStatus={selectedStatus}
                  onStatusChange={handleStatusChange}
                  isLoading={loading}
                />
              </div>
            </div>
          </div>

          {/* Download Button Container */}
          <div className="sm:mt-0 mt-3 sm:w-auto w-full">
            <button
              onClick={handleDownloadReport}
              className="w-full sm:w-auto whitespace-nowrap text-xs sm:text-sm bg-secondary !text-white px-2 sm:px-4 h-8 sm:h-10 rounded-md cursor-pointer"
            >
              Download Report
            </button>
          </div>
        </div>
        {/* Chart section: only show after all API calls are done */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 w-full mb-4">
          {apiInitLoading ? (
            <>
              <div className="relative flex w-full max-w-full bg-white rounded-[12px] h-[300px] animate-pulse p-6">
                <div className="w-full h-full bg-gray-200 rounded-lg"></div>
              </div>
              <div className="relative flex w-full max-w-full bg-white rounded-[12px] h-[300px] animate-pulse p-6">
                <div className="w-full h-full bg-gray-200 rounded-lg"></div>
              </div>
              <div className="relative flex w-full max-w-full bg-white rounded-[12px] h-[300px] animate-pulse p-6">
                <div className="w-full h-full bg-gray-200 rounded-lg"></div>
              </div>
            </>
          ) : (
            <>
              <div
                className="relative flex w-full max-w-full bg-white rounded-[12px]"
                style={{ boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)" }}
              >
                <div className="flex items-center gap-2 w-full">
                  <PieChart
                    title="Incoming Calls"
                    labels={incomingChart.labels}
                    data={incomingChart.data}
                  />
                </div>
              </div>
              <div
                className="relative flex w-full max-w-full bg-white rounded-[12px]"
                style={{ boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)" }}
              >
                <div className="flex items-center gap-2 w-full">
                  <PieChart
                    title="Outgoing Calls"
                    labels={outgoingChart.labels}
                    data={outgoingChart.data}
                  />
                </div>
              </div>
              <div
                className="relative flex w-full max-w-full bg-white rounded-[12px]"
                style={{ boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)" }}
              >
                <div className="flex items-center gap-2 w-full p-3 sm:p-6">
                  <div className="relative grid grid-cols-2 w-full h-full">
                    {filteredStatuses?.length > 0 &&
                      filteredStatuses
                        .filter((status) => {
                          const count =
                            filteredCallData?.filter(
                              (call) => call.status === status
                            )?.length || 0;
                          return count > 0;
                        })
                        .map((status, index) => (
                          <div
                            key={index}
                            className={`relative flex flex-col w-full justify-center items-center border-gray-200 ${
                              index === 0 || index === 2 ? "border-r-[1px]" : ""
                            } ${
                              index === 0 || index === 1 ? "border-b-[1px]" : ""
                            }`}
                          >
                            <img
                              src={
                                status === "ANSWERED"
                                  ? answeredCallIcon
                                  : status === "NO ANSWER"
                                  ? noanswerIcon
                                  : status === "BUSY"
                                  ? busyIcon
                                  : status === "FAILED"
                                  ? missedCallsIcon
                                  : allCallsIcon
                              }
                              className="w-6 h-6 sm:w-10 sm:h-10 mb-2 sm:mb-3.5"
                              alt=""
                            />
                            <p className="text-sm sm:text-base">
                              {filteredCallData?.filter(
                                (call) => call.status === status
                              )?.length || 0}
                            </p>
                            <h5 className="text-xs sm:text-sm">{status}</h5>
                          </div>
                        ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <div
          className="relative block w-full bg-white rounded-[12px] p-2 sm:p-4"
          style={{ boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)" }}
        >
          <div
            ref={tableRef}
            onScroll={handleScroll}
            className="relative block w-full overflow-y-auto max-h-[500px] overflowScroll"
          >
            <table className="w-full border-collapse border border-gray-200 text-left text-xs sm:text-sm">
              <thead className="sticky top-0 bg-secondary text-white z-10">
                <tr>
                  <th className="border-b-[1px] border-gray-200 px-2 sm:px-4 py-1 sm:py-2 whitespace-nowrap text-xs sm:text-sm">
                    Extension
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-2 sm:px-4 py-1 sm:py-2 whitespace-nowrap text-xs sm:text-sm">
                    Caller Name
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-2 sm:px-4 py-1 sm:py-2 whitespace-nowrap text-xs sm:text-sm">
                    Caller Number
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-2 sm:px-4 py-1 sm:py-2 text-right whitespace-nowrap text-xs sm:text-sm">
                    Receiver
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-2 sm:px-4 py-1 sm:py-2 text-right whitespace-nowrap text-xs sm:text-sm">
                    Date & Time
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-2 sm:px-4 py-1 sm:py-2 text-right whitespace-nowrap text-xs sm:text-sm">
                    Duration
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-2 sm:px-4 py-1 sm:py-2 text-right whitespace-nowrap text-xs sm:text-sm">
                    Direction
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-2 sm:px-4 py-1 sm:py-2 text-right whitespace-nowrap text-xs sm:text-sm">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {initialLoading && filteredCallData < 0 ? (
                  <>
                    {[...Array(5)].map((_, index) => (
                      <tr key={index} className="animate-pulse">
                        {[...Array(8)].map((_, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="border-b-[1px] border-gray-200 px-2 sm:px-4 py-1 sm:py-2"
                          >
                            <span className="h-4 bg-gray-200 rounded w-24"></span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ) : loading ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="border-b-[1px] border-gray-200 px-4 py-4 text-center"
                    >
                      <span className="flex justify-center items-center">
                        <span className="animate-spin h-5 w-5 mr-2 border-t-2 border-b-2 border-secondary rounded-full"></span>
                        Loading call data...
                      </span>
                    </td>
                  </tr>
                ) : !loading &&
                  filteredCallData &&
                  filteredCallData?.length > 0 ? (
                  filteredCallData?.map((call, index) => (
                    <tr key={index}>
                      <td className="border-b-[1px] border-gray-200 px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm">
                        {call?.extension || "N/A"}
                      </td>
                      <td className="border-b-[1px] border-gray-200 px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm">
                        {call?.callerName || "N/A"}
                      </td>
                      <td className="border-b-[1px] border-gray-200 px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm">
                        {formatUSAPhoneNumber(call?.callerNumber) || "N/A"}
                      </td>
                      <td className="border-b-[1px] border-gray-200 px-2 sm:px-4 py-1 sm:py-2 text-right text-xs sm:text-sm">
                        {formatUSAPhoneNumber(call?.receiver) || "N/A"}
                      </td>
                      <td className="border-b-[1px] border-gray-200 px-2 sm:px-4 py-1 sm:py-2 text-right text-xs sm:text-sm">
                        {convertCSTToLocalTime(call?.date) || "N/A"}
                      </td>
                      <td className="border-b-[1px] border-gray-200 px-2 sm:px-4 py-1 sm:py-2 text-right text-xs sm:text-sm">
                        {formatTimeDuration(call?.duration) || "0"}
                      </td>
                      <td className="border-b-[1px] border-gray-200 px-2 sm:px-4 py-1 sm:py-2 text-right text-xs sm:text-sm">
                        {call?.direction || "N/A"}
                      </td>
                      <td className="border-b-[1px] border-gray-200 px-2 sm:px-4 py-1 sm:py-2 text-right text-xs sm:text-sm">
                        {call?.status || "N/A"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      className="border-b-[1px] border-gray-200 px-4 py-4 text-center"
                    >
                      {getNoDataMessage()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );

  // Helper function to get appropriate message based on filters
  function getNoDataMessage() {
    const hasExtension = !!selectedExtension;
    const hasStatus = !!selectedStatus;
    const hasDirection = !!selectedDirection;

    if (hasExtension && hasStatus && hasDirection) {
      return (
        <>
          No call details available for extension
          <strong>{selectedExtension}</strong> with direction
          <strong>{selectedDirection}</strong> and status
          <strong>{selectedStatus}</strong>
        </>
      );
    } else if (hasExtension && hasStatus) {
      return (
        <>
          No call details available for extension
          <strong>{selectedExtension}</strong> with status
          <strong>{selectedStatus}</strong>
        </>
      );
    } else if (hasExtension && hasDirection) {
      return (
        <>
          No call details available for extension
          <strong>{selectedExtension}</strong> with direction
          <strong>{selectedDirection}</strong>
        </>
      );
    } else if (hasStatus && hasDirection) {
      return (
        <>
          No call details available with direction
          <strong>{selectedDirection}</strong> and status
          <strong>{selectedStatus}</strong>
        </>
      );
    } else if (hasExtension) {
      return (
        <>
          No call details available for extension
          <strong>{selectedExtension}</strong>
        </>
      );
    } else if (hasStatus) {
      return (
        <>
          No call details available with status
          <strong>{selectedStatus}</strong>
        </>
      );
    } else if (hasDirection) {
      return (
        <>
          No call details available with direction
          <strong>{selectedDirection}</strong>
        </>
      );
    } else {
      return <>No call details available for the selected date range</>;
    }
  }
};

export default Dashboard;
