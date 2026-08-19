/**
 * src/ai/aiClient.js
 * ---------------------------------------------------------------------------
 * The ISOLATED AI integration layer. This is the ONLY file in the project
 * that would ever talk to an AI API, and it is OFF by default.
 *
 * Design rules enforced here:
 *   1. When RG.Config.AI.enabled is false (the default), the game uses only
 *      the hand-written fallback events in src/data/events.js and never makes
 *      a network request.
 *   2. When enabled, we build a strict prompt that instructs the AI to return
 *      ONLY a JSON object with the exact shape of a fallback event
 *      (title / text / choices[] with label / effects / result).
 *   3. Every response is validated hard before use. Invalid shape, wrong
 *      choice count, non-numeric or out-of-range effects, or a network error
 *      all SILENTLY fall back to a random hand-written event. The player
 *      never sees a broken state.
 *   4. AI never controls raw game state. It can only propose content. The
 *      game code applies validated effects via RG.State.applyEffects().
 *
 * ---------------------------------------------------------------------------
 * >>> SECURITY — READ THIS BEFORE ENABLING <<<
 * ---------------------------------------------------------------------------
 * NEVER put a real AI API key in this file (or anywhere in this repo).
 * Everything under src/ is served as static files, so a key written here
 * would be public on GitHub Pages and could be stolen.
 *
 * The supported pattern is a SERVERLESS PROXY that you host, which holds the
 * key server-side and calls the AI provider on your behalf:
 *
 *    browser  --POST-->  your proxy  --POST(Authorization: Bearer KEY)-->  AI provider
 *    browser  <--JSON--  your proxy  <--JSON-----------------------------  AI provider
 *
 * The proxy is a tiny Cloudflare Worker / Vercel function / Netlify function.
 * Set RG.Config.AI.endpoint to the proxy's URL. The request/response contract
 * is below so any proxy you write will "just work".
 *
 *   REQUEST  (POST, JSON body)
 *   {
 *     "system": "<rules + exact JSON contract, same as buildSystemPrompt()>",
 *     "user":   "<player context: current HP, floor, a hint>"
 *   }
 *
 *   RESPONSE (HTTP 200, JSON body) — your proxy should forward the provider's
 *   completion as a STRING in `completion`:
 *   {
 *     "completion": "{\"title\":\"...\",\"text\":\"...\",\"choices\":[...]}"
 *   }
 *
 * The proxy is responsible for holding the key and calling the provider; this
 * file is provider-agnostic on purpose (works with any OpenAI-compatible chat
 * completion API, Anthropic, etc. — the proxy adapts).
 */
