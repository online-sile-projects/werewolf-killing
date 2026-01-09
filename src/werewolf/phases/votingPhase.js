/**
 * VotingPhase - 投票階段類別
 */

import { BasePhase } from './BasePhase.js';
import { GAME_PHASES } from '../roles/roleConstants.js';
import { handleHunterAbility, simulateHunterAbility } from '../roles/hunter.js';

export class VotingPhase extends BasePhase {
  constructor() {
    super('VOTING', {
      name: GAME_PHASES.VOTING,
      description: '玩家投票驅逐一名玩家',
      order: 3
    });
  }

  /**
   * 進入投票階段
   */
  async onEnter(game) {
    game.log.day('現在進入投票階段，將決定驅逐一名玩家');
    game.state.votes = {};
    game.recordGameMessage('系統', '現在進入投票階段，玩家們開始投票。');
  }

  /**
   * 執行投票階段邏輯
   */
  async execute(game) {
    // 人類玩家先投票
    const humanPlayer = game.getHumanPlayer();
    if (humanPlayer.isAlive) {
      await this._handlePlayerVote(game, humanPlayer);
    }

    // AI 玩家投票
    const aiPlayers = game.getAlivePlayers().filter(p => !p.isHuman);
    for (const player of aiPlayers) {
      await this._simulatePlayerVote(game, player);
    }

    // 計算投票結果
    const votedOutPlayerId = this._calculateVoteResult(game);

    // 處理投票結果
    await this._handleVoteResult(game, votedOutPlayerId);

    // 檢查遊戲是否結束
    if (game.isGameOver()) {
      return 'GAME_OVER';
    }

    return 'NIGHT';
  }

  /**
   * 處理人類玩家投票
   */
  async _handlePlayerVote(game, player) {
    const targets = game.getAlivePlayers().filter(p => p.id !== player.id);

    if (targets.length === 0) {
      game.log.warning('沒有可以投票的目標!');
      return;
    }

    const options = targets.map(p => `${p.name} (ID: ${p.id})`);
    const selectedIndex = await game.selectOption(options, '請選擇要投票驅逐的玩家:');

    if (selectedIndex === -1) {
      game.log.warning('您選擇棄票!');
      game.recordGameMessage(`玩家-${player.id}`, '棄票');
      return;
    }

    const selectedTarget = targets[selectedIndex];
    game.state.votes[player.id] = selectedTarget.id;
    game.log.action(`您投票驅逐 ${selectedTarget.name}`);
    game.recordGameMessage(`玩家-${player.id}`, `投票驅逐 ${selectedTarget.name}`);
  }

  /**
   * 模擬 AI 玩家投票
   */
  async _simulatePlayerVote(game, player) {
    const targets = game.getAlivePlayers().filter(p => p.id !== player.id);

    if (targets.length === 0) return;

    let selectedTarget;

    if (game.settings.useAI && game.apiManager) {
      try {
        const gameContext = `現在是第 ${game.state.day} 天投票階段，你是 ${player.role}，需要投票選擇一名玩家驅逐出局。請根據以往的遊戲記錄和玩家表現，投給你認為最可疑的玩家。`;

        const decision = await game.apiManager.generateAiDecision(
          player.role,
          'vote',
          targets,
          gameContext,
          player.id
        );

        if (decision && typeof decision.targetId === 'number') {
          const targetPlayer = targets.find(p => p.id === decision.targetId);
          if (targetPlayer) {
            selectedTarget = targetPlayer;
          }
        }
      } catch (error) {
        console.error('AI 投票決策出錯:', error);
      }
    }

    if (!selectedTarget) {
      selectedTarget = targets[Math.floor(Math.random() * targets.length)];
    }

    game.state.votes[player.id] = selectedTarget.id;
    game.log.action(`${player.name} 投票驅逐 ${selectedTarget.name}`);
    game.recordGameMessage(`玩家-${player.id}`, `投票驅逐 ${selectedTarget.name}`);
  }

  /**
   * 計算投票結果
   */
  _calculateVoteResult(game) {
    const voteResults = {};

    for (const [, targetId] of Object.entries(game.state.votes)) {
      if (!voteResults[targetId]) {
        voteResults[targetId] = 0;
      }
      voteResults[targetId]++;
    }

    let maxVotes = 0;
    let maxVotedPlayers = [];

    for (const [targetId, votes] of Object.entries(voteResults)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        maxVotedPlayers = [parseInt(targetId)];
      } else if (votes === maxVotes) {
        maxVotedPlayers.push(parseInt(targetId));
      }
    }

    if (maxVotedPlayers.length === 1) {
      return maxVotedPlayers[0];
    } else if (maxVotedPlayers.length > 1) {
      game.log.warning('投票出現平局！將隨機選擇一名玩家');
      game.recordGameMessage('系統', '投票出現平局！將隨機選擇一名玩家');
      return maxVotedPlayers[Math.floor(Math.random() * maxVotedPlayers.length)];
    }

    return null;
  }

  /**
   * 處理投票結果
   */
  async _handleVoteResult(game, votedOutPlayerId) {
    if (votedOutPlayerId === null) {
      game.log.warning('投票結束，沒有玩家被驅逐');
      game.recordGameMessage('系統', '投票結束，沒有玩家被驅逐');
      return;
    }

    const votedOutPlayer = game.players.find(p => p.id === votedOutPlayerId);

    game.log.warning(`投票結束，${votedOutPlayer.name} 被驅逐出村莊`);
    votedOutPlayer.isAlive = false;

    game.recordGameMessage('系統', `投票結束，${votedOutPlayer.name} 被驅逐出村莊`);
    game.log.role(`${votedOutPlayer.name} 的真實身份是: ${votedOutPlayer.role}`);
    game.recordGameMessage('系統', `${votedOutPlayer.name} 的真實身份是: ${votedOutPlayer.role}`);

    // 獵人死亡時可以開槍
    if (votedOutPlayer.role === game.roles.HUNTER && votedOutPlayer.abilities.canShoot) {
      if (votedOutPlayer.isHuman) {
        await handleHunterAbility(game, votedOutPlayer);
      } else {
        await simulateHunterAbility(game, votedOutPlayer);
      }
    }

    await game.ask('按Enter繼續...');
  }

  /**
   * 離開投票階段
   */
  async onExit(game) {
    game.printGameStatus();
  }
}

// 向後相容的函式匯出
export async function handleVotingPhase(game) {
  const phase = new VotingPhase();
  await phase.onEnter(game);

  // 投票邏輯
  const humanPlayer = game.getHumanPlayer();
  if (humanPlayer.isAlive) {
    await phase._handlePlayerVote(game, humanPlayer);
  }

  const aiPlayers = game.getAlivePlayers().filter(p => !p.isHuman);
  for (const player of aiPlayers) {
    await phase._simulatePlayerVote(game, player);
  }

  return phase._calculateVoteResult(game);
}

export async function handlePlayerVote(game, player) {
  const phase = new VotingPhase();
  return phase._handlePlayerVote(game, player);
}

export async function simulatePlayerVote(game, player) {
  const phase = new VotingPhase();
  return phase._simulatePlayerVote(game, player);
}

export async function handleVoteResult(game, votedOutPlayerId) {
  const phase = new VotingPhase();
  return phase._handleVoteResult(game, votedOutPlayerId);
}

export default VotingPhase;
