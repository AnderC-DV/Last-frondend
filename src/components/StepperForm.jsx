import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

/**
 * StepperForm - Componente para formularios multi-paso
 * 
 * Props:
 * - steps (array): Array de pasos con { title, description?, component }
 * - onComplete (function): Callback cuando se completa todos los pasos
 * - onCancel (function): Callback al cancelar
 * - isSubmitting (boolean): Si está enviando (default: false)
 * - submitLabel (string): Texto del botón submit (default: 'Enviar')
 */
const StepperForm = ({
  steps = [],
  onComplete,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Enviar',
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isLastStep = currentStep === totalSteps - 1;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const step = steps[currentStep];

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="mb-6">
        {/* Barra de progreso visual */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="ml-4 text-xs font-medium text-gray-600 whitespace-nowrap">
            Paso {currentStep + 1} de {totalSteps}
          </span>
        </div>

        {/* Indicadores de pasos */}
        <div className="flex justify-between items-center">
          {steps.map((s, idx) => (
            <div key={idx} className="flex items-center flex-1">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm
                  transition-all duration-300
                  ${idx <= currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                  }
                `}
              >
                {idx < currentStep ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-1 mx-2 transition-all duration-300
                    ${idx < currentStep ? 'bg-green-500' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Título y descripción del paso */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-1">
          {step?.title}
        </h3>
        {step?.description && (
          <p className="text-sm text-gray-600">
            {step.description}
          </p>
        )}
      </div>

      {/* Contenido del paso actual */}
      <div className="mb-8 min-h-[300px]">
        {step?.component}
      </div>

      {/* Botones de navegación */}
      <div className="flex justify-between gap-3 pt-6 border-t border-gray-200">
        <button
          onClick={onCancel || handlePrevious}
          disabled={currentStep === 0 && onCancel === undefined}
          className={`
            px-4 py-2 rounded-lg font-medium transition-all duration-200
            flex items-center gap-2
            ${currentStep === 0 && onCancel === undefined
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          <ChevronLeft className="h-4 w-4" />
          {onCancel && currentStep === 0 ? 'Cancelar' : 'Anterior'}
        </button>

        {!isLastStep ? (
          <button
            onClick={handleNext}
            className={`
              px-6 py-2 rounded-lg font-medium transition-all duration-200
              flex items-center gap-2
              bg-green-600 text-white hover:bg-green-700
              disabled:bg-gray-300 disabled:cursor-not-allowed
            `}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`
              px-6 py-2 rounded-lg font-medium transition-all duration-200
              bg-green-600 text-white hover:bg-green-700
              disabled:bg-gray-300 disabled:cursor-not-allowed
              flex items-center gap-2
            `}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Enviando...
              </>
            ) : (
              submitLabel
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default StepperForm;
