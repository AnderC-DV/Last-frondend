import React, { useState } from 'react';
import FormField from './FormField';

const RetiroPersonalForm = ({ onSubmit, isSubmitting = false, empleado = null, onCancel }) => {
  const [formData, setFormData] = useState({
    cedula_a_retirar: empleado?.cedula || '',
    motivo_retiro: '',
    fecha_retiro_deseada: '',
    observacion_retiro: '',
  });

  // DEBUG: Log cuando cambia formData
  React.useEffect(() => {
    console.log('RetiroPersonalForm updated:', formData);
  }, [formData]);

  const handleChange = (e) => {
    console.log('onChange disparado:', e.target.name, e.target.value);
    const { name, value } = e.target;
    setFormData(prevState => {
      const newState = { ...prevState, [name]: value };
      console.log('Nuevo estado:', newState);
      return newState;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    if (onSubmit) await onSubmit({...formData, estado: 'RETIRO_SOLICITADO'});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Retiro de Personal</h3>
        <p className="text-sm text-gray-600">Registra la solicitud de retiro del empleado</p>
        <FormField 
          label="Cédula del Empleado" 
          name="cedula_a_retirar" 
          value={formData.cedula_a_retirar} 
          onChange={handleChange} 
          placeholder="1234567890" 
          required 
          disabled={!!empleado} 
        />
        <FormField 
          label="Motivo del Retiro" 
          name="motivo_retiro" 
          type="select" 
          value={formData.motivo_retiro} 
          onChange={handleChange} 
          options={[
            {label: 'Selecciona una razón', value: ''}, 
            {label: 'Renuncia voluntaria', value: 'RENUNCIA_VOLUNTARIA'}, 
            {label: 'Terminación de contrato', value: 'TERMINACION_CONTRATO'}, 
            {label: 'Despido', value: 'DESPIDO'}, 
            {label: 'Jubilación', value: 'JUBILACION'}, 
            {label: 'Otro', value: 'OTRO'}
          ]} 
          required 
        />
        <FormField 
          label="Fecha de Retiro Deseada" 
          name="fecha_retiro_deseada" 
          type="date" 
          value={formData.fecha_retiro_deseada} 
          onChange={handleChange} 
          required 
        />
        <FormField 
          label="Observaciones (Opcional)" 
          name="observacion_retiro" 
          type="textarea" 
          value={formData.observacion_retiro} 
          onChange={handleChange} 
          placeholder="Notas adicionales sobre el retiro..." 
        />
      </div>
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-4 py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="px-6 py-2 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Procesando...
            </>
          ) : (
            'Solicitar Retiro'
          )}
        </button>
      </div>
    </form>
  );
};

export default RetiroPersonalForm;
