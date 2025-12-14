/**
 * Crash Recovery Service
 * Handles emergency backups and crash detection
 */

import { storageService } from './storage.service';
import { sessionService } from './session.service';
import type { Session } from '@/types';

const CRASH_FLAG_KEY = 'crash_detection_flag';
const LAST_BACKUP_KEY = 'last_emergency_backup';

/**
 * Crash recovery service
 */
class CrashRecoveryService {
  private alarmName = 'emergency-backup';

  /**
   * Initializes crash recovery system
   * Should be called when the service worker starts
   */
  async initialize(): Promise<void> {
    const settings = await storageService.getSettings();
    
    if (!settings.crashRecoveryEnabled) {
      return;
    }

    // Check if this is a recovery situation
    const wasCleanShutdown = await this.wasCleanShutdown();
    
    if (!wasCleanShutdown) {
      // Mark that we detected a potential crash
      await this.markPotentialCrash();
    }

    // Set the flag for next time
    await this.setRunningFlag();

    // Set up periodic emergency backups
    await this.startEmergencyBackupAlarm(settings.autoSaveInterval);
  }

  /**
   * Checks if the last shutdown was clean
   * @returns Whether the last shutdown was clean
   */
  private async wasCleanShutdown(): Promise<boolean> {
    try {
      const result = await chrome.storage.session.get(CRASH_FLAG_KEY);
      // If the flag exists and is true, it was NOT a clean shutdown
      return result[CRASH_FLAG_KEY] !== true;
    } catch {
      // If session storage doesn't exist, assume clean start
      return true;
    }
  }

  /**
   * Sets the running flag (indicates extension is active)
   */
  private async setRunningFlag(): Promise<void> {
    await chrome.storage.session.set({ [CRASH_FLAG_KEY]: true });
  }

  /**
   * Clears the running flag (called on clean shutdown)
   */
  async clearRunningFlag(): Promise<void> {
    await chrome.storage.session.remove(CRASH_FLAG_KEY);
  }

  /**
   * Marks that a potential crash was detected
   */
  private async markPotentialCrash(): Promise<void> {
    await chrome.storage.local.set({ 
      potential_crash_detected: true,
      crash_detected_at: Date.now()
    });
  }

  /**
   * Checks if a crash was recently detected
   * @returns Whether a crash was detected
   */
  async wasCrashDetected(): Promise<boolean> {
    const result = await chrome.storage.local.get('potential_crash_detected');
    return result.potential_crash_detected === true;
  }

  /**
   * Clears the crash detection flag
   */
  async clearCrashDetection(): Promise<void> {
    await chrome.storage.local.remove(['potential_crash_detected', 'crash_detected_at']);
  }

  /**
   * Starts the emergency backup alarm
   * @param intervalMinutes - Interval in minutes (0 to disable)
   */
  async startEmergencyBackupAlarm(intervalMinutes: number): Promise<void> {
    // Clear existing alarm
    await chrome.alarms.clear(this.alarmName);

    if (intervalMinutes <= 0) {
      return;
    }

    // Create new alarm
    await chrome.alarms.create(this.alarmName, {
      periodInMinutes: intervalMinutes,
      delayInMinutes: 1, // First backup after 1 minute
    });
  }

  /**
   * Stops the emergency backup alarm
   */
  async stopEmergencyBackupAlarm(): Promise<void> {
    await chrome.alarms.clear(this.alarmName);
  }

  /**
   * Performs an emergency backup
   * @returns The created emergency session
   */
  async performEmergencyBackup(): Promise<Session | null> {
    try {
      const session = await sessionService.createEmergencySession();
      
      await chrome.storage.local.set({
        [LAST_BACKUP_KEY]: Date.now()
      });

      return session;
    } catch (error) {
      console.error('Emergency backup failed:', error);
      return null;
    }
  }

  /**
   * Gets the last emergency backup timestamp
   * @returns Timestamp or null
   */
  async getLastBackupTime(): Promise<number | null> {
    const result = await chrome.storage.local.get(LAST_BACKUP_KEY);
    return result[LAST_BACKUP_KEY] as number | null;
  }

  /**
   * Gets all emergency sessions
   * @returns Array of emergency sessions
   */
  async getEmergencySessions(): Promise<Session[]> {
    return storageService.getEmergencySessions();
  }

  /**
   * Clears all emergency sessions
   */
  async clearEmergencySessions(): Promise<void> {
    await storageService.clearEmergencySessions();
  }

  /**
   * Handles the alarm event
   * @param alarm - Chrome alarm
   */
  async handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
    if (alarm.name === this.alarmName) {
      await this.performEmergencyBackup();
    }
  }

  /**
   * Performs cleanup before browser/extension shutdown
   * Should be called in the beforeunload handler if possible
   */
  async performCleanShutdown(): Promise<void> {
    // Perform one last backup
    await this.performEmergencyBackup();
    
    // Clear the running flag
    await this.clearRunningFlag();
  }
}

// Export singleton instance
export const crashRecoveryService = new CrashRecoveryService();
