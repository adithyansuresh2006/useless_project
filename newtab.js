/**
 * Tab Hoarder Roast: The Useless New Tab Roaster
 * Implementation strictly adhering to ARCHITECTURE.md (Manifest V3, Local-First, Zero AI dependency)
 * Phase 2 Redesign: Full-Screen Poster + Click-Only Evasion (Random Hidden Limit 5-15) + Text Cursor Trail ("click it")
 */

// Centralized Configuration
const CONFIG = {
  DESTINATION_URL: "https://www.google.com/",
  MIN_ESCAPES: 5,
  MAX_ESCAPES: 15,
  SAFE_MARGIN: 24,
  TRAIL_TEXT: "click it",
  TRAIL_SPACING: 80,
  TRAIL_MAX_POINTS: 10,
  TRAIL_EXIT_DURATION: 400,
  AI_ROAST_ENDPOINT: "http://localhost:3000/api/roast",
  AI_TIMEOUT_MS: 5000
};

// Random Secret Evasion Limit (Selected per session from 5 to 15 inclusive, never revealed to user)
const HIDDEN_EVASION_LIMIT = Math.floor(
  Math.random() * (CONFIG.MAX_ESCAPES - CONFIG.MIN_ESCAPES + 1)
) + CONFIG.MIN_ESCAPES;

// Supplied Meme Image Pool (From user's Gif folder: animated GIFs and high-res JPEGs)
const SUPPLIED_MEME_POOL = [
  {
    id: "gallery_gif_01",
    src: "assets/memes/gallery/GIF-2026-09-04-02-31-23.gif",
    alt: "Animated Meme 1"
  },
  {
    id: "gallery_gif_02",
    src: "assets/memes/gallery/GIF-2026-09-04-02-31-44.gif",
    alt: "Animated Meme 2"
  },
  {
    id: "gallery_gif_03",
    src: "assets/memes/gallery/GIF-2026-09-04-02-32-17.gif",
    alt: "Animated Meme 3"
  },
  {
    id: "gallery_gif_04",
    src: "assets/memes/gallery/GIF-2026-09-04-02-32-47.gif",
    alt: "Animated Meme 4"
  },
  {
    id: "gallery_gif_05",
    src: "assets/memes/gallery/GIF-2026-09-04-03-30-15.gif",
    alt: "Animated Meme 5"
  },
  {
    id: "gallery_gif_06",
    src: "assets/memes/gallery/GIF-2026-09-04-03-31-02.gif",
    alt: "Animated Meme 6"
  },
  {
    id: "gallery_gif_07",
    src: "assets/memes/gallery/GIF-2026-09-04-03-31-44.gif",
    alt: "Animated Meme 7"
  },
  {
    id: "gallery_gif_08",
    src: "assets/memes/gallery/GIF-2026-09-04-03-32-38.gif",
    alt: "Animated Meme 8"
  },
  {
    id: "gallery_jpg_01",
    src: "assets/memes/gallery/PHOTO-2026-09-03-23-07-18 2.jpg",
    alt: "Photo Meme 1"
  },
  {
    id: "gallery_jpg_02",
    src: "assets/memes/gallery/PHOTO-2026-09-03-23-07-18 3.jpg",
    alt: "Photo Meme 2"
  },
  {
    id: "gallery_jpg_03",
    src: "assets/memes/gallery/PHOTO-2026-09-03-23-07-18.jpg",
    alt: "Photo Meme 3"
  },
  {
    id: "gallery_jpg_04",
    src: "assets/memes/gallery/PHOTO-2026-09-04-03-29-21.jpg",
    alt: "Photo Meme 4"
  }
];

