/**
 * Input sanitization utilities for API routes.
 * React JSX auto-escapes rendered text, but we still need to:
 * - Strip HTML tags from inputs (defense in depth)
 * - Trim whitespace
 * - Enforce length limits
 * - Whitelist fields on PATCH to prevent mass assignment
 */

/** Strip HTML tags and trim whitespace */
export function sanitizeString(input: unknown, maxLength = 1000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, maxLength);
}

/** Pick only allowed fields from an object, sanitizing string values */
export function pickFields<T extends Record<string, unknown>>(
  body: T,
  allowedFields: string[],
  maxLength = 1000,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      result[key] = typeof body[key] === 'string'
        ? sanitizeString(body[key], maxLength)
        : body[key];
    }
  }
  return result;
}

/** Validate password strength: 8+ chars, at least one uppercase and one number */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
}
