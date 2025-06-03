import { useEffect } from "react";

const useOutsideClick = (ref, onClose) => {
  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [ref, onClose]);
};

// Add custom checkbox styling globally (this only needs to run once)
(() => {
  // Check if style already exists to prevent duplicates
  if (!document.getElementById('custom-checkbox-styles')) {
    const style = document.createElement('style');
    style.id = 'custom-checkbox-styles';
    style.innerHTML = `
      /* Custom checkbox color */
      input[type="checkbox"]:checked {
        accent-color: #67308F;
        border-color: #67308F;
      }
      
      input[type="checkbox"]:focus {
        --tw-ring-color: #67308F;
      }
    `;
    document.head.appendChild(style);
  }
})();

export default useOutsideClick;
