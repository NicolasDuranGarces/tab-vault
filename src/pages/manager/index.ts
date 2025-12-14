/**
 * Tab Vault Manager Page Script
 */
import { MessageType } from '@/types';
import type { SessionMetadata, Session, Settings } from '@/types';
import './manager.css';

// API Helper
async function sendMessage<T>(type: MessageType, payload?: unknown): Promise<T> {
  const response = await chrome.runtime.sendMessage({ type, payload });
  if (!response.success) throw new Error(response.error || 'Unknown error');
  return response.data as T;
}

// State
let sessions: SessionMetadata[] = [];

// Elements
const els = {
  viewTitle: document.getElementById('viewTitle')!,
  sessionsGrid: document.getElementById('sessionsGrid')!,
  emptyState: document.getElementById('emptyState')!,
  searchInput: document.getElementById('searchInput') as HTMLInputElement,
  saveBtn: document.getElementById('saveBtn')!,
  saveModal: document.getElementById('saveModal')!,
  saveForm: document.getElementById('saveForm') as HTMLFormElement,
  sessionName: document.getElementById('sessionName') as HTMLInputElement,
  sessionTags: document.getElementById('sessionTags') as HTMLInputElement,
  recoveryList: document.getElementById('recoveryList')!,
  navItems: document.querySelectorAll('.nav-item'),
  views: document.querySelectorAll('.view'),
  storageBar: document.querySelector('.storage-bar .used') as HTMLElement,
  // Settings
  autoSaveInterval: document.getElementById('autoSaveInterval') as HTMLSelectElement,
  saveScroll: document.getElementById('saveScroll') as HTMLInputElement,
  saveForm2: document.getElementById('saveForm') as HTMLInputElement,
  lazyRestore: document.getElementById('lazyRestore') as HTMLInputElement,
  theme: document.getElementById('theme') as HTMLSelectElement,
};

// Helpers
function formatDate(ts: number): string {
  const d = new Date(ts),
    now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff < 1) return 'Today';
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString();
}

