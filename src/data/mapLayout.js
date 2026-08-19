/**
 * src/data/mapLayout.js
 * ---------------------------------------------------------------------------
 * Deterministic procedural node-map generator (Slay the Spire style).
 *
 * A map is a list of `numFloors` floors; each floor is a list of nodes.
 * Every non-final node stores `next` (indices of nodes on the next floor it
 * connects to) so the player always has a valid path. The final floor is a
 * single boss node.
 *
 * Given the same seed the map is always identical, because all randomness
 * flows through the seeded RNG in RG.RNG (set up in BootScene).
 */
(function (RG) {
  'use strict';

  const MapLayout = {

    /**
     * Generate a map. `numFloors` should be in [5,7]; `seed` any integer.
     * Returns { floors: [ [node, ...], ... ] } where each node is:
     *   { index, floor, type, next: [index,...] }
     */
    generate(numFloors, seed) {
      // Local seeded RNG (independent of RG.RNG so tests can pass a seed
      // without disturbing run-scoped randomness).
      let s = (seed >>> 0) || 1;
      function nextInt() {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296; // [0,1)
      }
      function int(min, max) { return min + Math.floor(nextInt() * (max - min + 1)); }
      function pick(arr) { return arr[int(0, arr.length - 1)]; }

      const floors = [];
      const lastFloorIdx = numFloors - 1;
      const isFinalFloor = function (f) { return f === lastFloorIdx; };

      for (let f = 0; f < numFloors; f++) {
        if (isFinalFloor(f)) {
          // ---- Final floor: a single boss node ----
          floors.push([{ index: 0, floor: f, type: 'boss', next: [] }]);
          break;
        }

        // ---- Interior floor: 2-4 nodes, no two "rest" in a row ----
        const count = int(2, 4);
        const weights = {
          combat: 4, mystery: 3, treasure: 2, rest: 1,
        };
        const prevType = (f > 0) ? floors[f - 1][0].type : null;
        const usedTypes = {};

        const nodes = [];
        for (let i = 0; i < count; i++) {
          // Build a weighted pool, excluding types already used on this floor.
          let pool = [];
          Object.keys(weights).forEach(function (t) {
            if (usedTypes[t]) return;
            if (t === 'rest' && (prevType === 'rest' || (i > 0 && nodes[i - 1].type === 'rest'))) return;
            for (let w = 0; w < weights[t]; w++) pool.push(t);
          });
          if (!pool.length) pool = ['combat', 'mystery', 'treasure'];

          // Floor 0 is gentler: no more than one combat node.
          if (f === 0 && i > 0) {
            pool = pool.filter(function (t) { return t !== 'combat'; });
            if (!pool.length) pool = ['mystery', 'treasure'];
          }

          const type = pick(pool);
          usedTypes[type] = true;
          nodes.push({ index: i, floor: f, type: type, next: [] });
        }

        floors.push(nodes);
      }

      // ---- Wire up connections so every node reaches the end ----
      for (let f = 0; f < numFloors - 1; f++) {
        const cur = floors[f];
        const nxt = floors[f + 1];
        const target = Math.min(2, nxt.length - 1); // connect to at most the first 3 next nodes
        cur.forEach(function (node, i) {
          const span = Math.min(3, nxt.length);
          const start = Math.max(0, Math.min(nxt.length - span, i));
          const count = Math.min(target, span);
          const seen = {};
          for (let k = 0; k < count; k++) {
            const idx = int(start, start + span - 1);
            if (!seen[idx]) { seen[idx] = true; node.next.push(idx); }
          }
          if (!node.next.length) node.next.push(Math.min(i, nxt.length - 1));
          node.next.sort(function (a, b) { return a - b; });
        });
      }

      return { floors: floors };
    },
  };

  RG.MapLayout = MapLayout;
})(window.RG = window.RG || {});
