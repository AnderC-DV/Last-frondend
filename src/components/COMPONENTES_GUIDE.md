# 📚 Guía de Componentes Modernos - Administración de Personal

## Componentes Creados

### 1. **ModernModal.jsx** - Modal Dialog Genérico
Componente base reutilizable para cualquier modal.

**Props:**
```javascript
{
  isOpen: boolean,           // Controla visibilidad
  onClose: function,        // Callback al cerrar
  title: string,           // Título del modal
  children: ReactNode,     // Contenido
  size: 'sm'|'md'|'lg'|'xl', // Tamaño (default: 'md')
  showBackdrop: boolean,   // Mostrar backdrop (default: true)
  closeOnBackdropClick: boolean, // Cerrar al click en backdrop (default: true)
  icon: ReactNode,         // Ícono en el header (opcional)
  actions: ReactNode,      // Botones en footer (opcional)
}
```

**Ejemplo de uso:**
```jsx
<ModernModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Mi Modal"
  icon={<Icon className="h-6 w-6" />}
  size="md"
>
  <p>Contenido aquí</p>
</ModernModal>
```

**Características:**
- ✅ Animaciones suaves (scale + fade)
- ✅ Backdrop con blur
- ✅ Scroll interno automático
- ✅ Responsive (mobile-first)
- ✅ Previene scroll de página cuando abierto

---

### 2. **FormField.jsx** - Input Reutilizable
Input con validación en tiempo real y feedback visual.

**Props:**
```javascript
{
  label: string,           // Etiqueta
  type: string,           // text, email, password, number, tel, date
  placeholder: string,    // Placeholder
  value: string,          // Valor actual
  onChange: function,     // onChange callback
  validator: function,    // (val) => { isValid, message }
  error: string,          // Error externo
  required: boolean,      // Es requerido
  disabled: boolean,      // Input deshabilitado
  helperText: string,     // Texto de ayuda
  className: string,      // Clases adicionales
}
```

**Ejemplo:**
```jsx
<FormField
  label="Email"
  type="email"
  placeholder="usuario@ejemplo.com"
  value={email}
  onChange={setEmail}
  validator={(val) => ({
    isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    message: 'Email inválido'
  })}
  required
/>
```

**Características:**
- ✅ Validación en vivo con checkmark/error
- ✅ Focus glow verde
- ✅ Estados: default, focus, error, valid
- ✅ Helper text dinámico

---

### 3. **StepperForm.jsx** - Wizard Multi-Paso
Componente para formularios complejos con múltiples pasos.

**Props:**
```javascript
{
  steps: [
    { title: string, description?: string, component: ReactNode }
  ],
  onComplete: function,        // Callback al finalizar
  onCancel: function,          // Callback cancelar
  isSubmitting: boolean,       // Si está enviando
  submitLabel: string,         // Texto botón submit
}
```

**Ejemplo:**
```jsx
<StepperForm
  steps={[
    { title: 'Paso 1', component: <Step1 /> },
    { title: 'Paso 2', component: <Step2 /> },
    { title: 'Confirmación', component: <Confirm /> }
  ]}
  onComplete={handleSubmit}
  submitLabel="Guardar"
/>
```

**Características:**
- ✅ Barra de progreso animada
- ✅ Navegación Anterior/Siguiente
- ✅ Indicadores de paso
- ✅ Loading state en submit
- ✅ Botón Cancelar opcional

---

### 4. **IngresoPersonalForm.jsx**
Formulario de ingreso de personal con 3 pasos (Datos → Asignación → Confirmación).

**Pasos:**
1. Datos Básicos (nombre, email, teléfono, cédula)
2. Asignación Laboral (rol, departamento, salario, fecha)
3. Confirmación (resumen y envío)

**Props:**
```javascript
{
  onSubmit: function,      // (formData) => Promise
  isSubmitting: boolean,   // Estado de carga
}
```

---

### 5. **RetiroPersonalForm.jsx**
Formulario simple para retiro de personal.

**Campos:**
- Cédula del empleado
- Razón del retiro (dropdown)
- Fecha de retiro
- Observaciones

**Props:**
```javascript
{
  onSubmit: function,      // (formData) => Promise
  isSubmitting: boolean,
}
```

