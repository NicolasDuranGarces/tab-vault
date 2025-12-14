/**
 * Background Service Worker
 * Main entry point for the extension's background script
 */

import { MessageType } from '@/types';
import type { Message, Response, RestoreOptions } from '@/types';
import { sessionService } from '@/services/session.service';
import { storageService } from '@/services/storage.service';
import { crashRecoveryService } from '@/services/crash.service';
import { searchService } from '@/services/search.service';
import { backupService } from '@/services/backup.service';
import { tabService } from '@/services/tab.service';

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the extension on install
 */
chrome.runtime.onInstalled.addListener(async details => {
  if (details.reason === 'install') {
    // First time install - show welcome page
    await chrome.tabs.create({
      url: chrome.runtime.getURL('manager.html?welcome=true'),
    });
  }

  // Initialize crash recovery
  await crashRecoveryService.initialize();
});

/**
 * Initialize on startup
 */
chrome.runtime.onStartup.addListener(async () => {
  await crashRecoveryService.initialize();

  // Check if a crash was detected
  const wasCrash = await crashRecoveryService.wasCrashDetected();
  if (wasCrash) {
    const settings = await storageService.getSettings();
    if (settings.showNotifications) {
      // Show notification about recovery
      await chrome.notifications.create('crash-recovery', {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: 'Tab Vault - Session Recovery',
        message: 'Your previous session was saved. Click to restore.',
        priority: 2,
      });
    }
  }
});

// ============================================================================
// ALARM HANDLERS
// ============================================================================

chrome.alarms.onAlarm.addListener(async alarm => {
  await crashRecoveryService.handleAlarm(alarm);
});

// ============================================================================
// NOTIFICATION HANDLERS
// ============================================================================

chrome.notifications.onClicked.addListener(async notificationId => {
  if (notificationId === 'crash-recovery') {
    await chrome.tabs.create({
      url: chrome.runtime.getURL('manager.html?recovery=true'),
    });
    await chrome.notifications.clear(notificationId);
    await crashRecoveryService.clearCrashDetection();
  }
});

// ============================================================================
// COMMAND HANDLERS
// ============================================================================

chrome.commands.onCommand.addListener(async command => {
  try {
    switch (command) {
      case 'save-session': {
        const timestamp = new Date().toLocaleString();
        await sessionService.createSession(`Quick Save - ${timestamp}`);

        const settings = await storageService.getSettings();
        if (settings.showNotifications) {
          await chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon128.png'),
            title: 'Tab Vault',
            message: 'Session saved successfully!',
          });
        }
        break;
      }

      case 'restore-last': {
        const sessions = await storageService.getSessionMetadata();
        if (sessions.length > 0 && sessions[0]) {
          await sessionService.restoreSession(sessions[0].id);
        }
        break;
      }
    }
  } catch (error) {
    console.error('Command error:', error);
  }
});

// ============================================================================
// TAB ACTIVATION HANDLER (for lazy loading)
// ============================================================================

chrome.tabs.onActivated.addListener(async activeInfo => {
  const pendingUrl = await tabService.getPendingLazyUrl(activeInfo.tabId);
  if (pendingUrl) {
    await chrome.tabs.update(activeInfo.tabId, { url: pendingUrl });
  }
});

// ============================================================================
// TAB LOAD COMPLETE HANDLER (for scroll/form restore)
// ============================================================================

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  // Only trigger when page finishes loading
  if (changeInfo.status === 'complete') {
    await tabService.restorePendingData(tabId);
  }
});

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch(error => {
      sendResponse({ success: false, error: error.message });
    });

  // Return true to indicate async response
  return true;
});

/**
 * Handles messages from popup/content scripts
 */
