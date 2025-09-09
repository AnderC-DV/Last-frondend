import React, { useState, useEffect } from 'react';
import RecurrentScheduleForm from './RecurrentScheduleForm';

const Step4_Scheduling = ({ campaignData, setCampaignData }) => {
  const [scheduleType, setScheduleType] = useState(campaignData.schedule_type || 'immediate');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [recurrentData, setRecurrentData] = useState(campaignData.schedule_details || {
    cron_expression: '',
    start_date: '',
    end_date: '',
    description: ''
  });

  // Efecto para inicializar los campos de fecha y hora si ya existen en campaignData
  useEffect(() => {
    if (campaignData.schedule_type === 'scheduled' && campaignData.scheduled_at) {
      const localDate = new Date(campaignData.scheduled_at);
      
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);

      const hours = String(localDate.getHours()).padStart(2, '0');
      const minutes = String(localDate.getMinutes()).padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    }
  }, []); // Se ejecuta solo una vez al montar el componente

  useEffect(() => {
    let updatedData = { ...campaignData, schedule_type: scheduleType };

    if (scheduleType === 'immediate') {
      delete updatedData.scheduled_at;
      delete updatedData.schedule_details;
    } else if (scheduleType === 'scheduled') {
      delete updatedData.schedule_details;
      if (date && time) {
        const combinedDateTime = new Date(`${date}T${time}`);
        updatedData.scheduled_at = combinedDateTime.toISOString();
      } else {
        delete updatedData.scheduled_at;
      }
    } else if (scheduleType === 'recurrent') {
      delete updatedData.scheduled_at;
      updatedData.schedule_details = {
        ...recurrentData,
        start_date: recurrentData.start_date ? new Date(recurrentData.start_date).toISOString() : null,
        end_date: recurrentData.end_date ? new Date(recurrentData.end_date).toISOString() : null,
      };
    }
    
    setCampaignData(updatedData);

  }, [scheduleType, date, time, recurrentData]);

  const handleScheduleTypeChange = (e) => {
    setScheduleType(e.target.value);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800">Programa el Envío</h2>
      <p className="text-gray-500 mt-1">Define cuándo se enviará la campaña.</p>

      <div className="mt-8 space-y-6">
        <div className="space-y-4">
          {/* Opción Inmediato */}
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="scheduleType"
              value="immediate"
              checked={scheduleType === 'immediate'}
              onChange={handleScheduleTypeChange}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm font-medium text-gray-800">Envío Inmediato</span>
          </label>
          {/* Opción Programado */}
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="scheduleType"
              value="scheduled"
              checked={scheduleType === 'scheduled'}
              onChange={handleScheduleTypeChange}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm font-medium text-gray-800">Envío Programado</span>
          </label>
          {/* Opción Recurrente */}
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="scheduleType"
              value="recurrent"
              checked={scheduleType === 'recurrent'}
              onChange={handleScheduleTypeChange}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm font-medium text-gray-800">Campaña Recurrente</span>
          </label>
        </div>

        {/* Campos de Fecha y Hora (si está programado) */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${scheduleType === 'scheduled' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
              <input
                type="time"
                id="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Formulario de Recurrencia (si es recurrente) */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${scheduleType === 'recurrent' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <RecurrentScheduleForm 
            scheduleData={recurrentData}
            onScheduleChange={setRecurrentData}
          />
        </div>
      </div>
    </div>
  );
};

export default Step4_Scheduling;
