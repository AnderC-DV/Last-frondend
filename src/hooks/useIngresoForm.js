import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { validateForm, validators } from '../utils/InputValidator';
import * as api from '../services/api';

/**
 * Hook personalizado para gestionar el formulario de ingreso de personal
 * Maneja validación, estado del formulario y limpieza de datos
 */
const useIngresoForm = (initialState = {}) => {
  const defaultState = {
    // Step 1 - Datos Personales
    cedula: '',
    nombre: '',
    celular: '',
    correo_personal: '',
    
    // Step 2 - Datos Laborales
    cargo: '',
    area: '',
    fecha_ingreso: '',
    contrato: '',
    jefe_inmediato: '',
    extension_3cx: '',
    cola: '',
    adminfo: '',
    asignacion: '',
    
    // Step 3 - Credenciales Renovar
    correo_renovar: '',
    password_renovar: '',
    password_renovar_confirm: '',
    
    // Datos adicionales personales (nuevos)
    estado: '',
    ciudad: '',
    localidad: '', // Nueva: localidad de Bogotá
    fecha_nacimiento: '',
    genero: '',
    lugar: '',
    direccion_residencia: '',
    eps: '',
    fondo_pensiones: '',
    arl: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    cantidad_hijos: '',
  };

  const [formData, setFormData] = useState({ ...defaultState, ...initialState });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [cedulaValidating, setCedulaValidating] = useState(false);

  /**
   * Reglas de validación del formulario
   */
  const validationRules = {
    cedula: validators.cedula,
    nombre: validators.nombre,
    celular: validators.celular,
    correo_personal: (value) => validators.email(value, 'correo personal'),
    cargo: (value) => validators.required(value, 'Cargo'),
    area: (value) => validators.required(value, 'Área'),
    fecha_ingreso: validators.date,
    contrato: (value) => validators.required(value, 'Tipo de Contrato'),
    jefe_inmediato: validators.jefeInmediato,
    correo_renovar: (value) => validators.email(value, 'correo Renovar'),
    password_renovar: validators.password,
    fecha_nacimiento: validators.fechaNacimiento,
    contacto_emergencia_nombre: validators.nombreContactoEmergencia,
    contacto_emergencia_telefono: validators.telefonoEmergencia,
    genero: (value) => !value || value === '' ? 'Este campo es requerido' : null,
    estado: (value) => !value || value === '' ? 'Este campo es requerido' : null,
    ciudad: (value) => !value || value === '' ? 'Este campo es requerido' : null,
    localidad: (value) => !value || value === '' ? 'Este campo es requerido' : null,
    lugar: (value) => !value || value === '' ? 'Este campo es requerido' : null,
    direccion_residencia: (value) => {
      if (!value || value.toString().trim() === '') {
        return 'Este campo es requerido';
      }
      if (value.trim().length < 5) {
        return 'La dirección debe tener al menos 5 caracteres';
      }
      return null;
    },
    eps: (value) => !value || value === '' ? 'Este campo es requerido' : null,
    fondo_pensiones: (value) => !value || value === '' ? 'Este campo es requerido' : null,
    arl: (value) => !value || value === '' ? 'Este campo es requerido' : null,
    cantidad_hijos: (value) => !value || value === '' ? 'Este campo es requerido' : null,
  };

  /**
   * Validar cédula contra la API para evitar duplicados
   */
  const validateCedulaAgainstAPI = useCallback(async (cedula) => {
    if (!cedula || !/^\d{8,12}$/.test(cedula.replace(/\D/g, ''))) {
      return null;
    }

    setCedulaValidating(true);
    try {
      // getEmployeeByCedula retorna null si no existe (404)
      const employee = await api.getEmployeeByCedula(cedula);
      
      if (employee) {
        // La cédula ya existe en el sistema - Mostrar toast y retornar error para bloquear
        let mensaje = '';
        if (employee.estado === 'ACTIVO') {
          mensaje = 'Esta cédula ya está registrada como empleado activo.';
        } else if (employee.estado === 'PENDIENTE_APROBACION_JURIDICO') {
          mensaje = 'Esta cédula está pendiente de aprobación jurídica.';
        } else if (employee.estado === 'RETIRADO') {
          mensaje = 'Esta cédula corresponde a un empleado retirado.';
        } else {
          mensaje = `Esta cédula ya existe en el sistema (Estado: ${employee.estado}).`;
        }
        
        // Mostrar toast de error Y retornar mensaje para bloquear el formulario
        toast.error(mensaje);
        return mensaje;
      }
      // Si retorna null, la cédula no existe (es un usuario nuevo) - permitir continuar
      return null;
    } catch (error) {
      // Para otros errores inesperados, no bloquear pero loguear
      console.warn('Error validando cédula:', error);
      return null;
    } finally {
      setCedulaValidating(false);
    }
  }, []);

  /**
   * Validar un campo individual
   */
  const validateField = useCallback((fieldName, value) => {
    if (!validationRules[fieldName]) {
      return null;
    }

    if (fieldName === 'password_renovar_confirm') {
      return validators.passwordMatch(formData.password_renovar, value);
    }

    // Para jefe_inmediato, pasar también el cargo
    if (fieldName === 'jefe_inmediato') {
      return validators.jefeInmediato(value, formData.cargo);
    }

    if (typeof validationRules[fieldName] === 'function') {
      return validationRules[fieldName](value);
    }

    return null;
  }, [formData.password_renovar, formData.cargo]);

  /**
   * Manejar cambios en los campos
   */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validar si el campo ya ha sido tocado
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }
  }, [touched, validateField]);

  /**
   * Manejar blur (campo pierde foco)
   */
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, formData[name]);
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  }, [validateField, formData]);

  /**
   * Validar cédula específicamente (con validación API)
   */
  const validateCedula = useCallback(async () => {
    const basicError = validateField('cedula', formData.cedula);
    
    if (basicError) {
      setErrors(prev => ({ ...prev, cedula: basicError }));
      return false;
    }

    const apiError = await validateCedulaAgainstAPI(formData.cedula);
    if (apiError) {
      setErrors(prev => ({ ...prev, cedula: apiError }));
      return false;
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.cedula;
      return newErrors;
    });

    return true;
  }, [formData.cedula, validateField, validateCedulaAgainstAPI]);

  /**
   * Validar todos los campos
   */
  const validateAll = useCallback(() => {
    const requiredFields = {
      cedula: formData.cedula,
      nombre: formData.nombre,
      celular: formData.celular,
      correo_personal: formData.correo_personal,
      cargo: formData.cargo,
      area: formData.area,
      fecha_ingreso: formData.fecha_ingreso,
      contrato: formData.contrato,
      jefe_inmediato: formData.jefe_inmediato,
      fecha_nacimiento: formData.fecha_nacimiento,
      genero: formData.genero,
      estado: formData.estado,
      ciudad: formData.ciudad,
      ...(formData.ciudad === 'BOGOTA' && { localidad: formData.localidad }),
      lugar: formData.lugar,
      direccion_residencia: formData.direccion_residencia,
      eps: formData.eps,
      fondo_pensiones: formData.fondo_pensiones,
      arl: formData.arl,
      cantidad_hijos: formData.cantidad_hijos,
      contacto_emergencia_nombre: formData.contacto_emergencia_nombre,
      contacto_emergencia_telefono: formData.contacto_emergencia_telefono,
      correo_renovar: formData.correo_renovar,
      password_renovar: formData.password_renovar,
      password_renovar_confirm: formData.password_renovar_confirm,
    };

    const newErrors = {};
    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    // Validar campos requeridos que no tienen reglas de validación específicas
    let fieldsWithoutRules = ['contrato', 'fecha_nacimiento', 'genero', 'estado', 'ciudad', 'lugar', 
                                'direccion_residencia', 'eps', 'fondo_pensiones', 'arl', 'cantidad_hijos',
                                'contacto_emergencia_nombre', 'contacto_emergencia_telefono'];
    
    // Agregar localidad solo si es Bogotá
    if (formData.ciudad === 'BOGOTA') {
      fieldsWithoutRules.push('localidad');
    }
    
    fieldsWithoutRules.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors[field] = 'Este campo es requerido';
      }
    });

    // Validar coincidencia de contraseñas
    if (formData.password_renovar && formData.password_renovar_confirm) {
      const passwordMatchError = validators.passwordMatch(formData.password_renovar, formData.password_renovar_confirm);
      if (passwordMatchError) {
        newErrors.password_renovar_confirm = passwordMatchError;
      }
    }

    setErrors(newErrors);
    setTouched(
      Object.keys(requiredFields).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {})
    );

    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  /**
   * Obtener datos limpios para enviar a la API
   */
  const getCleanData = useCallback(() => {
    const { password_renovar_confirm, ...cleanData } = formData;
    
    // Si no es Bogotá, eliminar localidad del payload
    if (cleanData.ciudad !== 'BOGOTA') {
      delete cleanData.localidad;
    }
    
    return cleanData;
  }, [formData]);

  /**
   * Resetear el formulario
   */
  const reset = useCallback(() => {
    setFormData({ ...defaultState });
    setErrors({});
    setTouched({});
  }, []);

  /**
   * Setear valores del formulario
   */
  const setValues = useCallback((newValues) => {
    setFormData(prev => ({ ...prev, ...newValues }));
  }, []);

  /**
   * Obtener error de un campo (solo si ha sido tocado)
   */
  const getFieldError = useCallback((fieldName) => {
    return touched[fieldName] ? errors[fieldName] : null;
  }, [touched, errors]);

  /**
   * Verificar si el formulario tiene errores
   */
  const hasErrors = Object.keys(errors).length > 0;

  /**
   * Verificar si un campo específico tiene error
   */
  const hasFieldError = useCallback((fieldName) => {
    return touched[fieldName] && !!errors[fieldName];
  }, [touched, errors]);

  return {
    formData,
    errors,
    touched,
    cedulaValidating,
    handleChange,
    handleBlur,
    validateField,
    validateCedula,
    validateAll,
    getCleanData,
    reset,
    setValues,
    getFieldError,
    hasErrors,
    hasFieldError,
    setFormData,
    setErrors,
    setTouched,
  };
};

export default useIngresoForm;