// 6 Tier Tab Count Database (Preserved Exactly)
const MEME_DATABASE = [
  {
    min: 0,
    max: 5,
    category: "minimalist",
    label: "The Minimalist",
    memes: [
      {
        id: "min_01",
        src: "assets/memes/range_0_5/suspicious.gif",
        alt: "Suspicious Look"
      },
      {
        id: "min_02",
        src: "assets/memes/range_0_5/empty_room.gif",
        alt: "Tumbleweed in Empty Room"
      }
    ],
    roasts: [
      "Under 5 tabs? What are you hiding from the FBI?",
      "Look at you with your organized life. Absolutely disgusting.",
      "Only a few tabs open. Your RAM is crying from pure loneliness.",
      "Clean desktop, clean browser, questionable productivity."
    ]
  },
  {
    min: 6,
    max: 10,
    category: "multitasker",
    label: "The Multitasker",
    memes: [
      {
        id: "multi_01",
        src: "assets/memes/range_6_10/juggling.gif",
        alt: "Juggling Tabs"
      },
      {
        id: "multi_02",
        src: "assets/memes/range_6_10/thinking_cat.gif",
        alt: "Thinking Cat"
      }
    ],
    roasts: [
      "6 to 10 tabs: The universal sweet spot of pretending to work.",
      "You're not multitasking, you're just procrastinating in parallel.",
      "Ah, the classic 'I will definitely read these within 5 minutes' lie.",
      "Your browser is mildly concerned, but still willing to cooperate."
    ]
  },
  {
    min: 11,
    max: 20,
    category: "hoarder",
    label: "The Tab Hoarder",
    memes: [
      {
        id: "hoard_01",
        src: "assets/memes/range_11_20/hoarder_stash.gif",
        alt: "Tower of Tabs"
      },
      {
        id: "hoard_02",
        src: "assets/memes/range_11_20/this_is_fine.gif",
        alt: "This Is Fine Coffee"
      }
    ],
    roasts: [
      "11 to 20 tabs open. You haven't looked at tab #3 since Tuesday.",
      "Digital hoarding isn't a personality trait, please close something.",
      "This is fine. Everything is fine. You definitely need all those tabs.",
      "Your bookmarks bar exists for a reason, you know."
    ]
  },
  {
    min: 21,
    max: 30,
    category: "ram_destroyer",
    label: "RAM Destroyer",
    memes: [
      {
        id: "ram_01",
        src: "assets/memes/range_21_30/ram_eating_pacman.gif",
        alt: "RAM Eating Pacman"
      },
      {
        id: "ram_02",
        src: "assets/memes/range_21_30/fan_spinning.gif",
        alt: "Turbo Cooling Fan"
      }
    ],
    roasts: [
      "20+ tabs open! Your cooling fan sounds like a Boeing 747 taking off.",
      "Chrome is consuming more RAM than NASA used to land on the moon.",
      "Your CPU is begging for mercy, but you just opened another tab.",
      "Are you researching a PhD thesis or just collecting Wikipedia articles?"
    ]
  },
  {
    min: 31,
    max: 50,
    category: "digital_chaos",
    label: "Digital Chaos",
    memes: [
      {
        id: "chaos_01",
        src: "assets/memes/range_31_50/chaos_matrix.gif",
        alt: "Matrix Chaos"
      },
      {
        id: "chaos_02",
        src: "assets/memes/range_31_50/burning_laptop.gif",
        alt: "Burning Laptop"
      }
    ],
    roasts: [
      "Over 30 tabs! The favicons have shrunk into microscopic dots.",
      "You can't even read the tab titles anymore. Why are you opening more?",
      "Somewhere in those tabs is an autoplaying video and you can't find it.",
      "Your computer is running on pure hope and thermal throttling."
    ]
  },
  {
    min: 51,
    max: Infinity,
    category: "browser_meltdown",
    label: "Browser Meltdown",
    memes: [
      {
        id: "melt_01",
        src: "assets/memes/range_51_plus/nuclear_meltdown.gif",
        alt: "Nuclear Siren"
      },
      {
        id: "melt_02",
        src: "assets/memes/range_51_plus/rip_browser.gif",
        alt: "RIP Browser Gravestone"
      }
    ],
    roasts: [
      "50+ TABS?! Call the fire department, your browser is in critical meltdown!",
      "At this point, closing Chrome would feel like a spiritual rebirth.",
      "You don't need a new tab. You need a technological intervention.",
      "Rest in Peace to your computer's memory. Gone but never forgotten."
    ]
  }
];

