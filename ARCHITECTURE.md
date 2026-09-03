# ARCHITECTURE.md: The Useless New Tab Roaster

**Project Status:** Architecture Specification (Single Source of Truth)  
**Target Environment:** Google Chrome (Manifest V3)  
**Hackathon Budget:** ~11 Hours  

---

## 1. Executive Summary & Core Concept

**The Useless New Tab Roaster** is a comedic, deliberately unhelpful Chrome extension built for hackathon impact. When the user opens a new tab via Chrome's "+" button or shortcut (`Cmd+T` / `Ctrl+T`), the extension intercepts the New Tab page, counts how many open tabs exist in the current window, displays an animated meme and a humorous roast about the user's tab hoarding habits, and spawns an evasive "New Tab" button. 

The fake button dodges the user's cursor for a fixed sequence of 5 increasingly ridiculous escapes before becoming exhausted and clickable. Once clicked, it safely navigates the user to a configurable destination tab and removes the temporary roast tab.

### Core Architectural Principles
1. **Zero Service Worker Dependency:** All logic runs directly inside the `newtab.html` extension page context. No background workers or inter-process message passing required.
2. **Minimal Permissions (Zero Scary Warnings):** Tab counting and tab management are accomplished without requesting the privileged `"tabs"` permission or browsing history access.
3. **100% Offline-First & Local Primary:** **THE EXTENSION MUST BE FULLY FUNCTIONAL WITHOUT ANY AI API, ACCOUNT, API KEY, OR INTERNET CONNECTION.** The local roast system is the primary system. External AI is strictly an optional, provider-agnostic enhancement with a fast timeout.
4. **Hardened Security:** Server-side proxy/adapter isolates all third-party API credentials; DOM insertion strictly uses `textContent` to prevent XSS.
5. **Radical Simplicity:** No unnecessary abstractions or speculative scalability. The simplest reliable implementation is preferred.

---

## 2. System Architecture & Lifecycle Diagram

```
+-----------------------------------------------------------------------------------+
| CHROME BROWSER WINDOW                                                             |
|                                                                                   |
|  1. User presses "+" (New Tab)                                                    |
|     |                                                                             |
|     v                                                                             |
|  2. Manifest V3 chrome_url_overrides intercepts -> chrome-extension://<id>/newtab.html
|     |                                                                             |
|     +---> 3. Read Tab Count (chrome.tabs.query({ currentWindow: true }))           |
|     |        (Safely excludes current newtab tab ID without guessing)             |
|     |                                                                             |
|     +---> 4. Meme Selection Engine (Local JSON / Assets)                          |
|     |        (Selects random animated GIF/WebP from matching tab-count range)     |
|     |                                                                             |
|     +---> 5. Roast Engine (Local-First Flow)                                      |
|     |        |-- Step 5a: Generate local roast -> Render immediately              |
|     |        \-- Step 5b: Optional AI Enhancement (Async call to AI Service)      |
|     |                     |                                                       |
|     |                     +--> If Success (<= 1.5s): Update roast text            |
|     |                     \--> If Timeout/Error/Disabled: Retain local roast      |
|     |                                                                             |
|     +---> 6. Dodging Button Engine (DOM Mouse Physics)                            |
|     |        |-- Cursor Proximity Detection (<120px) -> Vector Evasion            |
|     |        |-- Viewport Safe-Bound Clamping & Reflection                        |
|     |        |-- Autonomous Random Twitch (every 2.2s)                            |
|     |        |-- Progressive Choreography (Escapes 1-5 get increasingly wild)     |
|     |        \-- Escape Counter (5 escapes limit) -> Exhausted / Clickable State  |
|     |                                                                             |
|  7. User clicks caught button                                                     |
|     |                                                                             |
|     v                                                                             |
|  8. Verified Tab Transition Sequence                                              |
|     |-- Step A: Identify current roast tab ID                                     |
|     |-- Step B: Create tab with CONFIG.DESTINATION_URL                            |
|     |-- Step C: Confirm new tab creation succeeds                                 |
|     \-- Step D: Remove temporary roast tab                                        |
+-----------------------------------------------------------------------------------+
```

---

## 3. Project Directory Layout

