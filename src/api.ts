const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

function getToken() {
  return localStorage.getItem('ttd-token');
}

async function request(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const resp = await fetch(url, { ...options, headers });
  if (resp.status === 401) {
    localStorage.removeItem('ttd-token');
    window.location.reload();
    throw new Error('Unauthorized');
  }
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.detail || resp.statusText);
  }
  return resp.json();
}

export function setToken(token: string) {
  localStorage.setItem('ttd-token', token);
}

export function removeToken() {
  localStorage.removeItem('ttd-token');
}

export const authApi = {
  register: (username: string, password: string) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  login: (username: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => request('/auth/me'),
};

export const pilgrimsApi = {
  list: () => request('/pilgrims'),
  create: (data: any) => request('/pilgrims', { method: 'POST', body: JSON.stringify(data) }),
  remove: (id: string) => request(`/pilgrims/${id}`, { method: 'DELETE' }),
};

export const eventsApi = {
  list: () => request('/events'),
  create: (data: any) => request('/events', { method: 'POST', body: JSON.stringify(data) }),
  remove: (id: string) => request(`/events/${id}`, { method: 'DELETE' }),
};
