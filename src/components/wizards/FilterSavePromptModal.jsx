import React, { useState, useEffect } from 'react';

/**
 * Modal para preguntar al usuario si desea guardar el filtro antes de lanzar la campaña.
 * Se muestra únicamente cuando el usuario construyó un filtro (definition) pero no seleccionó uno guardado.
 */
const FilterSavePromptModal = ({
  open,
  defaultName,
  onSaveExplicit, // (name, description)
  onSkip,         // Usuario decide NO guardarlo (seguimos flujo normal / autogenerado)
  onCancel,
  loading = false,
}) => {
  const [name, setName] = useState(defaultName || '');
  const [description, setDescription] = useState('');
  const nameTooShort = name.trim().length > 0 && name.trim().length < 3;
  const nameTooLong = name.trim().length > 100;

  useEffect(() => { setName(defaultName || ''); }, [defaultName, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative animate-fade-in">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">¿Guardar el filtro para reutilizarlo?</h3>
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          Has construido un filtro de segmentación pero aún no lo has guardado como reutilizable. Puedes:
        </p>
        <ul className="list-disc list-inside text-gray-600 text-sm mb-4 space-y-1">
          <li><span className="font-medium">Guardarlo</span>: quedará disponible en "Filtros Guardados".</li>
          <li><span className="font-medium">No guardarlo</span>: la campaña se lanzará usando su definición actual. (Se generará internamente un filtro técnico).</li>
        </ul>
        <div className="mb-4 border rounded-lg p-4 bg-gray-50">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Filtro</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Clientes con mora 30-60 días"
            disabled={loading}
          />
          <div className="mt-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Descripción (opcional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notas para otros usuarios..."
              disabled={loading}
            />
          </div>
          {(nameTooShort || nameTooLong) && (
            <div className="mt-2 text-xs text-red-600">
              {nameTooShort && <p>El nombre debe tener mínimo 3 caracteres.</p>}
              {nameTooLong && <p>El nombre debe tener máximo 100 caracteres.</p>}
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <button
            onClick={() => onSaveExplicit(name.trim(), description.trim() || null)}
            disabled={loading || name.trim().length < 3 || nameTooLong}
            className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium text-white transition-colors ${loading || name.trim().length < 3 || nameTooLong ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? 'Guardando...' : 'Guardar y Lanzar'}
          </button>
          <button
            onClick={onSkip}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium border transition-colors ${loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'}`}
          >
            {loading ? 'Procesando...' : 'Lanzar sin Guardar'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2.5 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >Cancelar</button>
        </div>
        <p className="mt-4 text-[11px] text-gray-400 leading-snug">
          Nota: Para lanzar la campaña igualmente se crea un filtro técnico interno necesario para el motor de envío.
        </p>
      </div>
    </div>
  );
};

export default FilterSavePromptModal;
