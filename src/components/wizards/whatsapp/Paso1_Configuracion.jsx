import React from 'react';

const Paso1_Configuracion = ({ template, setTemplate }) => {
  const handleMetaNameChange = (e) => {
    const newMetaName = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setTemplate(prev => ({
      ...prev,
      meta_template_name: newMetaName
    }));
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuración de la Plantilla</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="meta_template_name" className="block text-sm font-medium text-gray-700">
            Nombre de la Plantilla en Meta
          </label>
          <input
            type="text"
            id="meta_template_name"
            value={template.meta_template_name || ''}
            onChange={handleMetaNameChange}
            required
            className="mt-1 w-full p-2 border rounded-md"
            title="Solo letras minúsculas, números y guiones bajos."
          />
          <p className="text-xs text-gray-500 mt-1">Este nombre debe coincidir con el nombre de la plantilla aprobada por Meta. Solo minúsculas, números y guiones bajos.</p>
        </div>
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
        </div>
      </div>
    </div>
  );
};

export default Paso1_Configuracion;
