/**
 * src/ui/textures.js
 * ---------------------------------------------------------------------------
 * Code-generated placeholder art. The game runs with ZERO external art files:
 * every sprite is a coloured shape rasterized with Phaser Graphics into a
 * texture. This keeps the game fully playable offline and self-contained.
 *
 * HOW TO SWAP IN REAL ART (later):
 *   1. Put your images under assets/images/... using the exact paths in the
 *      IMAGE_PROMPTS table (see README.md).
 *   2. Add the matching this.load.image(key, path) lines in BootScene.preload()
 *      (the exact lines are written out there).
 *   3. That's it — every sprite in the game references these keys already:
 *        player, enemy-thorn, enemy-willow, enemy-moth, enemy-hedge,
 *        enemy-dredge, enemy-boss, background
 */
(function (RG) {
  'use strict';

  const C = RG.Config.COLORS;

  function solid(scene, key, width, height, color) {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(color, 1);
    g.fillRect(0, 0, width, height);
    g.generateTexture(key, width, height);
    g.destroy();
  }

  /** A glowing candle / will-o'-wisp marker for the player token. */
  function makePlayerToken(scene) {
    const key = 'player';
    if (scene.textures.exists(key)) return;
    const s = 44;
    const g = scene.make.graphics({ x: 0, y: 0 });

    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(s / 2, s - 6, s / 2, 9);

    g.fillStyle(0x1a1226, 1);
    g.fillRoundedRect(s / 2 - 4, s / 2 - 2, 8, 22, 3); // candle body
    g.fillStyle(0x9a7ae0, 1);
    g.fillCircle(s / 2, s / 2 - 8, 7);                 // flame glow
    g.fillStyle(0xe8c06a, 1);
    g.fillCircle(s / 2, s / 2 - 8, 3.5);               // flame core

    g.generateTexture(key, s, s);
    g.destroy();
  }

  /** A simple candle that mirrors the player token (treasure chest stand-in). */
  function makeCandle(scene) {
    const key = 'treasure';
    if (scene.textures.exists(key)) return;
    const s = 40;
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x1a1226, 1);
    g.fillRoundedRect(s / 2 - 3, s / 2, 6, 18, 2);
    g.fillStyle(0xd9a03a, 1);
    g.fillCircle(s / 2, s / 2 - 4, 7);
    g.fillStyle(0xffe9a8, 1);
    g.fillCircle(s / 2, s / 2 - 4, 3);
    g.generateTexture(key, s, s);
    g.destroy();
  }

  /** A small white moon (rest node). */
  function makeMoon(scene) {
    const key = 'rest';
    if (scene.textures.exists(key)) return;
    const s = 44;
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x3a4a5a, 1);
    g.fillCircle(s / 2, s / 2, 14);
    g.fillStyle(0x0a0916, 1);
    g.fillCircle(s / 2 - 6, s / 2 - 2, 11);
    g.generateTexture(key, s, s);
    g.destroy();
  }

  /** An upright question-mark slab (mystery node). */
  function makeQuestion(scene) {
    const key = 'question';
    if (scene.textures.exists(key)) return;
    const s = 44;
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x1f1833, 1);
    g.fillRoundedRect(6, 2, s - 12, s - 4, 8);
    g.lineStyle(3, 0x9a7ae0, 1);
    g.strokeRoundedRect(6, 2, s - 12, s - 4, 8);
    g.fillStyle(0x9a7ae0, 1);
    g.fillCircle(s / 2, 13, 4);
    g.fillRoundedRect(s / 2 - 2.5, 18, 5, 10, 2);
    g.fillRect(s / 2 - 2.5, 30, 5, 4);
    g.generateTexture(key, s, s);
    g.destroy();
  }

  /** Crossed swords (combat node). */
  function makeSwords(scene) {
    const key = 'combat';
    if (scene.textures.exists(key)) return;
    const s = 48;
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.lineStyle(3, 0xd4534a, 1);
    g.lineBetween(10, 8, s - 10, s - 8);
    g.lineBetween(s - 10, 8, 10, s - 8);
    g.lineStyle(2, 0x8f8796, 1);
    g.lineBetween(16, 6, 8, 2);
    g.lineBetween(s - 16, s - 6, s - 8, s - 2);
    g.generateTexture(key, s, s);
    g.destroy();
  }

  /** A crowned skull (boss node). */
  function makeBoss(scene) {
    const key = 'boss';
    if (scene.textures.exists(key)) return;
    const s = 56;
    const g = scene.make.graphics({ x: 0, y: 0 });
    // crown
    g.fillStyle(0xe0b04a, 1);
    g.fillTriangle(16, 10, 20, 4, 24, 10);
    g.fillTriangle(23, 10, 28, 3, 33, 10);
    g.fillTriangle(32, 10, 36, 4, 40, 10);
    g.fillRect(15, 10, 26, 4);
    // skull
    g.fillStyle(0xe6dcc3, 1);
    g.fillCircle(s / 2, 30, 11);
    g.fillRect(s / 2 - 11, 28, 22, 12);
    g.fillRect(s / 2 - 8, 40, 16, 7);
    // eyes
    g.fillStyle(0x0a0916, 1);
    g.fillCircle(s / 2 - 4, 28, 3);
    g.fillCircle(s / 2 + 4, 28, 3);
    g.generateTexture(key, s, s);
    g.destroy();
  }

  /**
   * Enemy placeholder generator. All enemies share a base silhouette with
   * per-enemy colour / size / spikes / halo so they read as distinct while
   * still clearly being placeholders.
   */
  function makeEnemy(scene, def) {
    if (scene.textures.exists(def.key)) return;
    const tierSizes = { small: 64, medium: 78, large: 92, boss: 120 };
    const s = tierSizes[def.tier] || 78;
    const c = def.tier === 'boss' ? 0x9a3a30 : def.color;
    const g = scene.make.graphics({ x: 0, y: 0 });

    // soft shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(s / 2, s - 8, s / 2, 11);

    // spiky halo (danger read)
    if (def.spikes) {
      g.fillStyle(c, 0.35);
      const spikes = def.tier === 'boss' ? 12 : 8;
      for (let i = 0; i < spikes; i++) {
        const a = (i / spikes) * Math.PI * 2;
        g.fillTriangle(
          s / 2 + Math.cos(a) * 12, s / 2 - 16 + Math.sin(a) * 12,
          s / 2 + Math.cos(a + 0.25) * 24, s / 2 - 16 + Math.sin(a + 0.25) * 24,
          s / 2 + Math.cos(a - 0.25) * 24, s / 2 - 16 + Math.sin(a - 0.25) * 24
        );
      }
    }

    // body blob
    g.fillStyle(c, 1);
    g.fillEllipse(s / 2, s / 2, s * 0.32, s * 0.38);
    // crown / top knot
    g.fillStyle(lighten(c, 20), 1);
    g.fillTriangle(s / 2 - 10, s / 4 - 6, s / 2 + 10, s / 4 - 6, s / 2, s / 4 - 26);

    // eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(s / 2 - 7, s / 2 - 4, 5);
    g.fillCircle(s / 2 + 7, s / 2 - 4, 5);
    g.fillStyle(0x1a0f14, 1);
    g.fillCircle(s / 2 - 7, s / 2 - 4, 2.2);
    g.fillCircle(s / 2 + 7, s / 2 - 4, 2.2);

    g.generateTexture(def.key, s, s);
    g.destroy();
  }

  function lighten(hex, amt) {
    const r = Math.min(255, ((hex >> 16) & 255) + amt);
    const g = Math.min(255, ((hex >> 8) & 255) + amt);
    const b = Math.min(255, (hex & 255) + amt);
    return (r << 16) | (g << 8) | b;
  }

  /** Very dark blue-purple gradient backdrop with a pale moon. */
  function makeBackground(scene) {
    const key = 'background';
    if (scene.textures.exists(key)) return;
    const w = 720, h = 960;
    const g = scene.make.graphics({ x: 0, y: 0 });
    const steps = 26;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const r = Math.round(6 + 6 * t);
      const gg = Math.round(5 + 8 * t);
      const b = Math.round(13 + 26 * t);
      const col = (r << 16) | (gg << 8) | b;
      g.fillStyle(col, 1);
      g.fillRect(0, Math.floor((i / steps) * h), w, Math.ceil(h / steps) + 1);
    }
    // moon
    g.fillStyle(0x2c3440, 1);
    g.fillCircle(560, 150, 58);
    g.fillStyle(0x1a2130, 1);
    g.fillCircle(538, 140, 52);
    // distant stars / fireflies
    g.fillStyle(0x8f8796, 0.6);
    const pts = [[90, 210], [150, 90], [250, 300], [420, 120], [300, 180], [620, 400], [70, 520], [660, 620], [120, 760], [520, 780]];
    pts.forEach(function (p) { g.fillCircle(p[0], p[1], 2); });
    g.generateTexture(key, w, h);
    g.destroy();
  }

  /** Generate every placeholder texture the game needs. Safe to call once. */
  RG.Textures = {
    generateAll: function (scene) {
      solid(scene, 'pixel', 2, 2, 0xffffff); // used for progress bars
      makeBackground(scene);
      makePlayerToken(scene);
      makeCandle(scene);
      makeMoon(scene);
      makeQuestion(scene);
      makeSwords(scene);
      makeBoss(scene);
    },

    /**
     * Generate an enemy texture on demand (combat scenes generate the one
     * enemy they need, so boot stays fast and memory stays low).
     */
    ensureEnemy: function (scene, def) {
      if (def.key === 'enemy-boss') {
        makeEnemy(scene, { key: def.key, tier: 'boss', color: 0x9a3a30, spikes: true });
      } else {
        const styles = {
          'enemy-thorn':  { color: 0x6a4a30, spikes: true },
          'enemy-willow': { color: 0x5c7a5a, spikes: false },
          'enemy-moth':   { color: 0x7a5aa0, spikes: false },
          'enemy-hedge':  { color: 0x4a6a34, spikes: true },
          'enemy-dredge': { color: 0x345a6a, spikes: true },
        };
        const st = styles[def.key] || { color: 0x777777, spikes: false };
        makeEnemy(scene, { key: def.key, tier: def.tier, color: st.color, spikes: st.spikes });
      }
    },
  };
})(window.RG = window.RG || {});