// Escalating Desperate Button Phrases (Strictly NO numbers or counts)
const ESCALATING_BUTTON_PHRASES = [
  { text: "WAIT.", icon: "⚡", isPanic: false },
  { text: "NOPE.", icon: "💨", isPanic: false },
  { text: "TOO SLOW.", icon: "🏃", isPanic: false },
  { text: "STOP CLICKING ME.", icon: "🛑", isPanic: false },
  { text: "WHY ARE YOU LIKE THIS?", icon: "😰", isPanic: true },
  { text: "SERIOUSLY?!", icon: "😤", isPanic: true },
  { text: "I'M CALLING CHROME SUPPORT.", icon: "🚨", isPanic: true },
  { text: "LEAVE ME ALONE.", icon: "💥", isPanic: true },
  { text: "THIS IS HARASSMENT.", icon: "🔥", isPanic: true },
  { text: "CLOSE A TAB INSTEAD.", icon: "🛑", isPanic: true },
  { text: "I REFUSE.", icon: "⚡", isPanic: true },
  { text: "NOT HAPPENING.", icon: "💨", isPanic: true },
  { text: "STILL HERE?", icon: "🏃", isPanic: true },
  { text: "PLEASE STOP.", icon: "😰", isPanic: true },
  { text: "ABSOLUTELY NOT.", icon: "😤", isPanic: true },
  { text: "FINAL WARNING.", icon: "🚨", isPanic: true }
];

// Cosmetic Browser Health Configuration (Pure Comedy UI)
const TIER_HEALTH_CONFIG = {
  minimalist: { status: "HEALTHY", percent: 100, color: "#38ef7d" },
  multitasker: { status: "FINE, PROBABLY", percent: 80, color: "#a371f7" },
  hoarder: { status: "CONCERNING", percent: 60, color: "#ffa657" },
  ram_destroyer: { status: "UNSTABLE", percent: 40, color: "#ff7b72" },
  digital_chaos: { status: "CRITICAL", percent: 20, color: "#ff4b2b" },
  browser_meltdown: { status: "EVACUATE", percent: 5, color: "#ff1744" }
};

// State variables
let escapeCount = 0;
let isExhausted = false;
let isTransitioning = false;

// DOM Elements
const tabCountBadge = document.getElementById("tab-count-badge");
const heroCountNum = document.getElementById("hero-count-num");
const heroCountLabel = document.getElementById("hero-count-label");
const heroCountFlame = document.getElementById("hero-count-flame");
const roastContainer = document.getElementById("roast-container");
const tierBadge = document.getElementById("tier-badge");
const healthStatusElem = document.getElementById("health-status");
const healthFillElem = document.getElementById("health-fill");
const memeImg = document.getElementById("meme-img");
const memeFallback = document.getElementById("meme-fallback");
const verdictCardElem = document.querySelector(".verdict-card");
const roastTextElem = document.getElementById("roast-text");
const frameTagElem = document.getElementById("frame-tag") || document.querySelector(".frame-tag");
const escapeHintElem = document.getElementById("escape-hint");
const dodgingBtn = document.getElementById("dodging-btn");
const btnIconElem = document.getElementById("btn-icon");
const btnTextElem = document.getElementById("btn-text");
const trailContainer = document.getElementById("cursor-trail-container");

// Active trail elements pool
const activeTrailElements = [];
let lastTrailPoint = null;

// Local Audio Preloading & Playback
let audioNo = null;
let audioYes = null;

try {
  audioNo = new Audio("No.mp3");
  audioNo.preload = "auto";
} catch (e) {
  console.warn("Could not preload No.mp3:", e);
}

try {
  audioYes = new Audio("Yes.mp3");
  audioYes.preload = "auto";
} catch (e) {
  console.warn("Could not preload Yes.mp3:", e);
}

/**
 * Play No.mp3 on non-final evasive clicks
 */
function playNoSound() {
  if (audioNo) {
    try {
      audioNo.currentTime = 0;
      const p = audioNo.play();
      if (p !== undefined) {
        p.catch((err) => {
          console.warn("No.mp3 playback failed or was suppressed:", err);
        });
      }
    } catch (e) {
      console.warn("Error playing No.mp3:", e);
    }
  }
}

/**
 * Play Yes.mp3 immediately BEFORE the final stationary New Tab button appears
 */
function playYesSound() {
  if (audioYes) {
    try {
      audioYes.currentTime = 0;
      const p = audioYes.play();
      if (p !== undefined) {
        p.catch((err) => {
          console.warn("Yes.mp3 playback failed or was suppressed:", err);
        });
      }
    } catch (e) {
      console.warn("Error playing Yes.mp3:", e);
    }
  }
}

