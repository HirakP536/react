/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import allCallsIcon from "../../assets/dashboard/allcall1.svg";
import answeredCallIcon from "../../assets/dashboard/answer.svg";
import didicon from "../../assets/dashboard/did1.svg";
import extensionicon from "../../assets/dashboard/extension.svg";
import missedCallsIcon from "../../assets/dashboard/missedcall.svg";
import userIcon from "../../assets/dashboard/user.svg";
import DateFilterDropdown from "../../components/common/DateFilterDropdown";
import DirectionFilterDropdown from "../../components/common/DirectionFilterDropdown";
import ExtensionFilterDropdown from "../../components/common/ExtensionFilterDropdown";
import StatusFilterDropdown from "../../components/common/StatusFilterDropdown";
import PieChart from "../../components/common/PieChart";
import DashboardSkeleton from "../../skeleton/DashboardSkeleton";
import { getChartDataByDirection } from "../../helpers/getChartDataByDirection";
import { transformApiData } from "../../helpers/transformApiData";
import { fetchDidList } from "../../store/slices/didSlice";
import { fetchExtension } from "../../store/slices/extensionSlice";
import { fetchUserList } from "../../store/slices/userSlice";
import { formatTimeDuration } from "../../utils/common";
import { getDateRangeForFilter } from "../../utils/dateFilters";
import Card from "./partials/Card";

