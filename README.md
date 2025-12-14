<p align="center">
  <img src="docs/assets/logo.svg" alt="Tab Vault Logo" width="128" height="128">
</p>

<h1 align="center">Tab Vault</h1>

<p align="center">
  <strong>Powerful session management for Chrome</strong><br>
  Save, organize, and restore your browser sessions with ease
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#keyboard-shortcuts">Shortcuts</a> •
  <a href="#development">Development</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/manifest-v3-blue?style=flat-square" alt="Manifest V3">
  <img src="https://img.shields.io/badge/typescript-5.3-blue?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/chrome-extension-yellow?style=flat-square&logo=googlechrome&logoColor=white" alt="Chrome Extension">
</p>

---

## 🚀 Overview

**Tab Vault** is a modern Chrome extension designed to revolutionize how you manage browser sessions. Whether you're a researcher juggling multiple projects, a developer with complex debugging setups, or anyone who values an organized browsing experience, Tab Vault has you covered.

Built with **Manifest V3** for enhanced security and performance, Tab Vault provides a seamless experience for saving, organizing, and restoring your valuable browser sessions.

---

## ✨ Features

### 📁 Session Management
- **One-Click Save** — Instantly save all tabs in your current window
- **Smart Naming** — Auto-generated session names with timestamps
- **Session Categories** — Organize sessions by project, topic, or custom tags
- **Bulk Operations** — Manage multiple sessions at once

### 🔄 Session Restoration
- **Full Restoration** — Restore all tabs from a saved session
- **Selective Restore** — Choose specific tabs to restore
- **New Window Options** — Open sessions in new or existing windows
- **Tab Group Support** — Preserve and restore Chrome tab groups

### 🔍 Search & Filter
- **Instant Search** — Find sessions and tabs quickly with fuzzy search
- **Advanced Filters** — Filter by date, tags, or session type
- **Tab Preview** — See all tabs in a session before restoring

### 💾 Backup & Sync
- **Auto-Save** — Automatic session backups at regular intervals
- **Export/Import** — Backup your sessions as JSON files
- **Data Compression** — Efficient storage using LZ-String compression

### 🛡️ Crash Recovery
- **Auto-Recovery** — Automatically saves sessions for crash recovery
- **Session History** — Access previously saved session states
- **Scroll Position Memory** — Remember scroll positions for each tab

### ⚡ Performance
- **Lightweight** — Minimal memory footprint
- **Fast Loading** — Optimized for quick popup and manager page loads
- **Efficient Storage** — Smart data compression and cleanup

---

## 📥 Installation

### From Chrome Web Store
> Coming soon...

### Manual Installation (Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/NicolasDuranGarces/tab-vault.git
   cd tab-vault
   ```

2. **Install dependencies**
   ```bash
   make install
   # or
   npm install
   ```

3. **Build the extension**
   ```bash
   make build
   # or
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top right)
   - Click **Load unpacked**
   - Select the `dist` folder from the project directory

---

## 🎯 Usage

### Quick Save
1. Click the Tab Vault icon in your Chrome toolbar
2. Click **Save Current Session**
3. (Optional) Add a custom name and tags
4. Your session is saved!

### Restore a Session
1. Open the Tab Vault popup or manager page
2. Browse or search for your desired session
3. Click **Restore** to open all tabs
4. Choose to open in a new window or current window

### Manage Sessions
- Access the full **Session Manager** for advanced operations
- Edit session names and tags
- Delete outdated sessions
- Export sessions for backup

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Shift + S` | Save current session |
| `Ctrl/Cmd + Shift + R` | Restore last session |
| `Ctrl/Cmd + Shift + V` | Open Tab Vault popup |

> **Tip:** You can customize these shortcuts in Chrome's extension settings at `chrome://extensions/shortcuts`

---

## 🛠️ Development

### Prerequisites
- Node.js 18+ 
- npm 9+
- Make (optional, for Makefile commands)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/NicolasDuranGarces/tab-vault.git
cd tab-vault

# Install dependencies
make install

# Start development mode (with hot reload)
make dev
```

### Available Commands

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies |
| `make dev` | Start development mode with watch |
| `make build` | Build for production |
| `make lint` | Run ESLint |
| `make lint-fix` | Run ESLint with auto-fix |
| `make type-check` | Run TypeScript type checking |
| `make test` | Run tests |
| `make test-coverage` | Run tests with coverage report |
| `make clean` | Clean build artifacts |
| `make package` | Create distributable zip file |
| `make help` | Show all available commands |

### Project Structure

```
tab-vault/
├── src/
│   ├── background/      # Service worker (background script)
│   ├── content/         # Content scripts
│   ├── popup/           # Extension popup UI
│   ├── pages/           # Full-page manager UI
│   ├── services/        # Core business logic
│   │   ├── session.service.ts
│   │   ├── storage.service.ts
│   │   ├── tab.service.ts
│   │   ├── search.service.ts
│   │   ├── backup.service.ts
│   │   └── compression.service.ts
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   └── manifest.json    # Extension manifest
├── dist/                # Built extension (generated)
├── Makefile             # Build automation
├── webpack.config.js    # Webpack configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project dependencies
```

### Tech Stack

- **TypeScript** — Type-safe development
- **Webpack** — Module bundling and build optimization
- **ESLint + Prettier** — Code quality and formatting
- **Jest** — Unit testing framework
- **Fuse.js** — Fuzzy search functionality
- **LZ-String** — Data compression

---

## 🔒 Privacy & Permissions

Tab Vault requests the following permissions:

| Permission | Purpose |
|------------|---------|
| `tabs` | Access tab URLs and titles for saving sessions |
| `storage` | Store your saved sessions locally |
| `alarms` | Schedule automatic backups |
| `scripting` | Capture scroll positions for restoration |

**Your data stays local.** Tab Vault does not send any data to external servers. All sessions are stored in your browser's local storage.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ using [TypeScript](https://www.typescriptlang.org/)
- Icons from [Lucide Icons](https://lucide.dev/)
- Search powered by [Fuse.js](https://fusejs.io/)

---

<p align="center">
  <strong>Made with ❤️ by <a href="https://github.com/NicolasDuranGarces">Nicolas Duran Garces</a></strong>
</p>

<p align="center">
  <sub>If you find Tab Vault useful, please consider giving it a ⭐ on GitHub!</sub>
</p>
