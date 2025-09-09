import React, { useState, useEffect } from 'react';
import SimpleFilterBuilder from './SimpleFilterBuilder';
import SavedFilters from './SavedFilters';
import TargetRoleSwitch from './TargetRoleSwitch';

const Step2_Segmentation = ({ campaignData, setCampaignData }) => {
  const [activeTab, setActiveTab] = useState('saved');
  const [clientCount, setClientCount] = useState(campaignData.client_count || 0);
  const [initialDefinition, setInitialDefinition] = useState(null);
  const [targetRole, setTargetRole] = useState(campaignData.target_role || 'DEUDOR');

  useEffect(() => {
    setCampaignData(prev => ({ ...prev, target_role: targetRole }));
  }, [targetRole, setCampaignData]);

  useEffect(() => {
    if (campaignData.definition) {
      setActiveTab('create');
      setInitialDefinition(campaignData.definition);
    } else if (campaignData.audience_filter_id) {
      setActiveTab('saved');
    }
  }, []);

  const handleClientCountChange = (count) => {
    setClientCount(count);
    setCampaignData(prev => ({ ...prev, client_count: count }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setClientCount(0);
    setInitialDefinition(null);
    setCampaignData(prev => ({ ...prev, definition: null, audience_filter_id: null, client_count: 0 }));
  };

  const handleEditFilter = (definition) => {
    setInitialDefinition(definition);
    setActiveTab('create');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800">Define tu Público Objetivo</h2>
      <p className="text-gray-500 mt-1">Selecciona los clientes que recibirán la campaña.</p>

      <div className="mt-8">
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => handleTabChange('saved')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'saved' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
          >
            Usar Filtro Guardado
          </button>
          <button
            onClick={() => handleTabChange('create')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'create' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
          >
            Crear Filtro Nuevo
          </button>
        </div>

        {activeTab === 'create' ?
            <SimpleFilterBuilder
              setClientCount={handleClientCountChange}
              setCampaignData={setCampaignData}
              initialDefinition={initialDefinition}
              onSave={() => handleTabChange('saved')}
            /> :
            <SavedFilters
              setClientCount={handleClientCountChange}
              setCampaignData={setCampaignData}
              onEdit={handleEditFilter}
              campaignData={campaignData}
            />
        }

        <TargetRoleSwitch
          selectedRole={targetRole}
          onChange={setTargetRole}
          codebtorStrategy={campaignData.codebtor_strategy}
          onCodebtorStrategyChange={(strategy) => setCampaignData(prev => ({ ...prev, codebtor_strategy: strategy }))}
        />

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-blue-800">Número de Clientes Coincidentes: <span className="font-bold">{clientCount.toLocaleString()}</span></p>
        </div>
        {!(campaignData.audience_filter_id || (campaignData.definition && (campaignData.definition.general?.length > 0 || campaignData.definition.exclude?.length > 0))) && (
          <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
            Debes seleccionar un filtro guardado o construir uno nuevo antes de continuar.
          </div>
        )}
      </div>
    </div>
  );
};

export default Step2_Segmentation;
