/**
 * 投票階段邏輯
 */
import { handleHunterAbility, simulateHunterAbility } from '../roles/hunter.js';

/**
 * 處理投票階段
 */
export async function handleVotingPhase(game) {
  game.log.day('現在進入投票階段，將決定驅逐一名玩家');
  game.state.votes = {};
  
  // 記錄進入投票階段的訊息
  game.recordGameMessage('系統', '現在進入投票階段，玩家們開始投票。');
  
  // 人類玩家先投票
  const humanPlayer = game.getHumanPlayer();
  if (humanPlayer.isAlive) {
    await handlePlayerVote(game, humanPlayer);
  }
  
  // AI玩家投票
  const aiPlayers = game.getAlivePlayers().filter(p => !p.isHuman);
  for (const player of aiPlayers) {
    await simulatePlayerVote(game, player);
  }
  
  // 計算投票結果
  const voteResults = {};
  for (const [voterId, targetId] of Object.entries(game.state.votes)) {
    if (!voteResults[targetId]) {
      voteResults[targetId] = 0;
    }
    voteResults[targetId]++;
  }
  
  // 找出票數最多的玩家
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
  
  // 處理平票情況
  let votedOutPlayerId = null;
  
  if (maxVotedPlayers.length === 1) {
    votedOutPlayerId = maxVotedPlayers[0];
  } else if (maxVotedPlayers.length > 1) {
    // 平票情況，隨機選擇一個
    game.log.warning('投票出現平局！將隨機選擇一名玩家');
    game.recordGameMessage('系統', '投票出現平局！將隨機選擇一名玩家');
    votedOutPlayerId = maxVotedPlayers[Math.floor(Math.random() * maxVotedPlayers.length)];
  }
  
  return votedOutPlayerId;
}

/**
 * 處理人類玩家投票
 */
export async function handlePlayerVote(game, player) {
  // 獲取可以投票的玩家（排除自己）
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
 * 模擬AI玩家投票
 */
export async function simulatePlayerVote(game, player) {
  // 獲取可以投票的玩家（排除自己）
  const targets = game.getAlivePlayers().filter(p => p.id !== player.id);
  
  if (targets.length === 0) return;
  
  // AI隨機選擇一個目標（這裡可以加入更複雜的AI邏輯）
  const selectedTarget = targets[Math.floor(Math.random() * targets.length)];
  game.state.votes[player.id] = selectedTarget.id;
  
  game.log.system(`${player.name} 進行了投票 (對你隱藏)`);
  game.recordGameMessage(`玩家-${player.id}`, `投票驅逐 ${selectedTarget.name}`);
}

/**
 * 處理投票結果
 */
export async function handleVoteResult(game, votedOutPlayerId) {
  if (votedOutPlayerId === null) {
    game.log.warning('投票結束，沒有玩家被驅逐');
    game.recordGameMessage('系統', '投票結束，沒有玩家被驅逐');
    return;
  }
  
  const votedOutPlayer = game.players.find(p => p.id === votedOutPlayerId);
  
  game.log.warning(`投票結束，${votedOutPlayer.name} 被驅逐出村莊`);
  votedOutPlayer.isAlive = false;
  
  // 記錄驅逐結果
  game.recordGameMessage('系統', `投票結束，${votedOutPlayer.name} 被驅逐出村莊`);
  
  // 顯示身份
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
