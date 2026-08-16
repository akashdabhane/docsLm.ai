const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    ...options.headers,
  };

  // Don't set Content-Type if FormData is used
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Sends HTTP-only JWT cookies
  });

  if (response.status === 401 && !endpoint.includes('/auth/')) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || data.message || `API error (${response.status})`);
  }

  return data;
}
