/**
 * Storage Service
 * Handles all Chrome Storage API interactions with type safety and error handling
 */

import type { Session, SessionMetadata, Folder, Settings, StorageData, Statistics } from '@/types';
import { DEFAULT_SETTINGS, StorageKey } from '@/types';

/**
 * Chrome Storage API wrapper with type safety
 */
class StorageService {
  /**
   * Gets data from local storage
   * @param keys - Keys to get
   * @returns Promise with storage data
   */
  async get<K extends StorageKey>(keys: K | K[]): Promise<Partial<StorageData>> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, result => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result as Partial<StorageData>);
        }
      });
    });
  }

  /**
   * Sets data in local storage
   * @param data - Data to set
   * @returns Promise
   */
  async set(data: Partial<StorageData>): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Removes data from local storage
   * @param keys - Keys to remove
   * @returns Promise
   */
  async remove(keys: StorageKey | StorageKey[]): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Clears all data from local storage
   * @returns Promise
   */
  async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Gets storage usage info
   * @returns Promise with bytes used and quota
   */
  async getStorageInfo(): Promise<{ bytesUsed: number; quota: number }> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.getBytesInUse(null, bytesUsed => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          // Local storage quota is typically 10MB for extensions
          resolve({ bytesUsed, quota: 10 * 1024 * 1024 });
        }
      });
    });
  }

  // ============================================================================
  // SESSION OPERATIONS
  // ============================================================================

  /**
   * Gets all session metadata (lightweight list)
   * @returns Promise with session metadata array
   */
  async getSessionMetadata(): Promise<SessionMetadata[]> {
    const result = await this.get(StorageKey.SESSION_METADATA);
    return result[StorageKey.SESSION_METADATA] || [];
  }

  /**
   * Gets a full session by ID
   * @param id - Session ID
   * @returns Promise with session or null
   */
  async getSession(id: string): Promise<Session | null> {
    const result = await this.get(StorageKey.SESSIONS);
    const sessions = result[StorageKey.SESSIONS] || {};
    return sessions[id] || null;
  }

  /**
   * Gets all sessions
   * @returns Promise with sessions record
   */
  async getAllSessions(): Promise<Record<string, Session>> {
    const result = await this.get(StorageKey.SESSIONS);
    return result[StorageKey.SESSIONS] || {};
  }

  /**
   * Saves a session
   * @param session - Session to save
   * @returns Promise
   */
  async saveSession(session: Session): Promise<void> {
    const sessions = await this.getAllSessions();
    sessions[session.id] = session;

    // Update metadata list
    const metadata = await this.getSessionMetadata();
    const existingIndex = metadata.findIndex(m => m.id === session.id);
    const sessionMeta: SessionMetadata = {
      id: session.id,
      name: session.name,
      description: session.description,
      tags: session.tags,
      folderId: session.folderId,
      tabCount: session.tabs.length,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      lastAccessedAt: session.lastAccessedAt,
      isEmergency: session.isEmergency,
      version: session.version,
      faviconPreview: session.tabs.slice(0, 5).map(t => t.favicon),
      domainPreview: [
        ...new Set(
          session.tabs.slice(0, 5).map(t => {
            try {
              return new URL(t.url).hostname;
            } catch {
              return 'unknown';
            }
          })
        ),
      ],
    };

    if (existingIndex >= 0) {
      metadata[existingIndex] = sessionMeta;
    } else {
      metadata.unshift(sessionMeta);
    }

    await this.set({
      [StorageKey.SESSIONS]: sessions,
      [StorageKey.SESSION_METADATA]: metadata,
    });
  }

  /**
   * Deletes a session
   * @param id - Session ID to delete
   * @returns Promise
   */
  async deleteSession(id: string): Promise<void> {
    const sessions = await this.getAllSessions();
    delete sessions[id];

    const metadata = await this.getSessionMetadata();
    const filteredMetadata = metadata.filter(m => m.id !== id);

    await this.set({
      [StorageKey.SESSIONS]: sessions,
      [StorageKey.SESSION_METADATA]: filteredMetadata,
    });
  }

  // ============================================================================
  // FOLDER OPERATIONS
  // ============================================================================

  /**
   * Gets all folders
   * @returns Promise with folders array
   */
  async getFolders(): Promise<Folder[]> {
    const result = await this.get(StorageKey.FOLDERS);
    return result[StorageKey.FOLDERS] || [];
  }

  /**
   * Saves folders
   * @param folders - Folders to save
   * @returns Promise
   */
  async saveFolders(folders: Folder[]): Promise<void> {
    await this.set({ [StorageKey.FOLDERS]: folders });
  }

  // ============================================================================
  // SETTINGS OPERATIONS
  // ============================================================================

  /**
   * Gets settings
   * @returns Promise with settings
   */
  async getSettings(): Promise<Settings> {
    const result = await this.get(StorageKey.SETTINGS);
    return { ...DEFAULT_SETTINGS, ...result[StorageKey.SETTINGS] };
  }

  /**
   * Saves settings
   * @param settings - Settings to save
   * @returns Promise
   */
  async saveSettings(settings: Partial<Settings>): Promise<void> {
    const current = await this.getSettings();
    await this.set({ [StorageKey.SETTINGS]: { ...current, ...settings } });
  }

  // ============================================================================
  // EMERGENCY SESSION OPERATIONS
  // ============================================================================

  /**
   * Gets emergency sessions
   * @returns Promise with emergency sessions array
   */
  async getEmergencySessions(): Promise<Session[]> {
    const result = await this.get(StorageKey.EMERGENCY_SESSIONS);
    return result[StorageKey.EMERGENCY_SESSIONS] || [];
  }

  /**
   * Saves an emergency session
   * @param session - Emergency session to save
   * @param maxSessions - Maximum number of emergency sessions to keep
   * @returns Promise
   */
  async saveEmergencySession(session: Session, maxSessions: number): Promise<void> {
    const sessions = await this.getEmergencySessions();
    sessions.unshift(session);

    // Keep only the last N sessions
    const trimmed = sessions.slice(0, maxSessions);

    await this.set({ [StorageKey.EMERGENCY_SESSIONS]: trimmed });
  }

  /**
   * Clears emergency sessions
   * @returns Promise
   */
  async clearEmergencySessions(): Promise<void> {
    await this.set({ [StorageKey.EMERGENCY_SESSIONS]: [] });
  }

  // ============================================================================
  // STATISTICS OPERATIONS
  // ============================================================================

  /**
   * Gets statistics
   * @returns Promise with statistics
   */
  async getStatistics(): Promise<Statistics> {
    const result = await this.get(StorageKey.STATISTICS);
    return (
      result[StorageKey.STATISTICS] || {
        totalSessionsSaved: 0,
        totalSessionsRestored: 0,
        totalTabsSaved: 0,
        totalTabsRestored: 0,
        mostUsedSessions: [],
        mostFrequentDomains: [],
        firstUseDate: Date.now(),
        lastUseDate: Date.now(),
      }
    );
  }

  /**
   * Updates statistics
   * @param updates - Partial statistics to update
   * @returns Promise
   */
  async updateStatistics(updates: Partial<Statistics>): Promise<void> {
    const current = await this.getStatistics();
    await this.set({ [StorageKey.STATISTICS]: { ...current, ...updates } });
  }
}

// Export singleton instance
export const storageService = new StorageService();