```
useless_project/
├── manifest.json                 # Manifest V3 configuration (Overrides newtab)
├── newtab.html                   # Clean, standalone New Tab DOM structure
├── newtab.css                    # Responsive layout, animations, dodging button styles
├── newtab.js                     # Core orchestration: Tab counter, meme loader, dodging physics, local/AI roaster
├── assets/
│   ├── icons/                    # Extension icons (16x16, 48x48, 128x128)
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── memes/                    # Categorized local meme assets (GIF / WebP)
│       ├── range_0_5/            # 0–5 tabs ("The Minimalist")
│       │   ├── suspicious.gif
│       │   └── empty_room.gif
│       ├── range_6_10/           # 6–10 tabs ("The Multitasker")
│       ├── range_11_20/          # 11–20 tabs ("The Tab Hoarder")
│       ├── range_21_30/          # 21–30 tabs ("RAM Destroyer")
│       ├── range_31_50/          # 31–50 tabs ("Digital Chaos")
│       └── range_51_plus/        # 51+ tabs ("Browser Meltdown")
├── serverless/                   # Optional Backend Proxy (for AI API key protection)
│   ├── package.json
│   ├── api/
│   │   └── roast.js              # Optional serverless handler / AI adapter
│   └── .env.example              # AI_API_KEY=... / AI_MODEL=... (Conceptual config)
├── ARCHITECTURE.md               # This document
└── README.md                     # Project overview and hackathon submission details
```

---

## 4. Chrome Extension MV3 Specifications & API Verification

### 4.1 Manifest V3 Configuration
The `manifest.json` requires only the URL override and no privileged host permissions for normal tab counting.

```json
{
  "manifest_version": 3,
  "name": "Tab Hoarder Roast: The Useless New Tab",
  "version": "1.0.0",
  "description": "A deliberately unhelpful new tab page that roasts your tab count before letting you browse.",
  "chrome_url_overrides": {
    "newtab": "newtab.html"
  },
  "icons": {
    "16": "assets/icons/icon16.png",
    "48": "assets/icons/icon48.png",
    "128": "assets/icons/icon128.png"
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self';"
  }
}
```

### 4.2 Background Service Worker: Not Needed
*   **Finding:** An extension page specified in `chrome_url_overrides` runs directly in Chrome's extension origin (`chrome-extension://<id>/newtab.html`).
*   **Verification:** It has full access to `chrome.tabs`, `chrome.runtime`, and standard Web APIs. A background service worker is completely omitted to avoid lifecycle sleep/wake issues and eliminate IPC messaging overhead.

### 4.3 Tab Counting & Permission Requirements
*   **Query Method:** `chrome.tabs.query({ currentWindow: true })`
*   **Is `"tabs"` permission required?** **NO.**
    *   `chrome.tabs.query()` returns an array of `Tab` objects with basic structural properties (`id`, `index`, `windowId`, `active`, `pinned`, `status`) without requiring `"tabs"` in `manifest.json`.
    *   The privileged `"tabs"` permission is *only* required to access sensitive URL strings, page titles, or favicons, none of which are collected or needed.
*   **User Privacy Impact:** Chrome will **not** display the warning *"This extension can read your browsing history"* upon installation.

### 4.4 Tab Counting Logic & Exclusion Rule
When a new tab opens, Chrome adds the new tab to the window before running the script.
*   **Identification Rule:** The extension attempts to retrieve its own tab ID via `chrome.tabs.getCurrent()`.
*   **Exclusion Rule:** If the current tab ID is successfully identified, filter out that exact tab ID.
*   **Anomaly Safety Rule:** If `chrome.tabs.getCurrent()` returns `undefined` (or fails to yield an ID), **DO NOT blindly subtract one or guess**. Log the anomaly and safely return the raw tab count.

```javascript
async function getEffectiveTabCount() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const currentTab = await chrome.tabs.getCurrent();
  
  if (currentTab && typeof currentTab.id === "number") {
    // Safely exclude the temporary roast tab by exact ID
    const otherTabs = tabs.filter(tab => tab.id !== currentTab.id);
    return otherTabs.length;
  }
  
  // Safe anomaly fallback: Report without guessing
  console.warn("Unable to identify current tab ID via chrome.tabs.getCurrent(). Using raw count.");
  return tabs.length;
}
```

### 4.5 Incognito Behavior
*   Extensions are disabled in Incognito by default.
*   If enabled by the user in `chrome://extensions`, `chrome.tabs.query({ currentWindow: true })` strictly returns tabs belonging to the current incognito window, preserving window isolation.

---

## 5. Tab Lifecycle Transition & Configuration

### 5.1 Configurable Destination Constant
To prevent hardcoded URL strings across the codebase while avoiding the infinite new-tab override loop, define a single centralized configuration object at the top of `newtab.js`:

