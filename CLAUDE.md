# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Skills to use

Always reference these skills when working on the codebase:

- `.claude/skills/frontend-design/skill.md` for all CSS changes and UI componentes

## Project Overview

Exploratory Testing Chrome Extension (Manifest v3) - A tool for web exploratory testing that allows testers to report bugs, ideas, notes, and questions with screenshots during testing sessions.

## Build and Test Commands

```bash
npm install              # Install dependencies
npm test                 # Run Jest tests
npx jest                 # Run Jest directly
npx jest --watch         # Run tests in watch mode
npx jest path/to/test    # Run a single test file
```

**PowerShell scripts:**
```powershell
.\genetareZip.ps1        # Create timestamped .zip for Chrome Web Store
.\start_test_server.ps1  # Start HTTP server on localhost:8000
```

## Architecture

### Chrome Extension Structure (Manifest v3)

- **Service Worker** (`background.js`): Handles message passing, storage, and session management
- **Popup** (`popup.html` + `js/popup.js`): User-facing UI for creating annotations
- **Content Script** (`js/content_script.js`): Handles screenshot cropping on pages

### Core Data Model

```
Session
├── BrowserInfo (os, browser version, cookies enabled)
├── StartDateTime
└── annotations[]
    ├── Bug (extends Annotation)
    ├── Note (extends Annotation)
    ├── Idea (extends Annotation)
    └── Question (extends Annotation)
```

### Key Source Files

| File | Purpose |
|------|---------|
| `src/Session.js` | Main session management class |
| `src/Annotation.js` | Annotation base class and subclasses (Bug, Note, Idea, Question) |
| `src/browserInfo.js` | System/browser information collector |
| `src/JSonSessionService.js` | JSON serialization/deserialization |
| `src/ExportSessionCSV.js` | CSV export functionality |

### Message Passing Protocol

Communication between popup and background:
- `addBug`, `addIdea`, `addNote`, `addQuestion`: Add annotation with optional screenshot
- `updateAnnotationName`, `deleteAnnotation`: Modify annotations
- `exportSessionCSV`, `exportSessionJSon`, `importSessionJSon`: Import/export
- `clearSession`, `getSessionData`, `getFullSession`: Session management
- `csToBgCropData`: Process cropped screenshot from content script

### Storage

Uses `chrome.storage.local` for persistence. The extension handles quota errors gracefully by removing oldest screenshots when storage is full.

## Testing

- **Framework**: Jest 29.7.0
- **Test location**: `test/spec/**/*.test.js`
- **Chrome API mocks**: Defined in `jest.setup.js`

When adding new Chrome API calls, update the mocks in `jest.setup.js`.

**Known issue**: `test/spec/ExportSessionCSV.test.js` has syntax errors and needs fixing.

## Technology Stack

- jQuery 1.11.3, Bootstrap CSS (frontend)
- Jest + Babel (testing/transpilation)
- CanvasJS, Chart.js, TableFilter (reporting)
- No npm runtime dependencies (all libraries bundled)
