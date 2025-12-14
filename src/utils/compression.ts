/**
 * Data Compression Utilities
 * Uses LZ-String for efficient compression of large session data
 */

import LZString from 'lz-string';
import type { TabData, Session } from '@/types';

/**
 * Compresses an array of tabs to a string
 * @param tabs - Array of tabs to compress
 * @returns Compressed string
 */
export function compressTabs(tabs: TabData[]): string {
  const json = JSON.stringify(tabs);
  return LZString.compressToUTF16(json);
}

/**
 * Decompresses tabs from a compressed string
 * @param compressed - Compressed string
 * @returns Array of tabs
 */
export function decompressTabs(compressed: string): TabData[] {
  try {
    const json = LZString.decompressFromUTF16(compressed);
    if (!json) {
      throw new Error('Decompression failed');
    }
    return JSON.parse(json) as TabData[];
  } catch (error) {
    console.error('Failed to decompress tabs:', error);
    return [];
  }
}

/**
 * Compresses a session for backup/versioning
 * @param session - Session to compress
 * @returns Compressed string
 */
export function compressSession(session: Session): string {
  const json = JSON.stringify(session);
  return LZString.compressToUTF16(json);
}

/**
 * Decompresses a session
 * @param compressed - Compressed string
 * @returns Session or null if failed
 */
export function decompressSession(compressed: string): Session | null {
  try {
    const json = LZString.decompressFromUTF16(compressed);
    if (!json) {
      throw new Error('Decompression failed');
    }
    return JSON.parse(json) as Session;
  } catch (error) {
    console.error('Failed to decompress session:', error);
    return null;
  }
}

/**
 * Calculates the compression ratio
 * @param original - Original size in bytes
 * @param compressed - Compressed size in bytes
 * @returns Compression ratio as percentage
 */
export function compressionRatio(original: number, compressed: number): number {
  if (original === 0) return 0;
  return Math.round((1 - compressed / original) * 100);
}

/**
 * Estimates the size of data in bytes
 * @param data - Data to estimate size of
 * @returns Estimated size in bytes
 */
export function estimateSize(data: unknown): number {
  const json = JSON.stringify(data);
  // UTF-16 encoding uses 2 bytes per character
  return json.length * 2;
}

/**
 * Checks if compression would be beneficial
 * @param tabs - Tabs to check
 * @param threshold - Minimum number of tabs to trigger compression
 * @returns Whether compression should be used
 */
export function shouldCompress(tabs: TabData[], threshold: number): boolean {
  return tabs.length >= threshold;
}
