/**
 * @class WhatsAppHeader
 * @description Represents the header component of a WhatsApp template.
 */
class WhatsAppHeader {
  /**
   * @param {object} headerData - The header data.
   * @param {string} headerData.format - Format of the header (TEXT, IMAGE, DOCUMENT, VIDEO).
   * @param {string} [headerData.text] - Text for TEXT header format.
   * @param {object} [headerData.example] - Example for TEXT header format.
   * @param {string} [headerData.gcs_object_name] - GCS object name for media headers.
   * @param {string} [headerData.file_name] - File name for DOCUMENT/VIDEO headers.
   * @param {string} [headerData.mime_type] - Mime type for DOCUMENT/VIDEO headers.
   */
  constructor(headerData) {
    if (!headerData || typeof headerData !== 'object') {
      throw new Error("Header data must be a valid object.");
    }

    if (!headerData.format) {
      throw new Error("Header format is required.");
    }

    const validHeaderFormats = ["TEXT", "IMAGE", "DOCUMENT", "VIDEO"];
    if (!validHeaderFormats.includes(headerData.format)) {
      throw new Error("Invalid header format. Must be one of TEXT, IMAGE, DOCUMENT, VIDEO.");
    }

    this.format = headerData.format;

    if (this.format === "TEXT") {
      if (typeof headerData.text !== 'string' || headerData.text.trim() === '') {
        throw new Error("Header text is required for TEXT header format.");
      }
      if (headerData.text.length > 60) {
        throw new Error("Header text cannot exceed 60 characters.");
      }
      this.text = headerData.text;
      if (headerData.example) {
        this.example = headerData.example;
      }
    } else { // Media headers (IMAGE, DOCUMENT, VIDEO)
      if (typeof headerData.gcs_object_name !== 'string' || headerData.gcs_object_name.trim() === '') {
        throw new Error("GCS object name is required for media headers.");
      }
      this.gcs_object_name = headerData.gcs_object_name;

      if (this.format === "DOCUMENT" || this.format === "VIDEO") {
        if (typeof headerData.file_name !== 'string' || headerData.file_name.trim() === '') {
          throw new Error("File name is required for DOCUMENT/VIDEO headers.");
        }
        if (typeof headerData.mime_type !== 'string' || headerData.mime_type.trim() === '') {
          throw new Error("Mime type is required for DOCUMENT/VIDEO headers.");
        }
        this.file_name = headerData.file_name;
        this.mime_type = headerData.mime_type;
      }
    }
  }
}

export default WhatsAppHeader;
