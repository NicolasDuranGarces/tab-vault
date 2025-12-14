/**
 * Tab Service
 * Handles capturing tabs from the browser
 */

import type { TabData, Settings } from '@/types';
import { generateId } from '@/utils/helpers';
import { isValidUrl, sanitizeUrl, shouldExcludeUrl } from '@/utils/validation';

/**
 * Tab capture service
 */
class TabService {
  /**
   * Captures all tabs from the current window
   * @param settings - Settings for what to capture
   * @returns Promise with array of tab data
   */
  async captureCurrentWindowTabs(settings: Settings): Promise<TabData[]> {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    return this.processTabsForCapture(tabs, settings);
  }

  /**
   * Captures all tabs from all windows
   * @param settings - Settings for what to capture
   * @returns Promise with array of tab data
   */
  async captureAllTabs(settings: Settings): Promise<TabData[]> {
    const tabs = await chrome.tabs.query({});
    return this.processTabsForCapture(tabs, settings);
  }

  /**
   * Processes raw Chrome tabs into TabData
   * @param tabs - Chrome tabs
   * @param settings - Settings for filtering
   * @returns Array of processed tab data
   */
  private async processTabsForCapture(
    tabs: chrome.tabs.Tab[],
    settings: Settings
  ): Promise<TabData[]> {
    const processedTabs: TabData[] = [];

    for (const tab of tabs) {
      // Skip invalid URLs
      if (!tab.url || !isValidUrl(tab.url)) {
        continue;
      }

      // Skip excluded domains
      if (shouldExcludeUrl(tab.url, settings.excludedDomains)) {
        continue;
      }

      const sanitizedUrl = sanitizeUrl(tab.url);
      if (!sanitizedUrl) {
        continue;
      }

      const tabData: TabData = {
        id: generateId(),
        url: sanitizedUrl,
        title: tab.title || 'Untitled',
        favicon: tab.favIconUrl || '',
        pinned: tab.pinned ?? false,
        groupId: tab.groupId ?? -1,
        index: tab.index,
        active: tab.active ?? false,
        muted: tab.mutedInfo?.muted ?? false,
      };

      // Get group info if applicable
      if (settings.saveTabGroups && tabData.groupId !== -1) {
        try {
          const group = await chrome.tabGroups.get(tabData.groupId);
          tabData.groupColor = group.color;
          tabData.groupName = group.title || undefined;
        } catch {
          // Group might not exist anymore
        }
      }

      // Get scroll position and form data via content script
      if (tab.id && (settings.saveScrollPosition || settings.saveFormData)) {
        try {
          const response = await this.getTabContentData(tab.id, settings);
          if (settings.saveScrollPosition && response?.scrollPosition) {
            tabData.scrollPosition = response.scrollPosition;
          }
          if (settings.saveFormData && response?.formData) {
            tabData.formData = response.formData;
          }
        } catch {
          // Content script might not be available on some pages
        }
      }

      processedTabs.push(tabData);
    }

    return processedTabs;
  }

  /**
   * Gets scroll position and form data from a tab via content script
   * @param tabId - Tab ID
   * @param settings - Settings for what to get
   * @returns Promise with content data
   */
  private async getTabContentData(
    tabId: number,
    settings: Settings
  ): Promise<{
    scrollPosition?: { x: number; y: number };
    formData?: Record<string, string>;
  } | null> {
    try {
      const results = await chrome.tabs.sendMessage(tabId, {
        type: 'GET_CONTENT_DATA',
        payload: {
          getScroll: settings.saveScrollPosition,
          getFormData: settings.saveFormData,
        },
      });
      return results as {
        scrollPosition?: { x: number; y: number };
        formData?: Record<string, string>;
      };
    } catch {
      return null;
    }
  }

