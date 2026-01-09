/**
 * 守衛角色類別
 */

import { BaseRole, TEAMS, ACTION_TYPES } from './BaseRole.js';
import { ROLES } from './roleConstants.js';

export class GuardRole extends BaseRole {
  constructor() {
    super('GUARD', {
      name: ROLES.GUARD,
      team: TEAMS.VILLAGE,
      actionType: ACTION_TYPES.ACTIVE_NIGHT,
      actionOrder: 10, // 守衛最先行動
      description: '每晚可以保護一位玩家免受狼人襲擊，不能連續兩晚保護同一人'
    });
  }

  /**
   * 初始化守衛能力
   */
  initializeAbilities() {
    return {
      lastProtected: null
    };
  }

  /**
   * 處理人類玩家的守衛行動
   */
  async handleAction(game, player) {
    game.log.night('您是守衛，請選擇一位玩家保護:');

    const targets = game.getAlivePlayers().filter(p => {
      return p.id !== player.abilities.lastProtected;
    });

    if (targets.length === 0) {
      game.log.warning('沒有可以保護的目標!');
      return;
    }

    const options = targets.map(p => `${p.name} (ID: ${p.id})`);
    const selectedIndex = await game.selectOption(options, '請選擇保護目標:');

    if (selectedIndex === -1) {
      game.log.warning('您選擇不保護任何人!');
      return;
    }

    const selectedTarget = targets[selectedIndex];
    game.state.guardProtected = selectedTarget.id;
    player.abilities.lastProtected = selectedTarget.id;
    game.log.action(`您選擇保護: ${selectedTarget.name}`);
  }

  /**
   * 模擬 AI 守衛行動
   */
  async simulateAction(game, player) {
    const targets = game.getAlivePlayers().filter(p => {
      return p.id !== player.abilities.lastProtected;
    });

    if (targets.length === 0) return;

    let context = this.buildAIContext(game, player,
      '可以保護一位玩家免受狼人襲擊。你不能連續兩晚保護同一個人。請選擇一位你認為可能受到襲擊的玩家進行保護。');

    if (player.abilities.lastProtected) {
      const lastProtectedPlayer = game.players.find(p => p.id === player.abilities.lastProtected);
      if (lastProtectedPlayer) {
        context += `\n\n你上一晚保護了 ${lastProtectedPlayer.name} (ID: ${lastProtectedPlayer.id})，不能再次保護他。`;
      }
    }

    const decision = await this.callAIDecision(game, player, 'guard', targets, context);

    let selectedTarget;
    if (decision && decision.targetId) {
      selectedTarget = targets.find(p => p.id === decision.targetId);
    }

    if (!selectedTarget) {
      selectedTarget = this.randomSelectTarget(targets);
    }

    game.state.guardProtected = selectedTarget.id;
    player.abilities.lastProtected = selectedTarget.id;

    game.log.system(`AI守衛 ${player.name} 選擇保護 ${selectedTarget.name} (對你隱藏)`);
  }
}

// 向後相容的函式匯出
export async function handleGuardAction(game, player) {
  const role = new GuardRole();
  return role.handleAction(game, player);
}

export async function simulateGuardAction(game, player) {
  const role = new GuardRole();
  return role.simulateAction(game, player);
}

export default GuardRole;