/**
 * Tab Counting with Safe Current-Tab Exclusion (Preserved Exactly)
 */
async function getEffectiveTabCount() {
  if (typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.query) {
    console.warn("chrome.tabs API not available in current environment. Using fallback count 1.");
    return 1;
  }

  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    let currentTab = null;

    try {
      if (chrome.tabs.getCurrent) {
        currentTab = await chrome.tabs.getCurrent();
      }
    } catch (e) {
      console.warn("chrome.tabs.getCurrent() threw an error:", e);
    }

    if (currentTab && typeof currentTab.id === "number") {
      // Safely filter out the temporary roast tab by exact ID
      const otherTabs = tabs.filter(tab => tab.id !== currentTab.id);
      return otherTabs.length;
    }

    // Safe anomaly fallback: Report without guessing or blind subtraction
    console.warn("Unable to identify current tab ID via chrome.tabs.getCurrent(). Using raw count.");
    return tabs.length;
  } catch (err) {
    console.error("Error querying tabs:", err);
    return 1;
  }
}

/**
 * Determine Tier and Render Meme, Roast & Health Indicator
 */
function selectMemeAndRoast(tabCount) {
  const tier = MEME_DATABASE.find(t => tabCount >= t.min && tabCount <= t.max) || MEME_DATABASE[0];
  const health = TIER_HEALTH_CONFIG[tier.category] || TIER_HEALTH_CONFIG.minimalist;

  // Update Hero Counter Display (Oversized Primary Visual Hierarchy)
  if (heroCountNum) {
    heroCountNum.textContent = String(tabCount);
  }
  if (heroCountLabel) {
    heroCountLabel.textContent = tabCount === 1 
      ? "OTHER TAB ALREADY OPEN" 
      : "OTHER TABS ALREADY OPEN";
  }
  if (heroCountFlame) {
    heroCountFlame.textContent = tabCount === 0 ? "✨" : tabCount >= 30 ? "💥" : "🔥";
  }
  if (roastContainer) {
    roastContainer.setAttribute("data-tier", tier.category);
  }

  // Update Header Badges
  const tabLabel = tabCount === 0 
    ? "✨ 0 OTHER TABS (SUSPICIOUS)" 
    : tabCount === 1 
      ? "🔥 1 OTHER TAB OPEN" 
      : `🔥 ${tabCount} OTHER TABS OPEN`;
  if (tabCountBadge) {
    tabCountBadge.textContent = tabLabel;
  }
  if (tierBadge) {
    tierBadge.textContent = tier.label;
  }

  // Update Cosmetic Browser Health Indicator
  if (healthStatusElem && healthFillElem) {
    healthStatusElem.textContent = health.status;
    healthStatusElem.style.color = health.color;
    healthFillElem.style.width = `${health.percent}%`;
    healthFillElem.style.backgroundColor = health.color;
  }

  // Pick random meme from the supplied meme collection (GIFs and JPEGs from Gif folder)
  const pool = (typeof SUPPLIED_MEME_POOL !== "undefined" && SUPPLIED_MEME_POOL.length > 0)
    ? SUPPLIED_MEME_POOL
    : tier.memes;
  const meme = pool[Math.floor(Math.random() * pool.length)];

  memeImg.onerror = () => {
    console.warn("Failed to load meme asset:", meme.src);
    memeImg.style.display = "none";
    memeFallback.classList.remove("hidden");
  };
  memeImg.onload = () => {
    memeImg.style.display = "block";
    memeFallback.classList.add("hidden");
  };
  memeImg.src = meme.src;
  memeImg.alt = meme.alt;

  // Pick random roast based on tabCount category (Immediate local render)
  const roast = tier.roasts[Math.floor(Math.random() * tier.roasts.length)];
  roastTextElem.textContent = roast;
  if (frameTagElem) {
    frameTagElem.textContent = "100% OFFLINE ROAST";
  }

  // Trigger snappy roast entrance animation
  if (verdictCardElem) {
    verdictCardElem.classList.remove("animate-roast");
    void verdictCardElem.offsetWidth;
    verdictCardElem.classList.add("animate-roast");
  }

  // Asynchronously request optional AI roast enhancement (local roast remains if AI fails or times out)
  enhanceWithAIRoast(tabCount, tier.category);
}

