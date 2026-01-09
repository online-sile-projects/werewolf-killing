/**
 * NightPhase - 夜晚階段類別
 */

import { BasePhase } from './BasePhase.js';
import { ROLES, NIGHT_ACTIONS_ORDER, GAME_PHASES } from '../roles/roleConstants.js';
import { handleWerewolfAction, simulateWerewolfAction } from '../roles/werewolf.js';
import { handleSeerAction, simulateSeerAction } from '../roles/seer.js';
import { handleWitchAction, simulateWitchAction } from '../roles/witch.js';
import { handleGuardAction, simulateGuardAction } from '../roles/guard.js';

export class NightPhase extends BasePhase {
  constructor() {
    super('NIGHT', {
      name: GAME_PHASES.NIGHT,
      description: '狼人行動、預言家查驗、女巫救毒、守衛保護',
      order: 1
    });
  }

  /**
   * 進入夜晚階段
   */
  async onEnter(game) {
    game.state.day++;
    game.log.night(`=== 第 ${game.state.day} 天夜晚 ===`);

    // 重置夜晚狀態
    game.state.witchSaved = false;
    game.state.witchPoisoned = false;
    game.state.guardProtected = null;

    game.printGameStatus();
    game.recordGameMessage('系統', `進入第 ${game.state.day} 天夜晚階段。`);
  }

  /**
   * 執行夜晚階段邏輯
   */
  async execute(game) {
    // 按角色順序執行夜晚行動
    for (const roleKey of NIGHT_ACTIONS_ORDER) {
      await this._handleNightAction(game, roleKey);
    }

    // 處理夜晚結果
    this._resolveNightActions(game);

    // 檢查遊戲是否結束
    if (game.isGameOver()) {
      return 'GAME_OVER';
    }

    return 'DAY_DISCUSSION';
  }

  /**
   * 處理特定角色的夜晚行動
   */
  async _handleNightAction(game, roleKey) {
    const roleName = game.roles[roleKey];
    const players = game.players.filter(p => p.role === roleName && p.isAlive);

    if (players.length === 0) return;

    game.log.night(`${roleName}的回合...`);
    game.recordGameMessage('系統', `${roleName}的回合開始`);

    const humanPlayer = players.find(p => p.isHuman);

    if (humanPlayer) {
      await this._executeHumanAction(game, roleKey, humanPlayer);
    } else {
      for (const player of players) {
        await this._executeAIAction(game, roleKey, player);
      }
    }

    game.recordGameMessage('系統', `${roleName}的回合結束`);
  }

  /**
   * 執行人類玩家行動
   */
  async _executeHumanAction(game, roleKey, player) {
    switch (roleKey) {
      case 'WEREWOLF':
        await handleWerewolfAction(game, player);
        break;
      case 'SEER':
        await handleSeerAction(game, player);
        break;
      case 'WITCH':
        await handleWitchAction(game, player);
        break;
      case 'GUARD':
        await handleGuardAction(game, player);
        break;
    }
  }

  /**
   * 執行 AI 玩家行動
   */
  async _executeAIAction(game, roleKey, player) {
    switch (roleKey) {
      case 'WEREWOLF':
        await simulateWerewolfAction(game, player);
        break;
      case 'SEER':
        await simulateSeerAction(game, player);
        break;
      case 'WITCH':
        await simulateWitchAction(game, player);
        break;
      case 'GUARD':
        await simulateGuardAction(game, player);
        break;
    }
  }

  /**
   * 處理夜晚行動結果
   */
  _resolveNightActions(game) {
    game.log.night('黎明即將到來...');

    let nightDeaths = [];

    // 處理狼人擊殺
    const killedPlayerId = game.state.werewolfVoteResult;
    if (killedPlayerId !== null) {
      const killedPlayer = game.players.find(p => p.id === killedPlayerId);

      if ((game.state.witchSaved) || (game.state.guardProtected === killedPlayerId)) {
        game.log.night('狼人的獵物被救回來了！');
        game.recordGameMessage('系統', '狼人的獵物被救回來了！');
      } else {
        killedPlayer.isAlive = false;
        nightDeaths.push(killedPlayer);
        game.recordGameMessage('系統', `${killedPlayer.name} 被狼人殺死了！`);
      }
    }

    // 處理女巫毒藥
    if (game.state.witchPoisoned && game.state.witchPoisonTarget) {
      const poisonedPlayerId = game.state.witchPoisonTarget;
      const poisonedPlayer = game.players.find(p => p.id === poisonedPlayerId);

      if (poisonedPlayer && poisonedPlayer.isAlive) {
        poisonedPlayer.isAlive = false;
        if (!nightDeaths.some(p => p.id === poisonedPlayerId)) {
          nightDeaths.push(poisonedPlayer);
          game.recordGameMessage('系統', `${poisonedPlayer.name} 被女巫毒死了！`);
        }
      }
    }

    // 記錄夜晚結果
    game.state.nightKilled = nightDeaths.length > 0 ? nightDeaths.map(p => p.id) : null;

    if (nightDeaths.length === 0) {
      game.recordGameMessage('系統', '今晚是平安夜，沒有玩家死亡。');
    }

    // 重置投票結果
    game.state.werewolfVoteResult = null;
    game.state.witchPoisonTarget = null;
  }

  /**
   * 離開夜晚階段
   */
  async onExit(game) {
    game.printGameStatus();
  }
}

// 向後相容的函式匯出
export async function handleNightPhase(game) {
  const phase = new NightPhase();
  await phase.onEnter(game);
  const nextPhase = await phase.execute(game);
  await phase.onExit(game);

  // 更新遊戲狀態
  if (nextPhase === 'DAY_DISCUSSION') {
    game.state.phase = game.gamePhases.DAY_DISCUSSION;
  } else if (nextPhase === 'GAME_OVER') {
    game.state.phase = game.gamePhases.GAME_OVER;
  }
}

export default NightPhase;
