/**
 * src/scenes/BootScene.js
 * ---------------------------------------------------------------------------
 * First scene: seeds the RNG, generates all placeholder textures, and hands
 * off to the Map scene. No network, no external assets.
 *
 * ---------------------------------------------------------------------------
 * >>> PRELOAD — WHERE TO ADD REAL ART LATER <<<
 * ---------------------------------------------------------------------------
 * The game ships with code-generated placeholder shapes (src/ui/textures.js)
 * and needs zero art files. When you want real art, drop the images in and
 * add lines like these inside preload():
 *
 *   this.load.image('background',  'assets/images/backgrounds/fallowmire_moor.jpg');
 *   this.load.image('player',      'assets/images/player/warden.png');
 *   this.load.image('enemy-thorn', 'assets/images/enemies/thorn_stalker.png');
 *   this.load.image('enemy-willow','assets/images/enemies/willow_wight.png');
 *   this.load.image('enemy-moth',  'assets/images/enemies/moth_knight.png');
 *   this.load.image('enemy-hedge', 'assets/images/enemies/hedge_knight.png');
 *   this.load.image('enemy-dredge','assets/images/enemies/dredge_child.png');
 *   this.load.image('enemy-boss',  'assets/images/enemies/the_peat_king.png');
 *
 * IMPORTANT: if you add those load lines, also call generateAll() in create()
 * only AFTER preload finishes — real images override the placeholder keys
 * (generateAll skips any key that already exists), so placeholders fill in
 * any image you haven't made yet. The game code never needs to change.
 */
(function (RG) {
  'use strict';

  class BootScene extends Phaser.Scene {
    constructor() { super('Boot'); }

    preload() {
      // >>> Real-art load lines go HERE (see the comment block above). <<<
    }

    create() {
      // Seed the shared RNG (deterministic when RG.Config.SEED is set).
      RG.RNG = new Phaser.Math.RandomDataGenerator(
        (RG.Config.SEED != null) ? [String(RG.Config.SEED)] : undefined
      );

      // Generate every placeholder texture (skips keys that already exist).
      RG.Textures.generateAll(this);

      // Start a fresh run and enter the map.
      RG.State.newRun(RG.Config.SEED);
      this.scene.start('Map');
    }
  }

  RG.BootScene = BootScene;
})(window.RG = window.RG || {});
