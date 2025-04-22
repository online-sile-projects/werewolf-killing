/**
 * 夜晚階段邏輯
 */
import { ROLES, NIGHT_ACTIONS_ORDER } from '../roles/roleConstants.js';
import { handleWerewolfAction, simulateWerewolfAction } from '../roles/werewolf.js';
import { handleSeerAction, simulateSeerAction } from '../roles/seer.js';
import { handleWitchAction, simulateWitchAction } from '../roles/witch.js';
import { handleGuardAction, simulateGuardAction } from '../roles/guard.js';

/**
 * 處理夜晚階段
 */
export async function handleNightPhase(game) {
  // 增加天數
  game.state.day++;
  game.log.night(`=== 第 ${game.state.day} 天夜晚 ===`);
  game.state.witchSaved = false;
  game.state.witchPoisoned = false;
  game.state.guardProtected = null;
  game.printGameStatus();
  
  // 按角色順序執行夜晚行動
  for (const role of NIGHT_ACTIONS_ORDER) {
    await handleNightAction(game, role);
  }
  
  // 處理夜晚結果
  resolveNightActions(game);
  
  // 轉入白天討論階段
  game.state.phase = game.gamePhases.DAY_DISCUSSION;
  game.printGameStatus();
}

/**
 * 處理特定角色的夜晚行動
 */
async function handleNightAction(game, roleKey) {
  const roleName = game.roles[roleKey];
  const players = game.players.filter(p => p.role === roleName && p.isAlive);
  
  if (players.length === 0) return;
  
  game.log.night(`${roleName}的回合...`);
  
  // 查找人類玩家是否是此角色
  const humanPlayer = players.find(p => p.isHuman);
  
  if (humanPlayer) {
    // 人類玩家的行動
    switch (roleKey) {
      case 'WEREWOLF':
        await handleWerewolfAction(game, humanPlayer);
        break;
      case 'SEER':
        await handleSeerAction(game, humanPlayer);
        break;
      case 'WITCH':
        await handleWitchAction(game, humanPlayer);
        break;
      case 'GUARD':
        await handleGuardAction(game, humanPlayer);
        break;
    }
  } else {
    // 模擬AI玩家行動
    for (const player of players) {
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
  }
}

/**
 * 處理夜晚行動結果
 */
function resolveNightActions(game) {
  game.log.night('黎明即將到來...');
  
  // 計算夜晚死亡情況
  let nightDeathText = '';
  let nightDeaths = [];
  
  // 處理狼人擊殺
  const killedPlayerId = game.state.werewolfVoteResult;
  if (killedPlayerId !== null) {
    const killedPlayer = game.players.find(p => p.id === killedPlayerId);
    
    // 確認是否被女巫救或被守衛保護
    if ((game.state.witchSaved) || (game.state.guardProtected === killedPlayerId)) {
      game.log.night('狼人的獵物被救回來了！');
    } else {
      killedPlayer.isAlive = false;
      nightDeaths.push(killedPlayer);
      nightDeathText += `${killedPlayer.name} 被狼人殺死了！\n`;
    }
  }
  
  // 處理女巫毒藥
  if (game.state.witchPoisoned && game.state.witchPoisonTarget) {
    const poisonedPlayerId = game.state.witchPoisonTarget;
    const poisonedPlayer = game.players.find(p => p.id === poisonedPlayerId);
    
    if (poisonedPlayer && poisonedPlayer.isAlive) {
      poisonedPlayer.isAlive = false;
      // 只有當該玩家還沒有被計算死亡時才添加
      if (!nightDeaths.some(p => p.id === poisonedPlayerId)) {
        nightDeaths.push(poisonedPlayer);
        nightDeathText += `${poisonedPlayer.name} 被毒死了！\n`;
      }
    }
  }
  
  // 記錄夜晚結果
  game.state.nightKilled = nightDeaths.length > 0 ? nightDeaths.map(p => p.id) : null;
  
  // 重置投票結果
  game.state.werewolfVoteResult = null;
  game.state.witchPoisonTarget = null;
}
