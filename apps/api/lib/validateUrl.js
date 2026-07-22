function validateUrl(input) {
  let parsed;

  try {
    parsed = new URL(input);
  } catch {
    return { valid: false, error: 'Not a valid URL' };
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, error: 'URL must use http or https' };
  }

  const ownHosts = ['localhost', '127.0.0.1'];
  if (ownHosts.includes(parsed.hostname)) {
    return { valid: false, error: 'Cannot shorten a link to this service itself' };
  }

  return { valid: true };
}

module.exports = { validateUrl };