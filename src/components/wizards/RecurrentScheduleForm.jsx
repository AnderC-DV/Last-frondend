import React, { useState } from 'react';

const RecurrentScheduleForm = ({ scheduleData, onScheduleChange }) => {
  const [frequencyType, setFrequencyType] = useState('custom');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onScheduleChange({ ...scheduleData, [name]: value });
  };

  const handleFrequencyChange = (e) => {
    const type = e.target.value;
    setFrequencyType(type);
    let cron_expression = '';
    // Setting a default time of 9:00 AM for presets
    switch (type) {
      case 'daily':
        cron_expression = '0 9 * * *';
        break;
      case 'every_2_days':
        cron_expression = '0 9 */2 * *';
        break;
      case 'weekly':
        cron_expression = '0 9 * * 1'; // Monday
        break;
      case 'monthly':
        cron_expression = '0 9 1 * *'; // 1st of the month
        break;
      case 'custom':
      default:
        cron_expression = '';
        break;
    }
    onScheduleChange({ ...scheduleData, cron_expression });
  };

  return (
    <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Configuración de Recurrencia</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Frequency Selection */}
        <div>
          <label htmlFor="frequencyType" className="block text-sm font-medium text-gray-700">
            Frecuencia
          </label>
          <select
            id="frequencyType"
            name="frequencyType"
            value={frequencyType}
            onChange={handleFrequencyChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="daily">Diariamente (a las 9:00 AM)</option>
            <option value="every_2_days">Cada 2 días (a las 9:00 AM)</option>
            <option value="weekly">Semanalmente (Lunes a las 9:00 AM)</option>
            <option value="monthly">Mensualmente (Día 1 a las 9:00 AM)</option>
            <option value="custom">Personalizado (CRON)</option>
          </select>
        </div>

        {/* CRON Expression Input (conditional) */}
        <div className={frequencyType === 'custom' ? 'block' : 'hidden'}>
          <label htmlFor="cron_expression" className="block text-sm font-medium text-gray-700">
            Expresión CRON Personalizada
          </label>
          <input
            type="text"
            name="cron_expression"
            id="cron_expression"
            value={scheduleData.cron_expression || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Ej: 0 9 * * 1"
          />
        </div>
        
        {/* Start and End Dates */}
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
            Fecha de Inicio (Opcional)
          </label>
          <input
            type="datetime-local"
            name="start_date"
            id="start_date"
            value={scheduleData.start_date || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
            Fecha de Fin (Opcional)
          </label>
          <input
            type="datetime-local"
            name="end_date"
            id="end_date"
            value={scheduleData.end_date || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Descripción (Opcional)
          </label>
          <textarea
            name="description"
            id="description"
            value={scheduleData.description || ''}
            onChange={handleInputChange}
            rows="3"
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Describe el propósito de esta campaña recurrente."
          ></textarea>
        </div>
      </div>
    </div>
  );
};

export default RecurrentScheduleForm;