/**
 * Sanitize untrusted AI roast response text
 */
function sanitizeClientRoast(text) {
  if (typeof text !== "string") return null;
  const cleaned = text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || cleaned.length > 180) return null;
  return cleaned;
}

/**
 * Asynchronously request optional AI roast enhancement
 * Strict 5000ms timeout with silent local fallback
 */
async function fetchAIRoast(tabCount, category) {
  if (!CONFIG.AI_ROAST_ENDPOINT) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.AI_TIMEOUT_MS);

  try {
    const res = await fetch(CONFIG.AI_ROAST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ tabCount, category }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data && typeof data.roast === "string") {
      return sanitizeClientRoast(data.roast);
    }
    return null;
  } catch (err) {
    clearTimeout(timeoutId);
    // Silently fail to preserve local roast
    return null;
  }
}

/**
 * Asynchronously enhance local roast with AI if available
 */
function enhanceWithAIRoast(tabCount, category) {
  fetchAIRoast(tabCount, category)
    .then((aiRoast) => {
      if (aiRoast && roastTextElem) {
        roastTextElem.style.transition = "opacity 0.22s ease";
        roastTextElem.style.opacity = "0.2";
        setTimeout(() => {
          roastTextElem.textContent = aiRoast;
          roastTextElem.style.opacity = "1";
          if (frameTagElem) {
            frameTagElem.textContent = "AI-ENHANCED ROAST";
          }
        }, 180);
      }
    })
    .catch(() => {
      // Silently keep local roast
      if (frameTagElem) {
        frameTagElem.textContent = "100% OFFLINE ROAST";
      }
    });
}

/**
 * Position Clamping inside Viewport with Safe Margin (24px Minimum)
 * Accounts for CSS hover / animation scale factors (up to 1.25x)
 */
function clampPosition(targetX, targetY, width, height) {
  const effectiveW = Math.max(width, (dodgingBtn.offsetWidth || 150) * 1.15);
  const effectiveH = Math.max(height, (dodgingBtn.offsetHeight || 50) * 1.15);

  const minX = CONFIG.SAFE_MARGIN;
  const maxX = Math.max(minX, window.innerWidth - effectiveW - CONFIG.SAFE_MARGIN);
  const minY = CONFIG.SAFE_MARGIN;
  const maxY = Math.max(minY, window.innerHeight - effectiveH - CONFIG.SAFE_MARGIN);

  return {
    x: Math.max(minX, Math.min(maxX, Math.round(targetX))),
    y: Math.max(minY, Math.min(maxY, Math.round(targetY)))
  };
}

/**
 * Move Button to coordinates
 */
function setButtonPosition(x, y) {
  dodgingBtn.style.left = `${x}px`;
  dodgingBtn.style.top = `${y}px`;
}

/**
 * Initialize button position on load
 */
function initButtonPosition() {
  const btnW = dodgingBtn.offsetWidth || 160;
  const btnH = dodgingBtn.offsetHeight || 52;
  const initialX = Math.round((window.innerWidth - btnW) / 2);
  const initialY = Math.round(window.innerHeight * 0.78);
  const pos = clampPosition(initialX, initialY, btnW, btnH);
  setButtonPosition(pos.x, pos.y);
}

/**
 * Generate a New Safe Relocation Position Across Full Viewport
 * Ensures significant displacement from previous position
 */
function calculateNextEvasionPosition(currentLeft, currentTop, btnWidth, btnHeight) {
  const effectiveW = Math.max(btnWidth, (dodgingBtn.offsetWidth || 150) * 1.15);
  const effectiveH = Math.max(btnHeight, (dodgingBtn.offsetHeight || 50) * 1.15);

  const minX = CONFIG.SAFE_MARGIN;
  const maxX = Math.max(minX, window.innerWidth - effectiveW - CONFIG.SAFE_MARGIN);
  const minY = CONFIG.SAFE_MARGIN;
  const maxY = Math.max(minY, window.innerHeight - effectiveH - CONFIG.SAFE_MARGIN);

  let targetX = minX;
  let targetY = minY;
  let attempts = 0;

  do {
    targetX = minX + Math.random() * (maxX - minX);
    targetY = minY + Math.random() * (maxY - minY);
    attempts++;
  } while (
    attempts < 20 && 
    Math.hypot(targetX - currentLeft, targetY - currentTop) < Math.min(window.innerWidth, window.innerHeight) * 0.3
  );

  return clampPosition(targetX, targetY, btnWidth, btnHeight);
}

