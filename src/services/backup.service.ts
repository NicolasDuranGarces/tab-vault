/**
 * Backup Service
 * Handles export, import, and versioning of sessions
 */

import type { Session, SessionVersion, Folder, Settings } from '@/types';
import { storageService } from './storage.service';
import { compressSession, decompressSession } from '@/utils/compression';
import { generateId, now } from '@/utils/helpers';
import { isValidUrl } from '@/utils/validation';
import { sanitizeSessionName, sanitizeTags, sanitizeDescription } from '@/utils/sanitization';
import { StorageKey } from '@/types';

/**
 * Export data structure
 */
interface ExportData {
  version: string;
  exportedAt: number;
  sessions: Session[];
  folders: Folder[];
  settings?: Settings;
}

/**
 * Import result
 */
interface ImportResult {
  success: boolean;
  sessionsImported: number;
  foldersImported: number;
  errors: string[];
}

/**
 * Backup service
 */
class BackupService {
  private readonly EXPORT_VERSION = '1.0';
  private readonly MAX_VERSIONS_PER_SESSION = 10;

  /**
   * Exports all sessions to JSON
   * @param includeSettings - Whether to include settings
   * @returns Blob with JSON data
   */
  async exportToJSON(includeSettings = false): Promise<Blob> {
    const sessions = await storageService.getAllSessions();
    const folders = await storageService.getFolders();

    const exportData: ExportData = {
      version: this.EXPORT_VERSION,
      exportedAt: now(),
      sessions: Object.values(sessions),
      folders,
    };

    if (includeSettings) {
      exportData.settings = await storageService.getSettings();
    }

    const json = JSON.stringify(exportData, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  /**
   * Exports specific sessions to JSON
   * @param sessionIds - Array of session IDs to export
   * @returns Blob with JSON data
   */
  async exportSessionsToJSON(sessionIds: string[]): Promise<Blob> {
    const allSessions = await storageService.getAllSessions();
    const sessions = sessionIds
      .map(id => allSessions[id])
      .filter((s): s is Session => s !== undefined);

    const exportData: ExportData = {
      version: this.EXPORT_VERSION,
      exportedAt: now(),
      sessions,
      folders: [],
    };

    const json = JSON.stringify(exportData, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  /**
   * Imports sessions from JSON
   * @param file - File to import
   * @param options - Import options
   * @returns Import result
   */
  async importFromJSON(
    file: File,
    options: {
      overwriteExisting?: boolean;
      importSettings?: boolean;
    } = {}
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      sessionsImported: 0,
      foldersImported: 0,
      errors: [],
    };

    try {
      const text = await file.text();
      const data = JSON.parse(text) as ExportData;

      // Validate export format
      if (!data.version || !data.sessions || !Array.isArray(data.sessions)) {
        result.errors.push('Invalid export file format');
        return result;
      }

      // Import folders first
      if (data.folders && Array.isArray(data.folders)) {
        const existingFolders = await storageService.getFolders();
        const existingFolderIds = new Set(existingFolders.map(f => f.id));

        const folderIdMap = new Map<string, string>();
        const newFolders: Folder[] = [...existingFolders];

        for (const folder of data.folders) {
          if (existingFolderIds.has(folder.id) && !options.overwriteExisting) {
            // Create new ID to avoid conflict
            const newId = generateId();
            folderIdMap.set(folder.id, newId);
            newFolders.push({
              ...folder,
              id: newId,
            });
          } else {
            folderIdMap.set(folder.id, folder.id);
            const existingIndex = newFolders.findIndex(f => f.id === folder.id);
            if (existingIndex >= 0) {
              newFolders[existingIndex] = folder;
            } else {
              newFolders.push(folder);
            }
          }
          result.foldersImported++;
        }

        await storageService.saveFolders(newFolders);

        // Update session folder references
        for (const session of data.sessions) {
          if (session.folderId && folderIdMap.has(session.folderId)) {
            session.folderId = folderIdMap.get(session.folderId);
          }
        }
      }

      // Import sessions
      for (const session of data.sessions) {
        try {
          // Validate and sanitize session
          const validatedSession = this.validateAndSanitizeSession(session);
          if (!validatedSession) {
            result.errors.push(`Invalid session: ${session.name || 'unnamed'}`);
            continue;
          }

          // Check for existing session
          const existingSessions = await storageService.getAllSessions();
          if (existingSessions[validatedSession.id] && !options.overwriteExisting) {
            // Create new ID to avoid conflict
            validatedSession.id = generateId();
          }

          await storageService.saveSession(validatedSession);
          result.sessionsImported++;
        } catch (error) {
          result.errors.push(`Failed to import session: ${session.name || 'unnamed'}`);
        }
      }

      // Import settings if requested
      if (options.importSettings && data.settings) {
        await storageService.saveSettings(data.settings);
      }

      result.success = result.sessionsImported > 0;
    } catch (error) {
      result.errors.push(`Failed to parse import file: ${error}`);
    }

    return result;
  }

  /**
   * Validates and sanitizes an imported session
   * @param session - Session to validate
   * @returns Validated session or null
   */
  private validateAndSanitizeSession(session: Session): Session | null {
    if (!session.id || !session.tabs) {
      return null;
    }

    // Validate tabs
    const validTabs = session.tabs.filter(tab => {
      return tab.url && isValidUrl(tab.url) && tab.title;
    });

    if (validTabs.length === 0) {
      return null;
    }

    return {
      ...session,
      id: session.id || generateId(),
      name: sanitizeSessionName(session.name),
      description: session.description ? sanitizeDescription(session.description) : undefined,
      tags: sanitizeTags(session.tags || []),
      tabs: validTabs,
      tabCount: validTabs.length,
      createdAt: session.createdAt || now(),
      updatedAt: now(),
      version: session.version || 1,
      isEmergency: false,
      isCompressed: false,
      faviconPreview: validTabs.slice(0, 5).map(t => t.favicon),
      domainPreview: [
        ...new Set(
          validTabs.slice(0, 5).map(t => {
            try {
              return new URL(t.url).hostname;
            } catch {
              return 'unknown';
            }
          })
        ),
      ],
    };
  }

  // ============================================================================
  // VERSIONING
  // ============================================================================

  /**
   * Creates a version snapshot of a session
   * @param sessionId - Session ID
   */
  async createVersion(sessionId: string): Promise<void> {
    const session = await storageService.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const version: SessionVersion = {
      id: generateId(),
      sessionId,
      timestamp: now(),
      tabCount: session.tabCount,
      snapshot: compressSession(session),
    };

    // Get existing versions
    const result = await storageService.get(StorageKey.SESSION_VERSIONS);
    const allVersions = result[StorageKey.SESSION_VERSIONS] || {};
    const sessionVersions = allVersions[sessionId] || [];

    // Add new version
    sessionVersions.unshift(version);

    // Trim to max versions
    const trimmedVersions = sessionVersions.slice(0, this.MAX_VERSIONS_PER_SESSION);

    allVersions[sessionId] = trimmedVersions;
    await storageService.set({ [StorageKey.SESSION_VERSIONS]: allVersions });
  }

  /**
   * Gets version history for a session
   * @param sessionId - Session ID
   * @returns Array of session versions
   */
  async getVersionHistory(sessionId: string): Promise<SessionVersion[]> {
    const result = await storageService.get(StorageKey.SESSION_VERSIONS);
    const allVersions = result[StorageKey.SESSION_VERSIONS] || {};
    return allVersions[sessionId] || [];
  }

  /**
   * Restores a session from a version
   * @param sessionId - Session ID
   * @param versionId - Version ID to restore
   * @returns Restored session
   */
  async restoreVersion(sessionId: string, versionId: string): Promise<Session | null> {
    const versions = await this.getVersionHistory(sessionId);
    const version = versions.find(v => v.id === versionId);

    if (!version) {
      throw new Error('Version not found');
    }

    const session = decompressSession(version.snapshot);
    if (!session) {
      throw new Error('Failed to decompress version');
    }

    // Update timestamps
    session.updatedAt = now();
    session.version += 1;

    await storageService.saveSession(session);
    return session;
  }

  /**
   * Deletes version history for a session
   * @param sessionId - Session ID
   */
  async deleteVersionHistory(sessionId: string): Promise<void> {
    const result = await storageService.get(StorageKey.SESSION_VERSIONS);
    const allVersions = result[StorageKey.SESSION_VERSIONS] || {};

    delete allVersions[sessionId];

    await storageService.set({ [StorageKey.SESSION_VERSIONS]: allVersions });
  }
}

// Export singleton instance
export const backupService = new BackupService();
