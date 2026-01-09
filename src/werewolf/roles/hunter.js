/**
 * 獵人角色類別
 */

import { BaseRole, TEAMS, ACTION_TYPES } from './BaseRole.js';
import { ROLES } from './roleConstants.js';

export class HunterRole extends BaseRole {
  constructor() {
    super('HUNTER', {
      name: ROLES.HUNTER,
      team: TEAMS.VILLAGE,
      actionType: ACTION_TYPES.TRIGGER, // 觸發型能力
      actionOrder: 99, // 無夜晚行動
      description: '死亡時可以開槍帶走一名玩家'
    });
  }

  /**
   * 初始化獵人能力
   */
  initializeAbilities() {
    return {
      canShoot: true
    };
  }

  /**
   * 獵人沒有主動夜晚行動
   */
  hasNightAction() {
    return false;
  }

  /**
   * 處理人類獵人死亡觸發
   */
  async onDeath(game, player) {
    if (!player.abilities.canShoot) {
      return;
    }

    game.log.role('您是獵人，死亡時可以開槍帶走一名玩家');
    const willShoot = await game.askYesNo('是否使用獵人能力開槍？');

    if (willShoot) {
      await this._shootTarget(game, player, true);
    }
  }

  /**
   * 模擬 AI 獵人死亡觸發
   */
  async simulateDeathTrigger(game, player) {
    if (!player.abilities.canShoot) {
      return;
    }

    // AI獵人有較高機率開槍
    if (Math.random() > 0.2) {
      await this._shootTarget(game, player, false);
    } else {
      game.log.action(`獵人 ${player.name} 沒有開槍就嚥下了最後一口氣...`);
    }
  }

  /**
   * 執行開槍
   */
  async _shootTarget(game, player, isHuman) {
    const targets = game.getAlivePlayers();

    if (targets.length === 0) {
      game.log.warning('沒有可以射擊的目標!');
      return;
    }

    let shootTarget;

    if (isHuman) {
      const options = targets.map(p => `${p.name} (ID: ${p.id})`);
      const selectedIndex = await game.selectOption(options, '請選擇射擊目標:');

      if (selectedIndex === -1) {
        game.log.warning('獵人放棄了開槍');
        return;
      }

      shootTarget = targets[selectedIndex];
    } else {
      // AI 隨機選擇
      shootTarget = this.randomSelectTarget(targets);
    }

    if (shootTarget) {
      shootTarget.isAlive = false;
      player.abilities.canShoot = false;
      game.log.action(`獵人 ${player.name} 開槍擊中了 ${shootTarget.name}！`);
    }
  }
}

// 向後相容的函式匯出
export async function handleHunterAbility(game, player) {
  const role = new HunterRole();
  return role.onDeath(game, player);
}

export async function simulateHunterAbility(game, player) {
  const role = new HunterRole();
  return role.simulateDeathTrigger(game, player);
}

export default HunterRole;
