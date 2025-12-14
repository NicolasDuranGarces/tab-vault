/**
 * Compression Utility Tests
 */

import {
  compressTabs,
  decompressTabs,
  compressSession,
  decompressSession,
  compressionRatio,
  estimateSize,
  shouldCompress,
} from '../compression';
import type { TabData, Session } from '@/types';

describe('Compression Utilities', () => {
  const mockTabs: TabData[] = [
    {
      id: 'tab-1',
      url: 'https://example.com',
      title: 'Example',
      favicon: 'https://example.com/favicon.ico',
      pinned: false,
      groupId: -1,
      index: 0,
      active: true,
      muted: false,
    },
    {
      id: 'tab-2',
      url: 'https://test.com/page',
      title: 'Test Page',
      favicon: '',
      pinned: true,
      groupId: 1,
      groupColor: 'blue',
      groupName: 'Test Group',
      index: 1,
      active: false,
      muted: false,
    },
  ];

  const mockSession: Session = {
    id: 'session-1',
    name: 'Test Session',
    description: 'A test session',
    tags: ['test', 'mock'],
    tabCount: 2,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isEmergency: false,
    version: 1,
    faviconPreview: [],
    domainPreview: ['example.com', 'test.com'],
    tabs: mockTabs,
    isCompressed: false,
  };

  describe('compressTabs', () => {
    it('should compress tabs to a non-empty string', () => {
      const compressed = compressTabs(mockTabs);
      expect(typeof compressed).toBe('string');
      expect(compressed.length).toBeGreaterThan(0);
    });

    it('should produce smaller output than JSON for larger data', () => {
      // Create a large array of tabs
      const largeTabs = Array.from({ length: 100 }, (_, i) => ({
        ...mockTabs[0]!,
        id: `tab-${i}`,
        url: `https://example.com/page/${i}`,
        title: `Page ${i} with a longer title for more data`,
      }));
      
      const original = JSON.stringify(largeTabs);
      const compressed = compressTabs(largeTabs);
      
      // LZ-String UTF16 usually compresses well for repetitive data
      expect(compressed.length).toBeLessThan(original.length);
    });

    it('should handle empty array', () => {
      const compressed = compressTabs([]);
      expect(compressed).toBeDefined();
      expect(typeof compressed).toBe('string');
    });
  });

  describe('decompressTabs', () => {
    it('should decompress to original tabs', () => {
      const compressed = compressTabs(mockTabs);
      const decompressed = decompressTabs(compressed);
      
      expect(decompressed).toHaveLength(mockTabs.length);
      expect(decompressed[0]?.url).toBe(mockTabs[0]?.url);
      expect(decompressed[1]?.pinned).toBe(mockTabs[1]?.pinned);
    });

    it('should return empty array for invalid compressed string', () => {
      const result = decompressTabs('not-valid-compressed-data');
      expect(result).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      const result = decompressTabs('');
      expect(result).toEqual([]);
    });
  });

  describe('compressSession', () => {
    it('should compress session to a non-empty string', () => {
      const compressed = compressSession(mockSession);
      expect(typeof compressed).toBe('string');
      expect(compressed.length).toBeGreaterThan(0);
    });
  });

  describe('decompressSession', () => {
    it('should decompress to original session', () => {
      const compressed = compressSession(mockSession);
      const decompressed = decompressSession(compressed);
      
      expect(decompressed).not.toBeNull();
      expect(decompressed?.id).toBe(mockSession.id);
      expect(decompressed?.name).toBe(mockSession.name);
      expect(decompressed?.tabs).toHaveLength(mockSession.tabs.length);
    });

    it('should return null for invalid compressed string', () => {
      const result = decompressSession('invalid-data');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = decompressSession('');
      expect(result).toBeNull();
    });
  });

  describe('compressionRatio', () => {
    it('should calculate correct ratio', () => {
      const ratio = compressionRatio(100, 25);
      expect(ratio).toBe(75); // 75% reduction
    });

    it('should return 0 for zero original size', () => {
      const ratio = compressionRatio(0, 10);
      expect(ratio).toBe(0);
    });

    it('should handle no compression scenario', () => {
      const ratio = compressionRatio(100, 100);
      expect(ratio).toBe(0); // 0% reduction
    });

    it('should handle expansion scenario', () => {
      const ratio = compressionRatio(100, 150);
      expect(ratio).toBe(-50); // Negative means expansion
    });
  });

  describe('estimateSize', () => {
    it('should estimate size in bytes', () => {
      const data = { key: 'value' };
      const size = estimateSize(data);
      // {"key":"value"} = 15 chars * 2 bytes = 30
      expect(size).toBe(30);
    });

    it('should handle empty object', () => {
      const size = estimateSize({});
      // {} = 2 chars * 2 bytes = 4
      expect(size).toBe(4);
    });

    it('should handle arrays', () => {
      const size = estimateSize([1, 2, 3]);
      // [1,2,3] = 7 chars * 2 bytes = 14
      expect(size).toBe(14);
    });
  });

  describe('shouldCompress', () => {
    it('should return true when tabs >= threshold', () => {
      const tabs = mockTabs;
      expect(shouldCompress(tabs, 2)).toBe(true);
      expect(shouldCompress(tabs, 1)).toBe(true);
    });

    it('should return false when tabs < threshold', () => {
      const tabs = mockTabs;
      expect(shouldCompress(tabs, 3)).toBe(false);
      expect(shouldCompress(tabs, 10)).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(shouldCompress([], 1)).toBe(false);
    });

    it('should return true for empty array with threshold 0', () => {
      expect(shouldCompress([], 0)).toBe(true);
    });
  });
});
