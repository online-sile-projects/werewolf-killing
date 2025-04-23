/**
 * 白天討論階段邏輯
 */
import { GAME_PHASES } from '../roles/roleConstants.js';
import { handleHunterAbility, simulateHunterAbility } from '../roles/hunter.js';

/**
 * 處理白天討論階段
 */
export async function handleDayDiscussionPhase(game) {
  game.log.day(`=== 第 ${game.state.day} 天白天 ===`);
  
  // 記錄進入白天階段的訊息
  game.recordGameMessage('系統', `進入第 ${game.state.day} 天白天討論階段。`);
  
  // 宣佈昨晚死亡情況
  if (game.state.nightKilled && game.state.nightKilled.length > 0) {
    game.log.warning(`昨晚，以下玩家不幸遇難:`);
    
    let deathMessage = `昨晚，以下玩家不幸遇難: `;
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
          // 記錄死亡故事
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
    
    // 記錄死亡訊息
    deathMessage += deadPlayerNames.join('、');
    game.recordGameMessage('系統', deathMessage);
    
  } else {
    game.log.success('昨晚是平安夜，沒有人死亡！');
    
    // 記錄平安夜訊息
    game.recordGameMessage('系統', '昨晚是平安夜，沒有人死亡！');
    
    // 使用 AI 生成平安夜故事敘述
    if (game.settings.useAI && game.apiManager) {
      const context = `第 ${game.state.day} 天是平安夜，沒有村民死亡。`;
      const story = await game.generateStoryWithAI(context);
      if (story) {
        game.log.story(story);
        // 記錄故事敘述
        game.recordGameMessage('旁白', story);
      }
    }
  }
  
  // 更新遊戲狀態
  game.printGameStatus();
  
  // 檢查遊戲是否應該結束
  if (game.isGameOver()) {
    game.state.phase = GAME_PHASES.GAME_OVER;
    return;
  }
  
  // 討論階段
  game.log.day('現在進入討論階段，請玩家們依序發言...');
  game.recordGameMessage('系統', '現在進入討論階段，玩家們依序開始發言。');
  
  // 取得所有活著的玩家並按 ID 排序以確保發言順序
  const alivePlayers = game.getAlivePlayers().sort((a, b) => a.id - b.id);
  
  // 依照玩家 ID 順序依次發言
  for (const player of alivePlayers) {
    game.log.system(`輪到 ${player.name} (ID: ${player.id}) 發言...`);
    
    if (player.isHuman) {
      // 人類玩家發言處理
      game.log.system('現在是您的發言時間...');
      game.log.info('您可以發表對遊戲局勢的看法或懷疑，或是為自己辯護。');
      
      const userSpeech = await game.ask('請輸入您的發言 (直接按 Enter 跳過發言)：');
      
      if (userSpeech && userSpeech.trim() !== '') {
        game.log.player(`${player.name}: ${userSpeech}`);
        // 記錄人類玩家發言
        game.recordGameMessage(`玩家-${player.id}`, userSpeech);
      } else {
        game.log.warning('您選擇了沉默...');
        game.recordGameMessage(`玩家-${player.id}`, '（沉默不語）');
      }
    } else {
      // NPC 玩家發言處理
      if (game.settings.useAI && game.apiManager) {
        const context = `這是遊戲的第 ${game.state.day} 天白天討論階段，請您以狼人殺遊戲中的 ${player.role} 角色身份，根據當前情況發表簡短的發言。`;
        const response = await game.generateNpcResponseWithAI(player.id, context);
        if (response) {
          game.log.player(`${player.name}: ${response}`);
          // 記錄 NPC 發言
          game.recordGameMessage(`玩家-${player.id}`, response);
        } else {
          // 如果 AI 生成失敗，使用預設發言
          const defaultResponse = `我覺得大家還是謹慎行事比較好，注意觀察每個人的發言。`;
          game.log.player(`${player.name}: ${defaultResponse}`);
          // 記錄預設發言
          game.recordGameMessage(`玩家-${player.id}`, defaultResponse);
        }
      } else {
        // 不使用 AI 時的預設發言
        const defaultResponse = `我認為我們需要多觀察，找出可疑的人。`;
        game.log.player(`${player.name}: ${defaultResponse}`);
        // 記錄預設發言
        game.recordGameMessage(`玩家-${player.id}`, defaultResponse);
      }
    }
    
    // 每位玩家發言後短暫暫停，讓遊戲節奏更自然
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  await game.ask('按Enter進入投票階段...');
  
  // 進入投票階段
  game.state.phase = GAME_PHASES.VOTING;
  game.log.system('討論結束，進入投票階段');
  game.recordGameMessage('系統', '討論結束，進入投票階段。');
}
