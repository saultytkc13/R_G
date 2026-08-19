/**
 * src/scenes/CombatScene.js
 * ---------------------------------------------------------------------------
 * Deterministic turn-based combat. This is 100% ordinary game code — the AI
 * layer is NOT involved here.
 *
 * Rules:
 *   - Player actions: Attack / Defend.
 *   - Attack deals (attack + small deterministic variance); enemy auto-retaliates.
 *   - Defend halves the NEXT incoming hit (and still lets the enemy swing).
 *   - Attack 3 times in a row without defending to charge a heavy blow
 *     (+4 attack, and the enemy's next strike misses).
 *   - Victory: gold (plus a chance of a small max-HP reward); the player also
 *     recovers a little HP. Death: game over.
 */
(function (RG) {
  'use strict';

  class CombatScene extends Phaser.Scene {
    constructor() { super('Combat'); }

    init(data) {
      this._node = data.node;
    }

    create() {
      const S = RG.State;
      const W = RG.Config.GAME_WIDTH;
      const H = RG.Config.GAME_HEIGHT;

      this.add.image(W / 2, H / 2, 'background').setDisplaySize(W, H);
      RG.UI.drawHud(this);

      // ---- Build the enemy (boss is scaled; regular enemies scale with floor) ----
      const node = this._node;
      const enemy = node.type === 'boss'
        ? RG.ENEMIES.getBoss(S.numFloors)
        : RG.ENEMIES.pickForFloor(S.floor);
      RG.Textures.ensureEnemy(this, enemy);
      this._enemy = enemy;
      this._enemyHp = enemy.hp;

      // ---- Player combat fields ----
      this._playerAtk = RG.Config.PLAYER.attack;
      this._defending = false;
      this._charge = 0; // consecutive attacks without defending
      this._turn = 'player';
      this._won = false;
      this._lost = false;

      // ---- Title + enemies left countdown ----
      RG.UI.text(this, W / 2, 150, enemy.name, { size: 38, color: RG.Config.COLORS.text, originX: 0.5, originY: 0 });

      // ---- Enemy sprite + HP bar ----
      const escale = enemy.tier === 'boss' ? 1.0 : (enemy.tier === 'large' ? 0.92 : (enemy.tier === 'medium' ? 0.82 : 0.72));
      this._enemySprite = this.add.image(W / 2, 360, enemy.key).setScale(escale);
      this._enemyHpBack = this.add.graphics();
      this._enemyHpFill = this.add.graphics();
      this.drawEnemyHp();

      // ---- Enemy attack preview ----
      this._enemyAtkTxt = RG.UI.text(this, W / 2, 470, 'attack ' + enemy.attack, { size: 16, color: RG.Config.COLORS.textDim, originX: 0.5, originY: 0 });

      // ---- Player stats panel ----
      RG.UI.panel(this, 46, 510, W - 92, 74);
      this._statsTxt = RG.UI.text(this, W / 2, 547, this.playerLine(), { size: 18, color: RG.Config.COLORS.text, align: 'center', originX: 0.5, originY: 0.5 });

      // ---- Log line ----
      this._logTxt = RG.UI.text(this, W / 2, 596, 'The ' + enemy.name + ' bars your way.', { size: 19, color: RG.Config.COLORS.textDim, align: 'center', wordWrap: W - 120, originX: 0.5, originY: 0 });

      // ---- Action buttons ----
      const bw = (W - 120) / 2;
      const self = this;
      this._atkBtn = RG.UI.button(this, 60 + bw / 2, 700, bw, 70, 'Attack', function () { self.onAttack(); });
      this._defBtn = RG.UI.button(this, W - 60 - bw / 2, 700, bw, 70, 'Defend', function () { self.onDefend(); });

      this._helpTxt = RG.UI.text(this, W / 2, 780, 'Strike 3 times in a row to charge a heavy blow.', { size: 14, color: RG.Config.COLORS.textDim, originX: 0.5, originY: 0 });

      this._turnTxt = RG.UI.text(this, W / 2, 820, 'Your turn', { size: 20, color: RG.Config.COLORS.gold, originX: 0.5, originY: 0 });
    }

    playerLine() {
      const S = RG.State;
      const d = this._defending ? '  (defending)' : '';
      const c = this._charge >= 2 ? '  (charged!)' : '';
      return 'You  ATK ' + this._playerAtk + '   |   HP ' + S.hp + '/' + S.maxHp + d + c;
    }

    drawEnemyHp() {
      const W = RG.Config.GAME_WIDTH;
      const barW = 260;
      const x = W / 2 - barW / 2;
      const y = 430;
      this._enemyHpBack.clear();
      this._enemyHpBack.fillStyle(0x3a1f22, 0.9);
      this._enemyHpBack.fillRoundedRect(x, y, barW, 16, 8);
      this._enemyHpFill.clear();
      const ratio = this._enemyHp > 0 ? this._enemyHp / this._enemy.hp : 0;
      this._enemyHpFill.fillStyle(0xc94f45, 1);
      this._enemyHpFill.fillRoundedRect(x, y, Math.max(0, barW * ratio), 16, 8);
    }

    // ---- Player actions -----------------------------------------------------

    onAttack() {
      if (this._turn !== 'player' || this._won || this._lost) return;
      RG.UI.click(this);
      const S = RG.State;
      const rng = RG.RNG;

      // Deterministic variance: -1..+2 around attack.
      const variance = rng.integerInRange(-1, 2);
      const base = this._playerAtk + variance;
      let dmg = Math.max(1, base);

      // Heavy blow: charged after 3 attacks without defending.
      const charged = this._charge >= 2;
      if (charged) dmg += 4;

      this._enemyHp -= dmg;
      if (this._enemyHp < 0) this._enemyHp = 0;
      this._charge += 1;

      this.drawEnemyHp();
      RG.UI.hit(this);
      this.shakeEnemy();

      let log = 'You strike for ' + dmg + '.';
      if (charged) log = 'HEAVY BLOW! You strike for ' + dmg + '!';

      if (this._enemyHp <= 0) {
        this._logTxt.setText(log);
        this.onVictory();
        return;
      }

      // Enemy retaliation. On a charged blow the enemy's next hit misses.
      if (charged) {
        this._charge = 0;
        this._logTxt.setText(log + ' The ' + this._enemy.name + ' reels and misses!');
        this._turn = 'player';
        this._turnTxt.setText('Your turn');
        this._statsTxt.setText(this.playerLine());
        return;
      }

      this.enemyTurn(log);
    }

    onDefend() {
      if (this._turn !== 'player' || this._won || this._lost) return;
      RG.UI.click(this);
      this._defending = true;
      this._charge = 0;
      this._statsTxt.setText(this.playerLine());
      this._turnTxt.setText('Enemy turn…');
      this._logTxt.setText('You raise your guard. Next hit is halved.');
      this.enemyTurn('You raise your guard.');
    }

    enemyTurn(afterLog) {
      this._turn = 'enemy';
      this._turnTxt.setText('Enemy turn…');
      this._atkBtn._btn.setEnabled(false);
      this._defBtn._btn.setEnabled(false);

      const self = this;
      this.time.delayedCall(700, function () {
        const S = RG.State;
        const rng = RG.RNG;
        const variance = rng.integerInRange(-1, 2);
        let dmg = Math.max(1, self._enemy.attack + variance);
        let halved = false;
        if (self._defending) {
          dmg = Math.max(1, Math.floor(dmg * RG.Config.COMBAT.defendReduction));
          halved = true;
          self._defending = false;
        }
        S.damage(dmg);
        RG.UI.hit(self);
        self.shakePlayer();
        self.floatOnPlayer('- ' + dmg + ' HP');

        let log = (afterLog ? afterLog + ' ' : '') + 'The ' + self._enemy.name + ' hits you for ' + dmg + (halved ? ' (halved).' : '.');
        self._logTxt.setText(log);
        self._statsTxt.setText(self.playerLine());

        if (S.hp <= 0) {
          self.onDeath();
          return;
        }

        self._turn = 'player';
        self._turnTxt.setText('Your turn');
        self._atkBtn._btn.setEnabled(true);
        self._defBtn._btn.setEnabled(true);
      });
    }

    // ---- Resolution ---------------------------------------------------------

    onVictory() {
      this._won = true;
      const S = RG.State;
      const rng = RG.RNG;
      this._turnTxt.setText('Victory!');
      this._atkBtn._btn.setEnabled(false);
      this._defBtn._btn.setEnabled(false);
      this._enemySprite.setAlpha(0.35);

      const gold = this._enemy.gold;
      S.addGold(gold);
      S.kills += 1;

      // Chance of a small max-HP reward (weighted by the enemy's maxHpGain).
      const maxGain = this._enemy.maxHpGain || 0;
      let maxGainMsg = '';
      if (maxGain > 0 && rng.between(0, 9) < 3) {
        S.maxHp += maxGain;
        S.hp = Math.min(S.maxHp, S.hp + maxGain);
        maxGainMsg = '  •  +' + maxGain + ' max HP';
      }
      // Small post-battle recovery.
      const recover = S.heal(3 + Math.floor(S.maxHp * 0.1));
      RG.UI.coin(this);
      RG.UI.fanfare(this);

      this._logTxt.setText('You prevail! +' + gold + ' gold' + maxGainMsg + '  •  +' + recover + ' HP');

      const self = this;
      RG.UI.button(this, RG.Config.GAME_WIDTH / 2, 860, 260, 60, 'Continue', function () {
        RG.UI.click(this);
        S.afterNodeResolved(self);
      });
    }

    onDeath() {
      this._lost = true;
      this._turnTxt.setText('Defeated');
      this._atkBtn._btn.setEnabled(false);
      this._defBtn._btn.setEnabled(false);
      this._enemySprite.setAlpha(0.4);
      RG.UI.dark(this);
      this._logTxt.setText('The dark takes you…');

      const self = this;
      this.time.delayedCall(900, function () {
        self.scene.start('GameOver');
      });
    }

    // ---- Small screen feedback ---------------------------------------------

    shakeEnemy() {
      this.tweens.add({ targets: this._enemySprite, x: this._enemySprite.x + 8, duration: 45, yoyo: true, repeat: 2, ease: 'Quad.easeOut' });
    }
    shakePlayer() {
      // The camera nudges to sell the hit.
      this.cameras.main.shake(120, 0.004);
    }
    floatOnPlayer(str) {
      const W = RG.Config.GAME_WIDTH;
      RG.UI.floatText(this, W / 2, 600, str, RG.Config.COLORS.hpLow);
    }
  }

  RG.CombatScene = CombatScene;
})(window.RG = window.RG || {});
