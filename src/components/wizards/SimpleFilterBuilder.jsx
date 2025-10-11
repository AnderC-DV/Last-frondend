import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { getAvailableFilterFields, getSimpleClientCount, createSimpleFilter, getDistinctValues } from '../../services/api';
import AudienceFilterSimpleCreate from '../../schemas/AudienceFilterSimpleCreate';
import { segmentationOperators } from './segmentationUtils';
import { toast } from 'sonner';

// --- Sub-componentes ---
const ConditionRow = ({ condition, onConditionChange, onRemove, fields, operators, path }) => {
  const isMultiValueOperator = ['in', 'not_in'].includes(condition.operator);
  const isNoValueOperator = ['is_null', 'is_not_null'].includes(condition.operator);
  const isBetweenOperator = condition.operator === 'between';

  const fieldMeta = fields.find(f => f.variable_name === condition.field);
  const isDateField = !!fieldMeta && (
    fieldMeta.data_type === 'date' || /fecha|date/i.test(fieldMeta.variable_name) || /fecha|date/i.test(fieldMeta.description || '')
  );

  useEffect(() => {
    const fetchInitialDistinctValues = async () => {
      if (condition.field && !isNoValueOperator && (!condition.distinctValues || condition.distinctValues.length === 0)) {
        try {
          const distinctValues = await getDistinctValues(condition.field);
          onConditionChange(path, 'distinctValues', distinctValues);
        } catch (error) {
          console.error(`Error fetching distinct values for ${condition.field}:`, error);
        }
      }
    };
    fetchInitialDistinctValues();
  }, []);

  useEffect(() => {
    if (isMultiValueOperator && !Array.isArray(condition.value)) {
      onConditionChange(path, 'value', []);
    } else if (isNoValueOperator && condition.value !== null) {
      onConditionChange(path, 'value', null);
    } else if (isBetweenOperator && isDateField) {
      if (!Array.isArray(condition.value) || condition.value.length !== 2) {
        onConditionChange(path, 'value', ['', '']);
      }
    } else if (!isMultiValueOperator && !isNoValueOperator && !isBetweenOperator && (condition.value === null || Array.isArray(condition.value))) {
      onConditionChange(path, 'value', '');
    }
  }, [condition.operator, path, isMultiValueOperator, isNoValueOperator, isBetweenOperator, isDateField, condition.value]);

  const handleFieldChange = async (selectedOption) => {
    const newField = selectedOption ? selectedOption.value : '';
    onConditionChange(path, 'field', newField);
    onConditionChange(path, 'value', '');
    onConditionChange(path, 'distinctValues', []);

    // Auto-select operator for special fields
    if (['cedula', 'codigo_de_obligacion'].includes(newField)) {
      onConditionChange(path, 'operator', 'contains');
    }

    if (newField && !isNoValueOperator) {
      try {
        const distinctValues = await getDistinctValues(newField);
        onConditionChange(path, 'distinctValues', distinctValues);
      } catch (error) {
        console.error(`Error fetching distinct values for ${newField}:`, error);
        onConditionChange(path, 'distinctValues', []);
      }
    }
  };
  
  const handleOperatorChange = (selectedOption) => {
    const newOperator = selectedOption ? selectedOption.value : '';
    onConditionChange(path, 'operator', newOperator);
  };

  const handleValueChange = (selectedOption) => {
    if (isMultiValueOperator) {
      const newValue = selectedOption ? selectedOption.map(option => option.value) : [];
      onConditionChange(path, 'value', newValue);
    } else {
      const newValue = selectedOption ? selectedOption.value : '';
      onConditionChange(path, 'value', newValue);
    }
  };

  const handleDateRangeChange = (e, index) => {
    const newDates = [...(condition.value || ['', ''])];
    newDates[index] = e.target.value;
    onConditionChange(path, 'value', newDates);
  };

  const handleCommaSeparatedChange = (e) => {
    // Permite números y comas, eliminando otros caracteres.
    const sanitizedValue = e.target.value.replace(/[^\d,]/g, '');
    onConditionChange(path, 'value', sanitizedValue);
  };

  const selectStyles = {
    control: (base) => ({ ...base, minHeight: '42px', borderColor: '#D1D5DB' }),
    menu: (base) => ({ ...base, zIndex: 10 }),
  };

  const renderValueInput = () => {
    // Prioridad 1: Operadores sin valor
    if (isNoValueOperator) {
      return <span className="text-sm text-gray-500 italic">No requiere valor</span>;
    }

    // Prioridad 2: Operadores de lista ('in', 'not_in')
    if (isMultiValueOperator) {
      const isSpecialField = ['cedula', 'codigo_de_obligacion'].includes(condition.field);
      
      // Para campos no especiales con valores distintos, mostrar el Select múltiple
      if (!isSpecialField && condition.distinctValues && condition.distinctValues.length > 0) {
        const options = condition.distinctValues.map(v => ({ value: v, label: v }));
        const selectedValue = options.filter(option => Array.isArray(condition.value) && condition.value.includes(option.value));
        return (
          <Select
            isMulti
            isSearchable
            isClearable
            options={options}
            value={selectedValue}
            onChange={handleValueChange}
            placeholder="Seleccionar o buscar..."
            noOptionsMessage={() => 'No hay opciones'}
            styles={selectStyles}
          />
        );
      }
      
      // Para campos especiales o campos sin valores distintos, mostrar el textarea
      return (
        <textarea
          value={condition.value || ''}
          onChange={isSpecialField ? handleCommaSeparatedChange : (e) => onConditionChange(path, 'value', e.target.value)}
          placeholder="Pegue valores separados por comas."
          className="w-full p-2 border rounded-md text-sm font-mono h-24"
          rows="3"
        />
      );
    }

    // Prioridad 3: Campos especiales con operadores de valor único
    if (['cedula', 'codigo_de_obligacion'].includes(condition.field)) {
      return (
        <input
          type="text"
          value={condition.value || ''}
          onChange={handleCommaSeparatedChange} // Saneamiento de números y comas
          placeholder="Valor (solo números y comas)"
          className="w-full p-2 border rounded-md text-sm"
        />
      );
    }

    // Prioridad 4: Fallback para otros tipos de campos (operadores de valor único)
    if (isDateField && isBetweenOperator) {
      const [startDate, endDate] = Array.isArray(condition.value) ? condition.value : ['', ''];
      return (
        <div className="flex items-center gap-2">
          <input type="date" value={startDate || ''} onChange={(e) => handleDateRangeChange(e, 0)} className="w-full p-2 border rounded-md text-sm" />
          <span className="text-sm text-gray-600">a</span>
          <input type="date" value={endDate || ''} onChange={(e) => handleDateRangeChange(e, 1)} className="w-full p-2 border rounded-md text-sm" />
        </div>
      );
    }
    if (isDateField) {
        return <input type="date" value={condition.value || ''} onChange={(e) => onConditionChange(path, 'value', e.target.value)} className="w-full p-2 border rounded-md text-sm" />;
    }

    if (condition.distinctValues && condition.distinctValues.length > 0) {
      const options = condition.distinctValues.map(v => ({ value: v, label: v }));
      const selectedValue = options.find(option => option.value === condition.value) || null;
      return (
        <Select
          isSearchable
          isClearable
          options={options}
          value={selectedValue}
          onChange={handleValueChange}
          placeholder="Seleccionar o buscar..."
          noOptionsMessage={() => 'No hay opciones'}
          styles={selectStyles}
        />
      );
    }

    return (
      <input
        type="text"
        value={condition.value || ''}
        onChange={(e) => onConditionChange(path, 'value', e.target.value)}
        placeholder="Valor"
        className="w-full p-2 border rounded-md text-sm"
      />
    );
  };

  const fieldOptions = fields.map(f => ({ value: f.variable_name, label: f.description }));
  
  // Dynamically filter operators based on the selected field
  let availableOperators = operators;
  if (['cedula', 'codigo_de_obligacion'].includes(condition.field)) {
    // Assuming 'contains' is the user-facing operator for this special logic.
    // You might need to adjust the id ('contains') if it's different in segmentationUtils.js
    availableOperators = operators.filter(op => op.id === 'contains');
  }
  const operatorOptions = availableOperators.map(o => ({ value: o.id, label: o.name }));

  return (
    <div className="grid grid-cols-12 items-center gap-4 mb-4 p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
      <div className="col-span-5">
        <Select
          options={fieldOptions}
          value={fieldOptions.find(f => f.value === condition.field) || null}
          onChange={handleFieldChange}
          placeholder="Seleccionar Campo..."
          isSearchable
          isClearable
          styles={selectStyles}
        />
      </div>
      <div className="col-span-3">
        <Select
          options={operatorOptions}
          value={operatorOptions.find(o => o.value === condition.operator) || null}
          onChange={handleOperatorChange}
          placeholder="Operador..."
          isSearchable
          isClearable
          styles={selectStyles}
          isDisabled={operatorOptions.length === 1} // Disable if only one option is available
        />
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
        .filter(c => {
          if (!c.field || !c.operator) return false;
          if (['is_null', 'is_not_null'].includes(c.operator)) return true;
          if (c.operator === 'between' && Array.isArray(c.value)) {
            return c.value.length === 2 && c.value[0] && c.value[1];
          }
          if (Array.isArray(c.value)) return c.value.length > 0;
          return c.value !== '' && c.value !== null;
        })
        .map(({ id: _id, distinctValues: _distinctValues, ...rest }) => {
          const finalRest = { ...rest };
          // Map 'contains' to 'in' for special fields before sending to backend
          if (['cedula', 'codigo_de_obligacion'].includes(finalRest.field) && finalRest.operator === 'contains') {
            finalRest.operator = 'in';
          }

          // If operator is 'in'/'not_in' and value is a string, split it into an array
          if (['in', 'not_in'].includes(finalRest.operator) && typeof finalRest.value === 'string') {
            finalRest.value = finalRest.value.split(',').filter(val => val !== '');
          }
          
          return finalRest;
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
