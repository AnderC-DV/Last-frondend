import React, { useState } from 'react';
import StepperForm from './StepperForm';
import FormField from './FormField';

/**
 * ProveedoresForm - Formulario multi-paso para creación de usuarios proveedores
 * Pasos: 1) Datos empresa, 2) Datos contacto, 3) Permisos y confirmación
 */
const ProveedoresForm = ({ onSubmit, isSubmitting = false }) => {
  const [formData, setFormData] = useState({
    nombreEmpresa: '',
    nit: '',
    direccion: '',
    telefonoEmpresa: '',
    nombreContacto: '',
    emailContacto: '',
    telefonoContacto: '',
    permisos: [],
  });

  const [selectedPermisos, setSelectedPermisos] = useState([]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const togglePermiso = (permiso) => {
    setSelectedPermisos(prev =>
      prev.includes(permiso)
        ? prev.filter(p => p !== permiso)
        : [...prev, permiso]
    );
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

  const validNIT = (nit) => {
    const isValid = /^\d{9}(-\d{1})?$/.test(nit);
    return {
      isValid,
      message: isValid ? '' : 'NIT inválido (formato: 123456789 o 123456789-1)'
    };
  };

  // Opciones de permisos disponibles
  const permisosDisponibles = [
    { id: 'leer_catalogos', label: 'Leer Catálogos' },
    { id: 'crear_ordenes', label: 'Crear Órdenes' },
    { id: 'ver_facturacion', label: 'Ver Facturación' },
    { id: 'descargar_reportes', label: 'Descargar Reportes' },
    { id: 'acceso_api', label: 'Acceso a API' },
  ];

  // Pasos del formulario
  const steps = [
    {
      title: 'Datos de la Empresa',
      description: 'Información básica del proveedor',
      component: (
        <div className="space-y-4">
          <FormField
            label="Nombre de la Empresa"
            placeholder="Empresa XYZ S.A."
            value={formData.nombreEmpresa}
            onChange={(val) => updateField('nombreEmpresa', val)}
            validator={(val) => ({
              isValid: val.trim().length >= 3,
              message: 'El nombre debe tener al menos 3 caracteres'
            })}
            required
          />
          <FormField
            label="NIT"
            placeholder="123456789-1"
            value={formData.nit}
            onChange={(val) => updateField('nit', val)}
            validator={validNIT}
            required
          />
          <FormField
            label="Dirección"
            placeholder="Calle 123 # 45-67"
            value={formData.direccion}
            onChange={(val) => updateField('direccion', val)}
            validator={(val) => ({
              isValid: val.trim().length >= 5,
              message: 'Dirección requerida'
            })}
            required
          />
          <FormField
            label="Teléfono Empresa"
            type="tel"
            placeholder="3001234567"
            value={formData.telefonoEmpresa}
            onChange={(val) => updateField('telefonoEmpresa', val)}
            validator={validPhone}
            required
          />
        </div>
      ),
    },
    {
      title: 'Datos del Contacto',
      description: 'Información de quien administrará la cuenta',
      component: (
        <div className="space-y-4">
          <FormField
            label="Nombre Completo del Contacto"
            placeholder="Juan Pérez"
            value={formData.nombreContacto}
            onChange={(val) => updateField('nombreContacto', val)}
            validator={(val) => ({
              isValid: val.trim().length >= 3,
              message: 'El nombre debe tener al menos 3 caracteres'
            })}
            required
          />
          <FormField
            label="Email"
            type="email"
            placeholder="contacto@empresa.com"
            value={formData.emailContacto}
            onChange={(val) => updateField('emailContacto', val)}
            validator={validEmail}
            required
          />
          <FormField
            label="Teléfono del Contacto"
            type="tel"
            placeholder="3001234567"
            value={formData.telefonoContacto}
            onChange={(val) => updateField('telefonoContacto', val)}
            validator={validPhone}
            required
          />
        </div>
      ),
    },
    {
      title: 'Permisos y Confirmación',
      description: 'Define qué funcionalidades puede acceder',
      component: (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Permisos de Acceso</p>
            <div className="space-y-2">
              {permisosDisponibles.map(permiso => (
                <label key={permiso.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedPermisos.includes(permiso.id)}
                    onChange={() => togglePermiso(permiso.id)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {permiso.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
            <h4 className="font-medium text-green-900 mb-3">Resumen</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Empresa:</span> {formData.nombreEmpresa}</p>
              <p><span className="font-medium">Contacto:</span> {formData.nombreContacto}</p>
              <p><span className="font-medium">Email:</span> {formData.emailContacto}</p>
              <p><span className="font-medium">Permisos:</span> {selectedPermisos.length > 0 ? selectedPermisos.join(', ') : 'Ninguno'}</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const handleComplete = async () => {
    if (onSubmit) {
      await onSubmit({
        ...formData,
        permisos: selectedPermisos,
      });
    }
  };

  return (
    <StepperForm
      steps={steps}
      onComplete={handleComplete}
      isSubmitting={isSubmitting}
      submitLabel="Crear Proveedor"
    />
  );
};

export default ProveedoresForm;
