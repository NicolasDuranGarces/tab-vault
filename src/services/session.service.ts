/**
 * Session Service
 * Core business logic for session management
 */

import type {
  Session,
  SessionMetadata,
  TabData,
  RestoreOptions,
} from '@/types';
import { DEFAULT_RESTORE_OPTIONS } from '@/types';
import { storageService } from './storage.service';
import { tabService } from './tab.service';
import { generateId, now } from '@/utils/helpers';
import { sanitizeSessionName, sanitizeTags, sanitizeDescription } from '@/utils/sanitization';
import { compressTabs, decompressTabs, shouldCompress } from '@/utils/compression';
import { extractDomain } from '@/utils/validation';

/**
 * Session management service
 */
class SessionService {
  /**
   * Creates and saves a new session from current tabs
   * @param name - Session name
   * @param options - Additional options
   * @returns Created session
   */
  async createSession(
    name: string,
    options: {
      description?: string;
      tags?: string[];
      folderId?: string;
      allWindows?: boolean;
    } = {}
  ): Promise<Session> {
    const settings = await storageService.getSettings();
    
    // Capture tabs based on option
    const tabs = options.allWindows
      ? await tabService.captureAllTabs(settings)
      : await tabService.captureCurrentWindowTabs(settings);

    if (tabs.length === 0) {
      throw new Error('No valid tabs to save');
    }

    const timestamp = now();
    const shouldUseCompression = settings.useCompression && 
      shouldCompress(tabs, settings.compressionThreshold);

    const session: Session = {
      id: generateId(),
      name: sanitizeSessionName(name),
      description: options.description ? sanitizeDescription(options.description) : undefined,
      tags: options.tags ? sanitizeTags(options.tags) : [],
      folderId: options.folderId,
      tabs: shouldUseCompression ? [] : tabs,
      compressedTabs: shouldUseCompression ? compressTabs(tabs) : undefined,
      isCompressed: shouldUseCompression,
      tabCount: tabs.length,
      createdAt: timestamp,
      updatedAt: timestamp,
      isEmergency: false,
      version: 1,
      faviconPreview: tabs.slice(0, 5).map(t => t.favicon),
      domainPreview: [...new Set(tabs.slice(0, 5).map(t => extractDomain(t.url)))],
    };

    await storageService.saveSession(session);

    // Update statistics
    const stats = await storageService.getStatistics();
    await storageService.updateStatistics({
      totalSessionsSaved: stats.totalSessionsSaved + 1,
      totalTabsSaved: stats.totalTabsSaved + tabs.length,
      lastUseDate: timestamp,
    });

    return session;
  }

  /**
   * Gets a session by ID, decompressing if necessary
   * @param id - Session ID
   * @returns Session with tabs
   */
  async getSession(id: string): Promise<Session | null> {
    const session = await storageService.getSession(id);
    
    if (!session) {
      return null;
    }

    // Decompress if needed
    if (session.isCompressed && session.compressedTabs) {
      session.tabs = decompressTabs(session.compressedTabs);
    }

    return session;
  }

  /**
   * Gets all session metadata
   * @returns Array of session metadata
   */
  async getAllSessionMetadata(): Promise<SessionMetadata[]> {
    return storageService.getSessionMetadata();
  }

  /**
   * Updates a session
   * @param id - Session ID
   * @param updates - Fields to update
   * @returns Updated session
   */
  async updateSession(
    id: string,
    updates: {
      name?: string;
      description?: string;
      tags?: string[];
      folderId?: string;
    }
  ): Promise<Session | null> {
    const session = await this.getSession(id);
    if (!session) {
      return null;
    }

    if (updates.name !== undefined) {
      session.name = sanitizeSessionName(updates.name);
    }
    if (updates.description !== undefined) {
      session.description = sanitizeDescription(updates.description);
    }
    if (updates.tags !== undefined) {
      session.tags = sanitizeTags(updates.tags);
    }
    if (updates.folderId !== undefined) {
      session.folderId = updates.folderId;
    }

    session.updatedAt = now();
    session.version += 1;

    // Re-compress if needed
    const settings = await storageService.getSettings();
    if (settings.useCompression && shouldCompress(session.tabs, settings.compressionThreshold)) {
      session.compressedTabs = compressTabs(session.tabs);
      session.tabs = [];
      session.isCompressed = true;
    }

    await storageService.saveSession(session);
    return session;
  }

  /**
   * Deletes a session
   * @param id - Session ID
   */
  async deleteSession(id: string): Promise<void> {
    await storageService.deleteSession(id);
  }

  /**
   * Restores a session
   * @param id - Session ID
   * @param options - Restore options
   * @returns Array of created tab IDs
   */
  async restoreSession(
    id: string,
    options: Partial<RestoreOptions> = {}
  ): Promise<number[]> {
    const session = await this.getSession(id);
    if (!session) {
      throw new Error('Session not found');
    }

    const restoreOptions: RestoreOptions = { ...DEFAULT_RESTORE_OPTIONS, ...options };
    
    // Filter tabs if specific IDs are provided
    let tabsToRestore = session.tabs;
    if (restoreOptions.tabIds) {
      tabsToRestore = session.tabs.filter(t => restoreOptions.tabIds?.includes(t.id));
    }

    // Detect duplicates if enabled
    const settings = await storageService.getSettings();
    if (settings.detectDuplicates) {
      const currentTabs = await tabService.captureCurrentWindowTabs(settings);
      const currentUrls = new Set(currentTabs.map(t => t.url));
      tabsToRestore = tabsToRestore.filter(t => !currentUrls.has(t.url));
    }

    const createdTabIds = await tabService.restoreTabs(tabsToRestore, restoreOptions);

    // Update session access time
    session.lastAccessedAt = now();
    await storageService.saveSession(session);

    // Update statistics
    const stats = await storageService.getStatistics();
    await storageService.updateStatistics({
      totalSessionsRestored: stats.totalSessionsRestored + 1,
      totalTabsRestored: stats.totalTabsRestored + createdTabIds.length,
      lastUseDate: now(),
    });

    return createdTabIds;
  }

