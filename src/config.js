/**
 * src/config.js
 * ---------------------------------------------------------------------------
 * All tunable constants live here: display size, colours, player stats,
 * map-generation bounds, and — most importantly — the AI on/off flag and the
 * placeholder AI endpoint URL.
 *
 * This file is plain data. It must never import or call anything.
 */
(function (RG) {
  'use strict';

  RG.Config = {
    // ---- Display (portrait, roughly 720x960) ----
    GAME_WIDTH: 720,
    GAME_HEIGHT: 960,

    // ---- Map generation ----
    FLOORS_MIN: 5,
    FLOORS_MAX: 7,
    // Set SEED to an integer to force the same map every run (useful for
    // testing). Leave null for a fresh, random map each run.
    SEED: null,

    // ---- Player baseline ----
    PLAYER: {
      maxHp: 60,
      attack: 12,
    },
    // Fraction of max HP recovered at a "rest" node.
    REST_HEAL_PERCENT: 0.5,
    TREASURE: {
      goldBase: 10,     // base gold from a treasure node
      goldPerFloor: 3,  // extra gold per floor reached
      heal: 6,          // small hp top-up from the "stale ration" in the cache
    },
    COMBAT: {
      // The Defend action halves the next incoming hit.
      defendReduction: 0.5,
    },

    // ---- AI (mystery events only) ----
    AI: {
      // OFF by default. Until this is true the game uses ONLY the
      // hand-written fallback events in src/data/events.js and never makes
      // a network request, so it stays fully playable offline.
      enabled: false,

      // Placeholder endpoint. This is intentionally NOT a real AI provider.
      //
      //   >>> SECURITY: never put a real API key anywhere in this repo. <<<
      //
      // Everything under src/ ships to the browser on GitHub Pages, so any
      // key written here would be public. Point this at a small serverless
      // proxy (Cloudflare Worker / Vercel / Netlify function) that you own
      // and that holds the real key server-side. See README.md and
      // src/ai/aiClient.js for the exact request/response contract.
      endpoint: 'https://YOUR-PROXY.example.com/api/event',
      timeoutMs: 6000,
    },

    // ---- Palette ----
    COLORS: {
      bg: 0x0a0916,
      bgDeep: 0x06050d,
      panel: 0x14111f,
      panelEdge: 0x2c2540,
      text: 0xe6dcc3,
      textDim: 0x8f8796,
      gold: 0xe0b04a,
      hpFill: 0x57b06a,
      hpLow: 0xc94f45,
      hpBack: 0x3a1f22,
      player: 0xe8c06a,
    },

    // ---- Node type metadata (label + accent colour) ----
    NODE_META: {
      combat:   { label: 'Combat',   color: 0xd4534a },
      mystery:  { label: 'Mystery',  color: 0x9a7ae0 },
      treasure: { label: 'Treasure', color: 0xd9a03a },
      rest:     { label: 'Rest',     color: 0x58a35c },
      boss:     { label: 'Boss',     color: 0xb0362f },
    },

    // ---- Typography (system fonts only — no external font dependency) ----
    FONT: {
      heading: 'Georgia, "Times New Roman", serif',
      body: 'Georgia, "Times New Roman", serif',
    },
  };
})(window.RG = window.RG || {});
