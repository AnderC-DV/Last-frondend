import React from 'react';

const FormSidebar = ({ isOpen, onClose, title, children }) => {
  return (
    <div
      className={`fixed top-0 right-0 h-full w-full md:w-1/2 lg:w-1/3 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-6 overflow-y-auto h-[calc(100vh-65px)]">
        {children}
      </div>
    </div>
  );
};

export default FormSidebar;