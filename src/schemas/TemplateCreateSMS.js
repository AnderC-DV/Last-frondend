/**
 * @class TemplateCreateSMS
 * @description Represents the schema for creating an SMS template.
 */
class TemplateCreateSMS {
  /**
   * @param {string} name - The name of the template (must be between 3 and 100 characters).
   * @param {string} content - The content of the template (must be at least 10 characters).
   */
  constructor(name, content) {
    if (name.length < 3 || name.length > 100) {
      throw new Error("Template name must be between 3 and 100 characters.");
    }
    if (content.length < 10 || content.length > 300) {
      throw new Error("Template content must be between 10 and 300 characters long.");
    }

    this.name = name;
    this.channel_type = 'SMS';
    this.content = content;
  }
}

export default TemplateCreateSMS;
