/**
 * 獵人角色邏輯
 */
import { ROLES } from './roleConstants.js';

/**
 * 處理人類獵人技能
 */
export async function handleHunterAbility(game, player) {
  game.log.role('您是獵人，死亡時可以開槍帶走一名玩家');
  const willShoot = await game.askYesNo('是否使用獵人能力開槍？');
  
  if (willShoot) {
    // 選擇開槍目標
    const targets = game.getAlivePlayers();
    
    if (targets.length === 0) {
      game.log.warning('沒有可以射擊的目標!');
      return;
    }
    
    const options = targets.map(p => `${p.name} (ID: ${p.id})`);
    const selectedIndex = await game.selectOption(options, '請選擇射擊目標:');
    
    if (selectedIndex !== -1) {
      const shootTarget = targets[selectedIndex];
      shootTarget.isAlive = false;
      player.abilities.canShoot = false;
      game.log.action(`獵人 ${player.name} 開槍擊中了 ${shootTarget.name}！`);
    } else {
      game.log.warning('獵人放棄了開槍');
    }
  }
}

/**
 * 模擬AI獵人技能
 */
export async function simulateHunterAbility(game, player) {
  // AI獵人有較高機率開槍
  if (Math.random() > 0.2) {
    const targets = game.getAlivePlayers();
    
    if (targets.length > 0) {
      // 隨機選擇一個目標
      const shootTarget = targets[Math.floor(Math.random() * targets.length)];
      shootTarget.isAlive = false;
      player.abilities.canShoot = false;
      game.log.action(`獵人 ${player.name} 開槍擊中了 ${shootTarget.name}！`);
    }
  } else {
    game.log.action(`獵人 ${player.name} 沒有開槍就嚥下了最後一口氣...`);
  }
}
