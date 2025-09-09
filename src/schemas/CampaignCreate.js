/**
 * @class CampaignCreate
 * @description Represents the schema for creating a new campaign.
 */
class CampaignCreate {
  /**
   * @param {object} data - The campaign data.
   * @param {string} data.name - Descriptive name of the campaign.
   * @param {string} data.channel_type - Communication channel ('SMS', 'WHATSAPP', 'EMAIL').
   * @param {string} data.message_template_id - UUID of the message template.
   * @param {string} data.audience_filter_id - UUID of the audience filter.
   * @param {string} data.target_role - Target role ('DEUDOR', 'CODEUDOR', 'BOTH').
   * @param {string|null} [data.codebtor_strategy] - Co-debtor strategy if applicable.
   * @param {string|null} [data.scheduled_at] - Optional scheduled date in ISO format.
   * @param {string|null} [data.source_schedule_id] - Optional source schedule ID.
   */
  constructor({
    name,
    channel_type,
    message_template_id,
    audience_filter_id,
    target_role,
    codebtor_strategy = null,
    scheduled_at = null,
    source_schedule_id = null,
  }) {
    if (!name || name.length < 5 || name.length > 150) {
      throw new Error("Campaign name must be between 5 and 150 characters.");
    }
    if (!['SMS', 'WHATSAPP', 'EMAIL'].includes(channel_type)) {
      throw new Error("Invalid channel type.");
    }
    if (!message_template_id) {
      throw new Error("Message template ID is required.");
    }
    if (!audience_filter_id) {
      throw new Error("Audience filter ID is required.");
    }
    if (!['DEUDOR', 'CODEUDOR', 'AMBAS'].includes(target_role)) {
      throw new Error("Invalid target role.");
    }

    this.name = name;
    this.channel_type = channel_type;
    this.message_template_id = message_template_id;
    this.audience_filter_id = audience_filter_id;
    this.target_role = target_role;

    // codebtor_strategy is required if target_role is CODEUDOR or AMBAS
    if (target_role === 'CODEUDOR' || target_role === 'AMBAS') {
      if (!codebtor_strategy) {
        throw new Error("Co-debtor strategy is required if target role is CODEUDOR or AMBAS.");
      }
      this.codebtor_strategy = codebtor_strategy;
    } else {
      this.codebtor_strategy = null; // Ensure it's null if not applicable
    }
    
    if (scheduled_at) this.scheduled_at = scheduled_at;
    if (source_schedule_id) this.source_schedule_id = source_schedule_id;
  }
}

export default CampaignCreate;
