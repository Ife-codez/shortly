const { validateUrl } = require('./validateUrl');

test('accepts a valid https url', () => {
  const result = validateUrl('https://example.com');
  expect(result.valid).toBe(true);
});

test('rejects a malformed url', () => {
  const result = validateUrl('not a url');
  expect(result.valid).toBe(false);
});

test('rejects a non-http(s) protocol', () => {
  const result = validateUrl('ftp://example.com');
  expect(result.valid).toBe(false);
  expect(result.error).toBe('URL must use http or https');
});

test('rejects a url pointing at localhost', () => {
  const result = validateUrl('http://localhost:4000/health');
  expect(result.valid).toBe(false);
  expect(result.error).toBe('Cannot shorten a link to this service itself');
});