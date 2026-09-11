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

  const normalizedHostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  const ownHostname = (
    process.env.SERVICE_HOSTNAME || 'localhost'
  ).toLowerCase();
  if (
    normalizedHostname === ownHostname ||
    normalizedHostname === '127.0.0.1'
  ) {
    return {
      valid: false,
      error: 'Cannot shorten a link to this service itself',
    };
  }

  return { valid: true };
}

module.exports = { validateUrl };
