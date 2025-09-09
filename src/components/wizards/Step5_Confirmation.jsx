import React, { useState, useEffect } from 'react';
import { getSimpleFilters, BASE_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import EmailPreview from './EmailPreview';
import SimpleFilterRulesPreview from './SimpleFilterRulesPreview';
import { toast } from 'sonner';
import { 
  DetailItem, 
  WhatsAppIcon, 
  SmsIcon, 
  EMAILIcon 
} from './wizardUtils';

const Step5_Confirmation = ({ campaignData }) => {
  const [audienceName, setAudienceName] = useState('Cargando...');
  const [audienceDefinition, setAudienceDefinition] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  // Los datos de la plantilla y el conteo ahora vienen directamente de campaignData
  const { templateName, previewContent, previewSubject, client_count = 0 } = campaignData;
  const { getAccessToken } = useAuth();
  const token = getAccessToken();

  useEffect(() => {
    if (campaignData.audience_filter_id) {
      getSimpleFilters(token).then(filters => {
        const found = filters.find(f => f.id === campaignData.audience_filter_id);
        if (found) {
          setAudienceName(found.name);
          setAudienceDefinition(found.definition);
        } else {
          setAudienceName('Filtro no encontrado');
          setAudienceDefinition(null);
        }
      });
    } else {
      const generalCount = campaignData.definition?.general?.length || 0;
      const excludeCount = campaignData.definition?.exclude?.reduce((acc, group) => acc + group.length, 0) || 0;
      setAudienceName(`Filtro Nuevo (${generalCount + excludeCount} condiciones)`);
      setAudienceDefinition(campaignData.definition || null);
    }

  }, [campaignData.audience_filter_id, campaignData.definition, token]);

  const getChannelIcon = () => {
    const iconProps = { className: "h-6 w-6 mr-2" };
    switch (campaignData.channel) {
      case 'WhatsApp': return <WhatsAppIcon {...iconProps} />;
      case 'SMS': return <SmsIcon {...iconProps} />;
      case 'EMAIL': return <EMAILIcon {...iconProps} />;
      default: return null;
    }
  };

  const handleDownloadCSV = async () => {
    // Validaciones rápidas antes de llamar al backend
    if (!campaignData?.channel) {
      toast.error("Selecciona un canal para continuar.");
      return;
    }
    if (!campaignData?.message_template_id) {
      toast.error("Selecciona una plantilla antes de descargar la vista previa.");
      return;
    }
    if (!campaignData?.audience_filter_id && !campaignData?.definition) {
      toast.error("Define la audiencia (filtro guardado o reglas nuevas) para generar la vista previa.");
      return;
    }
    if ((campaignData?.target_role === 'CODEUDOR' || campaignData?.target_role === 'AMBAS') && !campaignData?.codebtor_strategy) {
      toast.error("Selecciona la estrategia de codeudor.");
      return;
    }

    setIsDownloading(true);
    toast.info("Descargando el archivo CSV...");

    try {
      // Construye el payload respetando filtro guardado o definición en memoria
      const campaignPayload = {
        name: campaignData.name,
        channel_type: campaignData.channel?.toUpperCase(),
        message_template_id: campaignData.message_template_id,
        target_role: campaignData.target_role,
        codebtor_strategy:
          campaignData.target_role === 'CODEUDOR' || campaignData.target_role === 'AMBAS'
            ? campaignData.codebtor_strategy
            : null,
        scheduled_at: campaignData.scheduled_at || null,
        // source_schedule_id no es necesario para el preview de una campaña única
      };

      if (campaignData.audience_filter_id) {
        campaignPayload.audience_filter_id = campaignData.audience_filter_id;
      } else if (campaignData.definition) {
        // Permite previsualizar con un filtro nuevo sin necesidad de guardarlo
        campaignPayload.audience_definition = campaignData.definition;
      }

      const response = await fetch(`${BASE_URL}/campaigns/preview/csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/csv,application/octet-stream,application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(campaignPayload),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Intenta usar el nombre de archivo del header si existe
        const disposition = response.headers.get('Content-Disposition') || '';
        const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
        const serverFileName = decodeURIComponent(match?.[1] || match?.[2] || '');
        a.download = serverFileName || 'segmentacion_preview.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Archivo CSV descargado con éxito.");
      } else {
        // Intenta extraer mensaje detallado del cuerpo de la respuesta
        let errorMessage = `Error al descargar el CSV (${response.status})`;
        try {
          const contentType = response.headers.get('Content-Type') || '';
          if (contentType.includes('application/json')) {
            const data = await response.json();
            if (Array.isArray(data?.detail)) {
              errorMessage = data.detail.map(d => (d.msg || d.message || JSON.stringify(d))).join('; ');
            } else if (typeof data?.detail === 'string') {
              errorMessage = data.detail;
            } else if (data?.message) {
              errorMessage = data.message;
            }
          } else {
            const text = await response.text();
            if (text) errorMessage = text;
          }
        } catch (parseErr) {
          // Ignora errores de parsing, ya tenemos un mensaje genérico
        }
        console.error('Error al descargar el CSV:', errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error en la solicitud de descarga de CSV:', error);
      toast.error("Error en la solicitud de descarga de CSV.");
    } finally {
      setIsDownloading(false);
    }
  };

  const renderScheduleDetails = () => {
    const { schedule_type, scheduled_at, schedule_details } = campaignData;

    if (schedule_type === 'recurrent' && schedule_details) {
      return (
        <div className="text-sm text-gray-900">
          <p className="font-semibold">Campaña Recurrente</p>
          <p>Frecuencia: <span className="font-mono bg-gray-100 px-1 rounded">{schedule_details.cron_expression}</span></p>
          {schedule_details.start_date && <p>Inicia: {new Date(schedule_details.start_date).toLocaleString()}</p>}
          {schedule_details.end_date && <p>Termina: {new Date(schedule_details.end_date).toLocaleString()}</p>}
        </div>
      );
    }

    if (schedule_type === 'scheduled' && scheduled_at) {
      return `Programado para: ${new Date(scheduled_at).toLocaleString()}`;
    }

    return 'Envío Inmediato';
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800">Revisa y Confirma tu Campaña</h2>
      <p className="text-gray-500 mt-1">Verifica todos los detalles antes de continuar.</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <DetailItem label="Nombre">{campaignData.name}</DetailItem>
        <DetailItem label="Plantilla">{templateName || 'No seleccionada'}</DetailItem>
        <DetailItem label="Canal">
          <div className="flex items-center">{getChannelIcon()} {campaignData.channel}</div>
        </DetailItem>
        <DetailItem label="Programación">
          {renderScheduleDetails()}
        </DetailItem>
        <DetailItem label="Audiencia">
          {audienceName}
          <SimpleFilterRulesPreview definition={audienceDefinition} />
        </DetailItem>
        <DetailItem label="Público Dirigido">
          {campaignData.target_role === 'DEUDOR' ? 'Deudor' : campaignData.target_role === 'CODEUDOR' ? 'Codeudor' : 'Ambas'}
        </DetailItem>
        {(campaignData.target_role === 'CODEUDOR' || campaignData.target_role === 'AMBAS') && (
          <DetailItem label="Estrategia Codeudor">
            {campaignData.codebtor_strategy === 'FIRST' ? 'Enviar al primero' : 'Enviar a todos'}
          </DetailItem>
        )}
        <DetailItem label="Clientes Alcanzados">{client_count.toLocaleString()}</DetailItem>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleDownloadCSV}
          disabled={isDownloading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isDownloading ? "Descargando..." : "Descargar Vista Previa CSV"}
        </button>
      </div>

      {campaignData.channel === 'EMAIL' ? (
        <EmailPreview 
          subject={previewSubject} 
          htmlContent={previewContent} 
        />
      ) : (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Vista Previa del Mensaje</h3>
          <div className="p-4 bg-gray-50 rounded-lg border">
            <p className="text-gray-700 whitespace-pre-wrap">{previewContent}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step5_Confirmation;
