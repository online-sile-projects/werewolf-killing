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
  
  // 嘗試使用 AI 進行決策
  if (game.settings.useAI && game.apiManager) {
    try {
      // 準備遊戲上下文
      const gameContext = `現在是第 ${game.state.day} 天夜晚，你是狼人，需要選擇一位玩家擊殺。請考慮遊戲形勢做出決策。`;
      
      // 呼叫 AI 決策
      const decision = await game.apiManager.generateAiDecision(
        player.role,
        'kill',
        targets,
        gameContext,
        player.id
      );
      
      // 如果 AI 成功決策且目標有效
      if (decision && typeof decision.targetId === 'number') {
        // 檢查目標是否有效
        const targetPlayer = targets.find(p => p.id === decision.targetId);
        if (targetPlayer) {
          game.state.werewolfVoteResult = decision.targetId;
          game.log.system(`AI狼人 ${player.name} 選擇了擊殺目標 (對你隱藏)`);
          return;
        }
      }
      console.log('AI 狼人決策無效或發生錯誤，改用隨機決策');
    } catch (error) {
      console.error('AI 狼人決策出錯:', error);
    }
  }
  
  // 如果 AI 決策失敗或未啟用 AI，使用隨機決策
  const selectedTarget = targets[Math.floor(Math.random() * targets.length)];
  game.state.werewolfVoteResult = selectedTarget.id;
  
  game.log.system(`AI狼人 ${player.name} 選擇了擊殺目標 (對你隱藏)`);
}
