/**
 * 遊戲管理器
 * 連接 UI 元件與遊戲邏輯
 */
import { WerewolfGame } from '../WerewolfGame.js';
import ApiManager from '../api/apiManager.js';

/**
 * 建立遊戲管理器
 * @param {Object} callbacks - 回呼函式集合
 * @returns {Object} 遊戲管理器物件
 */
export function createGameManager(callbacks = {}) {
  // 解構回呼函式
  const {
    onStateChange, // 狀態變更時的回呼
    onQuestion,    // 提問時的回呼
    onOptions,     // 提供選項時的回呼
    onGameMessage, // 遊戲訊息的回呼
    onGameEnd      // 遊戲結束時的回呼
  } = callbacks;

  // 建立遊戲實例
  const game = new WerewolfGame();
  
  // 建立 API 管理器
  const apiManager = new ApiManager();
  
  // 將 API 管理器連接到遊戲
  game.apiManager = apiManager;

  // 儲存玩家的答案
  let pendingResolve = null;

  // 覆寫遊戲的問答方法，連接到 UI
  const originalAsk = game.ask.bind(game);
  game.ask = async (question) => {
    // 通知 UI 顯示問題
    if (onQuestion) {
      onQuestion(question);
    }

    // 等待使用者輸入
    return new Promise(resolve => {
      pendingResolve = resolve;
    });
  };

  // 覆寫遊戲的選項選擇方法
  const originalSelectOption = game.selectOption.bind(game);
  game.selectOption = async (options, question) => {
    // 通知 UI 顯示選項
    if (onOptions) {
      onOptions(question, options);
    }

    // 等待使用者選擇
    return new Promise(resolve => {
      pendingResolve = resolve;
    });
  };

  // 覆寫遊戲的是/否問題方法
  const originalAskYesNo = game.askYesNo.bind(game);
  game.askYesNo = async (question) => {
    // 通知 UI 顯示是/否問題
    if (onQuestion) {
      onQuestion(`${question} (y/n)`);
    }

    // 等待使用者回答
    const answer = await new Promise(resolve => {
      pendingResolve = resolve;
    });

    // 解析是/否答案
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  };

  // 覆寫遊戲的記錄方法，連接到 UI
  const originalLog = { ...game.log };
  
  // 所有記錄方法重新導向到 UI
  Object.keys(originalLog).forEach(key => {
    game.log[key] = (text) => {
      // 仍然呼叫原始的記錄方法
      originalLog[key](text);
      
      // 將訊息發送到 UI
      if (onGameMessage) {
        onGameMessage(text, key);
      }
    };
  });

  // 監聽遊戲狀態變更
  const checkGameStateInterval = setInterval(() => {
    // 更新 UI 狀態
    updateUIState();
    
    // 檢查遊戲是否結束
    if (game.state.phase === game.gamePhases.GAME_OVER) {
      clearInterval(checkGameStateInterval);
      
      // 通知 UI 遊戲結束
      if (onGameEnd) {
        onGameEnd({
          winner: game.state.winner,
          players: game.players
        });
      }
    }
  }, 500);

  // 更新 UI 狀態
  function updateUIState() {
    if (onStateChange) {
      onStateChange({
        gamePhase: game.state.phase,
        day: game.state.day,
        players: [...game.players]
      });
    }
  }

  // 開始遊戲
  async function startGame(settings = {}) {
    // 重置遊戲
    game.resetGame();
    
    // 設定 AI 功能
    if (settings.useAI !== undefined) {
      game.setAIEnabled(settings.useAI);
    }
    
    // 更新 UI 狀態
    updateUIState();
    
    // 啟動遊戲
    setTimeout(() => {
      game.startGame().catch(err => {
        console.error('遊戲啟動錯誤:', err);
        if (onGameMessage) {
          onGameMessage(`遊戲啟動發生錯誤: ${err.message}`, 'error');
        }
      });
    }, 100);
    
    return true;
  }

  // 提交答案
  function submitAnswer(answer) {
    if (pendingResolve) {
      const resolve = pendingResolve;
      pendingResolve = null;
      resolve(answer);
      return true;
    }
    return false;
  }

  // 重置遊戲
  function resetGame() {
    game.resetGame();
    updateUIState();
    return true;
  }

  // 清理資源
  function cleanup() {
    clearInterval(checkGameStateInterval);
    // 恢復原始方法
    game.ask = originalAsk;
    game.selectOption = originalSelectOption;
    game.askYesNo = originalAskYesNo;
    game.log = originalLog;
  }

  // 回傳遊戲管理器 API
  return {
    startGame,
    submitAnswer,
    resetGame,
    cleanup,
    
    // 允許直接存取遊戲和 API 管理器
    getGame: () => game,
    getApiManager: () => apiManager
  };
}
