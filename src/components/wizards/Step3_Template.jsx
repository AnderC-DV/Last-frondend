import React, { useState, useEffect } from 'react';
import { getTemplates, getTemplatePreview } from '../../services/api';
import EmailPreview from './EmailPreview';
import WhatsAppEditor from '../WhatsAppEditor';
import WhatsAppPreview from '../WhatsAppPreview'; // Import the new WhatsAppPreview component
import { getTemplateById } from '../../services/api'; // Import getTemplateById

const Step3_Template = ({ campaignData, setCampaignData }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreatingNewTemplate, setIsCreatingNewTemplate] = useState(false);
  const [selectedTemplateComponents, setSelectedTemplateComponents] = useState(null); // New state for WhatsApp components

  // Cargar plantillas disponibles
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!campaignData.channel) return;
      try {
        setLoading(true);
        const allTemplates = await getTemplates();
        const approvedAndFiltered = allTemplates.filter(
          t => t.status === 'APPROVED' && t.channel_type === campaignData.channel.toUpperCase()
        );
        setTemplates(approvedAndFiltered);
        setError(null);
      } catch (err) {
        console.error("Error al cargar las plantillas", err);
        setError("No se pudieron cargar las plantillas.");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [campaignData.channel]);

  // Obtener vista previa y componentes cuando cambia la plantilla seleccionada
  useEffect(() => {
    const fetchPreviewAndComponents = async () => {
      const templateId = campaignData.message_template_id;
      if (templateId && !isCreatingNewTemplate) {
        try {
          setCampaignData(prev => ({
            ...prev,
            previewContent: 'Cargando vista previa...',
            previewSubject: '',
          }));
          setSelectedTemplateComponents(null); // Clear previous components

          console.log('Debug: campaignData.channel:', campaignData.channel);
          console.log('Debug: campaignData.message_template_id:', templateId);
          console.log('Debug: current templates array:', templates); // Log the templates array

          const previewData = await getTemplatePreview(templateId);
          const templateDetails = templates.find(t => t.id === templateId);
          console.log('Debug: templateDetails found:', templateDetails); // Log the actual object, not just boolean

          // Fetch full template details to get components for WhatsApp preview
          if (campaignData.channel === 'WHATSAPP' && templateDetails) {
            console.log('Debug: Condition met for fetching full template details.');
            console.log('Debug: Calling getTemplateById for templateId:', templateId);
            const fullTemplate = await getTemplateById(templateId);
            console.log('Debug: fullTemplate from getTemplateById:', fullTemplate);
            setSelectedTemplateComponents(fullTemplate.components);
            console.log('Debug: selectedTemplateComponents:', fullTemplate.components);
          } else if (campaignData.channel === 'WHATSAPP' && !templateDetails) {
            console.log('Debug: templateDetails not found for WhatsApp channel, skipping full template fetch.');
          } else {
            console.log('Debug: Not a WhatsApp channel or templateDetails not found, skipping full template fetch.');
          }


          setCampaignData(prev => ({
            ...prev,
            templateName: templateDetails ? templateDetails.name : 'Desconocido',
            previewContent: previewData.preview_content,
            previewSubject: previewData.preview_subject || (templateDetails ? templateDetails.subject : ''),
          }));
        } catch (err) {
          console.error("Error al cargar la vista previa o componentes", err);
          setCampaignData(prev => ({
            ...prev,
            previewContent: 'No se pudo cargar la vista previa.',
            previewSubject: 'Error',
          }));
          setSelectedTemplateComponents(null);
        }
      } else if (!isCreatingNewTemplate) {
        setCampaignData(prev => ({
          ...prev,
          templateName: '',
          previewContent: '',
          previewSubject: '',
        }));
        setSelectedTemplateComponents(null);
      }
    };

    if (!loading) {
      fetchPreviewAndComponents();
    }
  }, [campaignData.message_template_id, loading, templates, setCampaignData, isCreatingNewTemplate, campaignData.channel]);

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    setCampaignData({ ...campaignData, message_template_id: templateId });
    setIsCreatingNewTemplate(false);
  };

  const handleCreateNewTemplateClick = () => {
    setIsCreatingNewTemplate(true);
    setCampaignData(prev => ({
      ...prev,
      message_template_id: null,
      templateName: '',
      previewContent: '',
      previewSubject: '',
    }));
    setSelectedTemplateComponents(null); // Clear components when creating new
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800">Construye tu Mensaje</h2>
      <p className="text-gray-500 mt-1">
        {isCreatingNewTemplate ? 'Crea una nueva plantilla para tu campaña de WhatsApp.' : `Selecciona una plantilla aprobada para tu campaña de ${campaignData.channel}.`}
      </p>

      <div className="mt-8">
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${!isCreatingNewTemplate ? 'bg-white shadow' : 'text-gray-400'}`}
            onClick={() => setIsCreatingNewTemplate(false)}
          >
            Seleccionar Plantilla
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${isCreatingNewTemplate ? 'bg-white shadow' : 'text-gray-400'}`}
            onClick={handleCreateNewTemplateClick}
            disabled={campaignData.channel !== 'WHATSAPP'}
          >
            Crear Nueva
          </button>
        </div>

        {isCreatingNewTemplate && campaignData.channel === 'WHATSAPP' ? (
          <WhatsAppEditor />
        ) : (
          <>
            {loading && <p>Cargando plantillas...</p>}
            {error && <p className="text-red-500">{error}</p>}
            
            {!loading && !error && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plantillas Existentes</label>
                <select
                  value={campaignData.message_template_id || ''}
                  onChange={handleTemplateChange}
                  className="w-full p-3 border rounded-md bg-white"
                >
                  <option value="">Selecciona una plantilla</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            {campaignData.message_template_id && ( // Only show preview if a template is selected
              <>
                {campaignData.channel === 'EMAIL' ? (
                  <EmailPreview 
                    subject={campaignData.previewSubject}
                    htmlContent={campaignData.previewContent}
                  />
                ) : campaignData.channel === 'WHATSAPP' && selectedTemplateComponents ? (
                  <WhatsAppPreview components={selectedTemplateComponents} />
                ) : (
                  <div className="mt-8 pt-8 border-t">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Vista Previa del Mensaje</h3>
                    <div className="bg-white rounded-xl shadow-md border w-full p-6">
                      <p className="text-gray-700 whitespace-pre-wrap">{campaignData.previewContent}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-4 text-center">
                      Las variables se completarán automáticamente con los datos de cada destinatario.
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Step3_Template;
