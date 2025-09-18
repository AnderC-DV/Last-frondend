import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTemplateById, getTemplateVariables, createTemplate, getTemplates } from '../services/api';
import { toast } from 'sonner';
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
    special_variable_name: '',
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
  const [isSaving, setIsSaving] = useState(false); // indicador de carga al guardar
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
            special_variable_name: existingTemplate.special_variable_name || '',
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
    // Handle special variables that come in {SPECIAL:variable_name} format
    let finalVariableString = variableString;

    if (template.channel_type === 'EMAIL') {
      setTemplate(prev => ({ ...prev, content: prev.content + finalVariableString }));
    } else if (contentRef.current) {
      const { selectionStart, selectionEnd, value } = contentRef.current;
      const newContent = value.substring(0, selectionStart) + finalVariableString + value.substring(selectionEnd);
      setTemplate(prev => ({ ...prev, content: newContent }));
      contentRef.current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (existingTemplates.some(t => t.name === template.name)) {
      toast.error('Ya existe una plantilla con este nombre. Por favor, elige otro.');
      return;
    }

    setIsSaving(true);
    try {
      let templateData;
      switch (template.channel_type) {
        case 'SMS':
          templateData = new TemplateCreateSMS(template.name, template.content, template.special_variable_name || null);
          break;
        case 'EMAIL':
          templateData = new TemplateCreateEmail(template.name, template.subject, template.content, template.special_variable_name || null);
          break;
        case 'WHATSAPP':
          templateData = new TemplateCreateWhatsApp(
            template.name,
            template.meta_template_name,
            template.category,
            template.components,
            template.special_variable_name || null
          );
          break;
        default:
          throw new Error('Invalid channel type');
      }
      const newTemplate = await createTemplate(templateData);
      const userRoles = user?.decoded?.roles || [];

      if (newTemplate.status === 'PENDING_INTERNAL_APPROVAL' && userRoles.includes('Directora de Operaciones')) {
        toast.success('Plantilla creada exitosamente', {
          description: 'Pendiente de revisión jurídica.'
        });
      } else if (newTemplate.status === 'PENDING_OPERATIONS_APPROVAL') {
        toast.success('Plantilla creada exitosamente', {
          description: 'Pendiente de revisión de Operaciones.'
        });
      } else {
        toast.success('Plantilla creada exitosamente', {
          description: 'La plantilla ha sido guardada correctamente.'
        });
      }

      // Redirigir después de un breve delay para que se vea el toast
      setTimeout(() => {
        navigate('/templates');
      }, 1500);

    } catch (error) {
      toast.error('Error al guardar la plantilla', {
        description: error.message
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredVariables = variables.filter(v =>
    v.variable_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8">Cargando editor...</div>;

  const containerClass = template.channel_type === 'WHATSAPP' ? 'max-w-7xl' : 'max-w-4xl';

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className={`${containerClass} mx-auto`}>
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
                  special_variable_name: '',
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
                {/* Special Variable - Always Available */}
                <div className="mb-3">
                  <div className="text-xs font-semibold text-amber-800 mb-2 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    VARIABLE ESPECIAL
                  </div>

                  {/* Draggable Variable */}
                  <div
                    className="group relative overflow-hidden p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg cursor-move hover:from-amber-100 hover:to-orange-100 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg"
                    title="Variable especial que va EN BLANCO en la plantilla. El valor se define al lanzar la campaña."
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', `{SPECIAL:variable_especial}`);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="text-amber-900 font-mono font-medium text-sm">
                          {'{SPECIAL:variable_especial}'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </div>

                    {/* Tooltip with Animation */}
                    <div className="absolute left-0 top-full mt-2 w-80 p-4 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                      <div className="font-semibold mb-2 text-amber-300 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Variable Especial
                      </div>
                      <div className="mb-3 text-gray-200 leading-relaxed">
                        <strong>💡 Importante:</strong> Esta variable irá <strong>EN BLANCO</strong> en tu plantilla.
                        El valor se define ÚNICAMENTE al momento de lanzar la campaña.
                      </div>
                      <div className="bg-amber-900 p-2 rounded text-amber-100 font-mono text-xs">
                        <div className="font-semibold mb-1">Así funciona:</div>
                        <div className="mb-1">En plantilla: "Tu cita es el <strong>{'{SPECIAL:variable_especial}'}</strong>"</div>
                        <div className="text-green-300">Al lanzar campaña: defines "15 de octubre"</div>
                        <div className="text-green-300">Resultado final: "Tu cita es el 15 de octubre"</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Regular Variables */}
                <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  VARIABLES DISPONIBLES
                </div>
                {filteredVariables.map(v => (
                  <div
                    key={v.variable_name}
                    className="p-2 my-1 bg-white border rounded cursor-move hover:bg-blue-50 hover:scale-[1.01] hover:shadow-md transition-all duration-300 ease-in-out"
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


          {/* Special Variable Info Section - Minimal */}
          <div className="mt-6 mb-4">
            <div className="group relative cursor-pointer overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg shadow-md border border-amber-200 transition-all duration-300 ease-in-out hover:shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-900">Variable Especial (Opcional)</h4>

                  {/* Contenido que aparece al hacer hover */}
                  <div className="overflow-hidden max-h-0 opacity-0 group-hover:max-h-96 group-hover:opacity-100 group-hover:mt-3 transition-all duration-500 ease-in-out">
                    <p className="text-amber-800 text-xs leading-relaxed mb-3">
                      Una variable personalizada que irá en blanco en tu plantilla. El valor se define únicamente cuando lances la campaña.
                      Perfecta para fechas, montos, códigos u otros datos que varían por campaña.
                    </p>

                    <div className="bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 rounded-md p-3">
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <h5 className="text-xs font-semibold text-amber-900 mb-1">💡 ¿Cómo funciona?</h5>
                          <p className="text-xs text-amber-800 leading-relaxed">
                            Arrastra <strong>{'{SPECIAL:variable_especial}'}</strong> desde la lista de variables a tu plantilla.
                            El valor lo defines cuando lances la campaña.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between items-center">
            <PolicyEditor onInsert={handleInsertCalculatedVariable} />
            <button
              type="submit"
              disabled={isSaving}
              className={`px-6 py-2 text-white rounded-md font-medium transition-colors duration-200 ${
                isSaving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isSaving ? 'Guardando...' : 'Guardar Plantilla'}
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

      {/* Overlay de carga mientras se guarda la plantilla */}
      {isSaving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/10 backdrop-blur-md backdrop-saturate-150 backdrop-brightness-110">
          <div className="relative flex flex-col items-center gap-4 px-8 py-6 rounded-2xl border border-white/40 bg-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.2)] ring-1 ring-white/30">
            <div className="relative h-14 w-14">
              <div className="absolute inset-0 rounded-full border-4 border-white/30"></div>
              <div className="animate-spin rounded-full h-14 w-14 bg-gradient-to-tr from-blue-500 via-cyan-400 to-indigo-500 p-[3px]">
                <div className="h-full w-full rounded-full bg-white/60 backdrop-blur-sm"></div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-800 tracking-wide drop-shadow">Guardando plantilla...</p>
              <p className="text-[11px] mt-1 text-gray-600/80">Procesando la información, por favor espera</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateEditorPage;
