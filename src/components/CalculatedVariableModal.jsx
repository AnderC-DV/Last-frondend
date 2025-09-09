import React, { useState, useEffect } from 'react';

const CalculatedVariableModal = ({ isOpen, onClose, onInsert, variables }) => {
  const [operand1, setOperand1] = useState('');
  const [operator, setOperator] = useState('+');
  const [operand2Type, setOperand2Type] = useState('fixed'); // 'fixed' or 'variable'
  const [operand2Value, setOperand2Value] = useState('');
  const [generatedString, setGeneratedString] = useState('');

  useEffect(() => {
    if (variables.length > 0 && !operand1) {
      setOperand1(variables[0].variable_name);
    }
  }, [variables, operand1]);

  useEffect(() => {
    if (!operand1 || !operator || !operand2Value) {
      setGeneratedString('');
      return;
    }
    const finalOperand2 = operand2Type === 'variable' 
      ? (variables.find(v => v.variable_name === operand2Value)?.variable_name || '') 
      : operand2Value;

    if (!finalOperand2) {
        setGeneratedString('');
        return;
    }

    const str = `{{CALC:${operand1} ${operator} ${finalOperand2}}}`;
    setGeneratedString(str);
  }, [operand1, operator, operand2Type, operand2Value, variables]);

  const handleInsert = () => {
    if (generatedString) {
      onInsert(generatedString);
      onClose();
    } else {
      alert("Por favor, completa todos los campos para generar la variable.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Insertar Campo Calculado</h2>
        
        <div className="space-y-4">
          {/* Operando 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Variable Principal</label>
            <select value={operand1} onChange={(e) => setOperand1(e.target.value)} className="mt-1 block w-full p-2 border rounded-md">
              {variables.map(v => <option key={v.variable_name} value={v.variable_name}>{v.variable_name}</option>)}
            </select>
          </div>

          {/* Operador */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Operador</label>
            <select value={operator} onChange={(e) => setOperator(e.target.value)} className="mt-1 block w-full p-2 border rounded-md">
              <option value="+">Suma (+)</option>
              <option value="-">Resta (-)</option>
              <option value="*">Multiplicación (*)</option>
              <option value="/">División (/)</option>
            </select>
          </div>

          {/* Tipo de Operando 2 */}
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input type="radio" value="fixed" checked={operand2Type === 'fixed'} onChange={() => setOperand2Type('fixed')} />
              <span className="ml-2">Valor Fijo</span>
            </label>
            <label className="flex items-center">
              <input type="radio" value="variable" checked={operand2Type === 'variable'} onChange={() => setOperand2Type('variable')} />
              <span className="ml-2">Otra Variable</span>
            </label>
          </div>

          {/* Operando 2 */}
          <div>
            {operand2Type === 'fixed' ? (
              <input 
                type="number" 
                placeholder="Escribe un valor numérico"
                value={operand2Value}
                onChange={(e) => setOperand2Value(e.target.value)}
                className="mt-1 block w-full p-2 border rounded-md"
              />
            ) : (
              <select value={operand2Value} onChange={(e) => setOperand2Value(e.target.value)} className="mt-1 block w-full p-2 border rounded-md">
                <option value="">Selecciona una variable</option>
                {variables.map(v => <option key={v.variable_name} value={v.variable_name}>{v.variable_name}</option>)}
              </select>
            )}
          </div>

          {/* Vista Previa */}
          <div className="bg-gray-100 p-3 rounded-md">
            <p className="text-sm text-gray-600">Vista previa:</p>
            <p className="font-mono text-blue-600 h-6">{generatedString}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
          <button onClick={handleInsert} className="px-4 py-2 bg-blue-600 text-white rounded-md">Insertar</button>
        </div>
      </div>
    </div>
  );
};

export default CalculatedVariableModal;
