import React from 'react';

const ButtonsEditor = ({ template, setTemplate }) => {
  const buttons = template.components?.buttons || [];

  const setButtons = (newButtons) => {
    if (newButtons.length === 0) {
      const newComponents = { ...template.components };
      delete newComponents.buttons;
      setTemplate(prev => ({ ...prev, components: newComponents }));
    } else {
      setTemplate(prev => ({
        ...prev,
        components: {
          ...prev.components,
          buttons: newButtons
        }
      }));
    }
  };

  const handleAddButton = () => {
    setButtons([...buttons, { type: 'QUICK_REPLY', text: '' }]);
  };

  const handleRemoveButton = (index) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const handleButtonChange = (index, field, value) => {
    const newButtons = [...buttons];
    newButtons[index][field] = value;
    // Reset other fields when type changes
    if (field === 'type') {
      delete newButtons[index].url;
      delete newButtons[index].phone_number;
    }
    setButtons(newButtons);
  };

  return (
    <div className="p-4 border rounded-md bg-white">
      <label className="block text-sm font-medium text-gray-700 mb-2">Botones (Opcional)</label>
      {buttons.map((button, index) => (
        <div key={index} className="p-3 border rounded-md bg-gray-50 mb-2">
          <div className="flex items-center space-x-2 mb-2">
            <select
              className="p-2 border rounded-md flex-grow"
              value={button.type}
              onChange={(e) => handleButtonChange(index, 'type', e.target.value)}
            >
              <option value="QUICK_REPLY">Respuesta Rápida</option>
              <option value="URL">URL</option>
              <option value="PHONE_NUMBER">Número de Teléfono</option>
            </select>
            <button
              type="button"
              onClick={() => handleRemoveButton(index)}
              className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 text-xs"
            >
              Eliminar
            </button>
          </div>
          <input
            type="text"
            className="w-full p-2 border rounded-md mb-2"
            placeholder="Texto del botón (máx 25 caracteres)"
            value={button.text}
            onChange={(e) => handleButtonChange(index, 'text', e.target.value)}
            maxLength="25"
            required
          />
          {button.type === 'URL' && (
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              placeholder="URL (ej: https://www.auratech.com)"
              value={button.url || ''}
              onChange={(e) => handleButtonChange(index, 'url', e.target.value)}
              required
            />
          )}
          {button.type === 'PHONE_NUMBER' && (
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              placeholder="Número de teléfono (ej: +1234567890)"
              value={button.phone_number || ''}
              onChange={(e) => handleButtonChange(index, 'phone_number', e.target.value)}
              required
            />
          )}
        </div>
      ))}
      {buttons.length < 3 && (
        <button
          type="button"
          onClick={handleAddButton}
          className="mt-2 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 w-full"
        >
          + Añadir Botón
        </button>
      )}
    </div>
  );
};

export default ButtonsEditor;
