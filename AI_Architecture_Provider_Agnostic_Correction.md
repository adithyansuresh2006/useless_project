# FINAL ARCHITECTURE CORRECTION — MAKE AI PROVIDER-AGNOSTIC

Re-open `ARCHITECTURE.md` and make one final correction to the **optional AI roast architecture**.

**Important:** I have NOT decided to use OpenAI, GPT, Gemini, Claude, Groq, OpenRouter, or any other specific AI provider. Previous references to GPT/OpenAI were only examples.

## Required changes

1. Remove all provider-specific assumptions from the architecture.
2. Replace OpenAI-specific terminology with **Optional AI Roast Provider** / **AI Roast Service**.
3. The core extension MUST remain completely functional without any AI API, account, API key, or internet connection.
4. AI must remain an optional enhancement that is implemented **only after the complete local MVP has been tested**.
5. Do not hardcode or assume any specific:
   - AI provider
   - model
   - API endpoint
   - API key
6. Keep the AI integration provider-agnostic through a simple abstraction:

```text
Chrome Extension
       ↓
Optional AI Roast Service / Adapter
       ↓
Configured AI Provider
       ↓
Roast Text
```

The extension should only expect a safe text response. It should not depend on how or where the text was generated.

7. Make the eventual AI configuration conceptually configurable, for example:

```text
AI_PROVIDER
AI_API_ENDPOINT
AI_MODEL
AI_API_KEY
AI_TIMEOUT
```

These are conceptual configuration names only. The eventual implementation may use different configuration mechanisms depending on the provider selected.

8. API credentials must NEVER be embedded in the Chrome extension's client-side code. If an external provider is eventually used, use an appropriate secure server-side/proxy mechanism.

9. Preserve the local-first flow:

```text
Generate local roast
       ↓
Display immediately
       ↓
Optional AI enhancement
       ↓
AI unavailable/timeout/error?
       ↓
Keep local roast
```

10. Remove provider-specific references from:
    - AI architecture sections
    - environment-variable examples
    - API descriptions
    - diagrams
    - model references
    - security sections
    - implementation notes

11. Do **NOT** implement the AI integration. This is an architecture-only correction.

## MVP remains unchanged

The mandatory MVP is still:

- Manifest V3 New Tab override
- Current-window tab counting
- Correct exclusion of the temporary extension tab
- Local animated meme system
- Five-stage dodging mechanic
- Exhausted/clickable state
- Safe explicit-destination tab transition
- Local roast system

AI is **SHOULD HAVE / optional enhancement**, not a requirement.

## Final review

After making the changes, review the entire `ARCHITECTURE.md` once more and ensure there are **no remaining assumptions that a particular AI provider will be used**.

Do not make unrelated architectural changes.

End your report with exactly:

**`AI ARCHITECTURE PROVIDER-AGNOSTIC — READY FOR MVP IMPLEMENTATION`**
