import React, { useState } from 'react';
import StepperForm from './StepperForm';
import FormField from './FormField';

/**
 * IngresoPersonalForm - Formulario multi-paso para ingreso de personal
 * Pasos: 1) Datos básicos, 2) Asignación laboral, 3) Confirmación
 */
const IngresoPersonalForm = ({ onSubmit, isSubmitting = false }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    cedula: '',
    rol: 'empleado',
    departamento: '',
    salario: '',
    fechaIngreso: '',
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validadores
  const validEmail = (email) => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return {
      isValid,
      message: isValid ? '' : 'Email inválido'
    };
  };

  const validPhone = (phone) => {
    const isValid = /^\d{10}$/.test(phone.replace(/\D/g, ''));
    return {
      isValid,
      message: isValid ? '' : 'Teléfono debe tener 10 dígitos'
    };
  };

  const validCedula = (cedula) => {
    const isValid = cedula.length >= 8;
    return {
      isValid,
      message: isValid ? '' : 'Cédula inválida'
    };
  };

  const validSalary = (salary) => {
    const isValid = !isNaN(salary) && Number(salary) > 0;
    return {
      isValid,
      message: isValid ? '' : 'Salario debe ser un número positivo'
    };
  };

  // Pasos del formulario
  const steps = [
    {
      title: 'Datos Básicos',
      description: 'Ingresa la información personal del nuevo empleado',
      component: (
        <div className="space-y-4">
          <FormField
            label="Nombre Completo"
            placeholder="Juan Pérez García"
            value={formData.nombre}
            onChange={(val) => updateField('nombre', val)}
            validator={(val) => ({
              isValid: val.trim().length >= 3,
              message: 'El nombre debe tener al menos 3 caracteres'
            })}
            required
          />
          <FormField
            label="Email"
            type="email"
            placeholder="juan@ejemplo.com"
            value={formData.email}
            onChange={(val) => updateField('email', val)}
            validator={validEmail}
            required
          />
          <FormField
            label="Teléfono"
            type="tel"
            placeholder="3001234567"
            value={formData.telefono}
            onChange={(val) => updateField('telefono', val)}
            validator={validPhone}
            required
          />
          <FormField
            label="Cédula"
            placeholder="1234567890"
            value={formData.cedula}
            onChange={(val) => updateField('cedula', val)}
            validator={validCedula}
            required
          />
        </div>
      ),
    },
    {
      title: 'Asignación Laboral',
      description: 'Configura el rol y departamento del empleado',
      component: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
            <select
              value={formData.rol}
              onChange={(e) => updateField('rol', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="empleado">Empleado</option>
              <option value="supervisor">Supervisor</option>
              <option value="gerente">Gerente</option>
              <option value="director">Director</option>
            </select>
          </div>
          <FormField
            label="Departamento"
            placeholder="ej: Recursos Humanos"
            value={formData.departamento}
            onChange={(val) => updateField('departamento', val)}
            validator={(val) => ({
              isValid: val.trim().length >= 2,
              message: 'Departamento requerido'
            })}
            required
          />
          <FormField
            label="Salario Mensual"
            type="number"
            placeholder="2500000"
            value={formData.salario}
            onChange={(val) => updateField('salario', val)}
            validator={validSalary}
            required
          />
          <FormField
            label="Fecha de Ingreso"
            type="date"
            value={formData.fechaIngreso}
            onChange={(val) => updateField('fechaIngreso', val)}
            required
          />
        </div>
      ),
    },
    {
      title: 'Confirmación',
      description: 'Revisa los datos antes de guardar',
      component: (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 font-medium">Nombre:</p>
              <p className="text-gray-900">{formData.nombre}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Email:</p>
              <p className="text-gray-900">{formData.email}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Teléfono:</p>
              <p className="text-gray-900">{formData.telefono}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Cédula:</p>
              <p className="text-gray-900">{formData.cedula}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Rol:</p>
              <p className="text-gray-900 capitalize">{formData.rol}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Departamento:</p>
              <p className="text-gray-900">{formData.departamento}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Salario:</p>
              <p className="text-gray-900">${Number(formData.salario).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Fecha Ingreso:</p>
              <p className="text-gray-900">{formData.fechaIngreso}</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const handleComplete = async () => {
    if (onSubmit) {
      await onSubmit(formData);
    }
  };

  return (
    <StepperForm
      steps={steps}
      onComplete={handleComplete}
      isSubmitting={isSubmitting}
      submitLabel="Guardar Empleado"
    />
  );
};

export default IngresoPersonalForm;
