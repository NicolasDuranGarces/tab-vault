/**
 * URL Validation and Sanitization Utilities
 * Security-focused utilities for handling URLs
 */

/**
 * List of allowed URL protocols
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'chrome:', 'chrome-extension:'];

/**
 * List of dangerous URL protocols that should be blocked
 */
const BLOCKED_PROTOCOLS = ['javascript:', 'data:', 'file:', 'vbscript:', 'about:'];

/**
 * Validates if a URL is safe to store and restore
 * @param url - The URL to validate
 * @returns Whether the URL is valid and safe
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);

    // Block dangerous protocols
    if (BLOCKED_PROTOCOLS.some(protocol => parsed.protocol === protocol)) {
      return false;
    }

    // Only allow known safe protocols
    if (!ALLOWED_PROTOCOLS.some(protocol => parsed.protocol === protocol)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes a URL for safe storage
 * @param url - The URL to sanitize
 * @returns Sanitized URL or null if invalid
 */
export function sanitizeUrl(url: string): string | null {
  if (!isValidUrl(url)) {
    return null;
  }

  try {
    const parsed = new URL(url);
    // Remove any user credentials from URL
    parsed.username = '';
    parsed.password = '';
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Extracts the domain from a URL
 * @param url - The URL to extract domain from
 * @returns Domain or 'unknown'
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return 'unknown';
  }
}

/**
 * Checks if a URL matches a domain pattern
 * @param url - The URL to check
 * @param pattern - Domain pattern (can include wildcards like *.example.com)
 * @returns Whether the URL matches the pattern
 */
export function matchesDomainPattern(url: string, pattern: string): boolean {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.toLowerCase();
    const normalizedPattern = pattern.toLowerCase().trim();

    // Exact match
    if (domain === normalizedPattern) {
      return true;
    }

    // Wildcard match (*.example.com matches sub.example.com)
    if (normalizedPattern.startsWith('*.')) {
      const suffix = normalizedPattern.slice(2);
      return domain.endsWith(suffix) || domain === suffix.slice(1);
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Checks if a URL should be excluded based on excluded domains list
 * @param url - The URL to check
 * @param excludedDomains - List of domain patterns to exclude
 * @returns Whether the URL should be excluded
 */
export function shouldExcludeUrl(url: string, excludedDomains: string[]): boolean {
  return excludedDomains.some(pattern => matchesDomainPattern(url, pattern));
}
