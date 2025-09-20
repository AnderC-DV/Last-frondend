import React from 'react';

const WppScrollToBottomButton = ({ showScrollButton, onScrollToBottom }) => {
  if (!showScrollButton) return null;

  return (
    <button
      onClick={onScrollToBottom}
      className="absolute bottom-4 right-4 bg-green-500 hover:bg-green-600 text-white rounded-full p-2 shadow-lg transition-all duration-200 ease-in-out transform hover:scale-110 z-10"
      title="Ir al último mensaje"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
    </button>
  );
};

export default WppScrollToBottomButton;