function validateUrl(input) {
  let parsed;

  try {
    parsed = new URL(input);
  } catch {
    return { valid: false, error: 'Not a valid URL' };
  }

  return { valid: true };
}

module.exports = { validateUrl };