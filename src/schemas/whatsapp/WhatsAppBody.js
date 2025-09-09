/**
 * @class WhatsAppBody
 * @description Represents the body component of a WhatsApp template.
 */
class WhatsAppBody {
  /**
   * @param {object} bodyData - The body data.
   * @param {string} bodyData.text - The text of the message body.
   * @param {object} [bodyData.example] - Example for the body text.
   */
  constructor(bodyData) {
    if (!bodyData || typeof bodyData !== 'object') {
      throw new Error("Body data must be a valid object.");
    }

    if (typeof bodyData.text !== 'string' || bodyData.text.trim() === '') {
      throw new Error("Body text is required.");
    }

    if (bodyData.text.length > 1024) {
      throw new Error("Body text cannot exceed 1024 characters.");
    }

    this.text = bodyData.text;

    if (bodyData.example) {
      this.example = bodyData.example;
    }
  }
}

export default WhatsAppBody;
