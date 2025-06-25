import { useEffect, useRef } from "react";
import ProfileImage from "../../../components/common/ProfileImage ";
import { formatUSPhone } from "../../../utils/common";
import useOutsideClick from "../../../hooks/useOutsideClick";

const ContactDropdown = ({ contacts, onSelect, isOpen, setIsOpen }) => {
  const dropdownRef = useRef(null);
  
  useOutsideClick(dropdownRef, () => setIsOpen(false));

  useEffect(() => {
    // Close dropdown when Escape key is pressed
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setIsOpen]);
  
  if (!isOpen || !contacts || contacts.length === 0) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute left-0 right-0 top-full mt-1 bg-white rounded-md shadow-lg z-50 max-h-56 overflow-y-auto"
      style={{ boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.15)" }}
    >
      <ul className="py-1">
        {contacts.map((contact) => (
          <li 
            key={contact.id || Math.random()} 
            className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
            onClick={() => {
              onSelect(contact);
              setIsOpen(false);
            }}
          >
            <ProfileImage
              name={`${contact?.firstName || "N"} ${contact?.lastName || ""}`}
              size="32"
              classNameProperty="!text-white bg-secondary"
            />
            <div>
              <p className="font-medium">{`${contact?.firstName || ""} ${contact?.lastName || ""}`}</p>
              <p className="text-xs text-gray-600">{formatUSPhone(contact?.contactPhone)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContactDropdown;
