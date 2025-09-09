/**
 * @class AudienceConditionV2
 * @description Representa una única condición de filtro en la estructura V2.
 * Valida que los campos necesarios para una condición estén presentes.
 */
class AudienceConditionV2 {
  /**
   * @param {string} field - El nombre del campo sobre el que se aplica el filtro.
   * @param {string} operator - El operador de comparación (ej: 'eq', 'in', 'contains').
   * @param {string|Array<string>|null} value - El valor de la condición. Es nulo para operadores como 'is_null'.
   */
  constructor(field, operator, value) {
    if (!field || typeof field !== 'string' || field.trim() === '') {
      throw new Error("Condition 'field' debe ser un string no vacío.");
    }
    if (!operator || typeof operator !== 'string' || operator.trim() === '') {
      throw new Error("Condition 'operator' debe ser un string no vacío.");
    }

    // Operadores que no requieren valor
    const operatorsWithoutValue = ['is_null', 'is_not_null'];
    if (operatorsWithoutValue.includes(operator)) {
      if (value !== undefined && value !== null) {
        // Si el operador es is_null o is_not_null, el valor no es necesario y se puede ignorar.
        // console.warn(`El operador '${operator}' no requiere un valor, pero se proporcionó uno. Será ignorado.`);
      }
    } else if (value === undefined || value === null) {
      throw new Error(`El operador '${operator}' requiere un valor, pero no se proporcionó ninguno.`);
    }

    this.field = field;
    this.operator = operator;
    
    // Solo asignamos 'value' si no es un operador que lo ignore
    if (!operatorsWithoutValue.includes(operator)) {
        this.value = value;
    }
  }
}

export default AudienceConditionV2;
