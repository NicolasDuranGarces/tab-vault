/**
 * Search Service
 * Handles fuzzy search and filtering across sessions
 */

import Fuse from 'fuse.js';
import type { SessionMetadata, SearchQuery, SearchResult, TabData } from '@/types';
import { storageService } from './storage.service';

/**
 * Search service for sessions and tabs
 */
class SearchService {
  private sessionIndex: Fuse<SessionMetadata> | null = null;
  private lastIndexUpdate = 0;
  private readonly INDEX_TTL = 60000; // 1 minute cache

  /**
   * Builds or rebuilds the search index
   */
  private async buildIndex(): Promise<Fuse<SessionMetadata>> {
    const sessions = await storageService.getSessionMetadata();
    
    this.sessionIndex = new Fuse(sessions, {
      keys: [
        { name: 'name', weight: 2 },
        { name: 'description', weight: 1.5 },
        { name: 'tags', weight: 1.5 },
        { name: 'domainPreview', weight: 1 },
      ],
      threshold: 0.3,
      includeScore: true,
      ignoreLocation: true,
      useExtendedSearch: true,
    });

    this.lastIndexUpdate = Date.now();
    return this.sessionIndex;
  }

  /**
   * Gets the current search index, rebuilding if stale
   */
  private async getIndex(): Promise<Fuse<SessionMetadata>> {
    if (!this.sessionIndex || Date.now() - this.lastIndexUpdate > this.INDEX_TTL) {
      return this.buildIndex();
    }
    return this.sessionIndex;
  }

  /**
   * Invalidates the search index cache
   */
  invalidateCache(): void {
    this.sessionIndex = null;
    this.lastIndexUpdate = 0;
  }

  /**
   * Searches sessions by text query
   * @param query - Search text
   * @returns Array of search results
   */
  async searchSessions(query: string): Promise<SearchResult[]> {
    if (!query.trim()) {
      const sessions = await storageService.getSessionMetadata();
      return sessions.map(session => ({
        session,
        score: 1,
      }));
    }

    const index = await this.getIndex();
    const results = index.search(query);

    return results.map(result => ({
      session: result.item,
      score: 1 - (result.score || 0),
    }));
  }

  /**
   * Searches with advanced filters
   * @param searchQuery - Search query with filters
   * @returns Array of search results
   */
  async searchWithFilters(searchQuery: SearchQuery): Promise<SearchResult[]> {
    let results: SearchResult[];

    // Start with text search if provided
    if (searchQuery.text) {
      results = await this.searchSessions(searchQuery.text);
    } else {
      const sessions = await storageService.getSessionMetadata();
      results = sessions.map(session => ({ session, score: 1 }));
    }

    // Apply filters
    results = results.filter(result => {
      const session = result.session;

      // Filter by tags
      if (searchQuery.tags && searchQuery.tags.length > 0) {
        const hasAllTags = searchQuery.tags.every(tag =>
          session.tags.includes(tag.toLowerCase())
        );
        if (!hasAllTags) return false;
      }

      // Filter by domains
      if (searchQuery.domains && searchQuery.domains.length > 0) {
        const hasAnyDomain = searchQuery.domains.some(domain =>
          session.domainPreview.some(d => d.includes(domain.toLowerCase()))
        );
        if (!hasAnyDomain) return false;
      }

      // Filter by folder
      if (searchQuery.folderId) {
        if (session.folderId !== searchQuery.folderId) return false;
      }

      // Filter by date range
      if (searchQuery.dateFrom) {
        if (session.createdAt < searchQuery.dateFrom) return false;
      }
      if (searchQuery.dateTo) {
        if (session.createdAt > searchQuery.dateTo) return false;
      }

      // Filter by tab count
      if (searchQuery.minTabs !== undefined) {
        if (session.tabCount < searchQuery.minTabs) return false;
      }
      if (searchQuery.maxTabs !== undefined) {
        if (session.tabCount > searchQuery.maxTabs) return false;
      }

      return true;
    });

    return results;
  }

  /**
   * Searches for tabs within a specific session
   * @param sessionId - Session ID
   * @param query - Search text
   * @returns Array of matching tabs
   */
  async searchTabsInSession(
    sessionId: string,
    query: string
  ): Promise<Array<{ tab: TabData; score: number }>> {
    const session = await storageService.getSession(sessionId);
    if (!session) {
      return [];
    }

    // Decompress if needed
    let tabs = session.tabs;
    if (session.isCompressed && session.compressedTabs) {
      const { decompressTabs } = await import('@/utils/compression');
      tabs = decompressTabs(session.compressedTabs);
    }

    if (!query.trim()) {
      return tabs.map(tab => ({ tab, score: 1 }));
    }

    const tabIndex = new Fuse(tabs, {
      keys: [
        { name: 'title', weight: 2 },
        { name: 'url', weight: 1 },
      ],
      threshold: 0.4,
      includeScore: true,
    });

    const results = tabIndex.search(query);
    return results.map(result => ({
      tab: result.item,
      score: 1 - (result.score || 0),
    }));
  }

  /**
   * Searches for tabs across all sessions
   * @param query - Search text
   * @returns Array of results with session and tab info
   */
  async searchTabsGlobal(
    query: string
  ): Promise<Array<{ session: SessionMetadata; tab: TabData; score: number }>> {
    if (!query.trim()) {
      return [];
    }

    const sessions = await storageService.getAllSessions();
    const results: Array<{ session: SessionMetadata; tab: TabData; score: number }> = [];

    for (const session of Object.values(sessions)) {
      // Decompress if needed
      let tabs = session.tabs;
      if (session.isCompressed && session.compressedTabs) {
        const { decompressTabs } = await import('@/utils/compression');
        tabs = decompressTabs(session.compressedTabs);
      }

      const tabIndex = new Fuse(tabs, {
        keys: [
          { name: 'title', weight: 2 },
          { name: 'url', weight: 1 },
        ],
        threshold: 0.4,
        includeScore: true,
      });

      const tabResults = tabIndex.search(query);
      for (const tabResult of tabResults) {
        results.push({
          session: {
            id: session.id,
            name: session.name,
            description: session.description,
            tags: session.tags,
            folderId: session.folderId,
            tabCount: session.tabCount,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            lastAccessedAt: session.lastAccessedAt,
            isEmergency: session.isEmergency,
            version: session.version,
            faviconPreview: session.faviconPreview,
            domainPreview: session.domainPreview,
          },
          tab: tabResult.item,
          score: 1 - (tabResult.score || 0),
        });
      }
    }

    // Sort by score descending
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Gets all unique tags
   * @returns Array of unique tags
   */
  async getAllTags(): Promise<string[]> {
    const sessions = await storageService.getSessionMetadata();
    const tags = new Set<string>();
    
    for (const session of sessions) {
      for (const tag of session.tags) {
        tags.add(tag);
      }
    }

    return Array.from(tags).sort();
  }

  /**
   * Gets all unique domains
   * @returns Array of unique domains
   */
  async getAllDomains(): Promise<string[]> {
    const sessions = await storageService.getSessionMetadata();
    const domains = new Set<string>();
    
    for (const session of sessions) {
      for (const domain of session.domainPreview) {
        domains.add(domain);
      }
    }

    return Array.from(domains).sort();
  }
}

// Export singleton instance
export const searchService = new SearchService();
