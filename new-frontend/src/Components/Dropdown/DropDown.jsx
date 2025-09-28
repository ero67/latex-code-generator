import React, { useState, useRef, useEffect } from 'react';

const Dropdown = ({ trigger, menu, className }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle menu items click
  const handleMenuItemClick = (onClick) => {
    setOpen(false);
    if (onClick) onClick();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown trigger button */}
      <div className="cursor-pointer" onClick={() => setOpen(!open)}>
        {trigger}
      </div>
      
      {/* Dropdown menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {menu.map((item, index) => (
              <button
                key={index}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => handleMenuItemClick(item.onClick)}
                role="menuitem"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;