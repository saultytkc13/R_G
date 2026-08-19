/**
 * src/state.js
 * ---------------------------------------------------------------------------
 * The single source of truth for a run's mutable state (hp, maxHp, gold,
 * floor, map, stats, flags). Ordinary game code — and ONLY ordinary game
 * code — mutates this through the helpers below.
 *
 * This matters for requirement #5: AI never controls raw game state. AI (or
 * a fallback event) can only PROPOSE content shaped like
 * { title, text, choices[] } where each choice carries small numeric
 * effects. The game itself calls applyEffects() with validated numbers, and
 * applyEffects() clamps everything into safe ranges before touching state.
 */
(function (RG) {
  'use strict';

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function int(v) { return Math.round(Number(v) || 0); }

  const State = {
    // Run stats
    hp: 0,
    maxHp: 0,
    gold: 0,

    // Progression
    floor: 0,        // 0-based index of the floor whose nodes are clickable now
    numFloors: 0,
    map: null,       // result of RG.MapLayout.generate()
    lastNode: null,  // the node the player chose on the previous floor
    seed: 0,

    // Bookkeeping (shown on the game-over screen)
    kills: 0,
    goldEarned: 0,
    eventsSeen: 0,

    dead: false,
    won: false,

    // A one-shot banner message shown by the next MapScene draw (used by
    // treasure/rest nodes so the reward reads before the map redraws).
    pendingMessage: null,
    pendingColor: null,

    /** Start a fresh run. Seed may be passed explicitly, else random. */
    newRun(seed) {
      this.seed = (seed == null) ? (Date.now() & 0x7fffffff) : seed;
      this.numFloors = RG.Config.FLOORS_MIN +
        (this.seed % (RG.Config.FLOORS_MAX - RG.Config.FLOORS_MIN + 1));
      this.map = RG.MapLayout.generate(this.numFloors, this.seed);
      this.maxHp = RG.Config.PLAYER.maxHp;
      this.hp = this.maxHp;
      this.gold = 0;
      this.floor = 0;
      this.lastNode = null;
      this.kills = 0;
      this.goldEarned = 0;
      this.eventsSeen = 0;
      this.dead = false;
      this.won = false;
      this.pendingMessage = null;
      this.pendingColor = null;
    },

    get floors() { return this.map ? this.map.floors : []; },

    /**
     * The nodes the player may currently choose: everything on the current
     * floor when starting out, otherwise only nodes connected from lastNode.
     */
    reachableNodes() {
      const nodes = this.map.floors[this.floor] || [];
      if (!this.lastNode) return nodes.slice();
      return nodes.filter(function (n) { return this.lastNode.next.indexOf(n.index) !== -1; }, this);
    },

    /** Record the node the player just selected (before resolving it). */
    chooseNode(node) { this.lastNode = node; },

    // ---- State mutators (the only places run state changes) ----------------

    addGold(n) {
      const amt = Math.max(0, int(n));
      this.gold += amt;
      this.goldEarned += amt;
      return amt;
    },

    heal(n) {
      const amt = int(n);
      if (amt <= 0) return 0;
      const before = this.hp;
      this.hp = clamp(this.hp + amt, 0, this.maxHp);
      return this.hp - before;
    },

    damage(n) {
      const amt = Math.max(0, int(n));
      this.hp = clamp(this.hp - amt, 0, this.maxHp);
      if (this.hp <= 0) this.dead = true;
      return amt;
    },

    /**
     * Apply a (already validated) effects object: { hp?, gold?, maxHp? }.
     * Each value is clamped to [-10, +10] as a last line of defence, so even
     * a buggy content source can never do anything wild to the run.
     * Returns the deltas actually applied, plus whether this killed the player.
     */
    applyEffects(effects) {
      const e = effects || {};
      const hpD = clamp(int(e.hp || 0), -10, 10);
      const goldD = clamp(int(e.gold || 0), -10, 10);
      const maxHpD = clamp(int(e.maxHp || 0), -10, 10);
      let died = false;

      if (maxHpD !== 0) {
        this.maxHp = Math.max(10, this.maxHp + maxHpD);
        // Gaining max HP also raises current HP; losing max HP clamps current HP.
        if (maxHpD > 0) this.hp = clamp(this.hp + maxHpD, 0, this.maxHp);
        else this.hp = clamp(this.hp, 0, this.maxHp);
      }
      if (goldD !== 0) {
        this.gold = Math.max(0, this.gold + goldD);
        if (goldD > 0) this.goldEarned += goldD;
      }
      if (hpD !== 0) this.hp = clamp(this.hp + hpD, 0, this.maxHp);

      if (this.hp <= 0) { this.hp = 0; this.dead = true; died = true; }
      return { hpD, goldD, maxHpD, died };
    },

    /**
     * Advance past a resolved node and report what comes next:
     * 'dead' (player died), 'win' (just cleared the boss floor), or 'map'.
     */
    finishNodeResolution() {
      this.floor += 1;
      if (this.hp <= 0) return 'dead';
      if (this.floor >= this.numFloors) return 'win';
      return 'map';
    },

    /**
     * Convenience for scenes: resolve the node and route to the right scene.
     * restartMap=true is used by MapScene (it restarts itself); other scenes
     * start('Map').
     */
    afterNodeResolved(scene, restartMap) {
      const r = this.finishNodeResolution();
      if (r === 'win' || r === 'dead') {
        this.won = (r === 'win');
        scene.scene.start('GameOver');
      } else if (restartMap) {
        scene.scene.restart();
      } else {
        scene.scene.start('Map');
      }
    },
  };

  RG.State = State;
})(window.RG = window.RG || {});
