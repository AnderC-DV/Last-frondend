/**
 * @class TemplateCreateEmail
 * @description Represents the schema for creating an Email template.
 */
class TemplateCreateEmail {
  /**
   * @param {string} name - The name of the template (must be between 3 and 100 characters).
   * @param {string} subject - The subject of the email (must be between 5 and 255 characters).
   * @param {string} content - The content of the template (must be at least 10 characters).
   */
  constructor(name, subject, content) {
    if (name.length < 3 || name.length > 100) {
      throw new Error("Template name must be between 3 and 100 characters.");
    }
    if (subject.length < 5 || subject.length > 255) {
      throw new Error("Email subject must be between 5 and 255 characters.");
    }
    if (content.length < 10) {
      throw new Error("Template content must be at least 10 characters long.");
    }

    this.name = name;
    this.channel_type = 'EMAIL';
    this.subject = subject;
    this.content = content;
  }
}

export default TemplateCreateEmail;
