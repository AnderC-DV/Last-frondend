/**
 * @class WhatsAppButton
 * @description Represents a button component for a WhatsApp template.
 */
class WhatsAppButton {
  /**
   * @param {object} buttonData - The button data.
   * @param {string} buttonData.type - The type of the button (QUICK_REPLY, URL, PHONE_NUMBER).
   * @param {string} buttonData.text - The text of the button.
   * @param {string} [buttonData.url] - The URL for URL buttons.
   * @param {string} [buttonData.phone_number] - The phone number for PHONE_NUMBER buttons.
   * @param {Array<string>} [buttonData.example] - Example for URL buttons with variables.
   */
  constructor(buttonData) {
    if (!buttonData || typeof buttonData !== 'object') {
      throw new Error("Button data must be a valid object.");
    }

    if (!buttonData.type || !buttonData.text) {
      throw new Error("Button type and text are required.");
    }

    const validButtonTypes = ["QUICK_REPLY", "URL", "PHONE_NUMBER"];
    if (!validButtonTypes.includes(buttonData.type)) {
      throw new Error("Invalid button type.");
    }

    this.type = buttonData.type;

    if (buttonData.text.length > 25) {
      throw new Error("Button text cannot exceed 25 characters.");
    }
    this.text = buttonData.text;

    if (this.type === "URL") {
      if (typeof buttonData.url !== 'string' || buttonData.url.trim() === '') {
        throw new Error("URL is required for URL button type.");
      }
      if (buttonData.url.length > 2000) {
        throw new Error("URL cannot exceed 2000 characters.");
      }
      this.url = buttonData.url;
      if (buttonData.example) {
        this.example = buttonData.example;
      }
    } else if (this.type === "PHONE_NUMBER") {
      if (typeof buttonData.phone_number !== 'string' || buttonData.phone_number.trim() === '') {
        throw new Error("Phone number is required for PHONE_NUMBER button type.");
      }
      if (buttonData.phone_number.length > 20) {
        throw new Error("Phone number cannot exceed 20 characters.");
      }
      this.phone_number = buttonData.phone_number;
    }
  }
}

export default WhatsAppButton;