const Dashboard = () => {
  const [allCallDetails, setAllCallDetails] = useState([]);
  const [visibleCallDetails, setVisibleCallDetails] = useState([]);
  const [filteredCallData, setFilteredCallData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("week");
  const [dateRange, setDateRange] = useState(() =>
    getDateRangeForFilter("week")
  );
  const [selectedExtension, setSelectedExtension] = useState("");
  const [filteredExtensions, setFilteredExtensions] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [filteredStatuses, setFilteredStatuses] = useState([]);
  const [selectedDirection, setSelectedDirection] = useState("");
  const [filteredDirections, setFilteredDirections] = useState([]);
  const tableRef = useRef(null);
  const itemsToShow = 20;
  const dispatch = useDispatch();
  const companyTenant = useSelector(
    (state) => state?.auth?.selectedOrganization?.code
  );
  const extensionTenant = useSelector((state) => state.auth?.user?.data?.city);
  const extensionNumber = extensionTenant?.split("-")[0];
  const tenant = useSelector(
    (state) => state.auth?.selectedOrganization?.companyName
  );
  const userCompanyCode = useSelector(
    (state) => state.auth?.user?.data?.company?.code
  );
  const incomingChart = getChartDataByDirection(filteredCallData, "Incoming");
  const outgoingChart = getChartDataByDirection(filteredCallData, "Outgoing");

  const userRole = useSelector((state) => state.auth.user?.data?.userType);
  const apiKey = import.meta.env.VITE_API_KEY;
  // Get data from Redux store
  const extensionData = useSelector((state) => state.extension.data);
  const didData = useSelector((state) => state.did.data);

  const didList = didData ? didData.filter((item) => item?.[11] !== "f") : [];
  const users = useSelector((state) => state?.users);
  const userStatus = useSelector((state) => state?.users?.status);
  const userDataHandler = async () => {
    try {
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
      // Initialize with first batch of records
      setVisibleCallDetails(response.slice(0, itemsToShow));
      setFilteredCallData(response);
      return response;
    } catch (error) {
      console.log("Error in userDataHandler:", error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // Handle date filter change
  const handleFilterChange = (filterId) => {
    setDateFilter(filterId);
    const newDateRange = getDateRangeForFilter(filterId);
    setDateRange(newDateRange);
  }; // Handle custom date range change
  const handleCustomDateChange = (customDates) => {
    setDateFilter("custom");
    setDateRange(customDates);
  };
  // Handle extension filter change
  const handleExtensionChange = (extension) => {
    setSelectedExtension(extension);
    applyFilters(extension, selectedStatus, selectedDirection);
  };
  // Handle status filter change
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    applyFilters(selectedExtension, status, selectedDirection);
  };

  // Handle direction filter change
  const handleDirectionChange = (direction) => {
    setSelectedDirection(direction);
    applyFilters(selectedExtension, selectedStatus, direction);
  };

  // Apply all filters
  const applyFilters = (extension, status, direction) => {
    let filtered = [...allCallDetails];

    // Apply extension filter if provided
    if (extension) {
      filtered = filtered.filter(
        (call) => call.extension && call.extension === extension
      );
    }

    // Apply status filter if provided
    if (status) {
      filtered = filtered.filter(
        (call) => call.status && call.status === status
      );
    }

    // Apply direction filter if provided
    if (direction) {
      filtered = filtered.filter(
        (call) => call.direction && call.direction === direction
      );
    }

    setVisibleCallDetails(filtered.slice(0, itemsToShow));
    setFilteredCallData(filtered);
  };
  const handleScroll = () => {
    if (!tableRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      // When user scrolls to bottom, load more data
      const currentLength = visibleCallDetails.length;

      let sourceData = allCallDetails; // Apply current filters to source data for pagination
      if (selectedExtension || selectedStatus || selectedDirection) {
        sourceData = allCallDetails.filter((call) => {
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

      // Get the next batch of data
      const moreData = sourceData.slice(
        currentLength,
        currentLength + itemsToShow
      );

      if (moreData.length > 0) {
        setVisibleCallDetails((prev) => [...prev, ...moreData]);
      }
    }
  };

  const extensionhandler = () => {
    if (!companyTenant) return;
    dispatch(fetchExtension({ key: apiKey, companyTenant }));
  };

  const didHandler = () => {
    dispatch(fetchDidList({ key: apiKey, companyTenant }));
  };
  useEffect(() => {
    if (!companyTenant) return;
    extensionhandler();
    didHandler();
    dispatch(fetchUserList(companyTenant));
  }, [dispatch, companyTenant]);
  useEffect(() => {
    if (!extensionNumber || !tenant) return;
    userDataHandler();
  }, [
    extensionNumber,
    extensionTenant,
    tenant,
    dateRange.startDate,
    dateRange.endDate,
  ]); // Apply filters when allCallDetails or filters change
  useEffect(() => {
    if (allCallDetails.length > 0) {
      applyFilters(selectedExtension, selectedStatus, selectedDirection);
    }
  }, [
    allCallDetails,
    selectedExtension,
    selectedStatus,
    selectedDirection,
    itemsToShow,
  ]);

  // Extract unique extensions from call data
  useEffect(() => {
    if (allCallDetails && allCallDetails.length > 0) {
      const extensions = new Set();

      allCallDetails.forEach((call) => {
        // Add extension if it exists and is not empty
        if (call.extension && call.extension.trim()) {
          extensions.add(call.extension.trim());
        }
      });

      // Convert to array, remove any empty strings, and sort
      const extensionsArray = Array.from(extensions)
        .filter((ext) => ext && ext.length > 0)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      setFilteredExtensions(extensionsArray);
    } else {
      setFilteredExtensions([]);
    }
  }, [allCallDetails]);
  // Extract unique statuses from call data
  useEffect(() => {
    if (allCallDetails && allCallDetails.length > 0) {
      const statuses = new Set();

      allCallDetails.forEach((call) => {
        // Add status if it exists and is not empty
        if (call.status && call.status.trim()) {
          statuses.add(call.status.trim());
        }
      });

      // Convert to array, remove any empty strings, and sort
      const statusesArray = Array.from(statuses)
        .filter((status) => status && status.length > 0)
        .sort();

      setFilteredStatuses(statusesArray);
    } else {
      setFilteredStatuses([]);
    }
  }, [allCallDetails]);

  // Extract unique directions from call data
  useEffect(() => {
    if (allCallDetails && allCallDetails.length > 0) {
      const directions = new Set();

      allCallDetails.forEach((call) => {
        // Add direction if it exists and is not empty
        if (call.direction && call.direction.trim()) {
          directions.add(call.direction.trim());
        }
      });

      // Convert to array, remove any empty strings, and sort
      const directionsArray = Array.from(directions)
        .filter((direction) => direction && direction.length > 0)
        .sort();

      // If we found directions in the data, use them
      if (directionsArray.length > 0) {
        setFilteredDirections(directionsArray);
      } else {
        // Default to Incoming and Outgoing if no directions found in data
        setFilteredDirections(["Incoming", "Outgoing"]);
      }
    } else {
      // Default to Incoming and Outgoing if no call details
      setFilteredDirections(["Incoming", "Outgoing"]);
    }
  }, [allCallDetails]);

  // download report button functionality can be implemented here
  const handleDownloadReport = () => {
    if (!filteredCallData || filteredCallData.length === 0) {
      alert("No data available to download");
      return;
    }

    // CSV header
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

    // Format the data for CSV
    const rows = filteredCallData.map((call) => [
      call?.extension || "N/A",
      call?.callerName || "N/A",
      call?.callerNumber || "N/A",
      call?.receiver || "N/A",
      call?.date || "N/A",
      formatTimeDuration(call?.duration) || "0",
      call?.direction || "N/A",
      call?.status || "N/A",
    ]);

    // Add header row to the beginning
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) =>
            // Handle commas and quotes in the data
            typeof cell === "string" &&
            (cell.includes(",") || cell.includes('"'))
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          )
          .join(",")
      ),
    ].join("\n");

    // Create a Blob with the CSV data
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary link to trigger the download
    const link = document.createElement("a");

    // Generate filename with current date
    const now = new Date();
    const fileName = `Call_Report_${now.toISOString().split("T")[0]}.csv`;

    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);

    // Trigger download
    link.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  };

  if (initialLoading) {
    return <DashboardSkeleton userRole={userRole} />;
  }

  return (
    <>
      <section className="w-[calc(100%-32px)] m-4">
        {userRole !== "user" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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
              number={didList}
            />
          </div>
        )}{" "}
        {/* filterBox */}{" "}
        <div
          className="relative flex items-center justify-between bg-white rounded-2xl py-4 px-6 mb-4"
          style={{ boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)" }}
        >
          {" "}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-700">
                Date Range:
              </h3>{" "}
              <DateFilterDropdown
                selectedFilter={dateFilter}
                onFilterChange={handleFilterChange}
                onCustomDateChange={handleCustomDateChange}
                isLoading={loading}
              />
            </div>
            {userRole !== "user" && (
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-700">
                  Extension:
                </h3>{" "}
                <ExtensionFilterDropdown
                  extensions={filteredExtensions}
                  selectedExtension={selectedExtension}
                  onExtensionChange={handleExtensionChange}
                  isLoading={loading}
                />{" "}
              </div>
            )}
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-700">
                Direction:
              </h3>{" "}
              <DirectionFilterDropdown
                directions={filteredDirections}
                selectedDirection={selectedDirection}
                onDirectionChange={handleDirectionChange}
                isLoading={loading}
              />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-700">Status:</h3>{" "}
              <StatusFilterDropdown
                statuses={filteredStatuses}
                selectedStatus={selectedStatus}
                onStatusChange={handleStatusChange}
                isLoading={loading}
              />
            </div>
          </div>
          <button onClick={handleDownloadReport} className="text-sm bg-secondary !text-white px-4 h-10 rounded-md cursor-pointer">
            Download Report
          </button>
        </div>
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full mb-4">
          {initialLoading ? (
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
                <div className="flex items-center gap-2 w-full p-6">
                  {" "}
                  <div className="relative flex w-1/2 h-full justify-center items-center flex-col border-r-[1px] border-gray-200">
                    <img
                      src={allCallsIcon}
                      className="max-w-10 mb-3.5"
                      alt=""
                    />
                    <p>{filteredCallData?.length || 0}</p>
                    <h5>ALL Call</h5>
                  </div>
                  <div className="relative flex flex-col w-1/2 h-full">
                    <div className="flex flex-col items-center w-full h-1/2 justify-center border-b-[1px] border-gray-200">
                      <img
                        src={answeredCallIcon}
                        className="max-w-10 mb-3.5"
                        alt=""
                      />
                      <p>
                        {filteredCallData?.filter(
                          (call) => call.status === "ANSWERED"
                        )?.length || 0}
                      </p>
                      <h5>Answered Call</h5>
                    </div>
                    <div className="flex flex-col items-center w-full h-1/2 justify-center">
                      <img
                        src={missedCallsIcon}
                        className="max-w-10 mb-3.5"
                        alt=""
                      />
                      <p>
                        {filteredCallData?.filter(
                          (call) => call.status === "NO ANSWER"
                        )?.length || 0}
                      </p>
                      <h5>Missed Calls</h5>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        {/* {userRole !== "user" && ( */}
        <div
          ref={tableRef}
          onScroll={handleScroll}
          className="relative block w-full bg-white rounded-[12px] p-4 overflow-y-auto max-h-[500px] overflowScroll"
          style={{ boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)" }}
        >
          {" "}
          <table className="w-full border-collapse border border-gray-200 text-left text-sm">
            <thead className="sticky top-0 bg-secondary text-white z-10">
              <tr>
                <th className="border-b-[1px] border-gray-200 px-4 py-2">
                  Extension
                </th>
                <th className="border-b-[1px] border-gray-200 px-4 py-2">
                  Caller Name
                </th>
                <th className="border-b-[1px] border-gray-200 px-4 py-2">
                  Caller Number
                </th>
                <th className="border-b-[1px] border-gray-200 px-4 py-2 text-right">
                  Receiver
                </th>
                <th className="border-b-[1px] border-gray-200 px-4 py-2 text-right">
                  Date & Time
                </th>
                <th className="border-b-[1px] border-gray-200 px-4 py-2 text-right">
                  Duration
                </th>
                <th className="border-b-[1px] border-gray-200 px-4 py-2 text-right">
                  Direction
                </th>
                <th className="border-b-[1px] border-gray-200 px-4 py-2 text-right">
                  Status
                </th>
              </tr>
            </thead>{" "}
            <tbody>
              {initialLoading ? (
                <>
                  {[...Array(5)].map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      {[...Array(8)].map((_, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="border-b-[1px] border-gray-200 px-4 py-2"
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
              ) : visibleCallDetails && visibleCallDetails?.length > 0 ? (
                visibleCallDetails?.map((call, index) => (
                  <tr key={index}>
                    <td className="border-b-[1px] border-gray-200 px-4 py-2">
                      {call?.extension || "N/A"}
                    </td>
                    <td className="border-b-[1px] border-gray-200 px-4 py-2">
                      {call?.callerName || "N/A"}
                    </td>
                    <td className="border-b-[1px] border-gray-200 px-4 py-2">
                      {call?.callerNumber || "N/A"}
                    </td>
                    <td className="border-b-[1px] border-gray-200 px-4 py-2 text-right">
                      {call?.receiver || "N/A"}
                    </td>
                    <td className="border-b-[1px] border-gray-200 px-4 py-2 text-right">
                      {call?.date || "N/A"}
                    </td>
                    <td className="border-b-[1px] border-gray-200 px-4 py-2 text-right">
                      {formatTimeDuration(call?.duration) || "0"}
                    </td>
                    <td className="border-b-[1px] border-gray-200 px-4 py-2 text-right">
                      {call?.direction || "N/A"}
                    </td>
                    <td className="border-b-[1px] border-gray-200 px-4 py-2 text-right">
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
        {/* )} */}
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
