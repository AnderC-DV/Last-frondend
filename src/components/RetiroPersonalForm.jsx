import React, { useState } from 'react';
import FormField from './FormField';

/**
 * RetiroPersonalForm - Formulario simple para retiro de personal
 */
const RetiroPersonalForm = ({ onSubmit, isSubmitting = false }) => {
  const [formData, setFormData] = useState({
    cedulaEmpleado: '',
    razonRetiro: '',
    fechaRetiro: '',
    observaciones: '',
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validCedula = (cedula) => {
    const isValid = cedula.length >= 8;
    return {
      isValid,
      message: isValid ? '' : 'Cédula inválida'
    };
  };

  const handleSubmit = async () => {
    if (onSubmit) {
      await onSubmit(formData);
    }
  };

  return (
    <div className="space-y-4">
      <FormField
        label="Cédula del Empleado"
        placeholder="1234567890"
        value={formData.cedulaEmpleado}
        onChange={(val) => updateField('cedulaEmpleado', val)}
        validator={validCedula}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Razón del Retiro</label>
        <select
          value={formData.razonRetiro}
          onChange={(e) => updateField('razonRetiro', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Selecciona una razón</option>
          <option value="renuncia">Renuncia voluntaria</option>
          <option value="despido">Despido justificado</option>
          <option value="jubilacion">Jubilación</option>
          <option value="termino_contrato">Término de contrato</option>
          <option value="otra">Otra</option>
        </select>
      </div>

      <FormField
        label="Fecha de Retiro"
        type="date"
        value={formData.fechaRetiro}
        onChange={(val) => updateField('fechaRetiro', val)}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
        <textarea
          value={formData.observaciones}
          onChange={(e) => updateField('observaciones', e.target.value)}
          placeholder="Notas adicionales sobre el retiro..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          rows="4"
        />
      </div>

      <div className="pt-4 flex gap-3 justify-end border-t border-gray-200">
        <button
          className="px-4 py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200"
          onClick={() => {
            setFormData({
              cedulaEmpleado: '',
              razonRetiro: '',
              fechaRetiro: '',
              observaciones: '',
            });
          }}
        >
          Limpiar
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Procesando...
            </>
          ) : (
            'Registrar Retiro'
          )}
        </button>
      </div>
    </div>
  );
};

export default RetiroPersonalForm;