  /**
   * Duplicates a session
   * @param id - Session ID to duplicate
   * @param newName - Name for the duplicate
   * @returns Duplicated session
   */
  async duplicateSession(id: string, newName?: string): Promise<Session> {
    const original = await this.getSession(id);
    if (!original) {
      throw new Error('Session not found');
    }

    const timestamp = now();
    const duplicate: Session = {
      ...original,
      id: generateId(),
      name: newName ? sanitizeSessionName(newName) : `${original.name} (Copy)`,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastAccessedAt: undefined,
      isEmergency: false,
      version: 1,
    };

    await storageService.saveSession(duplicate);
    return duplicate;
  }

  /**
   * Merges multiple sessions into one
   * @param ids - Session IDs to merge
   * @param newName - Name for the merged session
   * @returns Merged session
   */
  async mergeSessions(ids: string[], newName: string): Promise<Session> {
    if (ids.length < 2) {
      throw new Error('Need at least 2 sessions to merge');
    }

    const allTabs: TabData[] = [];
    const allTags: string[] = [];
    const seenUrls = new Set<string>();

    for (const id of ids) {
      const session = await this.getSession(id);
      if (session) {
        // Avoid duplicate URLs
        for (const tab of session.tabs) {
          if (!seenUrls.has(tab.url)) {
            allTabs.push({ ...tab, id: generateId() });
            seenUrls.add(tab.url);
          }
        }
        allTags.push(...session.tags);
      }
    }

    const settings = await storageService.getSettings();
    const timestamp = now();
    const shouldUseCompression = settings.useCompression && 
      shouldCompress(allTabs, settings.compressionThreshold);

    const merged: Session = {
      id: generateId(),
      name: sanitizeSessionName(newName),
      tags: sanitizeTags([...new Set(allTags)]),
      tabs: shouldUseCompression ? [] : allTabs,
      compressedTabs: shouldUseCompression ? compressTabs(allTabs) : undefined,
      isCompressed: shouldUseCompression,
      tabCount: allTabs.length,
      createdAt: timestamp,
      updatedAt: timestamp,
      isEmergency: false,
      version: 1,
      faviconPreview: allTabs.slice(0, 5).map(t => t.favicon),
      domainPreview: [...new Set(allTabs.slice(0, 5).map(t => extractDomain(t.url)))],
    };

    await storageService.saveSession(merged);
    return merged;
  }

  /**
   * Splits a session by domain
   * @param id - Session ID to split
   * @param groupByDomain - Whether to group by domain
   * @returns Array of new sessions
   */
  async splitSession(id: string): Promise<Session[]> {
    const original = await this.getSession(id);
    if (!original) {
      throw new Error('Session not found');
    }

    // Group tabs by domain
    const domainGroups = new Map<string, TabData[]>();
    for (const tab of original.tabs) {
      const domain = extractDomain(tab.url);
      const existing = domainGroups.get(domain) || [];
      existing.push(tab);
      domainGroups.set(domain, existing);
    }

    const newSessions: Session[] = [];
    const settings = await storageService.getSettings();
    const timestamp = now();

    for (const [domain, tabs] of domainGroups) {
      const shouldUseCompression = settings.useCompression && 
        shouldCompress(tabs, settings.compressionThreshold);

      const session: Session = {
        id: generateId(),
        name: `${original.name} - ${domain}`,
        tags: original.tags,
        folderId: original.folderId,
        tabs: shouldUseCompression ? [] : tabs.map(t => ({ ...t, id: generateId() })),
        compressedTabs: shouldUseCompression ? compressTabs(tabs) : undefined,
        isCompressed: shouldUseCompression,
        tabCount: tabs.length,
        createdAt: timestamp,
        updatedAt: timestamp,
        isEmergency: false,
        version: 1,
        faviconPreview: tabs.slice(0, 5).map(t => t.favicon),
        domainPreview: [domain],
      };

      await storageService.saveSession(session);
      newSessions.push(session);
    }

    return newSessions;
  }

  /**
   * Creates an emergency backup session
   * @returns Emergency session
   */
  async createEmergencySession(): Promise<Session> {
    const settings = await storageService.getSettings();
    const tabs = await tabService.captureAllTabs(settings);

    if (tabs.length === 0) {
      throw new Error('No tabs to backup');
    }

    const timestamp = now();
    const session: Session = {
      id: generateId(),
      name: `Emergency Backup - ${new Date(timestamp).toLocaleString()}`,
      tags: ['emergency', 'auto-backup'],
      tabs: tabs,
      isCompressed: false,
      tabCount: tabs.length,
      createdAt: timestamp,
      updatedAt: timestamp,
      isEmergency: true,
      version: 1,
      faviconPreview: tabs.slice(0, 5).map(t => t.favicon),
      domainPreview: [...new Set(tabs.slice(0, 5).map(t => extractDomain(t.url)))],
    };

    await storageService.saveEmergencySession(session, settings.maxEmergencySessions);
    return session;
  }
}

// Export singleton instance
export const sessionService = new SessionService();
