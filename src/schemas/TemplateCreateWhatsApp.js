import WhatsAppHeader from './whatsapp/WhatsAppHeader.js';
import WhatsAppBody from './whatsapp/WhatsAppBody.js';
import WhatsAppFooter from './whatsapp/WhatsAppFooter.js';
import WhatsAppButton from './whatsapp/WhatsAppButton.js';

/**
 * @class TemplateCreateWhatsApp
 * @description Represents the schema for creating a WhatsApp template.
 */
class TemplateCreateWhatsApp {
  /**
   * @param {string} name - The name of the template (must be between 3 and 100 characters).
   * @param {string} meta_template_name - The name of the template in Meta (must be less than or equal to 512 characters and match ^[a-z0-9_]+$).
   * @param {string} category - The category of the template (must be one of "AUTHENTICATION", "MARKETING", or "UTILITY").
   * @param {object} components - The components of the template.
   * @param {WhatsAppHeader} [components.header] - Optional header component.
   * @param {WhatsAppBody} [components.body] - Optional body component.
   * @param {WhatsAppFooter} [components.footer] - Optional footer component.
   * @param {Array<WhatsAppButton>} [components.buttons] - Optional array of button components.
   */
  constructor(name, meta_template_name, category, components) {
    if (name.length < 3 || name.length > 100) {
      throw new Error("Template name must be between 3 and 100 characters.");
    }
    if (meta_template_name.length > 512 || !/^[a-z0-9_]+$/.test(meta_template_name)) {
      throw new Error("Meta template name is invalid.");
    }
    if (!["AUTHENTICATION", "MARKETING", "UTILITY"].includes(category)) {
      throw new Error("Invalid template category.");
    }

    this.name = name;
    this.channel_type = 'WHATSAPP';
    this.meta_template_name = meta_template_name;
    this.category = category;
    this.components = components;

    this.validateAndBuildComponents(components);
  }

  /**
   * Validates and builds the components for the template.
   * @param {object} components - The components object to validate and build.
   */
  validateAndBuildComponents(components) {
    if (!components) {
      throw new Error("Components object is required.");
    }

    const builtComponents = {};

    if (components.header) {
      builtComponents.header = new WhatsAppHeader(components.header);
    }
    if (components.body) {
      builtComponents.body = new WhatsAppBody(components.body);
    }
    if (components.footer) {
      builtComponents.footer = new WhatsAppFooter(components.footer);
    }
    if (components.buttons) {
      if (!Array.isArray(components.buttons)) {
        throw new Error("Buttons must be an array.");
      }
      builtComponents.buttons = components.buttons.map(buttonData => new WhatsAppButton(buttonData));
    }

    this.components = builtComponents;
  }
}

export default TemplateCreateWhatsApp;
