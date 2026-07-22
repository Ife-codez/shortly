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
  
  return { valid: true };
}

module.exports = { validateUrl };