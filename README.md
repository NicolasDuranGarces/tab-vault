<div align="center">

  <img src="docs/assets/logo.svg" alt="Tab Vault" width="120" height="120" />

  # Tab Vault

  **Enterprise-grade session management for Chrome**

  Save, organize, and restore browser sessions with military-grade precision.

  [![Chrome Extension](https://img.shields.io/badge/Platform-Chrome-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chrome.google.com)
  [![Manifest V3](https://img.shields.io/badge/Manifest-V3-00C853?style=for-the-badge)](https://developer.chrome.com/docs/extensions/mv3/intro/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

  [Features](#-features) •
  [Installation](#-installation) •
  [Usage](#-usage) •
  [Development](#-development) •
  [Documentation](#-documentation)

</div>

---

> 🇪🇸 **[Leer en Español](README.es.md)** disponible aquí.

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Development](#-development)
- [Architecture](#-architecture)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**Tab Vault** is a next-generation Chrome extension engineered for professionals who demand excellence in browser session management. Built from the ground up with **Manifest V3** architecture, it delivers unparalleled performance, security, and reliability.

### Why Tab Vault?

| Challenge | Solution |
|-----------|----------|
| Lost tabs after crash | **Automatic crash recovery** with intelligent auto-save |
| Disorganized workflows | **Smart categorization** with tags and custom naming |
| Slow session restoration | **Optimized loading** with lazy tab initialization |
| Storage limitations | **LZ-String compression** for efficient data storage |
| Complex search | **Fuzzy search** powered by Fuse.js |

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 📁 Session Management
- One-click session capture
- Auto-generated smart names
- Custom tags & categories
- Bulk operations support
- Session pinning & favorites

</td>
<td width="50%">

### 🔄 Restoration Engine
- Full session restoration
- Selective tab recovery
- New window/existing window options
- Chrome Tab Groups preservation
- Scroll position memory

</td>
</tr>
<tr>
<td width="50%">

### 🔍 Search & Discovery
- Instant fuzzy search
- Advanced filtering (date, tags, type)
- Tab preview before restore
- Session history timeline
- Quick access shortcuts

</td>
<td width="50%">

### 💾 Data Management
- Automatic interval backups
- JSON export/import
- LZ-String compression
- Chrome sync integration
- Storage optimization

</td>
</tr>
<tr>
<td width="50%">

### 🛡️ Crash Recovery
- Real-time session tracking
- Automatic state persistence
- Recovery checkpoint system
- Graceful degradation
- Data integrity validation

</td>
<td width="50%">

### ⚡ Performance
- Minimal memory footprint
- Lazy loading architecture
- Background service worker
- Debounced operations
- Efficient DOM updates

</td>
</tr>
</table>

---

## 📥 Installation

### Chrome Web Store

> 🚧 **Coming Soon** — Currently in development

### Manual Installation

```bash
# Clone repository
git clone https://github.com/NicolasDuranGarces/tab-vault.git

# Navigate to project
cd tab-vault

# Install dependencies
make install

# Build extension
make build
```

**Load in Chrome:**

1. Navigate to `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `dist` directory

---

## � Usage

### Quick Save Session

```
Click Tab Vault icon → Save Current Session → Done ✓
```

### Restore Session

```
Open Tab Vault → Find session → Click Restore → Choose window option
```

### Session Manager

Access the full-featured manager for advanced operations:
- Edit session metadata
- Batch delete operations
- Export/import sessions
- Configure auto-save settings

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Platform |
|----------|--------|----------|
| `Ctrl + Shift + S` | Save current session | Windows/Linux |
| `Cmd + Shift + S` | Save current session | macOS |
| `Ctrl + Shift + R` | Restore last session | Windows/Linux |
| `Cmd + Shift + R` | Restore last session | macOS |
| `Ctrl + Shift + V` | Open Tab Vault | Windows/Linux |
| `Cmd + Shift + V` | Open Tab Vault | macOS |

> **Pro Tip:** Customize shortcuts at `chrome://extensions/shortcuts`

---

## 🛠️ Development

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18.0+ |
| npm | 9.0+ |
| Make | 3.0+ (optional) |

### Quick Start

```bash
# Install dependencies
make install

# Start development server with hot reload
make dev

# Run linting
make lint

# Run tests
make test
```

### Available Commands

```bash
make install        # Install dependencies
make dev            # Development mode (watch)
make build          # Production build
make lint           # Run ESLint
make lint-fix       # Auto-fix lint issues
make type-check     # TypeScript validation
make test           # Run test suite
make test-coverage  # Generate coverage report
make package        # Create distributable ZIP
make clean          # Remove build artifacts
make help           # Show all commands
```

---

## 🏗️ Architecture

```
tab-vault/
├── src/
│   ├── background/          # Service worker
│   ├── content/             # Content scripts
│   ├── popup/               # Extension popup UI
│   ├── pages/               # Full-page manager
│   ├── services/            # Business logic layer
│   │   ├── session.service.ts
│   │   ├── storage.service.ts
│   │   ├── tab.service.ts
│   │   ├── search.service.ts
│   │   ├── backup.service.ts
│   │   └── compression.service.ts
│   ├── utils/               # Utility functions
│   ├── types/               # TypeScript definitions
│   └── manifest.json        # Extension manifest
├── dist/                    # Build output
├── docs/                    # Documentation
├── Makefile                 # Build automation
├── webpack.config.js        # Bundler config
└── tsconfig.json            # TypeScript config
```

### Tech Stack

| Technology | Purpose |
|------------|---------|
| TypeScript 5.3 | Type-safe development |
| Webpack 5 | Module bundling |
| ESLint + Prettier | Code quality |
| Jest | Unit testing |
| Fuse.js | Fuzzy search |
| LZ-String | Data compression |

---

## � API Reference

### SessionService

```typescript
// Save current window session
SessionService.saveSession(name?: string, tags?: string[]): Promise<Session>

// Restore session by ID
SessionService.restoreSession(sessionId: string, options?: RestoreOptions): Promise<void>

// Get all sessions
SessionService.getSessions(): Promise<Session[]>

// Delete session
SessionService.deleteSession(sessionId: string): Promise<void>
```

### StorageService

```typescript
// Get stored data
StorageService.get<T>(key: string): Promise<T | null>

// Set data with optional compression
StorageService.set<T>(key: string, value: T, compress?: boolean): Promise<void>

// Clear all extension data
StorageService.clear(): Promise<void>
```

---

## 🔒 Privacy & Security

| Permission | Purpose |
|------------|---------|
| `tabs` | Access tab URLs and titles |
| `storage` | Local session storage |
| `alarms` | Scheduled auto-backups |
| `scripting` | Scroll position capture |

> **🔐 Your data never leaves your browser.** Tab Vault operates entirely locally with zero external data transmission.

---

## 🤝 Contributing

We welcome contributions from the community.

```bash
# Fork the repository
# Create feature branch
git checkout -b feature/amazing-feature

# Commit changes
git commit -m 'feat: add amazing feature'

# Push to branch
git push origin feature/amazing-feature

# Open Pull Request
```

### Guidelines

- Follow existing code conventions
- Write meaningful commit messages ([Conventional Commits](https://www.conventionalcommits.org/))
- Add tests for new features
- Update documentation accordingly

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

  **Built with precision by [Nicolas Duran Garces](https://github.com/NicolasDuranGarces)**

  ⭐ Star this repository if Tab Vault improves your workflow

  <sub>© 2024 Tab Vault. All rights reserved.</sub>

</div>