(function (RG) {
  'use strict';

  // The exact JSON contract the AI must satisfy (mirrors the fallback events
  // in src/data/events.js). Keep this in sync with that file.
  const EVENT_SCHEMA = {
    title: 'string (short, evocative)',
    text: 'string (1-3 sentences of scene text)',
    choices: 'array of 2 or 3 objects: { label: string, effects: { hp?, gold?, maxHp? } , result: string }',
  };

  // ---- Prompt construction -------------------------------------------------

  function buildSystemPrompt() {
    return [
      'You are the narrator of "Fallowmire", a dark folk-horror roguelike game.',
      'Tone: dark fantasy and folk-horror, suitable for all ages. No gore, no profanity, no sexual content, no real-world references.',
      '',
      'Write ONE short "mystery event" for a traveler in a haunted marshland.',
      'Return ONLY a single valid JSON object, with no markdown fences, no code fences, and no text before or after the JSON.',
      'The JSON object must have EXACTLY this shape:',
      JSON.stringify({
        title: 'short title',
        text: '1-3 sentences of scene text',
        choices: [
          { label: 'choice label', effects: { hp: 0, gold: 0, maxHp: 0 }, result: 'one sentence result' },
          { label: 'choice label', effects: { hp: 0, gold: 0, maxHp: 0 }, result: 'one sentence result' },
        ],
      }),
      '',
      'Rules:',
      '- choices: exactly 2 or 3 entries.',
      '- each choice needs: label (string), effects (object), result (one sentence).',
      '- effects may include any subset of keys hp, gold, maxHp.',
      '- every effect value must be an INTEGER between -10 and +10 inclusive.',
      '- "hp" is current hit points, "gold" is money, "maxHp" is maximum hit points.',
      '- choices should feel like real trade-offs; at least one choice should have at least one non-zero effect.',
      '- do not repeat the exact title or text of an event I give you.',
    ].join('\n');
  }

  function buildUserPrompt(ctx) {
    const hint = pickHint();
    return [
      'Current run context:',
      '  - player HP: ' + ctx.hp + ' / ' + ctx.maxHp,
      '  - player gold: ' + ctx.gold,
      '  - floor: ' + (ctx.floor + 1) + ' of ' + ctx.numFloors,
      '',
      'Previous event titles to avoid repeating: ' + (ctx.recentTitles && ctx.recentTitles.length ? ctx.recentTitles.join(', ') : '(none)'),
      '',
      'Inspiration seed: ' + hint,
    ].join('\n');
  }

  const HINTS = [
    'a strange object half-buried in the marsh',
    'a whispered bargain offered by something unseen',
    'a silent figure that asks for help but will not show its face',
    'a feast or shrine left for a spirit of the fens',
    'a riddle whose answer changes the path ahead',
    'an object that hums or glows with old magic',
    'a warning carved into a tree or stone',
    'a creature watching from the reeds that never attacks',
    'a door, gate, or bridge that demands a toll',
    'a relic from a long-dead village',
  ];
  function pickHint() {
    return HINTS[(RG.RNG && RG.RNG.integerInRange) ? RG.RNG.integerInRange(0, HINTS.length - 1) : Math.floor(Math.random() * HINTS.length)];
  }

  // ---- Strict validation ---------------------------------------------------

  function isInt(v) { return typeof v === 'number' && Number.isFinite(v) && Math.floor(v) === v; }
  function inRange(v) { return isInt(v) && v >= -10 && v <= 10; }

  function isNonEmptyString(v) {
    return typeof v === 'string' && v.trim().length > 0 && v.length <= 500;
  }

  /**
   * Validate a parsed object against the event contract.
   * Returns { ok: boolean, event?: object, reason?: string }.
   */
  function validateEvent(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return { ok: false, reason: 'not an object' };
    }
    if (!isNonEmptyString(obj.title)) {
      return { ok: false, reason: 'title missing/invalid' };
    }
    if (!isNonEmptyString(obj.text) || obj.text.split(/\s+/).length > 160) {
      return { ok: false, reason: 'text missing or too long' };
    }
    if (!Array.isArray(obj.choices) || obj.choices.length < 2 || obj.choices.length > 3) {
      return { ok: false, reason: 'choices must be 2-3' };
    }

    const sanitized = { title: obj.title.trim(), text: obj.text.trim(), choices: [] };

    for (let i = 0; i < obj.choices.length; i++) {
      const c = obj.choices[i];
      if (!c || typeof c !== 'object' || Array.isArray(c)) {
        return { ok: false, reason: 'choice ' + i + ' not an object' };
      }
      if (!isNonEmptyString(c.label) || c.label.length > 60) {
        return { ok: false, reason: 'choice ' + i + ' label invalid' };
      }
      if (!isNonEmptyString(c.result)) {
        return { ok: false, reason: 'choice ' + i + ' result missing' };
      }

      const effects = { hp: 0, gold: 0, maxHp: 0 };
      const raw = c.effects;
      if (raw !== undefined && raw !== null) {
        if (typeof raw !== 'object' || Array.isArray(raw)) {
          return { ok: false, reason: 'choice ' + i + ' effects not an object' };
        }
        for (const key of ['hp', 'gold', 'maxHp']) {
          if (raw[key] === undefined || raw[key] === null) continue;
          const v = raw[key];
          if (typeof v === 'string' && v.trim() !== '') {
            // tolerate numeric strings from sloppy models
            if (!/^-?\d+$/.test(v.trim())) return { ok: false, reason: 'choice ' + i + ' effects.' + key + ' not an integer' };
            effects[key] = parseInt(v, 10);
          } else if (isInt(v)) {
            effects[key] = v;
          } else {
            return { ok: false, reason: 'choice ' + i + ' effects.' + key + ' not an integer' };
          }
          if (!inRange(effects[key])) {
            return { ok: false, reason: 'choice ' + i + ' effects.' + key + ' out of range (-10..10)' };
          }
        }
      }

      sanitized.choices.push({ label: c.label.trim(), effects: effects, result: c.result.trim() });
    }

    return { ok: true, event: sanitized };
  }

  /**
   * Parse a raw provider string into JSON. Handles markdown fences, stray
   * prose around the JSON, and finds the first {...} block. Returns null on
   * failure.
   */
  function extractJson(text) {
    if (typeof text !== 'string') return null;
    let t = text.trim();
    // strip ```json ... ``` fences
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
    try {
      return JSON.parse(t);
    } catch (e) { /* fall through to brace extraction */ }

    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(t.slice(start, end + 1));
    } catch (e) {
      return null;
    }
  }

  // ---- Request / response / orchestration ----------------------------------

  /**
   * Fetch a single event from the proxy endpoint with a timeout.
   * Returns { ok, completion? , status?, error? }.
   */
  function requestEvent(payload) {
    const endpoint = RG.Config.AI.endpoint;
    const timeoutMs = RG.Config.AI.timeoutMs || 6000;

    return new Promise(function (resolve) {
      const controller = ('AbortController' in window) ? new AbortController() : null;
      const timer = setTimeout(function () {
        if (controller) controller.abort();
        resolve({ ok: false, error: 'timeout' });
      }, timeoutMs);

      const opts = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      };
      if (controller) opts.signal = controller.signal;

      fetch(endpoint, opts)
        .then(function (res) {
          clearTimeout(timer);
          if (!res.ok) {
            return resolve({ ok: false, status: res.status, error: 'http ' + res.status });
          }
          return res.json().then(function (json) {
            resolve({ ok: true, status: res.status, body: json });
          }).catch(function () {
            resolve({ ok: false, status: res.status, error: 'bad json response' });
          });
        })
        .catch(function (err) {
          clearTimeout(timer);
          resolve({ ok: false, error: (err && err.name === 'AbortError') ? 'timeout' : 'network' });
        });
    });
  }

  /**
   * Resolve a single mystery event.
   *
   * @param {object} ctx  { hp, maxHp, gold, floor, numFloors, recentTitles }
   * @param {function} onEvent  callback(event) — called with the final event
   *                            (AI-validated or fallback) exactly once.
   * @returns {string} 'ai' | 'fallback' — which source supplied the event.
   *
   * When AI is enabled but anything goes wrong, the onEvent callback still
   * receives a random hand-written fallback event. This function NEVER
   * rejects, so callers can always trust onEvent.
   */
  function getMysteryEvent(ctx, onEvent) {
    const c = ctx || {};

    // 1) AI disabled (default): pure fallback, zero network activity.
    if (!RG.Config.AI || !RG.Config.AI.enabled) {
      const ev = RG.EVENTS.pick(c.recentTitles && c.recentTitles[0]);
      onEvent(ev);
      return 'fallback';
    }

    // 2) AI enabled: build the strict prompt and call the proxy.
    const payload = {
      system: buildSystemPrompt(),
      user: buildUserPrompt(c),
    };

    requestEvent(payload).then(function (res) {
      // Extract the completion string from any reasonable proxy shape.
      let raw = null;
      if (res.ok && res.body) {
        raw = res.body.completion
          || res.body.text
          || res.body.content
          || res.body.message
          || null;
        // Some proxies may return an OpenAI-style choices array.
        if (!raw && Array.isArray(res.body.choices) && res.body.choices[0]) {
          const ch = res.body.choices[0];
          raw = ch.text || (ch.message && ch.message.content) || null;
        }
      }

      const parsed = raw ? extractJson(raw) : null;
      const check = parsed ? validateEvent(parsed) : { ok: false, reason: 'no JSON' };

      if (check.ok) {
        onEvent(check.event);
        return;
      }

      // 3) Silent fallback on any failure — the player never sees the error.
      //    (Log to console only, so a developer can debug their proxy.)
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[aiClient] falling back to hand-written event.', res && res.error ? res.error : (check && check.reason));
      }
      onEvent(RG.EVENTS.pick(c.recentTitles && c.recentTitles[0]));
    });

    return 'ai';
  }

  // Expose internals for testing/debugging without letting them change state.
  RG.AI = {
    getMysteryEvent: getMysteryEvent,
    validateEvent: validateEvent,
    buildSystemPrompt: buildSystemPrompt,
    buildUserPrompt: buildUserPrompt,
    extractJson: extractJson,
    _schema: EVENT_SCHEMA,
  };
})(window.RG = window.RG || {});
