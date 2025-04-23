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
  
  let selectedTarget;
  
  // 嘗試使用 AI 進行決策
  if (game.settings.useAI && game.apiManager) {
    try {
      // 準備遊戲上下文
      const gameContext = `現在是第 ${game.state.day} 天夜晚，你是守衛，可以保護一位玩家免受狼人襲擊。你不能連續兩晚保護同一個人。請選擇一位你認為可能受到襲擊的玩家進行保護。`;
      
      // 上一個保護的玩家資訊
      if (player.abilities.lastProtected) {
        const lastProtectedPlayer = game.players.find(p => p.id === player.abilities.lastProtected);
        if (lastProtectedPlayer) {
          gameContext += `\n\n你上一晚保護了 ${lastProtectedPlayer.name} (ID: ${lastProtectedPlayer.id})，不能再次保護他。`;
        }
      }
      
      // 呼叫 AI 決策
      const decision = await game.apiManager.generateAiDecision(
        player.role,
        'guard',
        targets,
        gameContext,
        player.id
      );
      
      // 如果 AI 成功決策且目標有效
      if (decision && typeof decision.targetId === 'number') {
        // 檢查目標是否有效
        const targetPlayer = targets.find(p => p.id === decision.targetId);
        if (targetPlayer) {
          selectedTarget = targetPlayer;
        }
      }
    } catch (error) {
      console.error('AI 守衛決策出錯:', error);
    }
  }
  
  // 如果 AI 決策失敗或未啟用 AI，使用隨機決策
  if (!selectedTarget) {
    selectedTarget = targets[Math.floor(Math.random() * targets.length)];
  }
  
  game.state.guardProtected = selectedTarget.id;
  player.abilities.lastProtected = selectedTarget.id;
  
  game.log.system(`AI守衛 ${player.name} 選擇保護 ${selectedTarget.name} (對你隱藏)`);
}
