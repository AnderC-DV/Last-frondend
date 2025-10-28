import React from 'react';

const FormField = ({
  label,
  name,
  type = 'text',
  placeholder = '',
  value = '',
  onChange,
  onBlur,
  onFocus,
  required = false,
  disabled = false,
  className = '',
  options = [],
  autoComplete = 'off',
  error = false, // Prop para mostrar error
  ...rest // Permite pasar propiedades adicionales como max, min, etc.
}) => {
  const baseClasses = 'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder-gray-400';
  
  const errorClasses = error 
    ? 'border-red-500 focus:ring-red-500 bg-red-50'
    : 'border-gray-300 focus:ring-green-500 bg-white';
  
  const disabledClasses = disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : 'text-gray-900';

  if (type === 'select') {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          name={name}
          value={value || ''}
          onChange={(e) => onChange && onChange(e)}
          onBlur={(e) => onBlur && onBlur(e)}
          onFocus={(e) => {
            // Llamar a onFocus si se proporciona
            if (onFocus) {
              onFocus(e);
            } else if (onBlur) {
              // Si no hay onFocus específico, usar onBlur para marcar como touched
              onBlur(e);
            }
          }}
          disabled={disabled}
          className={`${baseClasses} ${errorClasses} ${disabledClasses} ${className}`}
        >
          <option value="">Selecciona una opción</option>
          {options.map((option) => (
            <option key={option.value || option} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          name={name}
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => onChange && onChange(e)}
          onBlur={(e) => onBlur && onBlur(e)}
          disabled={disabled}
          className={`${baseClasses} ${errorClasses} ${disabledClasses} ${className} resize-none`}
          rows="4"
          autoComplete={autoComplete}
        />
      </div>
    );
  }

  const handleNumericChange = (e) => {
    // Para campos numéricos, filtrar solo dígitos
    if (type === 'tel' || type === 'numeric') {
      let onlyNumbers = e.target.value.replace(/\D/g, '');
      
      // Restricción específica para celular (debe empezar con 3 y máx 10 dígitos)
      if (name === 'celular') {
        if (onlyNumbers.length > 0 && onlyNumbers[0] !== '3') {
          onlyNumbers = '3' + onlyNumbers;
        }
        onlyNumbers = onlyNumbers.substring(0, 10);
      }
      
      // Restricción para cédula (máx 12 dígitos)
      if (name === 'cedula') {
        onlyNumbers = onlyNumbers.substring(0, 12);
      }
      
      e.target.value = onlyNumbers;
    }
    onChange && onChange(e);
  };

  const handleLettersOnly = (e) => {
    // Para campo nombre, filtrar solo letras y espacios
    if (name === 'nombre') {
      // Mantener solo letras (incluyendo acentos) y espacios
      let lettersOnly = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      e.target.value = lettersOnly;
    }
    onChange && onChange(e);
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value || ''}
        onChange={name === 'nombre' ? handleLettersOnly : (type === 'tel' || type === 'numeric' ? handleNumericChange : (onChange || (() => {})))}
        onBlur={onBlur}
        disabled={disabled}
        className={`${baseClasses} ${errorClasses} ${disabledClasses} ${className}`}
        autoComplete={autoComplete}
        inputMode={type === 'tel' || type === 'numeric' ? 'numeric' : undefined}
        {...rest}
      />
    </div>
  );
};

export default FormField;
