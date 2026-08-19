/**
 * src/scenes/GameOverScene.js
 * ---------------------------------------------------------------------------
 * End-of-run screen. Shows victory or defeat plus the run summary, and
 * restarts a fresh run on demand.
 */
(function (RG) {
  'use strict';

  class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOver'); }

    create() {
      const S = RG.State;
      const W = RG.Config.GAME_WIDTH;
      const H = RG.Config.GAME_HEIGHT;

      this.add.image(W / 2, H / 2, 'background').setDisplaySize(W, H);

      const title = S.won ? 'THE MARSH RELEASES YOU' : 'LOST TO THE MARSH';
      const sub = S.won
        ? 'You walked the fens floor by floor and returned to tell of it.'
        : 'The fog closes over your lantern. Another will try.';

      RG.UI.text(this, W / 2, 180, title, { size: 40, color: S.won ? RG.Config.COLORS.gold : RG.Config.COLORS.text, originX: 0.5, originY: 0 });
      RG.UI.text(this, W / 2, 240, sub, { size: 18, color: RG.Config.COLORS.textDim, originX: 0.5, originY: 0 });

      RG.UI.panel(this, 60, 320, W - 120, 260);
      const lines = [
        'Floors reached   ' + Math.min(S.floor + 1, S.numFloors) + ' / ' + S.numFloors,
        'Enemies felled   ' + S.kills,
        'Gold gathered    ' + S.goldEarned,
        'Gold remaining   ' + S.gold,
        'Mysteries faced  ' + S.eventsSeen,
        'HP remaining     ' + S.hp + ' / ' + S.maxHp,
      ];
      lines.forEach(function (line, i) {
        RG.UI.text(this, 90, 352 + i * 36, line, { size: 20, color: RG.Config.COLORS.text });
      }, this);

      if (S.won) RG.UI.fanfare(this); else RG.UI.dark(this);

      const self = this;
      RG.UI.button(this, W / 2, 680, 300, 66, 'Try Again', function () {
        RG.UI.click(this);
        S.newRun();            // fresh random run (respects RG.Config.SEED if set)
        self.scene.start('Map');
      });
    }
  }

  RG.GameOverScene = GameOverScene;
})(window.RG = window.RG || {});
