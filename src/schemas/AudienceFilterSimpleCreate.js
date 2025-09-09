import AudienceSimpleDefinition from './AudienceSimpleDefinition.js';

/**
 * @class AudienceFilterSimpleCreate
 * @description Representa el payload para crear un nuevo filtro de audiencia simple.
 */
class AudienceFilterSimpleCreate {
  /**
   * @param {string} name - El nombre del filtro (3-100 caracteres).
   * @param {object} definition - El objeto de definición del filtro simple.
   * @param {string|null} [description=null] - Una descripción opcional.
   */
  constructor(name, definition, description = null) {
    if (!name || typeof name !== 'string' || name.length < 3 || name.length > 100) {
      throw new Error("El nombre del filtro debe ser un string entre 3 y 100 caracteres.");
    }
    if (!definition || typeof definition !== 'object') {
      throw new Error("La definición del filtro es requerida y debe ser un objeto.");
    }

    this.name = name;
    this.definition = new AudienceSimpleDefinition(definition);
    
    if (description !== null && typeof description === 'string' && description.trim() !== '') {
      this.description = description;
    }
  }
}

export default AudienceFilterSimpleCreate;
