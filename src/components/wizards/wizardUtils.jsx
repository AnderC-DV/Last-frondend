import React from 'react';

// --- Iconos para el canal (versión para Step1 con prop de color) ---
export const WhatsAppIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657A8 8 0 018.343 7.343m9.314 9.314a8 8 0 01-9.314-9.314m0 0A8.003 8.003 0 002 8c0 4.418 3.582 8 8 8 1.26 0 2.45-.293 3.536-.813" /></svg>;
export const SmsIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
export const EMAILIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;

// --- Componente ChannelCard para Step1 ---
export const ChannelCard = ({ icon, title, description, selected, onClick, color }) => {
  const borderColor = selected ? color.border : 'border-gray-200';
  const textColor = selected ? color.text : 'text-gray-800';
  const iconClassName = `h-8 w-8 ${selected ? color.text : 'text-gray-400'}`;
  const iconComponent = React.cloneElement(icon, { className: iconClassName });

  return (
    <div
      onClick={onClick}
      className={`p-6 border-2 ${borderColor} rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-1`}
    >
      <div className="flex flex-col items-center text-center">
        {iconComponent}
        <h3 className={`mt-4 text-lg font-semibold ${textColor}`}>{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
};


// --- Componente de detalle para Step5 ---
export const DetailItem = ({ label, children }) => (
  <div>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <div className="mt-1 text-lg font-semibold text-gray-900">{children}</div>
  </div>
);

// Las funciones de ayuda se han movido a segmentationUtils.js
