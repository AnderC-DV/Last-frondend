/**
 * @class WhatsAppFooter
 * @description Represents the footer component of a WhatsApp template.
 */
class WhatsAppFooter {
  /**
   * @param {object} footerData - The footer data.
   * @param {string} footerData.text - The text of the footer.
   */
  constructor(footerData) {
    if (!footerData || typeof footerData !== 'object') {
      throw new Error("Footer data must be a valid object.");
    }

    if (typeof footerData.text !== 'string' || footerData.text.trim() === '') {
      throw new Error("Footer text is required.");
    }

    if (footerData.text.length > 60) {
      throw new Error("Footer text cannot exceed 60 characters.");
    }

    this.text = footerData.text;
  }
}

export default WhatsAppFooter;
