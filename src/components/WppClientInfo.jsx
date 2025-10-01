import React from 'react';

const WppClientInfo = ({ selectedConversation, userRole }) => {
  const handleViewInAdminfo = () => {
    if (selectedConversation?.client_cedula) {
      // URL placeholder - reemplazar con la URL real de Adminfo
      const adminfoUrl = `https://renovar.adminfo.com/admin/#/clientes/detail/${selectedConversation.client_cedula}`;
      window.open(adminfoUrl, '_blank');
    } else {
      alert('No hay cédula de cliente disponible');
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h2 className="text-xl font-semibold text-gray-800">Información del Cliente</h2>
      </div>
      <div className="flex-1 min-h-0 p-4 space-y-4 overflow-y-auto">
        {(userRole === 'coordinador' || userRole === 'gestor' || userRole === 'Admin') && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2 text-gray-800">Último Resultado</h3>
            <p className="text-gray-700">Promesa de pago</p>
          </div>
        )}
        {(userRole === 'gestor' || userRole === 'Admin') && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2 text-gray-800">Acuerdos</h3>
            <p className="text-gray-700">
              Estado del Acuerdo: <span className="text-green-600 font-semibold">Activo</span>
            </p>
          </div>
        )}
        {(userRole === 'gestor' || userRole === 'Admin') && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2 text-gray-800">Herramientas Internas</h3>
            <button
              onClick={handleViewInAdminfo}
              disabled={!selectedConversation?.client_cedula}
              className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              👁️ Ver en Adminfo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WppClientInfo;