/**
 * Cursor-Following Text Trail Visual Effect ("click it")
 * Completely independent of button movement. Uses pointer-events: none.
 */
function initCursorTrail() {
  if (!trailContainer) return;

  window.addEventListener("mousemove", (e) => {
    const x = e.clientX;
    const y = e.clientY;

    if (!lastTrailPoint) {
      lastTrailPoint = { x, y };
      spawnTrailElement(x, y, 0);
      return;
    }

    const dx = x - lastTrailPoint.x;
    const dy = y - lastTrailPoint.y;
    const dist = Math.hypot(dx, dy);

    if (dist >= CONFIG.TRAIL_SPACING) {
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      spawnTrailElement(x, y, angle);
      lastTrailPoint = { x, y };
    }
  }, { passive: true });
}

function spawnTrailElement(x, y, angle) {
  if (!trailContainer) return;

  // Maintain max points in DOM
  while (activeTrailElements.length >= CONFIG.TRAIL_MAX_POINTS) {
    const old = activeTrailElements.shift();
    if (old && old.parentNode) {
      old.parentNode.removeChild(old);
    }
  }

  const span = document.createElement("span");
  span.className = "cursor-trail-item";
  span.textContent = CONFIG.TRAIL_TEXT;

  const randomRot = Math.round(angle + (Math.random() * 20 - 10));
  const randomDx = Math.round((Math.random() - 0.5) * 30);
  const randomDy = Math.round(-15 - Math.random() * 20);

  span.style.left = `${x}px`;
  span.style.top = `${y}px`;
  span.style.setProperty("--rot", `${randomRot}deg`);
  span.style.setProperty("--dx", `${randomDx}px`);
  span.style.setProperty("--dy", `${randomDy}px`);

  trailContainer.appendChild(span);
  activeTrailElements.push(span);

  setTimeout(() => {
    if (span.parentNode) {
      span.parentNode.removeChild(span);
    }
    const idx = activeTrailElements.indexOf(span);
    if (idx !== -1) activeTrailElements.splice(idx, 1);
  }, CONFIG.TRAIL_EXIT_DURATION);
}

/**
 * Execute Click-Triggered Evasion
 * Clicks 1 through HIDDEN_EVASION_LIMIT: relocate button, DO NOT NAVIGATE
 */
function executeClickEvasion() {
  if (isExhausted) return;

  escapeCount++;
  const isFinalEvasion = escapeCount >= HIDDEN_EVASION_LIMIT;

  if (isFinalEvasion) {
    // Play Yes.mp3 immediately BEFORE the final stationary New Tab button appears
    playYesSound();
  } else {
    // Play No.mp3 on every non-final evasive click
    playNoSound();
  }

  // Pick phrase from escalating list (strictly non-numeric)
  const phraseIndex = Math.min(escapeCount - 1, ESCALATING_BUTTON_PHRASES.length - 1);
  const phrase = ESCALATING_BUTTON_PHRASES[phraseIndex];

  btnTextElem.textContent = phrase.text;
  if (btnIconElem && phrase.icon) {
    btnIconElem.textContent = phrase.icon;
  }

  if (escapeHintElem) {
    escapeHintElem.textContent = "Your browser is aggressively avoiding tab creation.";
  }

  // Trigger escape animation
  dodgingBtn.classList.remove("evading", "panic");
  void dodgingBtn.offsetWidth; // Force reflow
  dodgingBtn.classList.add(phrase.isPanic ? "panic" : "evading");

  // Screen micro-shake on click
  document.body.classList.remove("screen-shake");
  void document.body.offsetWidth;
  document.body.classList.add("screen-shake");
  setTimeout(() => document.body.classList.remove("screen-shake"), 300);

  // Compute relocation using post-render bounding rect
  const currentRect = dodgingBtn.getBoundingClientRect();
  const nextPos = calculateNextEvasionPosition(
    currentRect.left, 
    currentRect.top, 
    currentRect.width, 
    currentRect.height
  );

  setButtonPosition(nextPos.x, nextPos.y);

  // Check if reached the secret random evasion limit
  if (isFinalEvasion) {
    enterExhaustedState();
  }
}

