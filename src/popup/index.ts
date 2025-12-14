/**
 * Tab Vault Popup
 */

import { MessageType } from '@/types';
import type { SessionMetadata, Statistics } from '@/types';
import './styles.css';

// DOM Elements
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const elements = {
  saveSessionBtn: $<HTMLButtonElement>('saveSessionBtn'),
  openManagerBtn: $<HTMLButtonElement>('openManagerBtn'),
  settingsBtn: $<HTMLButtonElement>('settingsBtn'),
  sessionsList: $<HTMLDivElement>('sessionsList'),
  sessionCount: $<HTMLSpanElement>('sessionCount'),
  emptyState: $<HTMLDivElement>('emptyState'),
  totalSessions: $<HTMLSpanElement>('totalSessions'),
  totalTabs: $<HTMLSpanElement>('totalTabs'),
  saveModal: $<HTMLDivElement>('saveModal'),
  saveForm: $<HTMLFormElement>('saveForm'),
  sessionName: $<HTMLInputElement>('sessionName'),
  sessionTags: $<HTMLInputElement>('sessionTags'),
  cancelSaveBtn: $<HTMLButtonElement>('cancelSaveBtn'),
};

let sessions: SessionMetadata[] = [];

// API
async function sendMessage<T>(type: MessageType, payload?: unknown): Promise<T> {
  const response = await chrome.runtime.sendMessage({ type, payload });
  if (!response.success) throw new Error(response.error || 'Unknown error');
  return response.data as T;
}

// Format date
function formatDate(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

// Create session card
function createCard(session: SessionMetadata): HTMLElement {
  const card = document.createElement('div');
  card.className = 'session-card';
  card.dataset.id = session.id;

  const initial = session.name.charAt(0).toUpperCase();

  card.innerHTML = `
    <div class="session-icon">${initial}</div>
    <div class="session-info">
      <div class="session-name">${escapeHtml(session.name)}</div>
      <div class="session-meta">${session.tabCount} tabs • ${formatDate(session.updatedAt)}</div>
    </div>
    <div class="session-actions">
      <button class="action-btn restore" title="Restore">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="1 4 1 10 7 10"></polyline>
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
        </svg>
      </button>
      <button class="action-btn delete" title="Delete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `;

  // Events
  card.querySelector('.restore')?.addEventListener('click', e => {
    e.stopPropagation();
    restoreSession(session.id);
  });

  card.querySelector('.delete')?.addEventListener('click', e => {
    e.stopPropagation();
    deleteSession(session.id);
  });

  card.addEventListener('click', () => restoreSession(session.id));

  return card;
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Render sessions
function render(list: SessionMetadata[]): void {
  elements.sessionsList.innerHTML = '';
  elements.sessionCount.textContent = list.length.toString();

  if (list.length === 0) {
    elements.emptyState.classList.remove('hidden');
    return;
  }

  elements.emptyState.classList.add('hidden');
  list.forEach(s => elements.sessionsList.appendChild(createCard(s)));
}

// Load data
async function loadSessions(): Promise<void> {
  try {
    sessions = await sendMessage<SessionMetadata[]>(MessageType.GET_SESSIONS);
    render(sessions);
  } catch (error) {
    console.error('Failed to load sessions:', error);
    elements.sessionsList.innerHTML = '<div class="empty-state"><p>Failed to load</p></div>';
  }
}

async function loadStats(): Promise<void> {
  try {
    const stats = await sendMessage<Statistics>(MessageType.GET_STATISTICS);
    elements.totalSessions.textContent = stats.totalSessionsSaved.toString();
    elements.totalTabs.textContent = stats.totalTabsSaved.toString();
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// Actions
async function saveSession(name: string, tags: string[]): Promise<void> {
  try {
    await sendMessage(MessageType.SAVE_SESSION, { name, tags });
    await loadSessions();
    await loadStats();
    hideModal();
  } catch (error) {
    console.error('Failed to save session:', error);
    alert('Failed to save session');
  }
}

async function restoreSession(id: string): Promise<void> {
  try {
    await sendMessage(MessageType.RESTORE_SESSION, { id });
    window.close();
  } catch (error) {
    console.error('Failed to restore session:', error);
    alert('Failed to restore session');
  }
}

async function deleteSession(id: string): Promise<void> {
  if (!confirm('Delete this session?')) return;

  try {
    await sendMessage(MessageType.DELETE_SESSION, { id });
    sessions = sessions.filter(s => s.id !== id);
    render(sessions);
  } catch (error) {
    console.error('Failed to delete session:', error);
    alert('Failed to delete session');
  }
}

// Modal
function showModal(): void {
  const date = new Date();
  const name = `Session - ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  elements.sessionName.value = name;
  elements.sessionTags.value = '';
  elements.saveModal.classList.remove('hidden');
  elements.sessionName.focus();
  elements.sessionName.select();
}

function hideModal(): void {
  elements.saveModal.classList.add('hidden');
}

// Event Listeners
function setupEvents(): void {
  // Buttons
  elements.saveSessionBtn.addEventListener('click', showModal);

  elements.openManagerBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('manager.html') });
    window.close();
  });

  elements.settingsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('manager.html?tab=settings') });
    window.close();
  });

  // Modal
  elements.cancelSaveBtn.addEventListener('click', hideModal);
  elements.saveModal.querySelector('.modal-overlay')?.addEventListener('click', hideModal);

  elements.saveForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name = elements.sessionName.value.trim();
    const tags = elements.sessionTags.value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    if (name) await saveSession(name, tags);
  });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') hideModal();
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      showModal();
    }
  });
}

// Init
async function init(): Promise<void> {
  setupEvents();
  await Promise.all([loadSessions(), loadStats()]);
}

init().catch(console.error);
