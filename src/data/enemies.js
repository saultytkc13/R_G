/**
 * src/data/enemies.js
 * ---------------------------------------------------------------------------
 * Enemy roster: pure data, no AI, no Phaser. 5 regular enemies plus the
 * floor-boss whose stats are scaled by the number of floors in the run.
 *
 * Fields:
 *   key     - unique id, also the placeholder-texture key (see ui/textures.js)
 *   name    - display name
 *   hp      - enemy max HP
 *   attack  - flat damage per strike (see CombatScene for damage variance)
 *   gold    - base gold reward on victory
 *   maxHpGain - chance-weighted player max-HP reward (see CombatScene)
 *   tier    - visual scale / accent used when drawing the placeholder
 *   boss    - true only for the final-floor encounter
 *
 * ---------------------------------------------------------------------------
 * IMAGE PROMPTS (full table in README.md — "Art / image-generation prompts")
 * ---------------------------------------------------------------------------
 * These are the final texture keys to drop in later (see BootScene.preload):
 *   enemy-thorn         -> assets/images/enemies/thorn_stalker.png
 *   enemy-willow        -> assets/images/enemies/willow_wight.png
 *   enemy-moth          -> assets/images/enemies/moth_knight.png
 *   enemy-hedge         -> assets/images/enemies/hedge_knight.png
 *   enemy-dredge        -> assets/images/enemies/dredge_child.png
 *   enemy-boss          -> assets/images/enemies/the_peat_king.png
 */
(function (RG) {
  'use strict';

  RG.ENEMIES = {
    list: [
      {
        key: 'enemy-thorn',
        name: 'Thorn Stalker',
        hp: 18,
        attack: 7,
        gold: 6,
        maxHpGain: 2,
        tier: 'small',
        boss: false,
      },
      {
        key: 'enemy-willow',
        name: 'Willow Wight',
        hp: 24,
        attack: 9,
        gold: 8,
        maxHpGain: 2,
        tier: 'medium',
        boss: false,
      },
      {
        key: 'enemy-moth',
        name: 'Moth Knight',
        hp: 30,
        attack: 11,
        gold: 10,
        maxHpGain: 3,
        tier: 'medium',
        boss: false,
      },
      {
        key: 'enemy-hedge',
        name: 'Hedge Knight',
        hp: 36,
        attack: 13,
        gold: 12,
        maxHpGain: 3,
        tier: 'large',
        boss: false,
      },
      {
        key: 'enemy-dredge',
        name: 'Dredge Child',
        hp: 42,
        attack: 15,
        gold: 15,
        maxHpGain: 4,
        tier: 'large',
        boss: false,
      },
    ],

    /**
     * The final-floor boss. Attack/hp are scaled by the run length so the
     * fight is a real but fair test after 5-7 floors.
     */
    boss: {
      key: 'enemy-boss',
      name: 'The Peat King',
      hp: 90,
      attack: 16,
      gold: 40,
      maxHpGain: 6,
      tier: 'boss',
      boss: true,
    },

    /**
     * Return a (possibly scaled) boss definition for a run of `numFloors`
     * floors. Uses RG.RNG so scaling is deterministic for a given seed.
     */
    getBoss(numFloors) {
      const b = this.boss;
      const rng = RG.RNG && RG.RNG.integerInRange ? RG.RNG : null;
      const jitter = rng ? rng.integerInRange(-4, 4) : 0;
      const hp = b.hp + (numFloors - RG.Config.FLOORS_MIN) * 8 + jitter;
      const attack = b.attack + (numFloors - RG.Config.FLOORS_MIN) + Math.floor(jitter / 2);
      return Object.assign({}, b, { hp: hp, attack: attack });
    },

    /**
     * A random non-boss enemy whose stats are scaled slightly upward by the
     * current floor so fights stay meaningful on deeper floors.
     */
    pickForFloor(floor) {
      // Always call through RG.RNG so the method keeps its `this` binding.
      const pickInt = (RG.RNG && RG.RNG.integerInRange)
        ? function (a, b) { return RG.RNG.integerInRange(a, b); }
        : function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
      const base = this.list[pickInt(0, this.list.length - 1)];
      const f = Math.max(0, floor || 0);
      return {
        key: base.key,
        name: base.name,
        hp: base.hp + f * 3,
        attack: base.attack + Math.floor(f / 2),
        gold: base.gold + Math.floor(f / 2),
        maxHpGain: base.maxHpGain,
        tier: base.tier,
        boss: false,
      };
    },
  };
})(window.RG = window.RG || {});
