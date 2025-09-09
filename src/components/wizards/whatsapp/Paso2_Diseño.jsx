import React from 'react';
import HeaderEditor from './HeaderEditor';
import BodyEditor from './BodyEditor';
import FooterEditor from './FooterEditor';
import ButtonsEditor from './ButtonsEditor';
import WhatsAppPreview from './WhatsAppPreview';

const Paso2_Diseño = ({ template, setTemplate }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Diseña tu Plantilla</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Columna de Editores */}
        <div>
          <HeaderEditor template={template} setTemplate={setTemplate} />
          <BodyEditor template={template} setTemplate={setTemplate} />
          <FooterEditor template={template} setTemplate={setTemplate} />
          <ButtonsEditor template={template} setTemplate={setTemplate} />
        </div>

        {/* Columna de Vista Previa */}
        <div>
          <WhatsAppPreview template={template} />
        </div>
      </div>
    </div>
  );
};

export default Paso2_Diseño;
