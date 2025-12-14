/**
 * Input Sanitization Utilities
 * Prevents XSS and injection attacks
 */

/**
 * HTML entities to escape
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escapes HTML special characters to prevent XSS
 * @param str - String to escape
 * @returns Escaped string
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str.replace(/[&<>"'`=/]/g, char => HTML_ENTITIES[char] || char);
}

/**
 * Sanitizes a session name
 * @param name - Name to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized name
 */
export function sanitizeSessionName(name: string, maxLength = 100): string {
  if (!name || typeof name !== 'string') {
    return 'Unnamed Session';
  }

  // Trim and limit length
  let sanitized = name.trim().slice(0, maxLength);

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Escape HTML entities
  sanitized = escapeHtml(sanitized);

  return sanitized || 'Unnamed Session';
}

/**
 * Sanitizes a tag
 * @param tag - Tag to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized tag
 */
export function sanitizeTag(tag: string, maxLength = 50): string {
  if (!tag || typeof tag !== 'string') {
    return '';
  }

  return tag
    .trim()
    .toLowerCase()
    .slice(0, maxLength)
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/[<>'"&]/g, '');
}

/**
 * Sanitizes a description
 * @param description - Description to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized description
 */
export function sanitizeDescription(description: string, maxLength = 500): string {
  if (!description || typeof description !== 'string') {
    return '';
  }

  return description
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/[<>]/g, char => HTML_ENTITIES[char] || char);
}

/**
 * Sanitizes form data values
 * @param value - Form value to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized value
 */
export function sanitizeFormValue(value: string, maxLength = 1000): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value.slice(0, maxLength);
}

/**
 * Validates and sanitizes a folder name
 * @param name - Folder name
 * @param maxLength - Maximum allowed length
 * @returns Sanitized folder name
 */
export function sanitizeFolderName(name: string, maxLength = 50): string {
  if (!name || typeof name !== 'string') {
    return 'New Folder';
  }

  let sanitized = name.trim().slice(0, maxLength);
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  sanitized = escapeHtml(sanitized);

  return sanitized || 'New Folder';
}

/**
 * Sanitizes an array of tags
 * @param tags - Array of tags to sanitize
 * @param maxTags - Maximum number of tags
 * @returns Sanitized array of tags
 */
export function sanitizeTags(tags: string[], maxTags = 20): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .slice(0, maxTags)
    .map(tag => sanitizeTag(tag))
    .filter(tag => tag.length > 0)
    .filter((tag, index, arr) => arr.indexOf(tag) === index); // Remove duplicates
}
