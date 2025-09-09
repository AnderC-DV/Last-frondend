import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTemplateById, getTemplateVariables, createTemplate, getTemplates } from '../services/api';
import TemplateCreateSMS from '../schemas/TemplateCreateSMS';
import TemplateCreateEmail from '../schemas/TemplateCreateEmail';
import TemplateCreateWhatsApp from '../schemas/TemplateCreateWhatsApp';
import CalculatedVariableModal from '../components/CalculatedVariableModal';
import EmailEditor from '../components/EmailEditor';
import SmsEditor from '../components/SmsEditor';
import PolicyEditor from '../components/PolicyEditor';
import WhatsAppWizard from '../components/wizards/whatsapp/WhatsAppWizard';

const TemplateEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [template, setTemplate] = useState({
    name: '',
    channel_type: 'SMS',
    content: '',
    subject: '',
    meta_template_name: '',
    category: 'UTILITY',
    components: {
      body: {
        text: ''
      }
    }
  });
  const [variables, setVariables] = useState([]);
  const [existingTemplates, setExistingTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [smsLimitExceeded, setSmsLimitExceeded] = useState(false); // bandera para mostrar alerta visual
  const [searchTerm, setSearchTerm] = useState('');
  const contentRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vars, templates] = await Promise.all([
          getTemplateVariables(),
          getTemplates()
        ]);
        setVariables(vars);
        setExistingTemplates(templates);

        if (id) {
          const existingTemplate = await getTemplateById(id);
          const content = existingTemplate.content || existingTemplate.components?.body?.text || '';
          setTemplate({
            name: `Copia de ${existingTemplate.name}`,
            channel_type: existingTemplate.channel_type,
            content: content,
            subject: existingTemplate.subject || '',
            meta_template_name: existingTemplate.meta_template_name || '',
            category: existingTemplate.category || 'UTILITY',
            components: existingTemplate.components || { body: { text: content } }
          });
        }
      } catch (error) {
        console.error("Error al cargar los datos de la plantilla:", error);
        alert("No se pudieron cargar los datos necesarios.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleInsertCalculatedVariable = (variableString) => {
    if (template.channel_type === 'EMAIL') {
      setTemplate(prev => ({ ...prev, content: prev.content + variableString }));
    } else if (contentRef.current) {
      const { selectionStart, selectionEnd, value } = contentRef.current;
      const newContent = value.substring(0, selectionStart) + variableString + value.substring(selectionEnd);
      setTemplate(prev => ({ ...prev, content: newContent }));
      contentRef.current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (existingTemplates.some(t => t.name === template.name)) {
      alert('Ya existe una plantilla con este nombre. Por favor, elige otro.');
      return;
    }
    try {
      let templateData;
      switch (template.channel_type) {
        case 'SMS':
          templateData = new TemplateCreateSMS(template.name, template.content);
          break;
        case 'EMAIL':
          templateData = new TemplateCreateEmail(template.name, template.subject, template.content);
          break;
        case 'WHATSAPP':
          templateData = new TemplateCreateWhatsApp(
            template.name,
            template.meta_template_name,
            template.category,
            template.components
          );
          break;
        default:
          throw new Error('Invalid channel type');
      }
      const newTemplate = await createTemplate(templateData);
      const userRoles = user?.decoded?.roles || [];

      if (newTemplate.status === 'PENDING_INTERNAL_APPROVAL' && userRoles.includes('Directora de Operaciones')) {
        alert('Plantilla creada. Pendiente de revisión jurídica.');
      } else if (newTemplate.status === 'PENDING_OPERATIONS_APPROVAL') {
        alert('Plantilla creada. Pendiente de revisión de Operaciones.');
      } else {
        setShowSuccessPopup(true);
      }
      
      if (!showSuccessPopup) {
        navigate('/templates');
      }

    } catch (error) {
      alert(`Error al guardar la plantilla: ${error.message}`);
    }
  };

  const filteredVariables = variables.filter(v =>
    v.variable_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8">Cargando editor...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{id ? 'Editar Plantilla (Guardar como Nueva)' : 'Crear Nueva Plantilla'}</h1>
            <p className="text-gray-500">Diseña tu mensaje y arrastra las variables que necesites.</p>
          </div>
          <button onClick={() => navigate('/templates')} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100">
            Volver
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre de la Plantilla</label>
              <input
                type="text"
                id="name"
                value={template.name}
                onChange={e => {
                  const newName = e.target.value;
                  const newMetaName = newName.toLowerCase().replace(/\s+/g, '_');
                  setTemplate(prev => ({
                    ...prev,
                    name: newName,
                    meta_template_name: prev.channel_type === 'WHATSAPP' ? newMetaName : prev.meta_template_name
                  }));
                }}
                required
                className="mt-1 w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label htmlFor="channel" className="block text-sm font-medium text-gray-700">Canal</label>
              <select id="channel" value={template.channel_type} onChange={e => {
                const newChannel = e.target.value;
                setTemplate(prev => ({
                  name: prev.name,
                  channel_type: newChannel,
                  content: '',
                  subject: '',
                  meta_template_name: '',
                  category: 'UTILITY',
                  components: { body: { text: '' } }
                }));
              }} className="mt-1 w-full p-2 border rounded-md bg-white">
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">Email</option>
              </select>
            </div>
          </div>


          {template.channel_type === 'EMAIL' && (
            <div className="mb-6">
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Asunto</label>
              <input type="text" id="subject" value={template.subject} onChange={e => setTemplate({...template, subject: e.target.value})} className="mt-1 w-full p-2 border rounded-md" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              {template.channel_type === 'EMAIL' ? (
                <EmailEditor
                  content={template.content}
                  setTemplate={setTemplate}
                />
              ) : template.channel_type === 'WHATSAPP' ? (
                <WhatsAppWizard template={template} setTemplate={setTemplate} />
              ) : (
                <SmsEditor
                  content={template.content}
                  setTemplate={setTemplate}
                  contentRef={contentRef}
                  smsLimitExceeded={smsLimitExceeded}
                  setSmsLimitExceeded={setSmsLimitExceeded}
                />
              )}
            </div>
            <div>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">Variables Disponibles</h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                >
                  + Campo Calculado
                </button>
              </div>
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Buscar variable..."
                  className="w-full p-2 border rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="mt-2 border rounded-md p-2 h-64 overflow-y-auto bg-gray-50">
                {filteredVariables.map(v => (
                  <div
                    key={v.variable_name}
                    className="p-2 my-1 bg-white border rounded cursor-move hover:bg-blue-50"
                    title={v.description}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', `${v.variable_name}`);
                    }}
                  >
                    {`${v.variable_name}`}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between items-center">
            <PolicyEditor onInsert={handleInsertCalculatedVariable} />
            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              Guardar Plantilla
            </button>
          </div>
        </form>
      </div>
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Éxito!</h2>
            <p className="text-gray-600 mb-6">La plantilla se ha guardado correctamente.</p>
            <button
              onClick={() => {
                setShowSuccessPopup(false);
                navigate('/templates');
              }}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      <CalculatedVariableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onInsert={handleInsertCalculatedVariable}
        variables={variables}
      />
    </div>
  );
};

export default TemplateEditorPage;
