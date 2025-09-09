import AudienceConditionV2 from './AudienceConditionV2.js';

/**
 * @class AudienceSimpleDefinition
 * @description Define la estructura de un filtro simple con condiciones generales y grupos de exclusión.
 */
class AudienceSimpleDefinition {
  /**
   * @param {object} definition - El objeto de definición del filtro.
   * @param {Array<object>} [definition.general=[]] - Condiciones generales (AND).
   * @param {Array<Array<object>>} [definition.exclude=[]] - Grupos de exclusión (OR of ANDs).
   */
  constructor({ general = [], exclude = [] }) {
    if (!Array.isArray(general)) {
      throw new Error("Las condiciones 'general' deben ser un array.");
    }
    if (!Array.isArray(exclude)) {
      throw new Error("Las exclusiones 'exclude' deben ser un array de arrays.");
    }

    this.general = general.map(c => new AudienceConditionV2(c.field, c.operator, c.value));
    this.exclude = exclude.map(group => {
      if (!Array.isArray(group)) {
        throw new Error("Cada elemento en 'exclude' debe ser un array de condiciones.");
      }
      return group.map(c => new AudienceConditionV2(c.field, c.operator, c.value));
    });
  }
}

export default AudienceSimpleDefinition;