async function handleMessage(message: Message): Promise<Response> {
  try {
    switch (message.type) {
      // ========== SESSION OPERATIONS ==========
      case MessageType.SAVE_SESSION: {
        const payload = message.payload as {
          name: string;
          description?: string;
          tags?: string[];
          folderId?: string;
        };
        const session = await sessionService.createSession(payload.name, payload);
        searchService.invalidateCache();
        return { success: true, data: session };
      }

      case MessageType.GET_SESSIONS: {
        const sessions = await sessionService.getAllSessionMetadata();
        return { success: true, data: sessions };
      }

      case MessageType.GET_SESSION: {
        const payload = message.payload as { id: string };
        const session = await sessionService.getSession(payload.id);
        return { success: true, data: session };
      }

      case MessageType.RESTORE_SESSION: {
        const payload = message.payload as { id: string; options?: Partial<RestoreOptions> };
        const tabIds = await sessionService.restoreSession(payload.id, payload.options);
        return { success: true, data: tabIds };
      }

      case MessageType.DELETE_SESSION: {
        const payload = message.payload as { id: string };
        await sessionService.deleteSession(payload.id);
        searchService.invalidateCache();
        return { success: true };
      }

      case MessageType.UPDATE_SESSION: {
        const payload = message.payload as { id: string; updates: Record<string, unknown> };
        const session = await sessionService.updateSession(payload.id, payload.updates);
        searchService.invalidateCache();
        return { success: true, data: session };
      }

      case MessageType.DUPLICATE_SESSION: {
        const payload = message.payload as { id: string; newName?: string };
        const session = await sessionService.duplicateSession(payload.id, payload.newName);
        searchService.invalidateCache();
        return { success: true, data: session };
      }

      case MessageType.MERGE_SESSIONS: {
        const payload = message.payload as { ids: string[]; newName: string };
        const session = await sessionService.mergeSessions(payload.ids, payload.newName);
        searchService.invalidateCache();
        return { success: true, data: session };
      }

      case MessageType.SPLIT_SESSION: {
        const payload = message.payload as { id: string };
        const sessions = await sessionService.splitSession(payload.id);
        searchService.invalidateCache();
        return { success: true, data: sessions };
      }

      // ========== FOLDER OPERATIONS ==========
      case MessageType.GET_FOLDERS: {
        const folders = await storageService.getFolders();
        return { success: true, data: folders };
      }

      case MessageType.CREATE_FOLDER: {
        const payload = message.payload as { name: string; color?: string; parentId?: string };
        const folders = await storageService.getFolders();
        const newFolder = {
          id: crypto.randomUUID(),
          name: payload.name,
          color: payload.color,
          parentId: payload.parentId,
          order: folders.length,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        folders.push(newFolder);
        await storageService.saveFolders(folders);
        return { success: true, data: newFolder };
      }

      case MessageType.UPDATE_FOLDER: {
        const payload = message.payload as { id: string; updates: Record<string, unknown> };
        const folders = await storageService.getFolders();
        const index = folders.findIndex(f => f.id === payload.id);
        if (index >= 0 && folders[index]) {
          folders[index] = { ...folders[index], ...payload.updates, updatedAt: Date.now() };
          await storageService.saveFolders(folders);
          return { success: true, data: folders[index] };
        }
        return { success: false, error: 'Folder not found' };
      }

      case MessageType.DELETE_FOLDER: {
        const payload = message.payload as { id: string };
        let folders = await storageService.getFolders();
        folders = folders.filter(f => f.id !== payload.id && f.parentId !== payload.id);
        await storageService.saveFolders(folders);
        return { success: true };
      }

      // ========== SETTINGS ==========
      case MessageType.GET_SETTINGS: {
        const settings = await storageService.getSettings();
        return { success: true, data: settings };
      }

      case MessageType.UPDATE_SETTINGS: {
        const payload = message.payload as Record<string, unknown>;
        await storageService.saveSettings(payload);

        // Update crash recovery alarm if interval changed
        if ('autoSaveInterval' in payload) {
          await crashRecoveryService.startEmergencyBackupAlarm(payload.autoSaveInterval as number);
        }

        return { success: true };
      }

      // ========== BACKUP ==========
      case MessageType.EXPORT_SESSIONS: {
        const payload = message.payload as { sessionIds?: string[]; includeSettings?: boolean };
        let blob: Blob;

        if (payload.sessionIds && payload.sessionIds.length > 0) {
          blob = await backupService.exportSessionsToJSON(payload.sessionIds);
        } else {
          blob = await backupService.exportToJSON(payload.includeSettings);
        }

        // Convert blob to base64 for transfer
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        return { success: true, data: base64 };
      }

      // ========== CRASH RECOVERY ==========
      case MessageType.CHECK_CRASH: {
        const wasCrash = await crashRecoveryService.wasCrashDetected();
        return { success: true, data: wasCrash };
      }

      case MessageType.GET_EMERGENCY_SESSIONS: {
        const sessions = await crashRecoveryService.getEmergencySessions();
        return { success: true, data: sessions };
      }

      case MessageType.CLEAR_EMERGENCY_SESSIONS: {
        await crashRecoveryService.clearEmergencySessions();
        await crashRecoveryService.clearCrashDetection();
        return { success: true };
      }

      // ========== STATISTICS ==========
      case MessageType.GET_STATISTICS: {
        const stats = await storageService.getStatistics();
        return { success: true, data: stats };
      }

      default:
        return { success: false, error: 'Unknown message type' };
    }
  } catch (error) {
    console.error('Message handler error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// CONTEXT MENU
// ============================================================================

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-session',
    title: 'Save current tabs as session',
    contexts: ['action'],
  });

  chrome.contextMenus.create({
    id: 'open-manager',
    title: 'Open session manager',
    contexts: ['action'],
  });
});

chrome.contextMenus.onClicked.addListener(async info => {
  switch (info.menuItemId) {
    case 'save-session': {
      const timestamp = new Date().toLocaleString();
      await sessionService.createSession(`Session - ${timestamp}`);
      break;
    }
    case 'open-manager':
      await chrome.tabs.create({
        url: chrome.runtime.getURL('manager.html'),
      });
      break;
  }
});

// Log that background script is loaded
console.info('Tab Vault background service worker loaded');
