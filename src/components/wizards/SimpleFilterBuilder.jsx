import React, { useState, useEffect } from 'react';
import { getAvailableFilterFields, getSimpleClientCount, createSimpleFilter, getDistinctValues } from '../../services/api';
import AudienceFilterSimpleCreate from '../../schemas/AudienceFilterSimpleCreate';
import { segmentationOperators } from './segmentationUtils';
import { toast } from 'sonner';

// --- Sub-componentes ---
const ConditionRow = ({ condition, onConditionChange, onRemove, fields, operators, path }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isMultiValueOperator = ['in', 'not_in'].includes(condition.operator);
  const isNoValueOperator = ['is_null', 'is_not_null'].includes(condition.operator);
  // Detectar si el campo seleccionado es de tipo fecha según metadata del backend o por heurística del nombre
  const fieldMeta = fields.find(f => f.variable_name === condition.field);
  const isDateField = !!fieldMeta && (
    fieldMeta.data_type === 'date' || /fecha|date/i.test(fieldMeta.variable_name) || /fecha|date/i.test(fieldMeta.description || '')
  );

  useEffect(() => {
    // Reset value based on operator type when operator changes
    if (isMultiValueOperator && !Array.isArray(condition.value)) {
      onConditionChange(path, 'value', []);
    } else if (isNoValueOperator && condition.value !== null) {
      onConditionChange(path, 'value', null);
    } else if (!isMultiValueOperator && !isNoValueOperator && (condition.value === null || Array.isArray(condition.value))) {
      onConditionChange(path, 'value', '');
    }
    // No need to re-fetch distinct values here, it's handled by handleFieldChange
  }, [condition.operator, path, isMultiValueOperator, isNoValueOperator, condition.value]); // Depend on operator and path

  const handleFieldChange = async (e) => {
    const newField = e.target.value;
    onConditionChange(path, 'field', newField);
    // Reset value to a generic empty state, useEffect will refine based on operator
    onConditionChange(path, 'value', ''); 
    onConditionChange(path, 'distinctValues', []); // Clear distinct values for new field

    if (newField && !isNoValueOperator) { // Fetch distinct values if field is selected and operator requires a value
      try {
        const distinctValues = await getDistinctValues(newField);
        onConditionChange(path, 'distinctValues', distinctValues);
      } catch (error) {
        console.error(`Error fetching distinct values for ${newField}:`, error);
        onConditionChange(path, 'distinctValues', []);
      }
    }
  };

  const handleMultiSelectChange = (valueToToggle) => {
    const currentValues = Array.isArray(condition.value) ? condition.value : [];
    const newValue = currentValues.includes(valueToToggle)
      ? currentValues.filter(v => v !== valueToToggle)
      : [...currentValues, valueToToggle];
    onConditionChange(path, 'value', newValue);
  };

  const handleSingleValueChange = (e) => {
    let val = e.target.value;
    // Normalizar formato de fecha AAAA-MM-DD si es campo fecha
    if (isDateField && val) {
      // El input type="date" ya entrega AAAA-MM-DD, pero normalizamos por seguridad
      const m = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) val = `${m[1]}-${m[2]}-${m[3]}`;
    }
    onConditionChange(path, 'value', val);
  };

  const renderValueInput = () => {
    if (isNoValueOperator) {
      return <span className="text-sm text-gray-500 italic">No requiere valor</span>;
    } else if (isMultiValueOperator && condition.distinctValues && condition.distinctValues.length > 0) {
      const selectedValues = Array.isArray(condition.value) ? condition.value : [];
      const displayValue = selectedValues.length > 0
        ? selectedValues.join(', ')
        : 'Seleccionar Valores';

      return (
        <div className="relative">
          <button
            type="button"
            className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm text-left flex justify-between items-center focus:ring focus:ring-blue-200 focus:border-blue-400"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className={selectedValues.length === 0 ? 'text-gray-500' : ''}>
              {displayValue}
            </span>
            <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
          {isDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {condition.distinctValues.map(v => (
                <label key={v} className="flex items-center p-2 hover:bg-gray-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(v)}
                    onChange={() => handleMultiSelectChange(v)}
                    className="form-checkbox h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="ml-2 text-sm">{v}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      );
    } else if (!isMultiValueOperator && !isNoValueOperator && isDateField) {
      return (
        <input
          type="date"
          value={condition.value || ''}
          onChange={handleSingleValueChange}
          className="w-full p-2 border rounded-md text-sm"
        />
      );
    } else if (condition.distinctValues && condition.distinctValues.length > 0) {
      return (
        <select value={condition.value} onChange={handleSingleValueChange} className="w-full p-2 border rounded-md bg-white text-sm">
          <option value="">Seleccionar Valor</option>
          {condition.distinctValues.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      );
    } else {
      return (
        <input
          type="text"
          value={condition.value}
          onChange={handleSingleValueChange}
          placeholder="Valor"
          className="w-full p-2 border rounded-md text-sm"
        />
      );
    }
  };

  return (
    <div className="grid grid-cols-12 items-center gap-4 mb-4 p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
      <div className="col-span-5">
        <select value={condition.field} onChange={handleFieldChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring focus:ring-blue-200 focus:border-blue-400">
          <option value="">Seleccionar Campo</option>
          {fields.map(f => <option key={f.variable_name} value={f.variable_name}>{f.description}</option>)}
        </select>
      </div>
      <div className="col-span-3">
        <select value={condition.operator} onChange={(e) => onConditionChange(path, 'operator', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring focus:ring-blue-200 focus:border-blue-400">
          <option value="">Operador</option>
          {operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <div className="col-span-3">
        {renderValueInput()}
      </div>
      <div className="col-span-1 text-right">
        <button onClick={() => onRemove(path)} className="text-red-500 hover:text-red-700 text-2xl leading-none pb-1">&times;</button>
      </div>
    </div>
  );
};

const ExclusionGroup = ({ group, onConditionChange, onAddCondition, onRemoveCondition, onRemoveGroup, fields, operators, groupIndex }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
    <div className="flex justify-between items-center mb-3">
      <h4 className="text-sm font-medium text-gray-600">Excluir si CUMPLE TODO lo siguiente:</h4>
      <button onClick={() => onRemoveGroup(groupIndex)} className="text-gray-400 hover:text-red-600 text-xs">Eliminar Grupo de Exclusión</button>
    </div>
    {group.map((cond, condIndex) => (
      <ConditionRow
        key={cond.id}
        condition={cond}
        onConditionChange={onConditionChange}
        onRemove={onRemoveCondition}
        fields={fields}
        operators={operators}
        path={{ groupIndex, condIndex }}
      />
    ))}
    <button onClick={() => onAddCondition(groupIndex)} className="text-blue-600 text-sm font-semibold mt-2">+ Añadir Condición de Exclusión</button>
  </div>
);

// --- Componente Principal ---
const SimpleFilterBuilder = ({ setClientCount, setCampaignData, initialDefinition, onSave }) => {
  const [generalConditions, setGeneralConditions] = useState(initialDefinition?.general || [{ id: Date.now(), field: '', operator: '', value: '', distinctValues: [] }]);
  const [excludeGroups, setExcludeGroups] = useState(initialDefinition?.exclude || []);
  const [fields, setFields] = useState([]);
  const [operators] = useState(segmentationOperators);
  const [loading, setLoading] = useState(true);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [newFilterDescription, setNewFilterDescription] = useState('');

  useEffect(() => {
    getAvailableFilterFields()
      .then(data => setFields(data))
      .catch(err => console.error("Error al cargar campos", err))
      .finally(() => setLoading(false));
  }, []);

  const handleConditionChange = (path, field, value) => {
    if (path.groupIndex !== undefined) { // Es una condición de exclusión
      setExcludeGroups(prevGroups => {
        const newGroups = [...prevGroups];
        const newGroup = [...newGroups[path.groupIndex]];
        newGroup[path.condIndex] = { ...newGroup[path.condIndex], [field]: value };
        newGroups[path.groupIndex] = newGroup;
        return newGroups;
      });
    } else { // Es una condición general
      setGeneralConditions(prevConditions => {
        const newConditions = [...prevConditions];
        newConditions[path.condIndex] = { ...newConditions[path.condIndex], [field]: value };
        return newConditions;
      });
    }
  };

  const handleAddCondition = (groupIndex) => {
    const newCondition = { id: Date.now(), field: '', operator: '', value: '', distinctValues: [] };
    if (groupIndex !== undefined) {
      setExcludeGroups(prevGroups => {
        const newGroups = [...prevGroups];
        newGroups[groupIndex] = [...newGroups[groupIndex], newCondition];
        return newGroups;
      });
    } else {
      setGeneralConditions(prevConditions => [...prevConditions, newCondition]);
    }
  };

  const handleRemoveCondition = (path) => {
    if (path.groupIndex !== undefined) {
      setExcludeGroups(prevGroups => {
        const newGroups = [...prevGroups];
        newGroups[path.groupIndex] = newGroups[path.groupIndex].filter((_, i) => i !== path.condIndex);
        return newGroups.filter(g => g.length > 0); // Remove empty groups
      });
    } else {
      setGeneralConditions(prevConditions => prevConditions.filter((_, i) => i !== path.condIndex));
    }
  };

  const handleAddExclusionGroup = () => {
    setExcludeGroups([...excludeGroups, [{ id: Date.now(), field: '', operator: '', value: '', distinctValues: [] }]]);
  };

  const handleRemoveExclusionGroup = (groupIndex) => {
    const newGroups = [...excludeGroups];
    newGroups.splice(groupIndex, 1);
    setExcludeGroups(newGroups);
  };

  const buildDefinition = () => {
    const cleanConditions = (conditions) =>
      conditions
        .filter(c => c.field && c.operator && (
          // Keep conditions if they have a non-empty value, or if they are 'is_null'/'is_not_null'
          // For 'in'/'not_in', an empty array is a valid "no values specified" state, so don't filter it out.
          (Array.isArray(c.value) && c.value.length > 0) ||
          (!Array.isArray(c.value) && c.value !== '' && c.value !== null) ||
          ['is_null', 'is_not_null'].includes(c.operator) ||
          (['in', 'not_in'].includes(c.operator) && Array.isArray(c.value) && c.value.length === 0)
        ))
        .map(({ id: _id, distinctValues: _distinctValues, ...rest }) => {
          // Ensure 'in' and 'not_in' values are arrays, others are not
          // The handleValueChange function now ensures the value is already an array for multi-value operators.
          // For other operators, it should be a string.
          return rest;
        });

    return {
      general: cleanConditions(generalConditions),
      exclude: excludeGroups.map(cleanConditions).filter(g => g.length > 0),
    };
  };

  const handleGetCount = async () => {
    const definition = buildDefinition();
    if (definition.general.length === 0 && definition.exclude.length === 0) {
      setClientCount(0);
      return;
    }
    try {
      const response = await getSimpleClientCount(definition);
      setClientCount(response.match_count);
      toast.success(`Audiencia calculada: ${response.match_count} clientes.`);
    } catch (error) {
      console.error("Error al obtener el conteo de clientes", error);
      setClientCount(0);
      toast.error("Error al calcular la audiencia.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const definition = buildDefinition();
    if (definition.general.length === 0 && definition.exclude.length === 0) {
      toast.warning("Añade al menos una condición válida para guardar.");
      return;
    }
    try {
      const payload = new AudienceFilterSimpleCreate(newFilterName, definition, newFilterDescription);
      await createSimpleFilter(payload);
      toast.success('Filtro guardado con éxito');
      setIsSaveModalOpen(false);
      setNewFilterName('');
      setNewFilterDescription('');
      onSave(); // Callback para refrescar la lista de filtros guardados
    } catch (error) {
      toast.error(`Error al guardar el filtro: ${error.message}`);
    }
  };

  useEffect(() => {
    const definition = buildDefinition();
    setCampaignData(prev => ({ ...prev, definition, audience_filter_id: null }));
  }, [generalConditions, excludeGroups, setCampaignData]);

  if (loading) return <div>Cargando constructor de filtros...</div>;

  return (
    <div>
      {/* General Conditions */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Filtrado General</h3>
        <p className="text-sm text-gray-500 mb-4">Todos los clientes deben cumplir <span className="font-bold">TODAS</span> estas condiciones.</p>
        {generalConditions.map((cond, index) => (
          <ConditionRow
            key={cond.id}
            condition={cond}
            onConditionChange={handleConditionChange}
            onRemove={handleRemoveCondition}
            fields={fields}
            operators={operators}
            path={{ condIndex: index }}
          />
        ))}
        <button onClick={() => handleAddCondition()} className="text-blue-600 text-sm font-semibold mt-2">+ Añadir Condición General</button>
      </div>

      {/* Exclusion Groups */}
      <div className="mt-6 border border-gray-300 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Exclusiones</h3>
        <p className="text-sm text-gray-500 mb-4">Se <span className="font-bold">retirarán</span> los clientes que cumplan con <span className="font-bold">ALGUNO</span> de los siguientes grupos de condiciones.</p>
        {excludeGroups.map((group, index) => (
          <ExclusionGroup
            key={index}
            group={group}
            onConditionChange={handleConditionChange}
            onAddCondition={handleAddCondition}
            onRemoveCondition={handleRemoveCondition}
            onRemoveGroup={handleRemoveExclusionGroup}
            fields={fields}
            operators={operators}
            groupIndex={index}
          />
        ))}
        <button onClick={handleAddExclusionGroup} className="text-green-600 text-sm font-semibold mt-2">+ Añadir Grupo de Exclusión</button>
      </div>

      {/* Actions */}
      <div className="flex justify-end items-center mt-6 gap-4">
        <button onClick={handleGetCount} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Calcular Audiencia
        </button>
        <button onClick={() => setIsSaveModalOpen(true)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
          Guardar Filtro
        </button>
      </div>

      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Guardar Filtro</h2>
            <form onSubmit={handleSave}>
              <label className="block text-sm font-medium text-gray-700">Nombre del Filtro</label>
              <input type="text" value={newFilterName} onChange={(e) => setNewFilterName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
              <label className="block text-sm font-medium text-gray-700 mt-4">Descripción (Opcional)</label>
              <textarea value={newFilterDescription} onChange={(e) => setNewFilterDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" rows="3"></textarea>
              <div className="mt-6 flex justify-end gap-4">
                <button type="button" onClick={() => setIsSaveModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleFilterBuilder;
