import { useEffect, useRef, useState } from "react";

const ExtensionFilterDropdown = ({ extensions = [], selectedExtension, onExtensionChange, isLoading = false }) => {
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

  const handleExtensionSelect = (extension) => {
    onExtensionChange(extension);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleResetFilter = () => {
    onExtensionChange("");
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter extensions based on search term
  const filteredExtensions = searchTerm
    ? extensions.filter(ext => 
        ext.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    : extensions;

  // All extensions option
  const allOption = { id: "", label: "All Extensions" };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className={`flex items-center justify-between px-4 py-2 border border-gray-200 rounded-md bg-white cursor-pointer ${isLoading ? 'opacity-75' : ''}`}
        onClick={() => !isLoading && setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <span className="text-sm font-medium">
            {selectedExtension ? `Extension: ${selectedExtension}` : 'All Extensions'}
          </span>
          {isLoading && (
            <div className="ml-2 animate-spin h-4 w-4 border-t-2 border-secondary rounded-full"></div>
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
        <div className="absolute z-10 w-64 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200 sticky top-0 bg-white z-20">
            <input
              type="text"
              placeholder="Search extension..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-3 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-secondary"
              disabled={isLoading}
            />
          </div>
          
          {/* All Extensions option */}
          <div
            className={`px-4 py-2 text-sm cursor-pointer hover:bg-secondary hover:text-white border-b border-gray-100 ${
              !selectedExtension ? 'bg-secondary text-white' : ''
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !isLoading && handleResetFilter()}
          >
            {allOption.label}
          </div>
          
          {/* List of extensions */}
          {filteredExtensions.length > 0 ? (
            filteredExtensions.map((extension, index) => (
              <div
                key={index}
                className={`px-4 py-2 text-sm cursor-pointer hover:bg-secondary hover:text-white ${
                  selectedExtension === extension ? 'bg-secondary text-white' : ''
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !isLoading && handleExtensionSelect(extension)}
              >
                {extension}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500 text-center">
              No extensions found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExtensionFilterDropdown;