/**
 * Enter the Exhausted / Clickable State (After Hidden Limit is Reached)
 * Becomes permanently stationary and awaits next click to navigate
 */
function enterExhaustedState() {
  isExhausted = true;

  dodgingBtn.classList.remove("evading", "panic");
  dodgingBtn.classList.add("is-exhausted");

  btnTextElem.textContent = "Fine. Take your tab.";
  if (btnIconElem) {
    btnIconElem.textContent = "✓";
  }

  if (escapeHintElem) {
    escapeHintElem.textContent = "The browser has surrendered. Click to open your new tab.";
    escapeHintElem.style.color = "#38ef7d";
  }

  // Re-clamp position immediately for expanded button width
  const rect = dodgingBtn.getBoundingClientRect();
  const clamped = clampPosition(rect.left, rect.top, rect.width, rect.height);
  setButtonPosition(clamped.x, clamped.y);
}

/**
 * Tab Transition Sequence: Create explicit destination -> Remove roast tab (Preserved Exactly)
 */
async function handleDestinationTransition() {
  if (isTransitioning) return;
  isTransitioning = true;

  try {
    let currentTab = null;

    if (typeof chrome !== "undefined" && chrome.tabs) {
      try {
        if (chrome.tabs.getCurrent) {
          currentTab = await chrome.tabs.getCurrent();
        }
      } catch (err) {
        console.warn("Unable to get current tab during transition:", err);
      }

      // Explicitly create tab with CONFIG.DESTINATION_URL to avoid newtab recursion
      const newTab = await chrome.tabs.create({
        url: CONFIG.DESTINATION_URL,
        active: true
      });

      // Confirm new tab creation succeeded before removing roast tab
      if (newTab && typeof newTab.id === "number") {
        if (currentTab && typeof currentTab.id === "number") {
          try {
            await chrome.tabs.remove(currentTab.id);
          } catch (removeErr) {
            console.warn("Could not remove roast tab:", removeErr);
          }
        }
        return;
      }
    }
  } catch (err) {
    console.error("Tab transition failed via chrome.tabs:", err);
  }

  // Graceful fallback navigation if chrome.tabs failed or in standalone browser
  window.location.href = CONFIG.DESTINATION_URL;
}

/**
 * Button Click Handler — Strictly Click-Only Evasion
 * Clicks 1 through HIDDEN_EVASION_LIMIT: Relocate button (DO NOT navigate)
 * Click after exhaustion: Navigate to destination
 */
function handleButtonClick(e) {
  if (e && e.preventDefault) {
    e.preventDefault();
  }

  if (isExhausted) {
    // Next click after exhaustion: navigate to destination!
    handleDestinationTransition();
    return;
  }

  // Evade and relocate! (Zero navigation)
  executeClickEvasion();
}

/**
 * Handle Window Resize to maintain safe 24px viewport bounds
 */
function handleResize() {
  const currentLeft = parseFloat(dodgingBtn.style.left) || Math.round((window.innerWidth - (dodgingBtn.offsetWidth || 150)) / 2);
  const currentTop = parseFloat(dodgingBtn.style.top) || Math.round(window.innerHeight * 0.82);
  const clamped = clampPosition(currentLeft, currentTop, dodgingBtn.offsetWidth || 150, dodgingBtn.offsetHeight || 50);
  setButtonPosition(clamped.x, clamped.y);
}

/**
 * Initialization Orchestrator
 */
async function init() {
  // 1. Position dodging button in initial centered spot
  initButtonPosition();

  // 2. Query tab count
  const effectiveTabCount = await getEffectiveTabCount();

  // 3. Select meme, local roast, and health meter
  selectMemeAndRoast(effectiveTabCount);

  // 4. Initialize Cursor Text Trail Effect ("click it")
  initCursorTrail();

  // 5. Setup Click-Only interaction listener & window resize
  dodgingBtn.addEventListener("click", handleButtonClick);
  window.addEventListener("resize", handleResize, { passive: true });

  // Note: All proximity and autonomous movement listeners have been completely removed!
}

// Start once DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
