import React, { useState } from 'react';
import Paso1_Configuracion from './Paso1_Configuracion';
import Paso2_Diseño from './Paso2_Diseño';

const WhatsAppWizard = ({ template, setTemplate }) => {
  const [step, setStep] = useState('configuracion');

  const renderStep = () => {
    switch (step) {
      case 'configuracion':
        return <Paso1_Configuracion template={template} setTemplate={setTemplate} />;
      case 'diseño':
        return <Paso2_Diseño template={template} setTemplate={setTemplate} />;
      default:
        return <Paso1_Configuracion template={template} setTemplate={setTemplate} />;
    }
  };

  return (
    <div className="p-4 border rounded-md bg-gray-50 mt-4">
      <div className="flex justify-around mb-4 border-b pb-2">
        <button 
          onClick={() => setStep('configuracion')} 
          className={`font-bold ${step === 'configuracion' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          1. Configurar Plantilla
        </button>
        <button 
          onClick={() => setStep('diseño')} 
          className={`font-bold ${step === 'diseño' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          2. Editar Plantilla
        </button>
        <button 
          className="font-bold text-gray-400 cursor-not-allowed"
        >
          3. Enviar para Revisión
        </button>
      </div>

      {renderStep()}

      <div className="flex justify-between mt-6">
        {step === 'diseño' && (
          <button 
            onClick={() => setStep('configuracion')}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
          >
            Anterior
          </button>
        )}
        {step === 'configuracion' && (
          <button 
            onClick={() => setStep('diseño')}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 ml-auto"
          >
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
};

export default WhatsAppWizard;
