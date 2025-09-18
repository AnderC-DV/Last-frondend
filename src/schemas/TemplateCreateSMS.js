/**
 * @class TemplateCreateSMS
 * @description Represents the schema for creating an SMS template.
 */
class TemplateCreateSMS {
  /**
   * @param {string} name - The name of the template (must be between 3 and 100 characters).
   * @param {string} content - The content of the template (must be at least 10 characters).
   * @param {string|null} [special_variable_name=null] - Optional name for special variable (alphanumeric + underscores, max 50 chars).
   */
  constructor(name, content, special_variable_name = null) {
    if (name.length < 3 || name.length > 100) {
      throw new Error("Template name must be between 3 and 100 characters.");
    }
    if (content.length < 10 || content.length > 300) {
      throw new Error("Template content must be between 10 and 300 characters long.");
    }
    if (special_variable_name && (special_variable_name.length > 50 || !/^[a-zA-Z0-9_]+$/.test(special_variable_name))) {
      throw new Error("Special variable name must be alphanumeric with underscores only and max 50 characters.");
    }

    this.name = name;
    this.channel_type = 'SMS';
    this.content = content;
    if (special_variable_name) {
      this.special_variable_name = special_variable_name;
    }
  }
}

export default TemplateCreateSMS;
