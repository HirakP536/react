import { useEffect, useRef, useState } from "react";

const DirectionFilterDropdown = ({ directions = [], selectedDirection, onDirectionChange, isLoading = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  
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

  const handleDirectionSelect = (direction) => {
    onDirectionChange(direction);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleResetFilter = () => {
    onDirectionChange("");
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter directions based on search term
  const filteredDirections = searchTerm
    ? directions.filter(direction => 
        direction.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    : directions;

  // All directions option
  const allOption = { id: "", label: "All Directions" };
  
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
            {selectedDirection ? selectedDirection : "All Directions"}
          </span>
          {isLoading && (
            <div className="ml-2 animate-spin h-3 w-3 sm:h-4 sm:w-4 border-t-2 border-secondary rounded-full" />
          )}
        </div>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full sm:w-64 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 sm:max-h-80 overflow-y-auto">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200 sticky top-0 bg-white z-20">
            <input
              type="text"
              placeholder="Search direction..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-3 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-secondary"
              disabled={isLoading}
            />
          </div>
          
          {/* All Directions option */}
          <div
            className={`px-4 py-2 text-sm cursor-pointer hover:bg-secondary hover:text-white border-b border-gray-100 ${
              !selectedDirection ? 'bg-secondary text-white' : ''
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !isLoading && handleResetFilter()}
          >
            {allOption.label}
          </div>
          
          {/* List of directions */}
          {filteredDirections?.length > 0 ? (
            filteredDirections?.map((direction, index) => (
              <div
                key={index}
                className={`px-4 py-2 text-sm cursor-pointer hover:bg-secondary hover:text-white ${
                  selectedDirection === direction ? 'bg-secondary text-white' : ''
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !isLoading && handleDirectionSelect(direction)}
              >
                {direction}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500 text-center">
              No directions found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DirectionFilterDropdown;
