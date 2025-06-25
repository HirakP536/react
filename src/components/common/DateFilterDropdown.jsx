import { useEffect, useRef, useState } from "react";

const DateFilterDropdown = ({
  selectedFilter,
  onFilterChange,
  onCustomDateChange,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customDates, setCustomDates] = useState({
    startDate: "",
    endDate: "",
  });
  const dropdownRef = useRef(null);

  const filters = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "custom", label: "Custom" },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFilterSelect = (filterId) => {
    if (filterId === "custom") {
      setShowCustomDate(true);
    } else {
      setShowCustomDate(false);
      onFilterChange(filterId);
    }
    setIsOpen(false);
  };
  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    if (customDates.startDate && customDates.endDate) {
      const today = new Date();
      const endDate = new Date(customDates.endDate);
      const isEndDateToday =
        endDate.getDate() === today.getDate() &&
        endDate.getMonth() === today.getMonth() &&
        endDate.getFullYear() === today.getFullYear();

      // Format custom dates with time component
      const formattedDates = {
        startDate: `${customDates.startDate} 00:00`,
        endDate: isEndDateToday
          ? `${customDates.endDate} ${String(today.getHours()).padStart(
              2,
              "0"
            )}:${String(today.getMinutes()).padStart(2, "0")}`
          : `${customDates.endDate} 23:59`,
      };

      onCustomDateChange(formattedDates);
      setShowCustomDate(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomDates((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getSelectedLabel = () => {
    if (
      selectedFilter === "custom" &&
      customDates.startDate &&
      customDates.endDate
    ) {
      return `${customDates.startDate} to ${customDates.endDate}`;
    }

    const selected = filters.find((filter) => filter.id === selectedFilter);
    return selected ? selected.label : "Select Date Range";
  };
  return (
    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
      <div
        className={`flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2 border border-gray-200 rounded-md bg-white cursor-pointer ${
          isLoading ? "opacity-75" : ""
        }`}
        onClick={() => !isLoading && setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <span className="text-xs sm:text-sm font-medium truncate max-w-[150px] sm:max-w-none">
            {getSelectedLabel()}
          </span>
          {isLoading && (
            <div className="ml-2 animate-spin h-3 w-3 sm:h-4 sm:w-4 border-t-2 border-secondary rounded-full" />
          )}
        </div>
        <svg
          className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>{" "}
      {isOpen && (
        <div className="absolute z-10 w-full sm:w-48 mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          {filters.map((filter) => (
            <div
              key={filter.id}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm cursor-pointer hover:bg-secondary hover:text-white ${
                selectedFilter === filter.id ? "bg-secondary text-white" : ""
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !isLoading && handleFilterSelect(filter.id)}
            >
              {filter.label}
            </div>
          ))}
        </div>
      )}
      {showCustomDate && (
        <div className="absolute z-10 w-full sm:w-72 p-3 sm:p-4 mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <h3 className="text-xs sm:text-sm font-medium mb-2">Select Date Range</h3>
          <form onSubmit={handleCustomDateSubmit}>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={customDates.startDate}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={customDates.endDate}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                  required
                  min={customDates.startDate}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="px-3 py-1 text-xs border border-gray-300 rounded"
                onClick={() => setShowCustomDate(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-3 py-1 text-xs bg-secondary text-white rounded ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={
                  !customDates.startDate || !customDates.endDate || isLoading
                }
              >
                Apply
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DateFilterDropdown;
