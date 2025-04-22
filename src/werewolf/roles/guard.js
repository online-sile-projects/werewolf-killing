/**
 * 守衛角色邏輯
 */
import { ROLES } from './roleConstants.js';

/**
 * 處理守衛行動
 */
export async function handleGuardAction(game, player) {
  game.log.night('您是守衛，請選擇一位玩家保護:');
  
  // 獲取可以保護的玩家
  const targets = game.getAlivePlayers().filter(p => {
    // 不能連續兩晚保護同一個人
    return p.id !== player.abilities.lastProtected;
  });
  
  if (targets.length === 0) {
    game.log.warning('沒有可以保護的目標!');
    return;
  }
  
  const options = targets.map(p => `${p.name} (ID: ${p.id})`);
  const selectedIndex = await game.selectOption(options, '請選擇保護目標:');
  
  if (selectedIndex === -1) {
    game.log.warning('您選擇不保護任何人!');
    return;
  }
  
  const selectedTarget = targets[selectedIndex];
  game.state.guardProtected = selectedTarget.id;
  player.abilities.lastProtected = selectedTarget.id;
  game.log.action(`您選擇保護: ${selectedTarget.name}`);
}

/**
 * 模擬AI守衛行動
 */
export async function simulateGuardAction(game, player) {
  // 獲取可以保護的玩家
  const targets = game.getAlivePlayers().filter(p => {
    // 不能連續兩晚保護同一個人
    return p.id !== player.abilities.lastProtected;
  });
  
  if (targets.length === 0) return;
  
  // AI隨機選擇一個目標
  const selectedTarget = targets[Math.floor(Math.random() * targets.length)];
  game.state.guardProtected = selectedTarget.id;
  player.abilities.lastProtected = selectedTarget.id;
  
  game.log.system(`AI守衛 ${player.name} 選擇了保護目標 (對你隱藏)`);
}