```javascript
// Centralized configuration - trivial to modify for different targets
const CONFIG = {
  DESTINATION_URL: "https://www.google.com/",
  MAX_ESCAPES: 5,
  PROXIMITY_RADIUS: 120,
  ROAST_API_TIMEOUT_MS: 1500
};
```
*Note: We do NOT build a custom search engine or search page. The destination URL is a simple configurable string defaulting to Google Search.*

### 5.2 Transition Sequence & Runtime Verification Checkpoint
Calling `chrome.tabs.create({})` without a URL must NOT be used, as it re-triggers the extension's `newtab.html`. 

The preferred transition sequence is **Create-Confirm-Remove**:
1. **Identify:** Capture `currentTab = await chrome.tabs.getCurrent()`.
2. **Create:** Request tab creation: `const newTab = await chrome.tabs.create({ url: CONFIG.DESTINATION_URL, active: true })`.
3. **Confirm:** Verify `newTab && newTab.id` exists to confirm creation succeeded.
4. **Remove:** Safely close the temporary roast tab: `if (currentTab?.id) { await chrome.tabs.remove(currentTab.id); }`.

> **Implementation Checkpoint:** This transition behavior must be verified in Chrome during implementation testing. While this sequence is the designated architectural pattern, testing must confirm Chrome maintains smooth focus handoff and does not close the window if the roast tab was initially the sole tab.

---

## 6. Meme System Architecture

### 6.1 Range Partitioning
The system defines 6 distinct tab count tiers to provide humor tailored to the user's tab hoarding level:

| Tier Range | Category Label | Theme / Humor Style | Asset Directory |
| :--- | :--- | :--- | :--- |
| **0 – 5** | `minimalist` | Suspicion, "Why are you even here?", too neat | `assets/memes/range_0_5/` |
| **6 – 10** | `multitasker` | Moderate distraction, standard productivity lie | `assets/memes/range_6_10/` |
| **11 – 20** | `hoarder` | Denial, "I will read these later", clutter | `assets/memes/range_11_20/` |
| **21 – 30** | `ram_destroyer` | Chrome eating all RAM, fans spinning up | `assets/memes/range_21_30/` |
| **31 – 50** | `digital_chaos` | Pure chaos, complete loss of control | `assets/memes/range_31_50/` |
| **51+** | `browser_meltdown` | Catastrophic hoarding, intervention needed | `assets/memes/range_51_plus/` |

### 6.2 Asset Format
*   **MVP Asset Standard:** Locally stored animated `.gif` or animated `.webp` files.
*   **Rationale:** Supported natively by all browsers with zero video decoder initialization overhead or muted-autoplay restrictions. Video infrastructure (`<video>`, mp4) is out of scope for the MVP.

### 6.3 Local Meme Database Structure
Defined directly in `newtab.js`:

```javascript
const MEME_DATABASE = [
  {
    min: 0,
    max: 5,
    category: "minimalist",
    memes: [
      {
        id: "min_01",
        src: "assets/memes/range_0_5/suspicious.gif",
        alt: "Suspicious Look",
        fallbackRoasts: [
          "Under 5 tabs? What are you hiding?",
          "Look at you with your organized life. Disgusting."
        ]
      },
      {
        id: "min_02",
        src: "assets/memes/range_0_5/empty_room.gif",
        alt: "Empty Room",
        fallbackRoasts: [
          "Only a few tabs open. Your RAM is crying of loneliness.",
          "Clean desktop, clean browser, questionable productivity."
        ]
      }
    ]
  },
  { min: 6, max: 10, category: "multitasker", memes: [ /* ... */ ] },
  { min: 11, max: 20, category: "hoarder", memes: [ /* ... */ ] },
  { min: 21, max: 30, category: "ram_destroyer", memes: [ /* ... */ ] },
  { min: 31, max: 50, category: "digital_chaos", memes: [ /* ... */ ] },
  { min: 51, max: Infinity, category: "browser_meltdown", memes: [ /* ... */ ] }
];
```

---

## 7. Dodging Button Mechanics & Progressive Choreography

The fake "New Tab" button (`#dodging-btn`) provides the core comedic gameplay.

```
       [ Viewport Top Boundary (safeMargin = 24px) ]
+-----------------------------------------------------------+
|                                                           |
|                 (dx, dy) Vector Evasion                   |
|                        ^                                  |
|                        |                                  |
|                  [ Fake Button ]                          |
|                        ^                                  |
|                   . - -|- - .                             |
|                 '      |      '                           |
|                '   [Cursor]    '  <- Proximity Radius:    |
|                 '             '      120px                |
|                   ' . _ _ . '                             |
|                                                           |
+-----------------------------------------------------------+
      [ Viewport Bottom Boundary (safeMargin = 24px) ]
```

