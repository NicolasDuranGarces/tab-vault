/**
 * Validation Utility Tests
 */

import {
  isValidUrl,
  sanitizeUrl,
  extractDomain,
  matchesDomainPattern,
  shouldExcludeUrl,
} from '../validation';

describe('Validation Utilities', () => {
  describe('isValidUrl', () => {
    it('should return true for valid http URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('http://example.com/path')).toBe(true);
      expect(isValidUrl('http://example.com:8080')).toBe(true);
    });

    it('should return true for valid https URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('https://sub.example.com/path?query=1')).toBe(true);
    });

    it('should return true for chrome URLs', () => {
      expect(isValidUrl('chrome://settings')).toBe(true);
      expect(isValidUrl('chrome://extensions')).toBe(true);
    });

    it('should return true for chrome-extension URLs', () => {
      expect(isValidUrl('chrome-extension://abcdef123/popup.html')).toBe(true);
    });

    it('should return false for javascript protocol (XSS vector)', () => {
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
    });

    it('should return false for data protocol', () => {
      expect(isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    it('should return false for file protocol', () => {
      expect(isValidUrl('file:///etc/passwd')).toBe(false);
    });

    it('should return false for about protocol', () => {
      expect(isValidUrl('about:blank')).toBe(false);
    });

    it('should return false for vbscript protocol', () => {
      expect(isValidUrl('vbscript:msgbox(1)')).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('://missing-protocol')).toBe(false);
    });

    it('should return false for null/undefined/non-string', () => {
      expect(isValidUrl(null as unknown as string)).toBe(false);
      expect(isValidUrl(undefined as unknown as string)).toBe(false);
      expect(isValidUrl(123 as unknown as string)).toBe(false);
    });
  });

  describe('sanitizeUrl', () => {
    it('should return sanitized URL for valid URLs', () => {
      const result = sanitizeUrl('https://example.com/path');
      expect(result).toBe('https://example.com/path');
    });

    it('should remove user credentials from URL', () => {
      const result = sanitizeUrl('https://user:pass@example.com/path');
      expect(result).toBe('https://example.com/path');
    });

    it('should return null for invalid URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
      expect(sanitizeUrl('')).toBeNull();
      expect(sanitizeUrl('not a url')).toBeNull();
    });

    it('should preserve query parameters', () => {
      const result = sanitizeUrl('https://example.com/path?foo=bar&baz=qux');
      expect(result).toContain('foo=bar');
      expect(result).toContain('baz=qux');
    });

    it('should preserve hash', () => {
      const result = sanitizeUrl('https://example.com/path#section');
      expect(result).toContain('#section');
    });
  });

  describe('extractDomain', () => {
    it('should extract domain from valid URLs', () => {
      expect(extractDomain('https://example.com')).toBe('example.com');
      expect(extractDomain('https://sub.example.com/path')).toBe('sub.example.com');
      expect(extractDomain('http://localhost:3000')).toBe('localhost');
    });

    it('should return hostname without port', () => {
      expect(extractDomain('https://example.com:8080/path')).toBe('example.com');
    });

    it('should return "unknown" for invalid URLs', () => {
      expect(extractDomain('')).toBe('unknown');
      expect(extractDomain('not a url')).toBe('unknown');
    });
  });

  describe('matchesDomainPattern', () => {
    it('should match exact domain', () => {
      expect(matchesDomainPattern('https://example.com', 'example.com')).toBe(true);
      expect(matchesDomainPattern('https://example.com/path', 'example.com')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(matchesDomainPattern('https://EXAMPLE.COM', 'example.com')).toBe(true);
      expect(matchesDomainPattern('https://example.com', 'EXAMPLE.COM')).toBe(true);
    });

    it('should not match different domains', () => {
      expect(matchesDomainPattern('https://example.com', 'other.com')).toBe(false);
      expect(matchesDomainPattern('https://sub.example.com', 'example.com')).toBe(false);
    });

    it('should match wildcard patterns', () => {
      expect(matchesDomainPattern('https://sub.example.com', '*.example.com')).toBe(true);
      expect(matchesDomainPattern('https://deep.sub.example.com', '*.example.com')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(matchesDomainPattern('not a url', 'example.com')).toBe(false);
      expect(matchesDomainPattern('', '*.example.com')).toBe(false);
    });
  });

  describe('shouldExcludeUrl', () => {
    const excludedDomains = ['example.com', '*.test.com', 'blocked.org'];

    it('should return true for URLs matching excluded domains', () => {
      expect(shouldExcludeUrl('https://example.com', excludedDomains)).toBe(true);
      expect(shouldExcludeUrl('https://sub.test.com', excludedDomains)).toBe(true);
      expect(shouldExcludeUrl('https://blocked.org/path', excludedDomains)).toBe(true);
    });

    it('should return false for URLs not matching excluded domains', () => {
      expect(shouldExcludeUrl('https://allowed.com', excludedDomains)).toBe(false);
      expect(shouldExcludeUrl('https://other.org', excludedDomains)).toBe(false);
    });

    it('should return false for empty excluded domains list', () => {
      expect(shouldExcludeUrl('https://example.com', [])).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      expect(shouldExcludeUrl('not a url', excludedDomains)).toBe(false);
    });
  });
});
