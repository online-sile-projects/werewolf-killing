/**
 * 女巫角色類別
 */

import { BaseRole, TEAMS, ACTION_TYPES } from './BaseRole.js';
import { ROLES } from './roleConstants.js';

export class WitchRole extends BaseRole {
  constructor() {
    super('WITCH', {
      name: ROLES.WITCH,
      team: TEAMS.VILLAGE,
      actionType: ACTION_TYPES.ACTIVE_NIGHT,
      actionOrder: 30, // 狼人之後行動
      description: '擁有一瓶解藥和一瓶毒藥，各可使用一次'
    });
  }

  /**
   * 初始化女巫能力
   */
  initializeAbilities() {
    return {
      hasMedicine: true,
      hasPoison: true
    };
  }

  /**
   * 處理人類玩家的女巫行動
   */
  async handleAction(game, player) {
    game.log.night('您是女巫，請選擇您的行動:');

    const killedPlayerId = game.state.werewolfVoteResult;
    const killedPlayer = killedPlayerId !== null
      ? game.players.find(p => p.id === killedPlayerId)
      : null;

    // 1. 解藥
    if (player.abilities.hasMedicine && killedPlayer) {
      game.log.info(`今晚 ${killedPlayer.name} 將被狼人殺死`);
      const willSave = await game.askYesNo('您是否要使用解藥救人？');

      if (willSave) {
        player.abilities.hasMedicine = false;
        game.state.witchSaved = true;
        game.log.action(`您使用解藥救了 ${killedPlayer.name}`);
      }
    } else if (player.abilities.hasMedicine && killedPlayer === null) {
      game.log.info('今晚沒有人被狼人選中');
    } else if (!player.abilities.hasMedicine) {
      game.log.info('您已經沒有解藥了');
    }

    // 2. 毒藥
    if (player.abilities.hasPoison) {
      const willPoison = await game.askYesNo('您是否要使用毒藥？');

      if (willPoison) {
        const targets = game.getAlivePlayers().filter(p => p.id !== player.id);

        if (targets.length === 0) {
          game.log.warning('沒有可以毒殺的目標!');
        } else {
          const options = targets.map(p => `${p.name} (ID: ${p.id})`);
          const selectedIndex = await game.selectOption(options, '請選擇毒殺目標:');

          if (selectedIndex !== -1) {
            const poisonTarget = targets[selectedIndex];
            player.abilities.hasPoison = false;
            game.state.witchPoisoned = true;
            game.state.witchPoisonTarget = poisonTarget.id;
            game.log.action(`您使用毒藥毒殺了 ${poisonTarget.name}`);
          } else {
            game.log.warning('您取消了使用毒藥');
          }
        }
      }
    } else {
      game.log.info('您已經沒有毒藥了');
    }
  }

  /**
   * 模擬 AI 女巫行動
   */
  async simulateAction(game, player) {
    const killedPlayerId = game.state.werewolfVoteResult;
    const killedPlayer = killedPlayerId !== null
      ? game.players.find(p => p.id === killedPlayerId)
      : null;

    // 處理解藥
    if (player.abilities.hasMedicine && killedPlayer) {
      const saveContext = this.buildAIContext(game, player,
        `狼人今晚選擇擊殺了 ${killedPlayer.name} (ID: ${killedPlayer.id})。你有一瓶解藥，可以救活他。請決定是否使用解藥。`);

      const saveDecision = await this.callAISaveDecision(game, player, killedPlayer, saveContext);

      if (saveDecision && saveDecision.save === true) {
        player.abilities.hasMedicine = false;
        game.state.witchSaved = true;
        game.log.system(`AI女巫 ${player.name} 使用了解藥 (對你隱藏)`);
      } else if (saveDecision === null) {
        // AI 失敗，使用隨機邏輯
        if (Math.random() > 0.3) {
          player.abilities.hasMedicine = false;
          game.state.witchSaved = true;
          game.log.system(`AI女巫 ${player.name} 做出了選擇 (對你隱藏)`);
        }
      }
    }

    // 處理毒藥
    if (player.abilities.hasPoison) {
      const targets = game.getAlivePlayers().filter(p => p.id !== player.id);

      if (targets.length > 0) {
        const poisonContext = this.buildAIContext(game, player,
          '你有一瓶毒藥，可以選擇殺死一位玩家。請決定是否使用毒藥，如使用請選擇目標。');

        const poisonDecision = await this.callAIPoisonDecision(game, player, targets, poisonContext);

        if (poisonDecision && poisonDecision.poison === true && poisonDecision.targetId) {
          const targetPlayer = targets.find(p => p.id === poisonDecision.targetId);
          if (targetPlayer) {
            player.abilities.hasPoison = false;
            game.state.witchPoisoned = true;
            game.state.witchPoisonTarget = poisonDecision.targetId;
            game.log.system(`AI女巫 ${player.name} 使用了毒藥 (對你隱藏)`);
            return;
          }
        }

        // AI 失敗或未決定使用，用隨機邏輯
        if (poisonDecision === null && Math.random() > 0.7) {
          const poisonTarget = this.randomSelectTarget(targets);
          player.abilities.hasPoison = false;
          game.state.witchPoisoned = true;
          game.state.witchPoisonTarget = poisonTarget.id;
          game.log.system(`AI女巫 ${player.name} 做出了選擇 (對你隱藏)`);
        }
      }
    }
  }

  /**
   * 呼叫 AI 解藥決策
   */
  async callAISaveDecision(game, player, killedPlayer, context) {
    if (!game.settings.useAI || !game.apiManager) {
      return null;
    }

    try {
      const decision = await game.apiManager.generateAiDecision(
        this.name,
        'save',
        { playerToSave: killedPlayer },
        context,
        player.id
      );
      return decision;
    } catch (error) {
      console.error('AI 女巫救人決策出錯:', error);
      return null;
    }
  }

  /**
   * 呼叫 AI 毒藥決策
   */
  async callAIPoisonDecision(game, player, targets, context) {
    if (!game.settings.useAI || !game.apiManager) {
      return null;
    }

    try {
      const decision = await game.apiManager.generateAiDecision(
        this.name,
        'poison',
        targets,
        context,
        player.id
      );
      return decision;
    } catch (error) {
      console.error('AI 女巫毒人決策出錯:', error);
      return null;
    }
  }
}

// 向後相容的函式匯出
export async function handleWitchAction(game, player) {
  const role = new WitchRole();
  return role.handleAction(game, player);
}

export async function simulateWitchAction(game, player) {
  const role = new WitchRole();
  return role.simulateAction(game, player);
}

export default WitchRole;