### 7.1 Progressive Escape Choreography
Rather than static movement, the 5 escapes progressively escalate in comedic intensity without adding architectural complexity:

1. **Escape 1 (The Flinch):** Small, timid hop ($100\text{px}$). Button text: *"New Tab"*.
2. **Escape 2 (The Step-Up):** Medium dodge ($160\text{px}$). Button text: *"Nope!"*.
3. **Escape 3 (The Jitter):** Wider dodge ($220\text{px}$) with random angular deflection ($\pm 45^\circ$). Button text: *"Too slow!"*.
4. **Escape 4 (The Panic):** Dramatic leap across the viewport ($300\text{px}$). Button text: *"Almost had it!"*.
5. **Escape 5 (The Final Gasp):** Maximum distance scramble. Button text: *"Giving up yet?"*.
6. **State 6 (Exhausted / Clickable):** Button stops moving completely, relaxes/pulses, and text becomes: *"Fine, take your tab! (Click me)"*.

### 7.2 Movement Parameters & Boundary Clamping
*   **Proximity Radius:** `120px` default.
*   **Random Restless Twitch:** Runs every `2200ms` (40% probability per tick) to prevent sitting idle if the user's cursor is stationary.
*   **Safe Margin Clamping:** Clamped strictly within `[24px, window.innerWidth - buttonWidth - 24px]` and `[24px, window.innerHeight - buttonHeight - 24px]`. If an escape vector pushes the button toward a boundary, reflect the vector back toward the viewport center.

---

## 8. Provider-Agnostic AI Roast Architecture (Optional Enhancement)

### 8.1 Core Principle: AI is Strictly Optional
*   **Local-First Architecture:** The extension must be **completely operational offline** using only the built-in local roast system.
*   **Enhancement Layer:** Dynamic AI roast generation is an optional enhancement layer that operates via a provider-agnostic abstraction.
*   **Implementation Sequence:**
    1. Implement local fallback roast system completely.
    2. Build and verify all core extension features (tab counting, meme playback, dodging, transition) offline.
    3. Only if sufficient time remains in the 11-hour hackathon, implement the optional AI roast service/adapter. If time runs short, the AI integration is omitted with zero impact on the product demo.

### 8.2 Provider-Agnostic Abstraction Flow

```
+------------------------------------+
| Chrome Extension Client (newtab.js)|
+------------------------------------+
                  |
                  | 1. Render local roast immediately
                  | 2. POST /api/roast (Payload: { tabCount, category })
                  v
+------------------------------------+
| Optional AI Roast Service/Adapter  |  <-- Isolates all API keys & provider specifics
+------------------------------------+
                  |
                  | Translates to configured provider format
                  v
+------------------------------------+
| Configured AI Provider             |  <-- Any provider selected during final build
+------------------------------------+
                  |
                  | Safe text roast (<= 15 words)
                  v
+------------------------------------+
| Extension Client Display           |
+------------------------------------+
```

### 8.3 Conceptual Configuration Architecture
The backend proxy/adapter keeps provider specifics completely decoupled from the Chrome extension. Conceptually, configuration is structured as follows:

```text
AI_PROVIDER        # Conceptual provider identifier (e.g. proxy adapter target)
AI_API_ENDPOINT    # Conceptual endpoint URL for the selected provider
AI_MODEL           # Conceptual model identifier
AI_API_KEY         # Secret key (strictly backend-only, never sent to client)
AI_TIMEOUT         # Maximum duration to wait before aborting (default: 1500ms)
```

### 8.4 Client-Side Local-First Flow
```
Generate local roast
       ↓
Display immediately
       ↓
Optional AI enhancement (POST /api/roast with 1.5s timeout)
       ↓
AI unavailable / timeout / error?
       ↓
Keep local roast (Silent graceful fallback, zero UI disruption)
```

The extension client only expects a standard JSON response `{ "roast": "string" }` containing plain text. It does not know or care which underlying model, service, or provider produced the text.

---

## 9. Security, Privacy & CSP Compliance

| Threat Area | Architectural Guarantee |
| :--- | :--- |
| **API Credential Isolation** | The client extension contains zero API keys or secret credentials. If an external AI service is used, all credentials reside exclusively on the serverless proxy/adapter. |
| **XSS & Injection** | All roast text (local or AI-generated) must **strictly** be rendered using `element.textContent = roastText`. Never use `innerHTML`, `document.write`, or `eval()`. |
| **MV3 CSP Rules** | Complies with `script-src 'self'; object-src 'self'`. All scripts, styles, and meme images are bundled locally. |
| **User Privacy** | Tab counting only queries integer length and tab IDs. No URLs, titles, or browsing history are read or transmitted. |