  /**
   * Restores tabs from saved data
   * @param tabs - Tabs to restore
   * @param options - Restore options
   * @returns Promise with created tab IDs
   */
  async restoreTabs(
    tabs: TabData[],
    options: {
      lazy: boolean;
      newWindow: boolean;
      restorePinned: boolean;
      restoreGroups: boolean;
    }
  ): Promise<number[]> {
    const createdTabIds: number[] = [];
    const groupMapping = new Map<number, number>(); // old groupId -> new groupId

    // Create window if needed
    let windowId: number | undefined;
    if (options.newWindow) {
      const window = await chrome.windows.create({});
      windowId = window.id;

      // Remove the default new tab
      if (window.tabs?.[0]?.id) {
        await chrome.tabs.remove(window.tabs[0].id);
      }
    }

    // Sort tabs by index to maintain order
    const sortedTabs = [...tabs].sort((a, b) => a.index - b.index);

    for (const tabData of sortedTabs) {
      try {
        // Create tab
        const createOptions: chrome.tabs.CreateProperties = {
          url: options.lazy ? undefined : tabData.url,
          pinned: options.restorePinned ? tabData.pinned : false,
          active: false,
          windowId,
        };

        // For lazy loading, we use a placeholder that loads on activate
        if (options.lazy) {
          createOptions.url = `chrome://newtab/`;
        }

        const createdTab = await chrome.tabs.create(createOptions);

        if (createdTab.id) {
          createdTabIds.push(createdTab.id);

          // For lazy loading, set the pending URL
          if (options.lazy && createdTab.id) {
            // Store pending URL for lazy load
            await this.setPendingLazyUrl(createdTab.id, tabData.url);
          }

          // Handle group restoration
          if (options.restoreGroups && tabData.groupId !== -1 && tabData.groupId !== undefined) {
            const oldGroupId = tabData.groupId;

            if (!groupMapping.has(oldGroupId)) {
              // Create new group
              const newGroupId = await chrome.tabs.group({
                tabIds: [createdTab.id],
                createProperties: windowId ? { windowId } : undefined,
              });

              // Set group properties
              if (tabData.groupColor || tabData.groupName) {
                await chrome.tabGroups.update(newGroupId, {
                  color: tabData.groupColor as chrome.tabGroups.ColorEnum,
                  title: tabData.groupName,
                });
              }

              groupMapping.set(oldGroupId, newGroupId);
            } else {
              // Add to existing group
              const existingGroupId = groupMapping.get(oldGroupId);
              if (existingGroupId !== undefined) {
                await chrome.tabs.group({
                  tabIds: [createdTab.id],
                  groupId: existingGroupId,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to restore tab:', tabData.url, error);
      }
    }

    return createdTabIds;
  }

  /**
   * Stores a pending URL for lazy loading
   * @param tabId - Tab ID
   * @param url - URL to load when tab is activated
   */
  private async setPendingLazyUrl(tabId: number, url: string): Promise<void> {
    await chrome.storage.session.set({ [`lazy_${tabId}`]: url });
  }

  /**
   * Gets and clears a pending lazy URL
   * @param tabId - Tab ID
   * @returns URL if pending, null otherwise
   */
  async getPendingLazyUrl(tabId: number): Promise<string | null> {
    const key = `lazy_${tabId}`;
    const result = await chrome.storage.session.get(key);
    if (result[key]) {
      await chrome.storage.session.remove(key);
      return result[key] as string;
    }
    return null;
  }

  /**
   * Detects duplicate tabs in a list
   * @param tabs - Tabs to check
   * @returns Array of duplicate URL sets
   */
  detectDuplicates(tabs: TabData[]): Map<string, TabData[]> {
    const urlMap = new Map<string, TabData[]>();

    for (const tab of tabs) {
      const existing = urlMap.get(tab.url);
      if (existing) {
        existing.push(tab);
      } else {
        urlMap.set(tab.url, [tab]);
      }
    }

    // Return only duplicates
    const duplicates = new Map<string, TabData[]>();
    for (const [url, tabList] of urlMap) {
      if (tabList.length > 1) {
        duplicates.set(url, tabList);
      }
    }

    return duplicates;
  }

  /**
   * Restores scroll position for a tab
   * @param tabId - Tab ID
   * @param position - Scroll position
   */
  async restoreScrollPosition(tabId: number, position: { x: number; y: number }): Promise<void> {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'RESTORE_SCROLL',
        payload: position,
      });
    } catch {
      // Content script might not be ready
    }
  }

  /**
   * Restores form data for a tab
   * @param tabId - Tab ID
   * @param formData - Form data to restore
   */
  async restoreFormData(tabId: number, formData: Record<string, string>): Promise<void> {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'RESTORE_FORM_DATA',
        payload: formData,
      });
    } catch {
      // Content script might not be ready
    }
  }
}

// Export singleton instance
export const tabService = new TabService();
