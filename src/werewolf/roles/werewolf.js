/**
 * 狼人角色邏輯
 */
import { ROLES } from './roleConstants.js';

/**
 * 處理狼人行動
 */
export async function handleWerewolfAction(game, player) {
  game.log.night('您是狼人，請選擇一位玩家擊殺:');
  
  // 獲取可以擊殺的玩家列表（排除狼人自己）
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
 * 模擬AI狼人行動
 */
export async function simulateWerewolfAction(game, player) {
  // 如果已經有狼人投票結果，則跳過（其他狼人已決定）
  if (game.state.werewolfVoteResult !== null) return;
  
  // 獲取可以擊殺的玩家列表（排除狼人自己）
  const targets = game.getAlivePlayers().filter(p => p.role !== ROLES.WEREWOLF);
  
  if (targets.length === 0) return;
  
  // AI隨機選擇一個目標
  const selectedTarget = targets[Math.floor(Math.random() * targets.length)];
  game.state.werewolfVoteResult = selectedTarget.id;
  
  game.log.system(`AI狼人 ${player.name} 選擇了擊殺目標 (對你隱藏)`);
}
