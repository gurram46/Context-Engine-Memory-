# Context Engine - Browser Extension

A universal memory layer for AI tools that captures conversations and maintains context across platforms.

## 🚀 Day 1 Complete - Extension Setup

### ✅ What's Been Built

1. **React + TypeScript + Vite** - Modern development environment
2. **Manifest V3 Extension** - Chrome extension with proper permissions
3. **Platform Support** - Content scripts for ChatGPT and Claude
4. **Popup UI** - "Hello World" interface with Tailwind CSS
5. **Build System** - Automated build and packaging scripts

### 🏗️ Project Structure

```
context-engine-extension/
├── dist/                     # Built extension (load this in Chrome)
│   ├── manifest.json         # Extension manifest
│   ├── popup.html           # Extension popup
│   ├── popup.js/css         # Built React app
│   ├── background.js        # Service worker
│   ├── content/             # Platform scripts
│   └── icons/               # Extension icons
├── src/
│   ├── popup/               # React popup UI
│   ├── background/          # Service worker
│   ├── content/             # Platform detection scripts
│   └── utils/               # Shared utilities
└── public/
    └── manifest.json        # Source manifest
```

## 📋 How to Test in Chrome

### 1. Build the Extension
```bash
npm run build:extension
```

### 2. Load in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist/` folder
5. Extension should appear in your toolbar

### 3. Test the Extension
1. Click the extension icon - popup should open
2. Visit `https://chat.openai.com` or `https://claude.ai`
3. Check browser console for content script logs
4. Verify extension loads without errors

## 🎯 Current Features

### ✅ Working
- Extension loads in Chrome without errors
- Popup UI displays "Hello World" message
- Content scripts inject into ChatGPT and Claude
- Background service worker initialized
- Platform detection logging

### 🔄 Coming Next (Day 2)
- Conversation DOM scraping
- Message extraction and storage
- Real-time conversation monitoring
- IndexedDB implementation

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Development server (for popup UI)
npm run dev

# Build extension for Chrome
npm run build:extension

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 🔧 Extension Architecture

### Content Scripts
- **chatgpt.ts**: Detects and monitors ChatGPT conversations
- **claude.ts**: Detects and monitors Claude conversations

### Background Service Worker
- Handles extension lifecycle
- Manages message passing between content scripts and popup

### Popup UI
- React-based interface with Tailwind CSS
- Currently shows "Hello World" with extension status
- Will become conversation management interface

### Storage Plan
- **Week 1**: IndexedDB for local conversation storage
- **Week 3**: Cloud sync with PostgreSQL backend

## 🚨 Known Issues

1. **Icons**: Currently using placeholder text files (will be replaced with actual PNGs)
2. **Content Scripts**: Only logging, not capturing conversations yet (Day 2)
3. **Storage**: Not implemented yet (Day 1.3)

## 📊 Success Metrics for Day 1

- ✅ Extension loads in Chrome without errors
- ✅ Popup opens and displays "Hello World"
- ✅ Content scripts inject into target platforms
- ✅ Build system works correctly
- ✅ TypeScript compilation succeeds

---

**Ready for Day 2**: Conversation capture and DOM scraping implementation 🚀
