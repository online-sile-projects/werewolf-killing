/**
 * 女巫角色邏輯
 */
import { ROLES } from './roleConstants.js';

/**
 * 處理女巫行動
 */
export async function handleWitchAction(game, player) {
  game.log.night('您是女巫，請選擇您的行動:');
  
  // 檢查狼人擊殺結果
  const killedPlayerId = game.state.werewolfVoteResult;
  const killedPlayer = killedPlayerId !== null ? game.players.find(p => p.id === killedPlayerId) : null;
  
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
      // 選擇毒藥目標
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
 * 模擬AI女巫行動
 */
export async function simulateWitchAction(game, player) {
  const killedPlayerId = game.state.werewolfVoteResult;
  const killedPlayer = killedPlayerId !== null ? game.players.find(p => p.id === killedPlayerId) : null;
  
  // 使用解藥的機率
  if (player.abilities.hasMedicine && killedPlayer && Math.random() > 0.3) {
    player.abilities.hasMedicine = false;
    game.state.witchSaved = true;
    game.log.system(`AI女巫 ${player.name} 做出了選擇 (對你隱藏)`);
  }
  
  // 使用毒藥的機率較低
  if (player.abilities.hasPoison && Math.random() > 0.7) {
    // 隨機選擇毒殺目標
    const targets = game.getAlivePlayers().filter(p => p.id !== player.id);
    
    if (targets.length > 0) {
      const poisonTarget = targets[Math.floor(Math.random() * targets.length)];
      player.abilities.hasPoison = false;
      game.state.witchPoisoned = true;
      game.state.witchPoisonTarget = poisonTarget.id;
      game.log.system(`AI女巫 ${player.name} 做出了選擇 (對你隱藏)`);
    }
  }
}
