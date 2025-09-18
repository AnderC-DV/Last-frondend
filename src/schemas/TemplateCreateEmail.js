/**
 * @class TemplateCreateEmail
 * @description Represents the schema for creating an Email template.
 */
class TemplateCreateEmail {
  /**
   * @param {string} name - The name of the template (must be between 3 and 100 characters).
   * @param {string} subject - The subject of the email (must be between 5 and 255 characters).
   * @param {string} content - The content of the template (must be at least 10 characters).
   * @param {string|null} [special_variable_name=null] - Optional name for special variable (alphanumeric + underscores, max 50 chars).
   */
  constructor(name, subject, content, special_variable_name = null) {
    if (name.length < 3 || name.length > 100) {
      throw new Error("Template name must be between 3 and 100 characters.");
    }
    if (subject.length < 5 || subject.length > 255) {
      throw new Error("Email subject must be between 5 and 255 characters.");
    }
    if (content.length < 10) {
      throw new Error("Template content must be at least 10 characters long.");
    }
    if (special_variable_name && (special_variable_name.length > 50 || !/^[a-zA-Z0-9_]+$/.test(special_variable_name))) {
      throw new Error("Special variable name must be alphanumeric with underscores only and max 50 characters.");
    }

    this.name = name;
    this.channel_type = 'EMAIL';
    this.subject = subject;
    this.content = content;
    if (special_variable_name) {
      this.special_variable_name = special_variable_name;
    }
  }
}

export default TemplateCreateEmail;
