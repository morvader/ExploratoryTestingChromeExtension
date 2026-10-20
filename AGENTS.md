# AGENTS.md

Instructions for AI coding agents working in this repository. This is the single source of agent guidance — there is no separate CLAUDE.md.

## Project

**Exploratory Testing Chrome Extension** — Manifest V3 extension for web exploratory testing. Testers record Bugs, Notes, Ideas and Questions (optionally with a cropped, annotated screenshot) while browsing; the current URL is captured automatically. Sessions are reviewed in an HTML report and exported to JSON, CSV or standalone HTML.

- Published on the [Chrome Web Store](https://chrome.google.com/webstore/detail/exploratory-testing-chrom/khigmghadjljgjpamimgjjmpmlbgmekj). Version lives in `manifest.json`.
- Plain JavaScript (ES modules in the service worker and `src/`, jQuery in UI code). **No bundler, no build step, no npm runtime dependencies** — the repo root is the extension.
- Some code comments and `test/e2e/README.md` are in Spanish. Write new code, comments and docs in English.

## Quick start

Requires Node 20 (matches CI).

```bash
npm install                 # dev deps only: Jest, Babel, Playwright
npx playwright install chromium   # first time, for E2E
npm test                    # unit tests — must pass before finishing any task
```

Load the extension manually: `chrome://extensions` → Developer mode → **Load unpacked** → repo root. After editing `background.js` or `manifest.json`, click reload on the extension card; popup/report changes only need reopening.

## Commands

| Command | What it does |
|---------|--------------|
| `npm test` | Jest unit tests (`test/spec/`) |
| `npx jest test/spec/Session.test.js` | Single unit test file |
| `npx jest --coverage` | Coverage for `src/**` into `coverage/` |
| `npm run test:e2e` | Playwright: smoke + basic functionality |
| `npm run test:e2e:all` | Playwright: full suite (same set as CI) |
| `npm run test:e2e:headed` | E2E with visible browser |
| `npm run test:e2e:ui` / `:debug` | Playwright UI mode / step debugger |
| `npm run test:e2e:crop` | Crop-screenshot specs, headed |
| `npm run test:e2e:report` | Open last HTML report |
| `npm run test:all` | Unit + full E2E |
| `.\genetareZip.ps1` | Build `ETExtension-<timestamp>.zip` for Web Store upload (PowerShell, runtime files only) |
| `.\start_test_server.ps1` | `python -m http.server 8000` serving the repo; open `/test/e2e/test-pages/index.html` |

## Architecture

```
popup.html / js/popup.js ──sendMessage──▶ background.js (service worker)
                                            │  holds Session, persists to chrome.storage.local
                                            │  injects + messages ▼
                                         js/content_script.js (all URLs)
                                            │  crop selection overlay
                                            └─ iframe ▶ js/annotation_editor.html/.js
HTMLReport/preview.html ── reads session ── renders stats, charts, filterable table
```

| Path | Role |
|------|------|
| `manifest.json` | MV3 manifest. Permissions: `storage`, `tabs`, `activeTab`, `downloads`, `scripting`, `notifications` |
| `background.js` | Service worker (`type: module`). Owns the `Session`, routes messages, saves to storage, triggers downloads, shows notifications |
| `popup.html`, `js/popup.js` | Popup UI: annotation forms, counters, export/import/clear, open report |
| `js/content_script.js` | Crop-area selection on the page; hosts the annotation editor iframe |
| `js/annotation_editor.*` | Screenshot editor (arrow, rectangle, text, blur, undo). Talks to the content script via `postMessage` (`initAnnotationEditor`, `annotationComplete`, `annotationCancelled`) |
| `src/Session.js` | Session model: browser info, start time, `annotations[]` |
| `src/Annotation.js` | `Annotation` base + `Bug`, `Note`, `Idea`, `Question` |
| `src/browserInfo.js` | `getSystemInfo()` — OS, browser, cookies |
| `src/JSonSessionService.js` | Session ⇄ JSON (import rebuilds class instances) |
| `src/ExportSessionCSV.js` | CSV export |
| `HTMLReport/preview.*` + `modules/` | Report: `reportData` (load), `reportUI` (render), `reportEvents` (filters/actions), `reportDownload` (HTML/ZIP export) |

### Messages handled by `background.js`

All use `chrome.runtime.sendMessage({ type, ... })`, dispatched in the `switch (request.type)` of the `onMessage` listener.

| `type` | Sender | Purpose |
|--------|--------|---------|
| `addBug`, `addNote`, `addIdea`, `addQuestion` | popup | Add annotation (optional screenshot) |
| `updateAnnotationName`, `deleteAnnotation` | report | Edit / remove annotation |
| `exportSessionCSV`, `exportSessionJSon`, `importSessionJSon` | popup | Export via `chrome.downloads` / import |
| `clearSession`, `getSessionData`, `getFullSession` | popup, report | Session lifecycle and reads |
| `initiateCropSelection` | popup | Inject content script and send it `startSelection` (blocked on `chrome://`, `edge://`, `about:`, extension pages) |
| `requestCropScreenshot` | content script | `captureVisibleTab` + crop; async response |
| `csToBgCropData` | content script | Store annotated crop as a new annotation |

Content script also sends `selectionCancelled` (not handled by background).

**Adding a message:** add a `case` in `background.js`; if it responds asynchronously set `isAsync = true` so the listener returns `true`; send it from the caller; add unit tests for any `src/` logic and an E2E spec for the user flow.

### Storage and persistence

- Whole session saved under key `session` in `chrome.storage.local`, restored on service-worker start. The service worker can be killed at any time — never keep state only in memory.
- On `QUOTA_BYTES` errors, `saveSession()` strips the oldest screenshots and retries, notifying the user. Preserve this when touching persistence.
- Stored/imported data is plain JSON; rebuild `Bug`/`Note`/`Idea`/`Question` instances through `JSonSessionService` rather than using raw objects.

### HTML report downloads

- **Download Report** — single self-contained HTML, screenshots inlined as base64, must work offline.
- **Download Images** — ZIP (JSZip) of screenshots named by type + timestamp, plus `README.txt`. Only offered in `preview.html`; deliberately omitted from downloaded reports to avoid Windows security warnings.

## Testing

### Unit (Jest)

- Jest 29 + `babel-jest`, `testEnvironment: 'node'`, specs in `test/spec/**/*.test.js`. Currently 5 suites / 52 tests, all passing.
- `jest.setup.js` mocks a minimal `chrome` (`runtime.getManifest`, `storage.local.get/set`, `tabs.query`) and `navigator`, and loads `lib/date.js`. **When code under test calls a new `chrome.*` API, add its mock there.**
- Unit tests cover `src/` only. `background.js`, popup and report logic are covered by E2E — keep business logic in `src/` so it stays unit-testable.

### E2E (Playwright)

- Specs in `test/e2e/*.spec.js`: `smoke`, `basic-functionality`, `reports-export`, `crop-screenshot`, `annotation-editor`. Shared setup in `test/e2e/helpers/extension-helper.js`; fixture pages in `test/e2e/test-pages/` (served at `http://localhost:8000/test/e2e/test-pages`).
- Runs one worker, not parallel (extensions require a persistent Chromium context). Retries 2× on CI.
- `npm run` scripts list spec files explicitly — **a new spec must be added to `test:e2e:all` and `test:e2e:ci` in `package.json`** or CI won't run it.
- Prefer role / label / test-id selectors over CSS paths; use Playwright's auto-waiting assertions, never fixed sleeps.
- When asserting on `postMessage` traffic, register the listener (and await it) *before* triggering the action — see `listenForEditorMessage` in `annotation-editor.spec.js`.

### CI

`.github/workflows/ci.yml`: unit tests + `npm run test:e2e:ci` on every push and on PRs to `main`/`master`. Playwright report uploaded as artifact.

## Agent-specific tooling

If your agent supports these, use them:

- **UI / CSS changes** — follow the `frontend-design` skill (`.claude/skills/frontend-design/SKILL.md`, mirrored in `.agents/skills/`).
- **E2E tests** — use the `playwright-cli` skill (`.claude/skills/playwright-cli/`) to explore the UI, generate selectors and draft specs; hand-write only what it can't produce.
- **Library / API docs** — look up current docs (e.g. Context7 MCP) before writing code against Chrome APIs, Playwright, Jest or Chart.js rather than relying on memory.

## Conventions

- Match surrounding style: ES classes + named exports in `src/`, jQuery in popup/report code. No new frameworks.
- No runtime npm dependencies. If a library is truly needed, vendor a pinned minified copy in `lib/` and justify it.
- MV3 rules: no remote code, no `eval`/`new Function`, no inline `<script>` in extension pages (CSP).
- Keep permissions minimal — each new one triggers a Web Store review warning and needs a clear reason.
- Treat page content and imported JSON as untrusted: insert user text with `.text()` / `textContent`, not `.html()` / `innerHTML`.
- Commits: Conventional Commits (`feat:`, `fix:`, `test:`, `refactor:`, `chore:`, `docs:`).
- Bump `manifest.json` `version` only when preparing a release.

## Do not edit

- Vendored libraries: `lib/*`, `js/jquery-1.11.3.min.js`, `js/bootstrap.bundle.min.js`, `css/bootstrap.min.css`, `HTMLReport/TableFilter/`
- Generated / ignored: `playwright-report/`, `test-results/`, `coverage/`, `test/e2e/.chrome-profile/`, `ETExtension-*.zip`

## Gotchas

- `genetareZip.ps1` (filename typo is real) packages an **allowlist** of runtime files (`manifest.json`, `background.js`, `popup.html`, `css`, `HTMLReport`, `icons`, `images`, `js`, `lib`, `src`). A new top-level runtime file or folder must be added to `$include`, or it will be missing from the store package.
- `README.md` still claims `ExportSessionCSV.test.js` is broken — it now passes.

## Definition of done

1. `npm test` passes.
2. Relevant E2E specs pass (`npm run test:e2e:all` for UI / message-flow changes).
3. New `chrome.*` calls are mocked in `jest.setup.js`; new specs are wired into `package.json`.
4. Extension reloaded and the change checked manually in Chrome when it affects UI.
5. This file updated if architecture, commands or conventions changed.
