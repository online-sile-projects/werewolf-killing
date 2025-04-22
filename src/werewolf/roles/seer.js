/**
 * 預言家角色邏輯
 */
import { ROLES } from './roleConstants.js';

/**
 * 處理預言家行動
 */
export async function handleSeerAction(game, player) {
  game.log.night('您是預言家，請選擇一位玩家查驗身份:');
  
  // 排除自己
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
  
  // 記錄查驗結果
  game.state.seerChecks.push({
    night: game.state.day,
    targetId: selectedTarget.id,
    result: isWerewolf ? '狼人' : '好人'
  });
  
  game.log.action(`您查驗了 ${selectedTarget.name}，結果是: ${isWerewolf ? '狼人' : '好人'}`);
}

/**
 * 模擬AI預言家行動
 */
export async function simulateSeerAction(game, player) {
  // 排除自己
  const targets = game.getAlivePlayers().filter(p => p.id !== player.id);
  
  if (targets.length === 0) return;
  
  // AI隨機選擇一個目標
  const selectedTarget = targets[Math.floor(Math.random() * targets.length)];
  const isWerewolf = selectedTarget.role === ROLES.WEREWOLF;
  
  // 記錄查驗結果
  game.state.seerChecks.push({
    night: game.state.day,
    targetId: selectedTarget.id,
    result: isWerewolf ? '狼人' : '好人'
  });
  
  game.log.system(`AI預言家 ${player.name} 查驗了一名玩家 (對你隱藏)`);
}
