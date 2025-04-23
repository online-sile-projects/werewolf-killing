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
  
  // 處理解藥使用決策
  if (player.abilities.hasMedicine && killedPlayer) {
    // 嘗試使用 AI 決策是否使用解藥
    if (game.settings.useAI && game.apiManager) {
      try {
        // 準備遊戲上下文
        const gameContext = `現在是第 ${game.state.day} 天夜晚，你是女巫，狼人今晚選擇擊殺了 ${killedPlayer.name} (ID: ${killedPlayer.id})。你有一瓶解藥，可以救活他。請決定是否使用解藥。`;
        
        // 呼叫 AI 決策
        const saveDecision = await game.apiManager.generateAiDecision(
          player.role,
          'save',
          { playerToSave: killedPlayer },
          gameContext,
          player.id
        );
        
        // 如果 AI 決定使用解藥
        if (saveDecision && saveDecision.save === true) {
          player.abilities.hasMedicine = false;
          game.state.witchSaved = true;
          game.log.system(`AI女巫 ${player.name} 使用了解藥 (對你隱藏)`);
        } else {
          game.log.system(`AI女巫 ${player.name} 選擇不使用解藥 (對你隱藏)`);
        }
        
        // 成功使用 AI 決策後返回，不再進行隨機決策
        // 但仍然處理毒藥決策
      } catch (error) {
        console.error('AI 女巫救人決策出錯:', error);
        // 出錯時使用原始的隨機決策作為備案
        if (Math.random() > 0.3) {
          player.abilities.hasMedicine = false;
          game.state.witchSaved = true;
          game.log.system(`AI女巫 ${player.name} 做出了選擇 (對你隱藏)`);
        }
      }
    } else {
      // 未啟用 AI 時使用原始的隨機決策
      if (Math.random() > 0.3) {
        player.abilities.hasMedicine = false;
        game.state.witchSaved = true;
        game.log.system(`AI女巫 ${player.name} 做出了選擇 (對你隱藏)`);
      }
    }
  }
  
  // 處理毒藥使用決策
  if (player.abilities.hasPoison) {
    // 獲取可能的毒殺目標
    const targets = game.getAlivePlayers().filter(p => p.id !== player.id);
    
    if (targets.length > 0) {
      // 嘗試使用 AI 決策是否使用毒藥
      if (game.settings.useAI && game.apiManager) {
        try {
          // 準備遊戲上下文
          const gameContext = `現在是第 ${game.state.day} 天夜晚，你是女巫，你有一瓶毒藥，可以選擇殺死一位玩家。請決定是否使用毒藥，如使用請選擇目標。`;
          
          // 呼叫 AI 決策
          const poisonDecision = await game.apiManager.generateAiDecision(
            player.role,
            'poison',
            targets,
            gameContext,
            player.id
          );
          
          // 如果 AI 決定使用毒藥且指定了有效目標
          if (poisonDecision && poisonDecision.poison === true && poisonDecision.targetId) {
            // 檢查目標是否有效
            const targetPlayer = targets.find(p => p.id === poisonDecision.targetId);
            if (targetPlayer) {
              player.abilities.hasPoison = false;
              game.state.witchPoisoned = true;
              game.state.witchPoisonTarget = poisonDecision.targetId;
              game.log.system(`AI女巫 ${player.name} 使用了毒藥 (對你隱藏)`);
              return;
            }
          }
        } catch (error) {
          console.error('AI 女巫毒人決策出錯:', error);
          // 出錯時進入原始的隨機決策作為備案
        }
      }
      
      // 如果 AI 決策失敗或未啟用 AI，使用原始的隨機邏輯
      if (Math.random() > 0.7) {
        const poisonTarget = targets[Math.floor(Math.random() * targets.length)];
        player.abilities.hasPoison = false;
        game.state.witchPoisoned = true;
        game.state.witchPoisonTarget = poisonTarget.id;
        game.log.system(`AI女巫 ${player.name} 做出了選擇 (對你隱藏)`);
      }
    }
  }
}
