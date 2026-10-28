const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;

function validateSignup({ email, password } = {}) {
  if (!email || !password) {
    return { valid: false, error: 'email and password are required' };
  }

  if (typeof email !== 'string' || typeof password !== 'string') {
    return { valid: false, error: 'email and password must be text' };
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(normalizedEmail)) {
    return { valid: false, error: 'a valid email address is required' };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, error: 'password must be at least 8 characters' };
  }

  if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    return { valid: false, error: 'password is too long' };
  }

  return { valid: true, email: normalizedEmail };
}

module.exports = { validateSignup };