---

## 10. Local Development & Verification Workflow

### 10.1 Step-by-Step Developer Setup
1. **Open Workspace Root:**
   ```bash
   cd useless_project
   ```
2. **Verify File Structure:** Ensure `manifest.json`, `newtab.html`, `newtab.css`, `newtab.js`, and `assets/` exist in project root.
3. **Load in Google Chrome:**
   * Open Chrome and navigate to `chrome://extensions`.
   * Enable the **"Developer mode"** toggle in the top-right corner.
   * Click the **"Load unpacked"** button in the top-left corner.
   * Select the project root folder.
4. **Testing the Extension:**
   * Open a new tab (`Cmd+T` on Mac or `Ctrl+T` on Windows).
   * Verify tab count accuracy, matching meme display, and dodging physics.
   * Verify all 5 escapes trigger progressively before the button becomes clickable.
   * Click the button; verify it safely navigates to `CONFIG.DESTINATION_URL`.
5. **Rapid Iteration:**
   * For changes in `newtab.html`, `newtab.css`, or `newtab.js`, simply **refresh the open new tab (`Cmd+R` / `F5`)** without reloading the extension.
   * For changes in `manifest.json`, click the **Reload icon (↻)** on the extension card in `chrome://extensions`.

---

## 11. 11-Hour Hackathon Scope & Priority Breakdown

### 11.1 Unambiguous Priority Matrix

```
+-------------------------------------------------------------------------------+
| MUST HAVE (Core MVP - Mandatory Delivery)                                     |
|  [x] Manifest V3 manifest.json with chrome_url_overrides                      |
|  [x] newtab.html + responsive CSS layout                                      |
|  [x] Current-window tab counting (chrome.tabs.query)                          |
|  [x] Correct exclusion of temporary extension tab (chrome.tabs.getCurrent)     |
|  [x] Local meme range system (6 tiers: 0-5, 6-10, 11-20, 21-30, 31-50, 51+)   |
|  [x] Animated local meme assets (GIF/WebP)                                    |
|  [x] Cursor-proximity dodging physics (120px radius)                          |
|  [x] Autonomous random movement                                               |
|  [x] Fixed 5-escape count limit + progressive choreography                    |
|  [x] Exhausted / clickable button state                                       |
|  [x] Safe tab transition (CONFIG.DESTINATION_URL)                             |
|  [x] Local fallback roast system (100% offline-ready)                          |
+-------------------------------------------------------------------------------+
| SHOULD HAVE (Enhancements - Only after MUST HAVE is complete)                 |
|  [ ] Optional AI roast adapter endpoint (1.5s timeout, provider-agnostic)      |
|  [ ] Dynamic button taunts per escape ("Nope!", "Too slow!", etc.)           |
|  [ ] Polished micro-animations (shake on escape, pulse on exhaustion)         |
+-------------------------------------------------------------------------------+
| NICE TO HAVE (Polish - Time Permitting)                                       |
|  [ ] Sound effects (whoosh on dodge, chime on catch)                          |
|  [ ] Confetti burst when button is caught                                     |
|  [ ] Additional visual styling / themes                                       |
+-------------------------------------------------------------------------------+
| DO NOT BUILD (Strictly Prohibited Scope)                                      |
|  [-] Database, user accounts, or authentication                               |
|  [-] Analytics, telemetry, or user dashboards                                 |
|  [-] Custom search engine or custom search page                               |
|  [-] Cross-browser polyfills / support (Chrome only)                          |
|  [-] Chrome Web Store packaging / publishing automation                       |
|  [-] Unnecessary frameworks (use Vanilla JS, HTML5, CSS3)                     |
+-------------------------------------------------------------------------------+
```

---

## 12. Known Technical Risks & Runtime Verification Points

1. **Tab Transition Sequence:** The Create-Confirm-Remove sequence must be verified in Chrome during implementation testing to ensure window stability.
2. **Current Tab Identification Anomaly:** If `chrome.tabs.getCurrent()` fails to provide an ID, the extension falls back to raw count without guessing or blind subtraction.
3. **AI Service Independence:** The core extension is 100% independent of any remote AI service; local fallback roasts guarantee a working demo even with no network or AI provider configured.
4. **Viewport Bounds:** Bounding box calculations use `window.innerWidth`/`innerHeight` with mandatory `24px` boundary padding and corner reflection vectors.

---
**AI ARCHITECTURE PROVIDER-AGNOSTIC — READY FOR MVP IMPLEMENTATION**
