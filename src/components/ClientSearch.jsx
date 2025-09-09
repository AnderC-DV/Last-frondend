import React from 'react';

const ClientSearch = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
      <h2 className="text-lg font-semibold text-gray-800">Encuentra un Cliente</h2>
      <p className="text-sm text-gray-500 mb-4">Busca un cliente por su nombre o número de identificación para acceder a su Vista 360°</p>
      <div className="flex">
        <input 
          type="text" 
          placeholder="Nombre del cliente o número de identificación..." 
          className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button className="bg-gray-800 text-white px-6 py-2 rounded-r-md hover:bg-gray-700">
          Buscar
        </button>
      </div>
    </div>
  );
};

export default ClientSearch;
