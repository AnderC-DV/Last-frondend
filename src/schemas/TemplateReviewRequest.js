/**
 * @class TemplateReviewRequest
 * @description Represents the schema for a template review request.
 */
class TemplateReviewRequest {
  /**
   * @param {boolean} approve - Whether the template is approved.
   * @param {string|null} rejection_reason - The reason for rejection (if applicable).
   */
  constructor(approve, rejection_reason = null) {
    if (typeof approve !== 'boolean') {
      throw new Error("The 'approve' field must be a boolean.");
    }
    if (!approve && (typeof rejection_reason !== 'string' || rejection_reason.length < 10)) {
      throw new Error("A rejection reason of at least 10 characters is required when rejecting a template.");
    }

    this.approve = approve;
    if (!approve) {
      this.rejection_reason = rejection_reason;
    }
  }
}

export default TemplateReviewRequest;
