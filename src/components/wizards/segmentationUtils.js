// --- Constantes para Segmentación ---
export const segmentationOperators = [
  { id: 'eq', name: 'Igual a' },
  { id: 'neq', name: 'Diferente de' },
  { id: 'gt', name: 'Mayor que' },
  { id: 'gte', name: 'Mayor o igual que' },
  { id: 'lt', name: 'Menor que' },
  { id: 'lte', name: 'Menor o igual que' },
  { id: 'in', name: 'Está en (lista)' },
  { id: 'not_in', name: 'No está en (lista)' },
  { id: 'contains', name: 'Contiene (texto)' },
  { id: 'between', name: 'Está entre' },
  { id: 'is_null', name: 'Es nulo' },
  { id: 'is_not_null', name: 'No es nulo' },
];

// --- Funciones de ayuda para el payload ---
export function buildCreateCampaignPayload(campaignData) {
  // target_role puede ser 'DEUDOR', 'CODEUDOR' o 'BOTH'
  const payload = {
    name: campaignData.name,
    channel_type: campaignData.channel ? campaignData.channel.toUpperCase() : undefined,
    message_template_id: campaignData.message_template_id,
    audience_filter_id: campaignData.audience_filter_id,
    target_role: campaignData.target_role || 'DEUDOR',
  };
  if (campaignData.codebtor_strategy && (campaignData.target_role === 'CODEUDOR' || campaignData.target_role === 'BOTH')) {
    payload.codebtor_strategy = campaignData.codebtor_strategy;
  }
  if (campaignData.scheduled_at) {
    payload.scheduled_at = campaignData.scheduled_at;
  }
  return payload;
}

export function logCreateCampaignPayload(payload) {
  console.log('[Crear Campaña] Payload enviado:', JSON.stringify(payload, null, 2));
}
