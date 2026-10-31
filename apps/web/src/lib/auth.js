export function setToken(token) {
  localStorage.setItem('token', token);
  window.dispatchEvent(new Event('auth-changed'));
}

export function clearToken() {
  localStorage.removeItem('token');
  window.dispatchEvent(new Event('auth-changed'));
}

export function getToken() {
  return localStorage.getItem('token');
}

export function hasToken() {
  return !!localStorage.getItem('token');
}

export function subscribeToAuth(callback) {
  window.addEventListener('auth-changed', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('auth-changed', callback);
    window.removeEventListener('storage', callback);
  };
}

export class UnauthorizedError extends Error {}

export async function authFetch(path, options = {}) {
  const token = getToken();

  if (!token) {
    throw new UnauthorizedError('Not signed in');
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  });

  if (response.status === 401) {
    clearToken();
    throw new UnauthorizedError('Session expired');
  }

  return response;
}