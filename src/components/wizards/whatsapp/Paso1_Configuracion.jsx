import React from 'react';

const Paso1_Configuracion = ({ template, setTemplate }) => {
  const categoryDescriptions = {
    MARKETING: "Para promocionar productos o servicios. Ej: ofertas, anuncios de nuevos productos, etc.",
    UTILITY: "Para comunicar algo importante sobre una transacción en curso. Ej: confirmaciones de pedidos, actualizaciones de envío, etc.",
    AUTHENTICATION: "Para enviar códigos de autenticación para el inicio de sesión. Ej: códigos de un solo uso, verificación de cuenta, etc."
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuración de la Plantilla</h3>
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Categoría
          </label>
          <select
            id="category"
            value={template.category || 'UTILITY'}
            onChange={e => setTemplate({ ...template, category: e.target.value })}
            className="mt-1 w-full p-2 border rounded-md bg-white"
          >
            <option value="AUTHENTICATION">Autenticación</option>
            <option value="MARKETING">Marketing</option>
            <option value="UTILITY">Utilidad</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {categoryDescriptions[template.category || 'UTILITY']}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Paso1_Configuracion;
