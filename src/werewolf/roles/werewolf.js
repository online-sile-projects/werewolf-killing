/**
 * 狼人角色類別
 */

import { BaseRole, TEAMS, ACTION_TYPES } from './BaseRole.js';
import { ROLES } from './roleConstants.js';

export class WerewolfRole extends BaseRole {
  constructor() {
    super('WEREWOLF', {
      name: ROLES.WEREWOLF,
      team: TEAMS.WEREWOLF,
      actionType: ACTION_TYPES.ACTIVE_NIGHT,
      actionOrder: 20,
      description: '每晚可以選擇一位玩家擊殺'
    });
  }

  /**
   * 處理人類玩家的狼人行動
   */
  // eslint-disable-next-line no-unused-vars
  async handleAction(game, _player) {
    game.log.night('您是狼人，請選擇一位玩家擊殺:');

    const targets = game.getAlivePlayers().filter(p => p.role !== ROLES.WEREWOLF);

    if (targets.length === 0) {
      game.log.warning('沒有可以擊殺的目標!');
      return;
    }

    const options = targets.map(p => `${p.name} (ID: ${p.id})`);
    const selectedIndex = await game.selectOption(options, '請選擇擊殺目標:');

    if (selectedIndex === -1) {
      game.log.warning('您選擇放棄擊殺!');
      return;
    }

    const selectedTarget = targets[selectedIndex];
    game.state.werewolfVoteResult = selectedTarget.id;
    game.log.action(`您選擇擊殺: ${selectedTarget.name}`);
  }

  /**
   * 模擬 AI 狼人行動
   */
  async simulateAction(game, player) {
    // 如果已經有狼人投票結果，則跳過
    if (game.state.werewolfVoteResult !== null) return;

    const targets = game.getAlivePlayers().filter(p => p.role !== ROLES.WEREWOLF);

    if (targets.length === 0) return;

    const context = this.buildAIContext(game, player,
      '需要選擇一位玩家擊殺。請考慮遊戲形勢做出決策。');

    const decision = await this.callAIDecision(game, player, 'kill', targets, context);

    if (decision && decision.targetId) {
      const targetPlayer = targets.find(p => p.id === decision.targetId);
      if (targetPlayer) {
        game.state.werewolfVoteResult = decision.targetId;
        game.log.system(`AI狼人 ${player.name} 選擇了擊殺目標 (對你隱藏)`);
        return;
      }
    }

    // AI 決策失敗，隨機選擇
    const selectedTarget = this.randomSelectTarget(targets);
    game.state.werewolfVoteResult = selectedTarget.id;
    game.log.system(`AI狼人 ${player.name} 選擇了擊殺目標 (對你隱藏)`);
  }
}

// 向後相容的函式匯出
export async function handleWerewolfAction(game, player) {
  const role = new WerewolfRole();
  return role.handleAction(game, player);
}

export async function simulateWerewolfAction(game, player) {
  const role = new WerewolfRole();
  return role.simulateAction(game, player);
}

export default WerewolfRole;
