/**
 * src/scenes/MysteryScene.js
 * ---------------------------------------------------------------------------
 * Resolves a "mystery" node. This is the scene where the AI layer is allowed
 * to contribute — but ONLY as content.
 *
 * Flow:
 *   1. Ask RG.AI.getMysteryEvent() for an event. If AI is off (default), or
 *      the AI call fails validation, we get a hand-written fallback event.
 *   2. Render title, scene text and 2-3 choice buttons.
 *   3. When the player picks a choice, ordinary game code applies the
 *      (already validated) effects through RG.State.applyEffects() — AI never
 *      touches game state directly.
 */
(function (RG) {
  'use strict';

  class MysteryScene extends Phaser.Scene {
    constructor() { super('Mystery'); }

    init(data) {
      this._node = data.node;
    }

    create() {
      const S = RG.State;
      const W = RG.Config.GAME_WIDTH;
      const H = RG.Config.GAME_HEIGHT;

      this.add.image(W / 2, H / 2, 'background').setDisplaySize(W, H);
      RG.UI.drawHud(this);

      // Keep the last few event titles to avoid back-to-back repeats.
      S._recentTitles = S._recentTitles || [];
      const ctx = {
        hp: S.hp,
        maxHp: S.maxHp,
        gold: S.gold,
        floor: S.floor,
        numFloors: S.numFloors,
        recentTitles: S._recentTitles.slice(0, 5),
      };

      // "..." placeholder while we resolve the event source.
      RG.UI.text(this, W / 2, 210, '…', { size: 44, color: RG.Config.COLORS.textDim, originX: 0.5, originY: 0 });

      const self = this;
      RG.AI.getMysteryEvent(ctx, function (event) {
        self.showEvent(event);
      });
    }

    showEvent(event) {
      const S = RG.State;
      const W = RG.Config.GAME_WIDTH;
      const H = RG.Config.GAME_HEIGHT;

      // Title
      RG.UI.text(this, W / 2, 150, event.title, { size: 40, color: RG.Config.COLORS.text, originX: 0.5, originY: 0 });

      // Scene text panel
      RG.UI.panel(this, 46, 250, W - 92, 250);
      RG.UI.text(this, 66, 266, event.text, {
        size: 22, color: RG.Config.COLORS.text, wordWrap: W - 132, lineSpacing: 8,
      });

      // Track + record this event's title so future events avoid repeating it.
      S.eventsSeen += 1;
      S._recentTitles.unshift(event.title);
      S._recentTitles = S._recentTitles.slice(0, 8);

      // Choice buttons (2-3).
      const y0 = 560;
      const btnH = 96;
      const gap = 22;
      const self = this;
      event.choices.forEach(function (choice, i) {
        const y = y0 + i * (btnH + gap);

        // Button (whole width, stacked). We render our own two-line label
        // (choice label + effect preview) as children of the button container,
        // so the button keeps its hover + hit-zone behaviour.
        const labelText = choice.label;
        const subText = RG.UI.describeEffects(choice.effects);
        const btn = RG.UI.button(self, W / 2, y + btnH / 2, W - 100, btnH, '', function () {
          self.onChoice(choice);
        });
        // Children of a container use LOCAL coordinates (container is centered
        // on the button), hence the offsets below.
        const t1 = self.add.text(0, -btnH / 2 + 14, labelText, {
          fontFamily: RG.Config.FONT.body,
          fontSize: '22px',
          color: '#e6dcc3',
          align: 'center',
          wordWrap: { width: W - 140, useAdvancedWrap: true },
        }).setOrigin(0.5, 0);
        const t2 = self.add.text(0, btnH / 2 - 20, subText, {
          fontFamily: RG.Config.FONT.body,
          fontSize: '15px',
          color: '#8f8796',
          align: 'center',
        }).setOrigin(0.5, 0.5);

        // Hide the button's own (empty) label so only our layered labels show.
        btn.list.forEach(function (c) { if (c.type === 'Text') c.setVisible(false); });
        btn.add([t1, t2]);
      });
    }

    onChoice(choice) {
      const S = RG.State;
      const W = RG.Config.GAME_WIDTH;
      const H = RG.Config.GAME_HEIGHT;

      // Clear the screen (keep only background + input plugin) and rebuild.
      this.children.removeAll(true);

      // Apply the validated effects through game code (never via AI).
      const deltas = S.applyEffects(choice.effects);

      // Result text.
      this.add.image(W / 2, H / 2, 'background').setDisplaySize(W, H);
      RG.UI.drawHud(this);
      RG.UI.panel(this, 46, 300, W - 92, 260);
      RG.UI.text(this, 66, 322, choice.result, { size: 24, color: RG.Config.COLORS.text, wordWrap: W - 132, lineSpacing: 8 });

      // Effect summary line.
      RG.UI.text(this, W / 2, 460, 'Effects:  ' + RG.UI.describeEffects(deltas), {
        size: 18, color: RG.Config.COLORS.gold, align: 'center', originX: 0.5, originY: 0,
      });

      // Audio cue based on the dominant outcome.
      if (deltas.hpD > 0) RG.UI.heal(this);
      else if (deltas.hpD < 0) RG.UI.hit(this);
      if (deltas.goldD > 0) RG.UI.coin(this);
      if (deltas.hpD === 0 && deltas.goldD === 0 && deltas.maxHpD === 0) RG.UI.click(this);

      const dead = S.hp <= 0;
      RG.UI.button(this, W / 2, 640, 260, 60, dead ? 'You collapse…' : 'Continue', function () {
        RG.UI.click(this);
        S.afterNodeResolved(this);
      }.bind(this));
    }
  }

  RG.MysteryScene = MysteryScene;
})(window.RG = window.RG || {});
