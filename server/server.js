/**
 * Optional AI Roast Service / Serverless Proxy
 * OpenRouter Live Provider Configuration (Zero-Client-Secret Architecture)
 * Strictly accepts POST /api/roast with { tabCount, category }
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Auto-load environment variables from .env / .env.local if present (Zero external dependencies)
function loadEnvFiles() {
  const possiblePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '..', '.env.local'),
    path.resolve(__dirname, '..', '..', '.env'),
    path.resolve(__dirname, '..', '..', '.env.local')
  ];

  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const match = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/);
          if (match) {
            const key = match[1];
            let val = match[2].trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      } catch (e) {
        // Silently skip
      }
    }
  }
}
loadEnvFiles();

// Environment Configuration (Server-Side Only - Never Exposed to Browser)
const CONFIG = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  AI_PROVIDER: process.env.AI_PROVIDER || 'openrouter', // 'openrouter' | 'mock' | 'gemini' | 'openai'
  AI_API_KEY: process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '',
  AI_API_ENDPOINT: process.env.AI_API_ENDPOINT || 'https://openrouter.ai/api/v1/chat/completions',
  AI_MODEL: process.env.AI_MODEL || 'openrouter/free',
  AI_TIMEOUT_MS: Math.max(parseInt(process.env.AI_TIMEOUT_MS || '8000', 10), 8000),
  MAX_BODY_BYTES: 4096
};

// Allowed category enum for strict input validation
const VALID_CATEGORIES = new Set([
  'minimalist',
  'multitasker',
  'hoarder',
  'ram_destroyer',
  'digital_chaos',
  'browser_meltdown'
]);

// Dynamic comedic fallback roasts for offline/mock mode (Dark, witty observational humor)
const MOCK_AI_ROAST_POOL = {
  minimalist: [
    "Under five tabs. Either you're incredibly focused or you're actively destroying evidence.",
    "One tab open. Your browser is so clean it looks like a digital crime scene after cleanup.",
    "Such suspicious restraint. Chrome is waiting for the inevitable psychotic break."
  ],
  multitasker: [
    "Seven tabs open. That's seven different abandoned dreams running in parallel.",
    "Your tabs aren't unfinished tasks anymore. They're digital witnesses to your procrastination.",
    "Chrome isn't managing your workflow anymore. It's quietly documenting the collapse."
  ],
  hoarder: [
    "That tab has been open so long it qualifies as an archaeological excavation site.",
    "Your tab bar isn't a workspace. It's a digital graveyard with high-speed Wi-Fi.",
    "Those fifteen tabs have outlived the reason you opened them in the first place."
  ],
  ram_destroyer: [
    "Chrome is still running, technically. Your RAM has already started drafting its will.",
    "Your laptop cooling fan sounds like a commercial flight experiencing rapid cabin depressurization.",
    "Opening one more tab will officially grant your CPU the right to seek political asylum."
  ],
  digital_chaos: [
    "Your favicons have dissolved into subatomic dust. This isn't browsing, it's digital decay.",
    "Somewhere in those forty tabs an audio stream is playing a funeral march for your battery.",
    "Your operating system is running purely on spite and thermal throttling."
  ],
  browser_meltdown: [
    "At this stage, closing Chrome would require HAZMAT clearance and grief counseling.",
    "Your open tabs have formed a sovereign nation with their own failing economy.",
    "The fire department called. Even they refuse to touch your Chrome window."
  ]
};

/**
 * Sanitize AI roast output (strips reasoning traces, quotes, extracts final punchline)
 */
