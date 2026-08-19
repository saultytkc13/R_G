/**
 * src/ui/ui.js
 * ---------------------------------------------------------------------------
 * Shared Phaser UI helpers used by every scene: panels, buttons, the HUD,
 * floating combat text and lightweight WebAudio sound effects (so there are
 * no audio files to load either).
 */
(function (RG) {
  'use strict';

  const FONT = RG.Config.FONT;

  const UI = {
    // ---- Panels ------------------------------------------------------------

    panel(scene, x, y, w, h, fill, edge, alpha) {
      const g = scene.add.graphics();
      g.fillStyle(fill || RG.Config.COLORS.panel, alpha === undefined ? 0.96 : alpha);
      g.fillRoundedRect(x, y, w, h, 14);
      g.lineStyle(2, edge || RG.Config.COLORS.panelEdge, 1);
      g.strokeRoundedRect(x, y, w, h, 14);
      return g;
    },

    // ---- Text --------------------------------------------------------------

    text(scene, x, y, str, opts) {
      const o = opts || {};
      return scene.add.text(x, y, str, {
        fontFamily: FONT.body,
        fontSize: (o.size || 22) + 'px',
        color: toColor(o.color === undefined ? RG.Config.COLORS.text : o.color),
        align: o.align || 'left',
        wordWrap: o.wordWrap ? { width: o.wordWrap, useAdvancedWrap: true } : undefined,
        lineSpacing: o.lineSpacing || 6,
      }).setOrigin(o.originX || 0, o.originY || 0);
    },

    // ---- Buttons -----------------------------------------------------------

    button(scene, x, y, w, h, label, onClick, opts) {
      const o = opts || {};
      const fill = o.fill || RG.Config.COLORS.panelEdge;
      const textCol = o.textColor === undefined ? RG.Config.COLORS.text : o.textColor;
      const container = scene.add.container(x, y);

      const bg = scene.add.graphics();
      bg.fillStyle(fill, 0.9);
      bg.fillRoundedRect(0, 0, w, h, 10);
      bg.lineStyle(1, RG.Config.COLORS.textDim, 0.7);
      bg.strokeRoundedRect(0, 0, w, h, 10);

      const txt = scene.add.text(w / 2, h / 2, label, {
        fontFamily: FONT.body,
        fontSize: (o.size || 22) + 'px',
        color: toColor(textCol),
        align: 'center',
        wordWrap: { width: w - 16, useAdvancedWrap: true },
      }).setOrigin(0.5);

      container.add([bg, txt]);
      const zone = scene.add.zone(w / 2, h / 2, w, h).setOrigin(0.5);
      container.add(zone);

      const hover = function () {
        bg.clear();
        bg.fillStyle(lightenHex(fill, 18), 0.95);
        bg.fillRoundedRect(0, 0, w, h, 10);
        bg.lineStyle(1, RG.Config.COLORS.gold, 0.8);
        bg.strokeRoundedRect(0, 0, w, h, 10);
        scene.input.setDefaultCursor('pointer');
      };
      const out = function () {
        bg.clear();
        bg.fillStyle(fill, 0.9);
        bg.fillRoundedRect(0, 0, w, h, 10);
        bg.lineStyle(1, RG.Config.COLORS.textDim, 0.7);
        bg.strokeRoundedRect(0, 0, w, h, 10);
        scene.input.setDefaultCursor('default');
      };

      zone.setInteractive({ useHandCursor: true });
      zone.on('pointerover', hover);
      zone.on('pointerout', out);
      zone.on('pointerdown', function () {
        UI.click(scene);
        if (onClick) onClick();
      });

      // Keep a handle so callers can disable a button (e.g. once per event).
      container._btn = {
        setEnabled: function (enabled) {
          zone.disableInteractive();
          if (enabled) {
            zone.setInteractive({ useHandCursor: true });
            zone.setAlpha(1);
          } else {
            zone.setAlpha(0.5);
          }
        },
      };
      return container;
    },

    // ---- HUD ---------------------------------------------------------------

    drawHud(scene) {
      const S = RG.State;
      const W = RG.Config.GAME_WIDTH;
      const C = RG.Config.COLORS;

      const barW = 190;
      const bx = W - barW - 22;
      const by = 18;

      // HP bar
      scene.add.graphics().fillStyle(C.hpBack, 0.9).fillRoundedRect(bx, by, barW, 16, 8);
      const ratio = S.maxHp > 0 ? S.hp / S.maxHp : 0;
      const hpCol = ratio > 0.35 ? C.hpFill : C.hpLow;
      scene.add.graphics().fillStyle(hpCol, 1).fillRoundedRect(bx, by, Math.max(0, barW * ratio), 16, 8);
      UI.text(scene, bx + 4, by - 1, 'HP ' + S.hp + '/' + S.maxHp, { size: 14, color: 0xffffff });

      // Floor label
      const floorTxt = 'Floor ' + (S.floor + 1) + ' / ' + S.numFloors;
      UI.text(scene, 22, 22, floorTxt, { size: 18, color: C.textDim });

      // Gold counter
      const goldG = scene.add.graphics();
      goldG.fillStyle(C.gold, 1);
      goldG.fillCircle(24, 62, 8);
      UI.text(scene, 38, 52, String(S.gold), { size: 18, color: C.gold });
    },

    // ---- Floating text / feedback ------------------------------------------

    floatText(scene, x, y, str, color) {
      const t = scene.add.text(x, y, str, {
        fontFamily: FONT.body,
        fontSize: '26px',
        color: toColor(color === undefined ? RG.Config.COLORS.gold : color),
        align: 'center',
        stroke: '#0a0916',
        strokeThickness: 3,
      }).setOrigin(0.5);
      scene.tweens.add({
        targets: t,
        y: y - 44,
        alpha: { from: 1, to: 0 },
        duration: 950,
        ease: 'Cubic.easeOut',
        onComplete: function () { t.destroy(); },
      });
    },

    /** Build a human-readable summary line of a choice's effects. */
    describeEffects(effects) {
      const parts = [];
      if (effects.hp) parts.push((effects.hp > 0 ? '+' : '') + effects.hp + ' HP');
      if (effects.gold) parts.push((effects.gold > 0 ? '+' : '') + effects.gold + ' gold');
      if (effects.maxHp) parts.push((effects.maxHp > 0 ? '+' : '') + effects.maxHp + ' max HP');
      if (!parts.length) return 'no change';
      return parts.join(', ');
    },

    // ---- Audio (no files — synthesized) ------------------------------------

    _audio: null,
    audio(scene) {
      if (!this._audio) this._audio = new SoundBank(scene);
      return this._audio;
    },

    click(scene) { this.audio(scene).click(); },
    hit(scene) { this.audio(scene).hit(); },
    heal(scene) { this.audio(scene).heal(); },
    coin(scene) { this.audio(scene).coin(); },
    fanfare(scene) { this.audio(scene).fanfare(); },
    dark(scene) { this.audio(scene).dark(); },
  };

  // ---- Small WebAudio synth -------------------------------------------------

  function SoundBank(scene) {
    this.scene = scene;
    this.ctx = null;
    this.ok = false;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        this.ctx = new AC();
        this.ok = true;
      }
    } catch (e) {
      this.ok = false;
    }
  }

  SoundBank.prototype._tone = function (freq, dur, type, gain, when) {
    if (!this.ok || !this.ctx) return;
    const t0 = (when || this.ctx.currentTime);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(gain || 0.06, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  };

  SoundBank.prototype._resume = function () {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  };

  // Safe accessor so the sequencer methods below never crash when there is no
  // AudioContext available (e.g. some webviews / strict browsers).
  SoundBank.prototype._now = function () {
    return this.ctx ? this.ctx.currentTime : 0;
  };

  SoundBank.prototype.click = function () { this._resume(); this._tone(420, 0.08, 'triangle', 0.04); };
  SoundBank.prototype.hit = function () { this._resume(); this._tone(110, 0.16, 'sawtooth', 0.08); this._tone(70, 0.2, 'square', 0.05); };
  SoundBank.prototype.heal = function () { this._resume(); this._tone(520, 0.12, 'sine', 0.05); this._tone(660, 0.16, 'sine', 0.05, this._now() + 0.08); };
  SoundBank.prototype.coin = function () { this._resume(); this._tone(880, 0.08, 'triangle', 0.05); this._tone(1175, 0.12, 'triangle', 0.05, this._now() + 0.06); };
  SoundBank.prototype.fanfare = function () { this._resume(); [523, 659, 784, 1046].forEach(function (f, i) { this._tone(f, 0.18, 'triangle', 0.06, this._now() + i * 0.09); }, this); };
  SoundBank.prototype.dark = function () { this._resume(); this._tone(220, 0.4, 'sine', 0.05); this._tone(185, 0.5, 'sine', 0.04, this._now() + 0.12); };

  // ---- Colour helpers -------------------------------------------------------

  function toColor(v) {
    if (typeof v === 'number') return '#' + v.toString(16).padStart(6, '0');
    return v;
  }

  function lightenHex(hex, amt) {
    const r = Math.min(255, ((hex >> 16) & 255) + amt);
    const g = Math.min(255, ((hex >> 8) & 255) + amt);
    const b = Math.min(255, (hex & 255) + amt);
    return (r << 16) | (g << 8) | b;
  }

  RG.UI = UI;
})(window.RG = window.RG || {});
