import { useEffect, useRef, useState } from "react";

const ExtensionFilterDropdown = ({ extensions, selectedExtension, onExtensionChange, isLoading = false }) => {
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

  // Filter and validate extensions
  const validExtensions = extensions?.filter(ext => {
    if (!ext || ext === 'N/A' || ext === 'Voicemail') return false;
    
    const pattern = /^\d+-[A-Za-z]+$/;
    return pattern.test(ext);
  }).sort((a, b) => {
    // Extract numbers from extensions for numeric sorting
    const numA = parseInt(a.split('-')[0]);
    const numB = parseInt(b.split('-')[0]);
    return numA - numB;
  });

  useEffect(() => {
    if (validExtensions?.length > 0 && !selectedExtension) {
      onExtensionChange(validExtensions?.[0]);
    }
  }, [validExtensions, selectedExtension, onExtensionChange]);

  const handleExtensionSelect = (extension) => {
    onExtensionChange(extension);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter extensions based on search term
  const filteredExtensions = searchTerm
    ? validExtensions.filter(ext => 
        ext.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    : validExtensions;

  
  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className={`flex items-center justify-between px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-gray-200 rounded-md bg-white cursor-pointer ${
          isLoading ? "opacity-75" : ""
        }`}
        onClick={() => !isLoading && setIsOpen(!isOpen)}>
        <div className="flex items-center overflow-hidden">
          <span className="text-xs sm:text-sm font-medium truncate max-w-[100px] sm:max-w-[120px] md:max-w-[150px] lg:max-w-none">
            {selectedExtension ? `${selectedExtension}` : "All Extensions"}
          </span>
          {isLoading && (
            <div className="ml-2 animate-spin h-3 w-3 sm:h-4 sm:w-4 border-t-2 border-secondary rounded-full" />
          )}
        </div>
        <svg 
          className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isOpen ? "transform rotate-180" : ""}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full min-w-[200px] mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[180px] sm:max-h-[250px] md:max-h-[300px] overflow-y-auto overflowScroll">
          <div className="sticky top-0 p-2 border-b border-gray-200 bg-white z-20">
            <input
              type="text"
              placeholder="Search extension..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-200 rounded focus:outline-none focus:border-secondary"
              disabled={isLoading}
            />
          </div>
          
          {filteredExtensions?.length > 0 ? (
            filteredExtensions.map((extension, index) => (
              <div
                key={index}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm cursor-pointer hover:bg-secondary hover:text-white ${
                  selectedExtension === extension ? 'bg-secondary text-white' : ''
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !isLoading && handleExtensionSelect(extension)}
              >
                {extension}
              </div>
            ))
          ) : (
            <div className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-500 text-center">
              No extensions found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExtensionFilterDropdown;
