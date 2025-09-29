import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getTemplates, getTemplatePreview } from '../../services/api';
import EmailPreview from './EmailPreview';
import WhatsAppTemplatePreview from './whatsapp/WhatsAppTemplatePreview';
import WhatsAppEditor from '../WhatsAppEditor';
import { getTemplateById } from '../../services/api';
import { generatePreviewWithSpecialVariable } from '../../utils/templateUtils';

const Step3_Template = ({ campaignData, setCampaignData }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreatingNewTemplate, setIsCreatingNewTemplate] = useState(false);
  const [selectedTemplateComponents, setSelectedTemplateComponents] = useState(null);
  const [selectedTemplateDetails, setSelectedTemplateDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const filteredTemplates = useMemo(() => {
    if (!searchTerm) return templates;
    return templates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [templates, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setSearchTerm(''); // Reset search on outside click
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Obtener vista previa y componentes cuando cambia la plantilla seleccionada
  useEffect(() => {
    const fetchPreviewAndComponents = async () => {
      const templateId = campaignData.message_template_id;
      if (templateId && !isCreatingNewTemplate) {
        let fullTemplate = null;

        try {
          setCampaignData(prev => ({
            ...prev,
            previewContent: 'Cargando vista previa...',
            previewSubject: '',
          }));
          setSelectedTemplateComponents(null);
          setSelectedTemplateDetails(null);

          const previewData = await getTemplatePreview(templateId);
          const templateDetails = templates.find(t => t.id === templateId);

          if (templateDetails) {
            fullTemplate = await getTemplateById(templateId);
            console.log('fullTemplate from getTemplateById:', fullTemplate);
            setSelectedTemplateDetails(fullTemplate);
            console.log('selectedTemplateDetails set to:', fullTemplate);

            if (campaignData.channel === 'WHATSAPP') {
              setSelectedTemplateComponents(fullTemplate.components);
            }
          }

          setCampaignData(prev => ({
            ...prev,
            templateName: templateDetails ? templateDetails.name : 'Desconocido',
            previewContent: previewData.preview_content,
            previewSubject: previewData.preview_subject || (templateDetails ? templateDetails.subject : ''),
            selectedTemplateDetails: fullTemplate || null,
          }));
        } catch (err) {
          console.error("Error al cargar la vista previa o componentes", err);
          setCampaignData(prev => ({
            ...prev,
            previewContent: 'No se pudo cargar la vista previa.',
            previewSubject: 'Error',
          }));
          setSelectedTemplateComponents(null);
          setSelectedTemplateDetails(null);
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

   // Function to render variables in text
   const renderTextWithVariables = (text) => {
     if (!text) return '';
     // Replace {{1}} with a styled span
     return text.replace(/\{\{(\d+)\}\}/g, '<span class="text-blue-500 font-semibold">[{{$1}}]</span>');
   };

   const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    setCampaignData({
      ...campaignData,
      message_template_id: templateId,
      selectedTemplateDetails: null,
      special_variable_value: ''
    });
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
      selectedTemplateDetails: null,
      special_variable_value: '',
    }));
    setSelectedTemplateComponents(null);
    setSelectedTemplateDetails(null);
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
              <div ref={dropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plantillas Existentes</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Busca o selecciona una plantilla"
                    value={isDropdownOpen ? searchTerm : (templates.find(t => t.id === campaignData.message_template_id)?.name || '')}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (!isDropdownOpen) setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className="w-full p-3 border rounded-md bg-white"
                  />
                  {isDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredTemplates.length > 0 ? (
                        filteredTemplates.map(t => (
                          <div
                            key={t.id}
                            onClick={() => {
                              handleTemplateChange({ target: { value: t.id } });
                              setIsDropdownOpen(false);
                              setSearchTerm('');
                            }}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                          >
                            {t.name}
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500">No se encontraron plantillas.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {campaignData.message_template_id && selectedTemplateDetails?.special_variable_name && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-amber-800">Variable Especial Requerida</h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p>Esta plantilla contiene una variable especial que debe ser completada:</p>
                      <p className="mt-1 font-medium"><code className="bg-amber-100 px-1 rounded">{'{SPECIAL:' + selectedTemplateDetails.special_variable_name + '}'}</code></p>
                    </div>
                    <div className="mt-3">
                      <label htmlFor="special_variable_value" className="block text-sm font-medium text-amber-800">Valor para la Variable Especial</label>
                      <input
                        type="text"
                        id="special_variable_value"
                        value={campaignData.special_variable_value || ''}
                        onChange={e => {
                          setCampaignData({...campaignData, special_variable_value: e.target.value});
                        }}
                        placeholder={`Ingresa el valor para ${selectedTemplateDetails.special_variable_name}`}
                        maxLength="255"
                        required
                        className="mt-1 w-full p-2 border border-amber-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                      />
                      <p className="mt-1 text-xs text-amber-600">Máximo 255 caracteres. Este valor reemplazará la variable especial en todos los mensajes.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {campaignData.message_template_id && (
              <>
                {campaignData.channel === 'EMAIL' && (
                  <EmailPreview
                    subject={campaignData.previewSubject}
                    htmlContent={campaignData.previewContent}
                  />
                )}
                {campaignData.channel === 'WHATSAPP' && (
                  campaignData.previewContent ? (
                    <WhatsAppTemplatePreview
                      template={selectedTemplateDetails}
                      components={selectedTemplateComponents}
                      previewContent={campaignData.previewContent}
                    />
                  ) : (
                    <div className="mt-8 pt-8 border-t text-center text-gray-500">Cargando vista previa de WhatsApp...</div>
                  )
                )}
                {campaignData.channel !== 'EMAIL' && campaignData.channel !== 'WHATSAPP' && (
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
