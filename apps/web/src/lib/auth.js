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