function escapeHtml(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// Render
function renderSessions(list: SessionMetadata[]): void {
  if (list.length === 0) {
    els.sessionsGrid.innerHTML = '';
    els.emptyState.classList.remove('hidden');
    return;
  }
  els.emptyState.classList.add('hidden');
  els.sessionsGrid.innerHTML = list
    .map(
      s => `
    <div class="card" data-id="${s.id}">
      <div class="card-header">
        <div class="card-favicons">
          ${s.faviconPreview
            .slice(0, 4)
            .map(f => (f ? `<img src="${escapeHtml(f)}" onerror="this.style.display='none'">` : ''))
            .join('')}
        </div>
      </div>
      <div class="card-title">${escapeHtml(s.name)}</div>
      <div class="card-meta">
        <span>${s.tabCount} tabs</span>
        <span>${formatDate(s.updatedAt)}</span>
      </div>
      ${
        s.tags.length
          ? `<div class="card-tags">${s.tags
              .slice(0, 3)
              .map(t => `<span class="tag">${escapeHtml(t)}</span>`)
              .join('')}</div>`
          : ''
      }
      <div class="card-actions">
        <button class="card-btn restore">Restore</button>
        <button class="card-btn delete">Delete</button>
      </div>
    </div>
  `
    )
    .join('');
}

async function renderRecovery(): Promise<void> {
  const emergency = await sendMessage<Session[]>(MessageType.GET_EMERGENCY_SESSIONS);
  if (emergency.length === 0) {
    els.recoveryList.innerHTML = '<div class="empty"><p>No recovery sessions available</p></div>';
    return;
  }
  els.recoveryList.innerHTML = emergency
    .map(
      s => `
    <div class="list-item" data-id="${s.id}">
      <div class="list-item-info">
        <div class="list-item-title">${escapeHtml(s.name)}</div>
        <div class="list-item-meta">${s.tabCount} tabs • ${formatDate(s.createdAt)}</div>
      </div>
      <button class="btn-primary" data-action="restore-emergency">Restore</button>
    </div>
  `
    )
    .join('');
}

async function loadSettings(): Promise<void> {
  const settings = await sendMessage<Settings>(MessageType.GET_SETTINGS);
  els.autoSaveInterval.value = String(settings.autoSaveInterval);
  els.saveScroll.checked = settings.saveScrollPosition;
  els.lazyRestore.checked = settings.lazyRestore;
  els.theme.value = settings.theme;
}

async function updateStorage(): Promise<void> {
  try {
    const info = await chrome.storage.local.getBytesInUse(null);
    const pct = Math.min((info / (10 * 1024 * 1024)) * 100, 100);
    els.storageBar.style.width = `${pct}%`;
  } catch {
    /* ignore */
  }
}

// Views
function switchView(view: string): void {
  els.navItems.forEach(n => n.classList.toggle('active', (n as HTMLElement).dataset.view === view));
  els.views.forEach(v => v.classList.toggle('active', v.id === `${view}View`));
  els.viewTitle.textContent = view.charAt(0).toUpperCase() + view.slice(1);
  if (view === 'recovery') renderRecovery();
  if (view === 'settings') loadSettings();
}

// Actions
async function saveSession(name: string, tags: string[]): Promise<void> {
  await sendMessage(MessageType.SAVE_SESSION, { name, tags });
  sessions = await sendMessage<SessionMetadata[]>(MessageType.GET_SESSIONS);
  renderSessions(sessions);
  hideModal();
}

async function restoreSession(id: string): Promise<void> {
  await sendMessage(MessageType.RESTORE_SESSION, { id });
}

async function deleteSession(id: string): Promise<void> {
  if (!confirm('Delete this session?')) return;
  await sendMessage(MessageType.DELETE_SESSION, { id });
  sessions = sessions.filter(s => s.id !== id);
  renderSessions(sessions);
}

function showModal(): void {
  els.sessionName.value = `Session - ${new Date().toLocaleString()}`;
  els.sessionTags.value = '';
  els.saveModal.classList.remove('hidden');
  els.sessionName.focus();
  els.sessionName.select();
}

function hideModal(): void {
  els.saveModal.classList.add('hidden');
}

// Events
function setupEvents(): void {
  // Navigation
  els.navItems.forEach(n =>
    n.addEventListener('click', () => switchView((n as HTMLElement).dataset.view!))
  );

  // Save button
  els.saveBtn.addEventListener('click', showModal);

  // Modal
  els.saveModal.querySelector('.modal-bg')?.addEventListener('click', hideModal);
  els.saveModal.querySelector('.btn-cancel')?.addEventListener('click', hideModal);
  els.saveForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name = els.sessionName.value.trim();
    const tags = els.sessionTags.value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    if (name) await saveSession(name, tags);
  });

  // Grid clicks
  els.sessionsGrid.addEventListener('click', async e => {
    const target = e.target as HTMLElement;
    const card = target.closest('.card') as HTMLElement;
    if (!card) return;
    const id = card.dataset.id!;
    if (target.classList.contains('restore')) await restoreSession(id);
    else if (target.classList.contains('delete')) await deleteSession(id);
    else await restoreSession(id);
  });

  // Recovery clicks
  els.recoveryList.addEventListener('click', async e => {
    const target = e.target as HTMLElement;
    if (target.dataset.action === 'restore-emergency') {
      const item = target.closest('.list-item') as HTMLElement;
      // For emergency, we need to get full session and restore
      const emergency = await sendMessage<Session[]>(MessageType.GET_EMERGENCY_SESSIONS);
      const session = emergency.find(s => s.id === item?.dataset.id);
      if (session) {
        // Save as regular session first
        await sendMessage(MessageType.SAVE_SESSION, {
          name: session.name.replace('Emergency Backup', 'Recovered'),
          tags: ['recovered'],
        });
      }
    }
  });

  // Settings changes
  els.autoSaveInterval.addEventListener('change', () => {
    sendMessage(MessageType.UPDATE_SETTINGS, {
      autoSaveInterval: Number(els.autoSaveInterval.value),
    });
  });
  els.saveScroll.addEventListener('change', () => {
    sendMessage(MessageType.UPDATE_SETTINGS, { saveScrollPosition: els.saveScroll.checked });
  });
  els.lazyRestore.addEventListener('change', () => {
    sendMessage(MessageType.UPDATE_SETTINGS, { lazyRestore: els.lazyRestore.checked });
  });
  els.theme.addEventListener('change', () => {
    sendMessage(MessageType.UPDATE_SETTINGS, { theme: els.theme.value });
    document.documentElement.dataset.theme = els.theme.value;
  });

  // Search
  let searchTimeout: ReturnType<typeof setTimeout>;
  els.searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const q = els.searchInput.value.toLowerCase();
      const filtered = q
        ? sessions.filter(
            s =>
              s.name.toLowerCase().includes(q) ||
              s.tags.some(t => t.includes(q)) ||
              s.domainPreview.some(d => d.includes(q))
          )
        : sessions;
      renderSessions(filtered);
    }, 200);
  });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') hideModal();
  });
}

// Init
async function init(): Promise<void> {
  setupEvents();

  // Check URL params
  const params = new URLSearchParams(window.location.search);
  if (params.get('recovery')) switchView('recovery');
  if (params.get('tab')) switchView(params.get('tab')!);

  // Load data
  sessions = await sendMessage<SessionMetadata[]>(MessageType.GET_SESSIONS);
  renderSessions(sessions);
  await updateStorage();
}

init().catch(console.error);
