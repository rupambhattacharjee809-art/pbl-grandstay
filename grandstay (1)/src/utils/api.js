const TOKEN_KEY = 'grandstay_auth_token';
const GUEST_SESSION_KEY = 'grandstay_guest_session';

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function getGuestSessionId() {
  try {
    let id = localStorage.getItem(GUEST_SESSION_KEY);
    if (!id) {
      id = `gs_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
      localStorage.setItem(GUEST_SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'gs_browser_session';
  }
}

export async function apiRequest(path, options = {}) {
  const token = getAuthToken();
  const guestSessionId = getGuestSessionId();

  const headers = {
    'Content-Type': 'application/json',
    'X-Guest-Session': guestSessionId,
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed (${response.status})`);
  }
  return data;
}
