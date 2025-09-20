/**
 * Reemplaza las variables especiales en el contenido de la plantilla
 * @param {string} content - El contenido original de la plantilla
 * @param {string} specialVariableName - El nombre de la variable especial
 * @param {string} specialVariableValue - El valor a reemplazar
 * @returns {string} El contenido con la variable especial reemplazada
 */
export const replaceSpecialVariable = (content, specialVariableName, specialVariableValue) => {
  if (!content || !specialVariableName || !specialVariableValue) {
    return content;
  }

  // Patrón para buscar {SPECIAL:variable_name}
  const pattern = new RegExp(`\\{SPECIAL:${specialVariableName}\\}`, 'g');

  return content.replace(pattern, specialVariableValue);
};

/**
 * Genera el contenido de vista previa con variables especiales reemplazadas
 * @param {string} originalContent - El contenido original de la vista previa
 * @param {object} selectedTemplateDetails - Los detalles de la plantilla seleccionada
 * @param {string} specialVariableValue - El valor de la variable especial
 * @returns {string} El contenido de vista previa con variables reemplazadas
 */
export const generatePreviewWithSpecialVariable = (originalContent, selectedTemplateDetails, specialVariableValue) => {
  if (!selectedTemplateDetails?.special_variable_name || !specialVariableValue) {
    return originalContent;
  }

  return replaceSpecialVariable(originalContent, selectedTemplateDetails.special_variable_name, specialVariableValue);
};