/**
 * DayPhase - 白天討論階段類別
 */

import { BasePhase } from './BasePhase.js';
import { GAME_PHASES } from '../roles/roleConstants.js';
import { handleHunterAbility, simulateHunterAbility } from '../roles/hunter.js';

export class DayPhase extends BasePhase {
  constructor() {
    super('DAY_DISCUSSION', {
      name: GAME_PHASES.DAY_DISCUSSION,
      description: '宣佈夜晚死亡情況，玩家依序發言',
      order: 2
    });
  }

  /**
   * 進入白天階段
   */
  async onEnter(game) {
    game.log.day(`=== 第 ${game.state.day} 天白天 ===`);
    game.recordGameMessage('系統', `進入第 ${game.state.day} 天白天討論階段。`);
  }

  /**
   * 執行白天討論階段邏輯
   */
  async execute(game) {
    // 宣佈昨晚死亡情況
    await this._announceNightDeaths(game);

    game.printGameStatus();

    // 檢查遊戲是否應該結束
    if (game.isGameOver()) {
      return 'GAME_OVER';
    }

    // 討論階段
    await this._handleDiscussion(game);

    await game.ask('按Enter進入投票階段...');

    game.log.system('討論結束，進入投票階段');
    game.recordGameMessage('系統', '討論結束，進入投票階段。');

    return 'VOTING';
  }

  /**
   * 宣佈夜晚死亡情況
   */
  async _announceNightDeaths(game) {
    if (game.state.nightKilled && game.state.nightKilled.length > 0) {
      game.log.warning(`昨晚，以下玩家不幸遇難:`);

      const deadPlayerNames = [];

      for (const id of game.state.nightKilled) {
        const player = game.players.find(p => p.id === id);
        game.log.dead(`- ${player.name} (ID: ${player.id})`);
        deadPlayerNames.push(player.name);

        // 使用 AI 生成死亡故事敘述
        if (game.settings.useAI && game.apiManager) {
          const context = `在第 ${game.state.day} 天的早晨，村民們發現 ${player.name} (角色: ${player.role}) 死亡了。`;
          const story = await game.generateStoryWithAI(context);
          if (story) {
            game.log.story(story);
            game.recordGameMessage('旁白', story);
          }
        }

        // 獵人死亡時可以開槍
        if (player.role === game.roles.HUNTER && player.abilities.canShoot) {
          if (player.isHuman) {
            await handleHunterAbility(game, player);
          } else {
            await simulateHunterAbility(game, player);
          }
        }
      }

      game.recordGameMessage('系統', `昨晚，以下玩家不幸遇難: ${deadPlayerNames.join('、')}`);
    } else {
      game.log.success('昨晚是平安夜，沒有人死亡！');
      game.recordGameMessage('系統', '昨晚是平安夜，沒有人死亡！');

      // 使用 AI 生成平安夜故事敘述
      if (game.settings.useAI && game.apiManager) {
        const context = `第 ${game.state.day} 天是平安夜，沒有村民死亡。`;
        const story = await game.generateStoryWithAI(context);
        if (story) {
          game.log.story(story);
          game.recordGameMessage('旁白', story);
        }
      }
    }
  }

  /**
   * 處理討論階段
   */
  async _handleDiscussion(game) {
    game.log.day('現在進入討論階段，請玩家們依序發言...');
    game.recordGameMessage('系統', '現在進入討論階段，玩家們依序開始發言。');

    const alivePlayers = game.getAlivePlayers().sort((a, b) => a.id - b.id);

    for (const player of alivePlayers) {
      game.log.system(`輪到 ${player.name} (ID: ${player.id}) 發言...`);

      if (player.isHuman) {
        await this._handleHumanSpeech(game, player);
      } else {
        await this._handleAISpeech(game, player);
      }

      // 每位玩家發言後短暫暫停
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * 處理人類玩家發言
   */
  async _handleHumanSpeech(game, player) {
    game.log.system('現在是您的發言時間...');
    game.log.info('您可以發表對遊戲局勢的看法或懷疑，或是為自己辯護。');

    const userSpeech = await game.ask('請輸入您的發言 (直接按 Enter 跳過發言)：');

    if (userSpeech && userSpeech.trim() !== '') {
      game.log.player(`${player.name}: ${userSpeech}`);
      game.recordGameMessage(`玩家-${player.id}`, userSpeech);
    } else {
      game.log.warning('您選擇了沉默...');
      game.recordGameMessage(`玩家-${player.id}`, '（沉默不語）');
    }
  }

  /**
   * 處理 AI 玩家發言
   */
  async _handleAISpeech(game, player) {
    if (game.settings.useAI && game.apiManager) {
      const context = `這是遊戲的第 ${game.state.day} 天白天討論階段，請您以狼人殺遊戲中的 ${player.role} 角色身份，根據當前情況發表簡短的發言。`;
      const response = await game.generateNpcResponseWithAI(player.id, context);

      if (response) {
        game.log.player(`${player.name}: ${response}`);
        game.recordGameMessage(`玩家-${player.id}`, response);
      } else {
        this._useDefaultSpeech(game, player);
      }
    } else {
      this._useDefaultSpeech(game, player);
    }
  }

  /**
   * 使用預設發言
   */
  _useDefaultSpeech(game, player) {
    const defaultResponse = `我認為我們需要多觀察，找出可疑的人。`;
    game.log.player(`${player.name}: ${defaultResponse}`);
    game.recordGameMessage(`玩家-${player.id}`, defaultResponse);
  }
}

// 向後相容的函式匯出
export async function handleDayDiscussionPhase(game) {
  const phase = new DayPhase();
  await phase.onEnter(game);
  const nextPhase = await phase.execute(game);

  // 更新遊戲狀態
  if (nextPhase === 'VOTING') {
    game.state.phase = game.gamePhases.VOTING;
  } else if (nextPhase === 'GAME_OVER') {
    game.state.phase = game.gamePhases.GAME_OVER;
  }
}

export default DayPhase;
