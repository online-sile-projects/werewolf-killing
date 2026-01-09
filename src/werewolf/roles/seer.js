/**
 * 預言家角色類別
 */

import { BaseRole, TEAMS, ACTION_TYPES } from './BaseRole.js';
import { ROLES } from './roleConstants.js';

export class SeerRole extends BaseRole {
  constructor() {
    super('SEER', {
      name: ROLES.SEER,
      team: TEAMS.VILLAGE,
      actionType: ACTION_TYPES.ACTIVE_NIGHT,
      actionOrder: 40,
      description: '每晚可以查驗一位玩家的身份'
    });
  }

  /**
   * 處理人類玩家的預言家行動
   */
  async handleAction(game, player) {
    game.log.night('您是預言家，請選擇一位玩家查驗身份:');

    const targets = game.getAlivePlayers().filter(p => p.id !== player.id);

    if (targets.length === 0) {
      game.log.warning('沒有可以查驗的目標!');
      return;
    }

    const options = targets.map(p => `${p.name} (ID: ${p.id})`);
    const selectedIndex = await game.selectOption(options, '請選擇查驗目標:');

    if (selectedIndex === -1) {
      game.log.warning('您選擇放棄查驗!');
      return;
    }

    const selectedTarget = targets[selectedIndex];
    const isWerewolf = selectedTarget.role === ROLES.WEREWOLF;

    game.state.seerChecks.push({
      night: game.state.day,
      targetId: selectedTarget.id,
      result: isWerewolf ? '狼人' : '好人'
    });

    game.log.action(`您查驗了 ${selectedTarget.name}，結果是: ${isWerewolf ? '狼人' : '好人'}`);
  }

  /**
   * 模擬 AI 預言家行動
   */
  async simulateAction(game, player) {
    const targets = game.getAlivePlayers().filter(p => p.id !== player.id);

    if (targets.length === 0) return;

    let selectedTarget;

    const context = this.buildAIContext(game, player,
      '可以查驗一位玩家的身份。請選擇一位你懷疑的玩家進行查驗。');

    const decision = await this.callAIDecision(game, player, 'check', targets, context);

    if (decision && decision.targetId) {
      selectedTarget = targets.find(p => p.id === decision.targetId);
    }

    if (!selectedTarget) {
      selectedTarget = this.randomSelectTarget(targets);
    }

    const isWerewolf = selectedTarget.role === ROLES.WEREWOLF;

    game.state.seerChecks.push({
      night: game.state.day,
      targetId: selectedTarget.id,
      result: isWerewolf ? '狼人' : '好人'
    });

    game.log.system(`AI預言家 ${player.name} 查驗了 ${selectedTarget.name} (對你隱藏)`);
  }
}

// 向後相容的函式匯出
export async function handleSeerAction(game, player) {
  const role = new SeerRole();
  return role.handleAction(game, player);
}

export async function simulateSeerAction(game, player) {
  const role = new SeerRole();
  return role.simulateAction(game, player);
}

export default SeerRole;
