import React from 'react';

const WppClientInfo = () => {
  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h2 className="text-xl font-semibold text-gray-800">Información del Cliente</h2>
      </div>
      <div className="flex-1 min-h-0 p-4 space-y-4 overflow-y-auto">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-2 text-gray-800">Último Resultado</h3>
          <p className="text-gray-700">Promesa de pago</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-2 text-gray-800">Acuerdos</h3>
          <p className="text-gray-700">
            Estado del Acuerdo: <span className="text-green-600 font-semibold">Activo</span>
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-2 text-gray-800">Herramientas Internas</h3>
          <div className="grid grid-cols-2 gap-2">
            <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              📝 Notas
            </button>
            <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              ✅ Tareas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WppClientInfo;