# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Context Engine is a Chrome browser extension that provides a universal memory layer for AI tools, capturing conversations and maintaining context across ChatGPT, Claude, and other AI platforms.

## Behavioral Directives (from behavioral-os)

### Agent Role & Constraints
This project follows the **Context Manager Agent** behavioral pattern from AGENTS.md with these core responsibilities:
- **Session Persistence**: Execute conversation capture with validation and versioning
- **Platform Detection**: Perform intelligent detection across ChatGPT and Claude platforms
- **Storage Management**: Handle IndexedDB operations with integrity and performance
- **User Experience**: Maintain responsive UI with sub-200ms response times

### Cognitive Compensations (from COGNITION.md)
Always apply these cognitive overlays during development:

#### Entropy Reduction
- **Preflight**: Check for existing DOM scraping patterns to extend
- **Postflight**: Verify duplication ↓, complexity ↓, boundaries respected
- **Decision**: Refactor if any metric degrades

#### Intent Memory
Maintain clear purpose for each component:
- Content Scripts: Platform-specific DOM monitoring
- Background Service: Message routing and lifecycle management
- Popup UI: User interaction and conversation management

#### Hierarchical Awareness
Respect these layer boundaries:
- **Extension Layer**: Chrome APIs, manifest configuration
- **Content Script Layer**: DOM access, platform detection
- **Business Logic Layer**: Conversation processing, storage
- **UI Layer**: React components, user interactions

### Quality Gates (from AGENTS-APPENDIX.md)
All code changes must meet these criteria:
- **Entropy Score**: Target < -5 (GOOD) or better
- **Response Times**: <200ms for cached operations
- **Type Safety**: Zero tolerance for `any` type usage
- **Error Handling**: Structured error responses with actionable guidance

#### Entropy Reduction Requirements
Before completing any task, calculate and report:
```markdown
### Quantified Metrics Report
**Complexity**: [before] → [after] ([% change])
**Duplication**: [before] → [after] ([% change])
**Function Length**: [before] → [after] ([% change])
**Import Coupling**: [before] → [after] ([% change])
**Test Coverage**: [before] → [after] ([% change])
**Entropy Score**: [calculated value]
**Verdict**: [EXCELLENT/GOOD/NEUTRAL/POOR/CRITICAL]
```

Critical threshold: Entropy Score > +5 requires immediate rework.

## Development Commands

```bash
# Install dependencies
npm install

# Development server with hot reload for popup UI
npm run dev

# Build complete extension for Chrome
npm run build:extension

# Individual build steps
npm run build          # TypeScript compilation + Vite build
npm run copy-manifest  # Copy manifest and assets to dist/

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Testing in Chrome

1. Build extension: `npm run build:extension`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in top right
4. Click "Load unpacked" and select the `dist/` folder
5. Extension will appear in toolbar; click to test popup

## Architecture Overview

### Multi-Entry Build System

The extension uses a custom Vite configuration with multiple entry points:

- **Popup** (`popup.html`): React UI that users interact with
- **Background** (`src/background/index.ts`): Service worker for extension lifecycle
- **Content Scripts** (`src/content/chatgpt.ts`, `src/content/claude.ts`): Platform-specific DOM injection

### Message Passing Architecture

Communication flows between extension components:

1. **Content Scripts → Background**: DOM events, conversation capture, platform detection
2. **Background → Popup**: Storage updates, extension state changes
3. **Popup → Background**: User actions, configuration changes

All messages use Chrome's `chrome.runtime.sendMessage()` with structured payload format:

```typescript
{
  type: string,        // Message type identifier
  data: any,          // Payload data
  platform: string,   // 'chatgpt' | 'claude'
  url: string         // Current page URL
}
```

### Platform Detection Pattern

Each content script follows the same pattern:

1. **Platform Verification**: URL-based detection with fallbacks
2. **DOM Observation**: MutationObserver for conversation changes
3. **Message Sending**: Structured communication with background script

### Chrome Extension Permissions (Manifest V3)

The extension requires minimal permissions:
- `storage`: For IndexedDB and Chrome storage API
- `activeTab`: To interact with current tab
- `scripting`: For content script injection
- Host permissions for ChatGPT and Claude domains

### Build Process Notes

- Vite builds each entry point separately into `dist/` folder
- TypeScript compilation happens first via `tsc -b`
- Manifest and icons are copied after build via `copy-manifest` script
- Content scripts output to `dist/content/` matching manifest paths
- Icons are currently placeholders (text files) - replace with actual PNGs for production

### Storage Strategy (Planned)

- **Week 1**: IndexedDB for local conversation storage
- **Week 3**: Cloud sync with PostgreSQL backend
- **Category System**: Personal, Work, Code (3 categories only)
- **Search**: Text search (Week 1) → Semantic search with embeddings (Week 2)

## File Structure Notes

- `src/popup/`: React application with Tailwind CSS styling
- `src/content/`: Platform-specific scripts using shared DOM scraping patterns
- `src/background/`: Service worker managing extension state and message routing
- `src/storage/`: (Week 1) IndexedDB abstraction layer
- `src/utils/`: Shared utilities and type definitions

## Chrome Extension Specifics

- All Chrome APIs are accessed via global `chrome` object
- TypeScript types provided by `@types/chrome` package
- Manifest V3 requires service workers instead of background pages
- Content scripts run in isolated worlds with limited API access
- Extension popup runs as separate context from content scripts

## Development Protocols (Behavioral Integration)

### Pre-Task Analysis (Required)
Before implementing any feature:
1. **Intent Log**: Define goal, constraints, non-goals, success criteria
2. **Layer Target**: Identify target architectural layer and responsibilities
3. **Coherence Check**: Verify naming, schemas, patterns match existing code
4. **Reuse Assessment**: Identify existing abstractions to extend

### Post-Implementation Validation (Required)
Before completing any task:
1. **Entropy Summary**: Quantify complexity, duplication, coupling changes
2. **Constraint Guard**: Verify token/time budgets respected
3. **RFC-Lite**: Document any new abstractions introduced
4. **Quality Gates**: Ensure all behavioral directives met

### Emergency Protocols
For time-critical fixes only:
- Use TIME-CONSTRAINED WAIVER with explicit risk acceptance
- Post-mortem due within 24h
- Never skip type safety or testing

### Pattern Library Integration
Follow established patterns from behavioral-os:
- **Service Layer Extraction**: Separate DOM concerns from business logic
- **Progressive Type Safety**: Add types incrementally without breaking
- **Early Return Guards**: Reduce nesting, improve readability
- **Structured Error Handling**: Consistent error response formats

### Anti-Pattern Avoidance
Never allow:
- `any` type usage (use `unknown` with type guards)
- Commented-out failing tests
- Magic numbers/strings (use named constants)
- Cross-layer boundary violations