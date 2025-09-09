import React from 'react';

const ROLES = [
  { id: 'DEUDOR', name: 'Deudor' },
  { id: 'CODEUDOR', name: 'Codeudor' },
  { id: 'AMBAS', name: 'Ambas' },
];

const STRATEGIES = [
  { id: 'FIRST', name: 'Enviar al primero que se encuentre' },
  { id: 'ALL', name: 'Enviar a todos los que se encuentren' },
];

const TargetRoleSwitch = ({ selectedRole, onChange, codebtorStrategy, onCodebtorStrategyChange }) => {
  const showStrategySelector = selectedRole === 'CODEUDOR' || selectedRole === 'AMBAS';

  const getButtonClasses = (roleId) => {
    const base = 'flex-1 py-2 px-4 text-sm font-medium transition-colors duration-200 focus:outline-none rounded-lg';
    return selectedRole === roleId ? `${base} bg-blue-600 text-white shadow` : `${base} bg-gray-200 text-gray-700 hover:bg-gray-300`;
  };

  return (
    <div className="mt-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        ¿A quién va dirigida esta campaña?
      </label>
      <div className="flex bg-gray-100 rounded-lg p-1 space-x-1">
        {ROLES.map(role => (
          <button
            key={role.id}
            type="button"
            onClick={() => onChange(role.id)}
            className={getButtonClasses(role.id)}
          >
            {role.name}
          </button>
        ))}
      </div>
      
      {showStrategySelector && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estrategia para Codeudores
          </label>
          <select
            value={codebtorStrategy || ''}
            onChange={(e) => onCodebtorStrategyChange(e.target.value)}
            className="w-full p-2 border rounded-md bg-white"
          >
            <option value="" disabled>Selecciona una estrategia</option>
            {STRATEGIES.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default TargetRoleSwitch;