---

### 6. **ProveedoresForm.jsx**
Formulario multi-paso para crear usuarios de proveedores (3 pasos).

**Pasos:**
1. Datos de Empresa (nombre, NIT, dirección, teléfono)
2. Datos de Contacto (nombre, email, teléfono contacto)
3. Permisos (checkboxes de permisos + resumen)

**Permisos Disponibles:**
- Leer Catálogos
- Crear Órdenes
- Ver Facturación
- Descargar Reportes
- Acceso a API

---

## 🎨 Estilo y Colores

**Paleta Aplicada:**
- Verde primario: `#10b981` (green-600)
- Verde oscuro: `#059669` (green-700)
- Verde claro: `#d1fae5` (green-100)
- Gris neutro para backgrounds
- Blur backdrop: `backdrop-blur-sm`

**Transiciones:**
- Duración: `300ms` (animaciones suaves)
- Easing: `ease-in-out` (natural)

---

## 🚀 Cómo Integrar en Nuevos Formularios

### Paso 1: Crear el componente del formulario
```jsx
import React, { useState } from 'react';
import StepperForm from './StepperForm';
import FormField from './FormField';

const MiFormulario = ({ onSubmit, isSubmitting }) => {
  const [data, setData] = useState({});
  
  const steps = [
    { title: 'Paso 1', component: <Step1 /> },
    { title: 'Paso 2', component: <Step2 /> },
  ];
  
  return (
    <StepperForm
      steps={steps}
      onComplete={() => onSubmit(data)}
      isSubmitting={isSubmitting}
    />
  );
};
```

### Paso 2: Usar en página
```jsx
const [openModal, setOpenModal] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (data) => {
  setIsSubmitting(true);
  try {
    await api.send(data);
    toast.success('Éxito');
    setOpenModal(false);
  } finally {
    setIsSubmitting(false);
  }
};

return (
  <>
    <button onClick={() => setOpenModal(true)}>Abrir</button>
    
    <ModernModal
      isOpen={openModal}
      onClose={() => setOpenModal(false)}
      title="Mi Formulario"
      size="lg"
    >
      <MiFormulario
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </ModernModal>
  </>
);
```

---

## 📝 Validadores Reusables

### Email
```javascript
const validEmail = (email) => ({
  isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  message: 'Email inválido'
});
```

### Teléfono
```javascript
const validPhone = (phone) => ({
  isValid: /^\d{10}$/.test(phone.replace(/\D/g, '')),
  message: 'Teléfono debe tener 10 dígitos'
});
```

### Cédula
```javascript
const validCedula = (cedula) => ({
  isValid: cedula.length >= 8,
  message: 'Cédula inválida'
});
```

### URL
```javascript
const validURL = (url) => ({
  isValid: /^(https?:\/\/).+/.test(url),
  message: 'URL inválida'
});
```

---

## 🎯 Casos de Uso Avanzados

### Modal Simple (sin Stepper)
```jsx
<ModernModal
  isOpen={isOpen}
  onClose={onClose}
  title="Confirmar"
  size="sm"
>
  <p>¿Estás seguro?</p>
  <div className="mt-4 flex gap-2 justify-end">
    <button onClick={onClose}>Cancelar</button>
    <button onClick={handleConfirm}>Confirmar</button>
  </div>
</ModernModal>
```

### Formulario Simple (sin Stepper)
```jsx
<ModernModal isOpen={isOpen} onClose={onClose} title="Editar">
  <FormField label="Nombre" value={name} onChange={setName} />
  <FormField label="Email" type="email" value={email} onChange={setEmail} />
  <button className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg">
    Guardar
  </button>
</ModernModal>
```

---

## ✨ Próximos Pasos Recomendados

1. **Conectar APIs reales** - Reemplazar `console.log` con llamadas API
2. **Agregar validaciones backend** - Confirmar datos en servidor
3. **Toast notifications** - Ya integrado con `sonner`
4. **Confirmar antes de enviar** - Modal de confirmación
5. **Historial/Edición** - Listar y editar registros existentes

---

**Creado:** Octubre 16, 2025  
**Estética:** WhatsApp Web + Material Design  
**Stack:** React + Tailwind + Lucide Icons
