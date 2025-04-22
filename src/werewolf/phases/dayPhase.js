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
  
  // 宣佈昨晚死亡情況
  if (game.state.nightKilled && game.state.nightKilled.length > 0) {
    game.log.warning(`昨晚，以下玩家不幸遇難:`);
    
    for (const id of game.state.nightKilled) {
      const player = game.players.find(p => p.id === id);
      game.log.dead(`- ${player.name} (ID: ${player.id})`);
      
      // 獵人死亡時可以開槍
      if (player.role === game.roles.HUNTER && player.abilities.canShoot) {
        if (player.isHuman) {
          await handleHunterAbility(game, player);
        } else {
          await simulateHunterAbility(game, player);
        }
      }
    }
  } else {
    game.log.success('昨晚是平安夜，沒有人死亡！');
  }
  
  // 更新遊戲狀態
  game.printGameStatus();
  
  // 檢查遊戲是否應該結束
  if (game.isGameOver()) {
    game.state.phase = GAME_PHASES.GAME_OVER;
    return;
  }
  
  // 討論階段
  game.log.day('現在進入討論階段，請玩家們自由發言...');
  await game.ask('按Enter進入投票階段...');
  
  // 進入投票階段
  game.state.phase = GAME_PHASES.VOTING;
  game.log.system('討論結束，進入投票階段');
}
