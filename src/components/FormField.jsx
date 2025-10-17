import React, { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

/**
 * FormField - Input reutilizable con validación en tiempo real
 * 
 * Props:
 * - label (string): Etiqueta del campo
 * - type (string): 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' (default: 'text')
 * - placeholder (string): Placeholder del input
 * - value (string): Valor actual
 * - onChange (function): Callback al cambiar valor
 * - validator (function): Función que retorna { isValid, message } (opcional)
 * - error (string): Mensaje de error externo (opcional)
 * - required (boolean): Es requerido (default: false)
 * - disabled (boolean): Input deshabilitado (default: false)
 * - helperText (string): Texto de ayuda debajo (opcional)
 * - className (string): Clases adicionales para el input
 */
const FormField = ({
  label,
  type = 'text',
  placeholder = '',
  value = '',
  onChange,
  validator,
  error: externalError,
  required = false,
  disabled = false,
  helperText,
  className = '',
}) => {
  const [isTouched, setIsTouched] = useState(false);

  const validation = validator && isTouched ? validator(value) : null;
  const error = externalError || (validation && !validation.isValid ? validation.message : null);
  const isValid = validation && validation.isValid;

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setIsTouched(true)}
          onFocus={() => setIsTouched(true)}
          disabled={disabled}
          className={`
            w-full px-3 py-2 border rounded-lg
            transition-all duration-200
            ${disabled 
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
              : 'bg-white text-gray-900 border-gray-300'
            }
            ${error 
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
              : isValid
              ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-200'
              : 'focus:border-green-500 focus:ring-2 focus:ring-green-100'
            }
            focus:outline-none
            placeholder-gray-400
            ${className}
          `}
        />
        
        {/* Validación Viva */}
        {isTouched && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {error ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : isValid ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : null}
          </div>
        )}
      </div>

      {/* Mensajes de error o helper text */}
      <div className="mt-2 min-h-[20px]">
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    </div>
  );
};

export default FormField;
