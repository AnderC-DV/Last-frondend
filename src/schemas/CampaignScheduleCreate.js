/**
 * @class CampaignScheduleCreate
 * @description Represents the schema for creating a new recurrent campaign schedule.
 */
class CampaignScheduleCreate {
  /**
   * @param {object} data - The campaign schedule data.
   * @param {string} data.name - Descriptive name of the schedule.
   * @param {string} data.cron_expression - Valid CRON expression.
   * @param {string} data.channel_type - Communication channel ('SMS', 'WHATSAPP', 'EMAIL').
   * @param {string} data.message_template_id - UUID of the message template.
   * @param {string} data.audience_filter_id - UUID of the audience filter.
   * @param {string} data.target_role - Target role ('DEUDOR', 'CODEUDOR').
   * @param {string|null} [data.description] - Optional description.
   * @param {boolean} [data.is_active=true] - Whether the schedule is active.
   * @param {string|null} [data.start_date] - Optional start date in ISO format.
   * @param {string|null} [data.end_date] - Optional end date in ISO format.
   * @param {string|null} [data.codebtor_strategy] - Co-debtor strategy if applicable.
   */
  constructor({
    name,
    cron_expression,
    channel_type,
    message_template_id,
    audience_filter_id,
    target_role,
    description = null,
    is_active = true,
    start_date = null,
    end_date = null,
    codebtor_strategy = null,
  }) {
    if (!name || name.length < 5 || name.length > 150) {
      throw new Error("Schedule name must be between 5 and 150 characters.");
    }
    if (!cron_expression) { // Basic validation, more complex validation can be added
      throw new Error("CRON expression is required.");
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
    this.cron_expression = cron_expression;
    this.channel_type = channel_type;
    this.message_template_id = message_template_id;
    this.audience_filter_id = audience_filter_id;
    this.target_role = target_role;
    this.is_active = is_active;

    if (description) this.description = description;
    if (start_date) this.start_date = start_date;
    if (end_date) this.end_date = end_date;
    
    // codebtor_strategy is required if target_role is CODEUDOR or AMBAS
    if (target_role === 'CODEUDOR' || target_role === 'AMBAS') {
      if (!codebtor_strategy) {
        throw new Error("Co-debtor strategy is required if target role is CODEUDOR or AMBAS.");
      }
      this.codebtor_strategy = codebtor_strategy;
    } else {
      this.codebtor_strategy = null; // Ensure it's null if not applicable
    }
  }
}

export default CampaignScheduleCreate;