function sanitizeRoast(raw) {
  if (typeof raw !== 'string') return null;

  // Reject safety refusals or model error strings
  const lowerRaw = raw.toLowerCase();
  if (
    lowerRaw.includes("safety") ||
    lowerRaw.includes("harassment") ||
    lowerRaw.includes("i cannot") ||
    lowerRaw.includes("as an ai") ||
    lowerRaw.includes("content policy") ||
    lowerRaw.includes("inappropriate")
  ) {
    return null;
  }

  // Remove thinking blocks, code blocks, HTML tags, script tags
  let text = raw
    .replace(/<think[\s\S]*?<\/think>/gi, '')
    .replace(/Here'?s a thinking process:[\s\S]*?(\n\n|\n-|$)/gi, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, '');

  // If the model leaked reasoning steps or drafts, isolate the candidate lines
  const lines = text
    .split(/\r?\n/)
    .map(l => l.replace(/[*_#"`]/g, '').trim())
    .filter(l => {
      if (!l) return false;
      const lower = l.toLowerCase();
      if (/^(analyze|deconstruct|constraints|format|rules|step \d|draft|notes|tone|target|output):/i.test(l)) return false;
      if (/^\d+\.\s*(analyze|deconstruct|draft|identify|assess|check)/i.test(l)) return false;
      if (lower.includes("character count") || lower.includes("word count") || lower.includes("strictly satisfies")) return false;
      return true;
    });

  let candidate = lines.length > 0 ? lines[lines.length - 1] : text;

  let cleaned = candidate
    .replace(/\(\d+\)/g, '')
    .replace(/([a-zA-Z])\d{1,2}(?=\s|[.,!?]|$)/g, '$1')
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .replace(/^(roast|final roast|output|result):\s*/i, '')
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned || cleaned.length < 10) return null;

  // Enforce length limit (max 150 chars)
  if (cleaned.length > 150) {
    cleaned = cleaned.substring(0, 147).trim() + '...';
  }

  return cleaned;
}

/**
 * Generate AI Roast via OpenRouter (or configured provider / mock mode)
 */
async function generateAIRoast(tabCount, category) {
  // 1. Mock Provider Mode or Missing Key Fallback
  if (CONFIG.AI_PROVIDER === 'mock' || !CONFIG.AI_API_KEY) {
    const list = MOCK_AI_ROAST_POOL[category] || MOCK_AI_ROAST_POOL.hoarder;
    const picked = list[Math.floor(Math.random() * list.length)];
    return sanitizeRoast(picked);
  }

  // 2. OpenRouter / OpenAI-Compatible Provider Adapter
  if (CONFIG.AI_PROVIDER === 'openrouter' || CONFIG.AI_PROVIDER === 'openai') {
    const endpoint = CONFIG.AI_API_ENDPOINT || 'https://openrouter.ai/api/v1/chat/completions';
    const model = CONFIG.AI_MODEL || 'openrouter/free';

    const systemPrompt = "You are a witty, satirical browser investigator delivering deadpan roasts about excessive Chrome tabs. Structure: Observation -> Dark Escalation -> Punchline (think: digital decay, historical crime scenes of unfinished tasks, laptop existential dread). Rules: PG-13 friendly satire, one or two short sentences, plain text only, no quotes, no markdown, no emojis, no preambles. Output ONLY the roast sentence.";
    const userPrompt = `Roast a user who has ${tabCount} tabs open (${category} tier). Deliver one witty, darkly comedic observational joke about their browser tabs with a punchline.`;

    const payload = JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.82,
      max_tokens: 250
    });

    const parsedUrl = new URL(endpoint);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.AI_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Useless New Tab Roaster',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: CONFIG.AI_TIMEOUT_MS
    };

    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const json = JSON.parse(data);
              const text = json.choices?.[0]?.message?.content;
              resolve(sanitizeRoast(text));
            } else {
              // Log status without leaking secrets
              console.warn(`[OpenRouter] Upstream returned HTTP ${res.statusCode}`);
              resolve(null);
            }
          } catch (e) {
            console.warn('[OpenRouter] Error parsing upstream response');
            resolve(null);
          }
        });
      });

      req.on('error', (err) => {
        console.warn('[OpenRouter] Network connection error');
        resolve(null);
      });

      req.on('timeout', () => {
        req.destroy();
        console.warn('[OpenRouter] Upstream request timed out');
        resolve(null);
      });

      req.write(payload);
      req.end();
    });
  }

  // 3. Gemini Provider Mode
  if (CONFIG.AI_PROVIDER === 'gemini') {
    const model = CONFIG.AI_MODEL || 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${CONFIG.AI_API_KEY}`;
    const prompt = `You are a sarcastic comedic browser assistant. Generate ONE short roast (maximum 15 words) about a user having ${tabCount} Chrome tabs open in the '${category}' category. Output plain text only. No markdown, no quotes, no emojis, no hate, no HTML.`;

    const payload = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 40, temperature: 0.8 }
    });

    const parsedUrl = new URL(endpoint);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: CONFIG.AI_TIMEOUT_MS
    };

    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const json = JSON.parse(data);
              const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
              resolve(sanitizeRoast(text));
            } else {
              console.warn(`[Gemini] Upstream returned HTTP ${res.statusCode}`);
              resolve(null);
            }
          } catch (e) {
            console.warn('[Gemini] Error parsing upstream response');
            resolve(null);
          }
        });
      });

      req.on('error', (err) => {
        console.warn('[Gemini] Network connection error');
        resolve(null);
      });

      req.on('timeout', () => {
        req.destroy();
        console.warn('[Gemini] Upstream request timed out');
        resolve(null);
      });

      req.write(payload);
      req.end();
    });
  }

  return null;
}

/**
 * HTTP Request Handler
 */
const server = http.createServer(async (req, res) => {
  // CORS Headers for Chrome Extension
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Endpoint: POST /api/roast
  if (req.method === 'POST' && (parsedUrl.pathname === '/api/roast' || parsedUrl.pathname === '/roast')) {
    let body = '';
    let bodyLength = 0;

    req.on('data', (chunk) => {
      body += chunk;
      bodyLength += chunk.length;
      if (bodyLength > CONFIG.MAX_BODY_BYTES) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
          return;
        }

        const { tabCount, category } = parsed;

        // 1. Validate tabCount
        if (typeof tabCount !== 'number' || !Number.isInteger(tabCount) || tabCount < 0 || tabCount > 10000) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid tabCount: must be a positive integer' }));
          return;
        }

        // 2. Validate category
        if (typeof category !== 'string' || !VALID_CATEGORIES.has(category)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid category: must be a valid tier string' }));
          return;
        }

        // 3. Generate roast
        const aiRoast = await generateAIRoast(tabCount, category);

        if (aiRoast) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ roast: aiRoast }));
        } else {
          // Graceful fallback response when provider is unreachable or failed
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'AI provider unavailable' }));
        }
      } catch (err) {
        console.error('Server error handling /api/roast:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });

    return;
  }

  // Health check endpoint
  if (req.method === 'GET' && (parsedUrl.pathname === '/health' || parsedUrl.pathname === '/api/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', provider: CONFIG.AI_PROVIDER, model: CONFIG.AI_MODEL }));
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Start server if executed directly
if (require.main === module) {
  server.listen(CONFIG.PORT, () => {
    console.log(`[AI Roast Proxy] Server running on port ${CONFIG.PORT} (Provider: ${CONFIG.AI_PROVIDER}, Model: ${CONFIG.AI_MODEL})`);
  });
}

module.exports = { server, generateAIRoast, sanitizeRoast, CONFIG };
