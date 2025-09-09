import React from 'react';

const QuickAccessCard = ({ title, description, icon }) => {
  return (
    <div className="group relative cursor-pointer overflow-hidden bg-white/50 p-5 rounded-xl shadow-lg backdrop-blur-sm border border-white/20 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl">
      <div className="flex items-center gap-4">
        {/* Icon Container */}
        <div className="flex-shrink-0">
          {icon}
        </div>
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-800 truncate">
          {title}
        </h3>
      </div>
      {/* Description - appears on hover */}
      <div className="overflow-hidden max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100 group-hover:mt-4 transition-all duration-500 ease-in-out">
        <p className="text-gray-600 text-sm">
          {description}
        </p>
      </div>
    </div>
  );
};

export default QuickAccessCard;
