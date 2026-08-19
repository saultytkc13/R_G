/**
 * src/scenes/MapScene.js
 * ---------------------------------------------------------------------------
 * The branching node map. Draws the procedurally generated floors top-to-
 * bottom, highlights the nodes the player may choose, and routes to the
 * matching scene (Combat / Mystery / and the inline Treasure & Rest
 * resolutions) when a node is clicked.
 */
(function (RG) {
  'use strict';

  const NODE_META = RG.Config.NODE_META;

  class MapScene extends Phaser.Scene {
    constructor() { super('Map'); }

    create() {
      const S = RG.State;
      const W = RG.Config.GAME_WIDTH;
      const H = RG.Config.GAME_HEIGHT;

      this.add.image(W / 2, H / 2, 'background').setDisplaySize(W, H);

      // Run header
      RG.UI.text(this, W / 2, 26, 'FALLOWMIRE', { size: 40, color: RG.Config.COLORS.text, originX: 0.5, originY: 0 });
      RG.UI.text(this, W / 2, 76, 'the marsh does not want you to leave', { size: 15, color: RG.Config.COLORS.textDim, originX: 0.5, originY: 0 });

      RG.UI.drawHud(this);

      this._drawn = [];
      this.buildMap(S);
      this.renderMap(S);
      this.drawFlavor(S);

      // A one-shot banner from a treasure/rest node resolved on the previous scene.
      if (S.pendingMessage) {
        this.showBanner(S.pendingMessage, S.pendingColor);
        S.pendingMessage = null;
        S.pendingColor = null;
      }
    }

    // Compute static geometry for every node (used for drawing + hit zones).
    buildMap(S) {
      const W = RG.Config.GAME_WIDTH;
      const top = 128;
      const bottom = 940;
      const span = bottom - top;
      const floors = S.floors;
      const n = floors.length;
      const nodeW = 84, nodeH = 60;
      const positions = []; // positions[floorIndex] = [{x, y, node}]

      floors.forEach(function (floor, f) {
        const y = top + (span * f) / (n - 1);
        const count = floor.length;
        const width = count * nodeW + (count - 1) * 26;
        const x0 = (W - width) / 2 + nodeW / 2;
        const row = floor.map(function (node, i) {
          return { x: x0 + i * (nodeW + 26), y: y, node: node };
        });
        positions.push(row);
      });

      this._positions = positions;
      this._nodeW = nodeW;
      this._nodeH = nodeH;
    }

    drawFlavor(S) {
      const tips = [
        'Reach the boss on the final floor to win.',
        'Rest nodes heal half your missing health.',
        'Mystery events are never the same twice.',
        'Defend halves the enemy\'s next attack.',
      ];
      RG.UI.text(this, RG.Config.GAME_WIDTH / 2, 916,
        tips[S.seed % tips.length],
        { size: 13, color: RG.Config.COLORS.textDim, originX: 0.5, originY: 0.5 });
    }

    // Draw the whole map (nodes, edges, player marker, floor labels).
    renderMap(S) {
      const W = RG.Config.GAME_WIDTH;
      this._drawn.forEach(function (o) { o.destroy(); });
      this._drawn = [];
      const self = this;
      const positions = this._positions;
      const reachable = S.reachableNodes();

      // Edges (draw first, under nodes)
      for (let f = 0; f < positions.length - 1; f++) {
        const row = positions[f];
        const nextRow = positions[f + 1];
        row.forEach(function (p) {
          p.node.next.forEach(function (ni) {
            const q = nextRow[ni];
            if (!q) return;
            const g = self.add.graphics();
            g.lineStyle(2, RG.Config.COLORS.panelEdge, 0.55);
            g.lineBetween(p.x, p.y + self._nodeH / 2, q.x, q.y - self._nodeH / 2);
            self._drawn.push(g);
          });
        });
      }

      // Floor labels
      positions.forEach(function (row, f) {
        if (f === positions.length - 1) return;
        const label = self.add.text(row[0].x - 58, row[0].y, String(f + 1), {
          fontFamily: RG.Config.FONT.body,
          fontSize: '14px',
          color: '#8f8796',
        }).setOrigin(0.5);
        self._drawn.push(label);
      });

      // Nodes
      positions.forEach(function (row, f) {
        row.forEach(function (p) {
          const node = p.node;
          const meta = NODE_META[node.type];
          const isReach = reachable.indexOf(node) !== -1;
          const isBoss = node.type === 'boss';
          const isCurrent = (node === S.lastNode);

          const iconKey = isBoss ? 'boss' : (node.type === 'combat' ? 'combat'
            : node.type === 'mystery' ? 'question'
              : node.type === 'treasure' ? 'treasure' : 'rest');

          const iconScale = (isBoss ? 0.9 : (node.type === 'combat' ? 0.8 : 0.62));
          const icon = self.add.image(p.x, p.y, iconKey).setScale(iconScale);
          self._drawn.push(icon);

          // Unreachable nodes are dimmed.
          if (!isReach) icon.setAlpha(0.38);

          // Ring around reachable nodes.
          if (isReach) {
            const ring = self.add.graphics();
            ring.lineStyle(3, isBoss ? meta.color : RG.Config.COLORS.gold, 0.9);
            ring.strokeRoundedRect(p.x - self._nodeW / 2, p.y - self._nodeH / 2, self._nodeW, self._nodeH, 12);
            self._drawn.push(ring);
          }

          // Boss label under the final node.
          if (isBoss) {
            const t = self.add.text(p.x, p.y + self._nodeH / 2 + 12, meta.label, {
              fontFamily: RG.Config.FONT.body,
              fontSize: '13px',
              color: '#' + meta.color.toString(16).padStart(6, '0'),
            }).setOrigin(0.5, 0);
            self._drawn.push(t);
          }

          // Player marker on the last-chosen node (slightly right of center).
          if (isCurrent) {
            const marker = self.add.image(p.x + 22, p.y - 6, 'player').setScale(0.55);
            self._drawn.push(marker);
          }

          // Hit zone (reachable nodes only).
          if (isReach) {
            const zone = self.add.zone(p.x, p.y, self._nodeW + 12, self._nodeH + 12).setOrigin(0.5).setInteractive({ useHandCursor: true });
            zone.on('pointerover', function () { icon.setScale(iconScale * 1.12); });
            zone.on('pointerout', function () { icon.setScale(iconScale); });
            zone.on('pointerdown', function () { self.onNodeClick(node); });
            self._drawn.push(zone);
          }
        });
      });
    }

    onNodeClick(node) {
      const S = RG.State;
      RG.UI.click(this);
      S.chooseNode(node);

      if (node.type === 'combat') {
        this.scene.start('Combat', { node: node });
      } else if (node.type === 'mystery') {
        this.scene.start('Mystery', { node: node });
      } else if (node.type === 'treasure') {
        this.resolveTreasure(node);
      } else if (node.type === 'rest') {
        this.resolveRest(node);
      } else if (node.type === 'boss') {
        this.scene.start('Combat', { node: node });
      }
    }

    // ---- Inline resolutions for the two non-scene node types ----------------

    resolveTreasure(node) {
      const S = RG.State;
      const gold = RG.Config.TREASURE.goldBase + (S.floor + 1) * RG.Config.TREASURE.goldPerFloor;
      const heal = RG.Config.TREASURE.heal;
      S.addGold(gold);
      S.heal(heal);
      RG.UI.coin(this);
      S.pendingMessage = '+ ' + gold + ' gold  •  + ' + heal + ' HP — a forgotten cache in the reeds.';
      S.pendingColor = RG.Config.COLORS.gold;
      S.afterNodeResolved(this, true);
    }

    resolveRest(node) {
      const S = RG.State;
      const amount = Math.max(1, Math.round((S.maxHp - S.hp) * RG.Config.REST_HEAL_PERCENT));
      const healed = S.heal(amount);
      RG.UI.heal(this);
      S.pendingMessage = 'You rest among the roots and recover ' + healed + ' HP.';
      S.pendingColor = RG.Config.COLORS.hpFill;
      S.afterNodeResolved(this, true);
    }

    showBanner(message, color) {
      const W = RG.Config.GAME_WIDTH;
      const H = RG.Config.GAME_HEIGHT;
      const g = this.add.graphics();
      g.fillStyle(0x0a0916, 0.88);
      g.fillRoundedRect(W / 2 - 300, H / 2 - 90, 600, 180, 16);
      g.lineStyle(2, color, 0.8);
      g.strokeRoundedRect(W / 2 - 300, H / 2 - 90, 600, 180, 16);
      const t = RG.UI.text(this, W / 2, H / 2, message, {
        size: 24, color: color, align: 'center', wordWrap: 540, originX: 0.5, originY: 0.5,
      });
      this.tweens.add({
        targets: [g, t],
        alpha: 0,
        delay: 1600,
        duration: 600,
        onComplete: function () { g.destroy(); t.destroy(); },
      });
    }
  }

  RG.MapScene = MapScene;
})(window.RG = window.RG || {});
