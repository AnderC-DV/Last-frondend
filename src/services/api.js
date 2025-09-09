export const BASE_URL = "https://backend-475190189080.us-central1.run.app/api/v1";

// Función para obtener el token de autenticación
const getAuthToken = () => {
  const tokenData = localStorage.getItem('authToken');
  if (tokenData) {
    const token = JSON.parse(tokenData);
    return token.access_token;
  }
  return null;
};

const apiRequest = async (endpoint, method = 'GET', body = null) => {
  const traceId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const start = performance.now();
  const isNotif = endpoint.startsWith('/notifications');
  if (isNotif) console.debug('[API][Notifications][REQUEST]', { traceId, endpoint, method, body });
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Error en la petición a ${endpoint}` }));
      let errorMessage = `Error en la petición a ${endpoint}`;

      if (response.status === 422 && errorData.detail) {
        // FastAPI validation errors often come as an array of objects
        errorMessage = errorData.detail.map(err => `${err.loc.join('.')} -> ${err.msg}`).join('; ');
      } else if (errorData.detail && typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else {
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }

      if (isNotif) {
        console.error('[API][Notifications][HTTP_ERROR]', { traceId, endpoint, status: response.status, errorMessage, errorData });
      }
      throw new Error(errorMessage);
    }
    const json = await response.json();
    if (isNotif) {
      const dur = (performance.now() - start).toFixed(1);
      console.debug('[API][Notifications][RESPONSE]', { traceId, endpoint, durationMs: dur, size: (Array.isArray(json) ? json.length : (json?.data?.length ?? 'n/a')) });
    }
    return json;
  } catch (error) {
    if (isNotif) {
      const dur = (performance.now() - start).toFixed(1);
      console.error('[API][Notifications][ERROR]', { traceId, endpoint, method, durationMs: dur, message: error.message });
    } else {
      console.error(`API request failed: ${error.message}`);
    }
    throw error;
  }
};

const apiRequestWithFile = async (endpoint, method = 'POST', file) => {
  const token = getAuthToken();
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const formData = new FormData();
  formData.append('file', file);

  const config = {
    method,
    headers,
    body: formData,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Error en la petición a ${endpoint}` }));
      let errorMessage = `Error en la petición a ${endpoint}`;

      if (response.status === 422 && errorData.detail) {
        errorMessage = errorData.detail.map(err => `${err.loc.join('.')} -> ${err.msg}`).join('; ');
      } else if (errorData.detail && typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else {
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }
    return await response.json();
  } catch (error) {
    console.error(`API file request failed: ${error.message}`);
    throw error;
  }
};

// --- Endpoints de Autenticación ---
export const checkUserIdentifier = (identifier) => apiRequest('/auth/login/check-identifier', 'POST', { identifier });
export const loginWithPassword = (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  return fetch(`${BASE_URL}/auth/login/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  }).then(async response => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Error en el login');
    }
    return response.json();
  });
};
export const firstTimeLogin = (identifier, password) => apiRequest('/auth/login/first-time', 'POST', { identifier, password });

// --- Endpoints de Usuario ---
export const changePassword = (current_password, new_password) => apiRequest('/users/me/change-password', 'PUT', { current_password, new_password });


// --- Endpoints de Segmentación ---
export const getAvailableFilterFields = () => apiRequest('/audience/available-filters');
export const getDistinctValues = (fieldName) => apiRequest(`/audience/filters/distinct-values/${fieldName}`);
export const getSimpleFilters = () => apiRequest('/audience/filters/simple');
export const getSimpleClientCount = (definition) => apiRequest('/audience/count/simple', 'POST', definition);
export const createSimpleFilter = (filterData) => apiRequest('/audience/filters/simple', 'POST', filterData);

// --- Endpoints de Campañas ---
export const getCampaignStats = () => apiRequest('/campaigns/stats');
export const refreshCampaignStats = () => apiRequest('/campaigns/stats/refresh', 'POST');
export const createAndLaunchCampaign = (campaignData) => apiRequest('/campaigns/', 'POST', campaignData);

// Preview de campaña en CSV (respuesta como Blob)
export const getCampaignPreviewCSV = async (payload) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'text/csv,application/octet-stream,application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/campaigns/preview/csv`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    try {
      const ct = res.headers.get('Content-Type') || '';
      if (ct.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data?.detail)) {
          throw new Error(data.detail.map(d => d.msg || d.message || JSON.stringify(d)).join('; '));
        }
        throw new Error(data?.detail || data?.message || `Error ${res.status}`);
      } else {
        const text = await res.text();
        throw new Error(text || `Error ${res.status}`);
      }
    } catch (e) {
      throw new Error(e.message || `Error ${res.status}`);
    }
  }
  return res;
};

// --- Endpoints de Campañas Recurrentes (Schedules) ---
export const createSchedule = (scheduleData) => apiRequest('/schedules/', 'POST', scheduleData);
export const getSchedules = () => apiRequest('/schedules/');
export const updateSchedule = (scheduleId, scheduleData) => apiRequest(`/schedules/${scheduleId}`, 'PATCH', scheduleData);
export const deleteSchedule = (scheduleId) => apiRequest(`/schedules/${scheduleId}`, 'DELETE');
export const getScheduleCampaigns = (scheduleId) => apiRequest(`/schedules/${scheduleId}/campaigns`);

// --- Endpoints de Plantillas ---
export const getTemplates = () => apiRequest('/templates/');
export const getTemplatesByStatus = (status) => apiRequest(`/templates/?status=${status}`);

export const createTemplate = (templateData) => apiRequest('/templates/', 'POST', templateData);

// --- Endpoints de Notificaciones ---
export const getNotifications = () => apiRequest('/notifications/');
export const getUnreadNotificationsCount = () => apiRequest('/notifications/unread-count');
export const markNotificationAsRead = (notificationId) => apiRequest(`/notifications/${notificationId}/read`, 'PATCH');
export const markAllNotificationsAsRead = () => apiRequest('/notifications/read-all', 'POST');

export const getTemplatePreview = (templateId) => apiRequest(`/templates/${templateId}/preview`);
export const getTemplateById = (templateId) => apiRequest(`/templates/${templateId}`);
import TemplateReviewRequest from '../schemas/TemplateReviewRequest';
export const getTemplateVariables = () => apiRequest('/templates/variables');
export const getPendingTemplates = () => apiRequest('/templates/pending-review');
export const approveTemplate = (templateId) => apiRequest(`/templates/${templateId}/internal-approve`, 'POST', {});
export const rejectTemplate = (templateId, rejection_reason) => {
  const body = new TemplateReviewRequest(false, rejection_reason);
  return apiRequest(`/templates/${templateId}/internal-reject`, 'POST', body);
};
export const reviewTemplate = (templateId, reviewData) => apiRequest(`/templates/${templateId}/review`, 'POST', reviewData);

// --- Endpoints de Contactos ---
export const uploadContactsCSV = (file) => apiRequestWithFile('/staff-contacts/bulk', 'POST', file);

// --- Endpoints de Conversaciones ---
export const getConversations = () => apiRequest('/conversations/');
export const sendMessage = (conversationId, messageData) => apiRequest(`/conversations/${conversationId}/reply`, 'POST', messageData);
