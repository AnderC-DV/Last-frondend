import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

// --- Iconos para el menú ---
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const DuplicateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const ReportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2z" /></svg>;
// -------------------------

const MenuPortal = ({ children, coords }) => {
  const el = document.createElement('div');

  useEffect(() => {
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, [el]);

  return ReactDOM.createPortal(
    <div
      className="absolute"
      style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
    >
      {children}
    </div>,
    el
  );
};


const CampaignActionMenu = ({ campaign }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({});
  const buttonRef = useRef(null);

  const handleDuplicate = () => {
    console.log(`Duplicando campaña: ${campaign.name}`);
    setIsOpen(false);
  };

  const handleDelete = () => {
    // Aquí normalmente mostrarías un modal de confirmación
    // y luego despacharías una acción para eliminar la campaña.
    console.log(`Eliminando campaña: ${campaign.name}`);
    setIsOpen(false);
  };

  const handleViewReport = () => {
    console.log(`Viendo reporte de: ${campaign.name}`);
    setIsOpen(false);
  };

  const toggleMenu = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX - 200, // Ajustar para alinear a la derecha
      });
    }
    setIsOpen(!isOpen);
  };

  // Cierra el menú si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (isOpen && buttonRef.current && !buttonRef.current.contains(event.target)) {
            // Se necesita un chequeo más robusto para el portal, pero por ahora cerramos si no es el botón
            setIsOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div>
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className="text-gray-500 hover:text-blue-600 font-bold p-2 rounded-full focus:outline-none"
      >
        •••
      </button>

      {isOpen && (
        <MenuPortal coords={coords}>
            <div className="w-56 bg-white rounded-md shadow-lg z-50 border">
                <ul className="py-1">
                <li>
                    <button
                    onClick={handleDuplicate}
                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                    <DuplicateIcon />
                    Duplicar Campaña
                    </button>
                </li>
                <li>
                    <button
                    onClick={handleViewReport}
                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                    <ReportIcon />
                    Ver Reporte
                    </button>
                </li>
                <hr className="my-1 border-gray-100" />
                <li>
                    <button
                    onClick={handleDelete}
                    className="w-full text-left flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                    <DeleteIcon />
                    Eliminar Campaña
                    </button>
                </li>
                </ul>
            </div>
        </MenuPortal>
      )}
    </div>
  );
};

export default CampaignActionMenu;
