import React from 'react';
import { segmentationOperators } from './segmentationUtils';

const operatorMap = segmentationOperators.reduce((acc, op) => {
  acc[op.id] = op.name;
  return acc;
}, {});

const ConditionLine = ({ rule }) => (
  <div className="text-xs text-gray-700 flex items-center">
    <span className="font-semibold bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded-md mr-1.5">{rule.field}</span>
    <span className="font-medium text-blue-600 mr-1.5">{operatorMap[rule.operator] || rule.operator}</span>
    <span className="italic text-gray-800 truncate">{Array.isArray(rule.value) ? `[${rule.value.join(', ')}]` : rule.value}</span>
  </div>
);

const SimpleFilterRulesPreview = ({ definition }) => {
  if (!definition || (!definition.general?.length && !definition.exclude?.length)) {
    return <p className="text-xs text-gray-500 italic mt-1">No se ha definido una audiencia.</p>;
  }

  const { general = [], exclude = [] } = definition;

  return (
    <div className="space-y-3">
      {general.length > 0 && (
        <div>
          <h5 className="text-xs font-bold text-gray-500 mb-1">General (deben cumplir TODO)</h5>
          <div className="space-y-1 pl-2">
            {general.map((rule, index) => <ConditionLine key={index} rule={rule} />)}
          </div>
        </div>
      )}
      {exclude.length > 0 && (
        <div>
          <h5 className="text-xs font-bold text-red-500 mb-1">Exclusiones (se retiran si cumplen ALGÚN grupo)</h5>
          {exclude.map((group, groupIndex) => (
            <div key={groupIndex} className="bg-red-50 p-2 rounded-md mt-1">
              <div className="text-xs font-semibold text-red-700 mb-1">Grupo de Exclusión {groupIndex + 1} (debe cumplir TODO)</div>
              <div className="space-y-1 pl-2">
                {group.map((rule, ruleIndex) => <ConditionLine key={ruleIndex} rule={rule} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleFilterRulesPreview;
