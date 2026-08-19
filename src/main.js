/**
 * src/main.js
 * ---------------------------------------------------------------------------
 * Phaser game configuration + bootstrap. Plain JavaScript, zero build step.
 * Loaded last from index.html so all RG.* namespaces exist by now.
 */
(function (RG) {
  'use strict';

  const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: RG.Config.GAME_WIDTH,
    height: RG.Config.GAME_HEIGHT,
    backgroundColor: RG.Config.COLORS.bg,
    pixelArt: false,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [
      RG.BootScene,
      RG.MapScene,
      RG.MysteryScene,
      RG.CombatScene,
      RG.GameOverScene,
    ],
  };

  RG.game = new Phaser.Game(config);

  // Expose a tiny debug hook (handy in the browser console, harmless in prod).
  if (typeof console !== 'undefined') {
    console.info(
      '%cFallowmire%c — dark folk-horror roguelike. ' +
      'AI events: ' + (RG.Config.AI.enabled ? 'ENABLED' : 'off (fallback events only)') + '.',
      'color:#9a7ae0;font-weight:bold', 'color:inherit'
    );
  }
})(window.RG = window.RG || {});
