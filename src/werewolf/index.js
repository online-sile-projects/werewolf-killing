/**
 * 狼人殺遊戲 - 控制台版本
 * 這個模組提供一個純文字介面的狼人殺遊戲，可以直接在瀏覽器控制台中執行
 */
import { WerewolfGame } from './WerewolfGame.js';
import ApiManager from './api/apiManager.js';
import { runWerewolfTest, werewolfTests } from './test/index.js';

console.log('初始化狼人殺遊戲...');

// 建立全域變數
const game = new WerewolfGame();
window.Werewolf = game;

// 初始化 API 管理器
const apiManager = new ApiManager();
window.WerewolfApi = apiManager;

// 將 API 管理器連接到遊戲
game.apiManager = apiManager;

// 註冊測試工具到全域
window.WerewolfTest = {
  runFullTest: werewolfTests.runFullTest,
  testGameSetup: werewolfTests.testGameSetup,
  testApiConnection: werewolfTests.testApiConnection,
  testRoleDistribution: werewolfTests.testRoleDistribution,
  testGameOver: werewolfTests.testGameOver,
  testGameHistory: werewolfTests.testGameHistory,
  testAIEnabled: werewolfTests.testAIEnabled
};

// 確保在控制台中可以直接訪問
console.log('%c=== 狼人殺遊戲（控制台版本）已載入 ===', 'color: #0099ff; font-weight: bold; font-size: 14px;');
console.log('%c請輸入 Werewolf.startGame() 開始遊戲', 'color: #00cc66; font-weight: bold;');
console.log('%c提示：在遊戲中回答問題時，請使用 Werewolf._answerQuestion("您的回答") 來輸入', 'color: #ff9900;');
console.log('%c您可以使用 WerewolfApi 來設定和測試 AI API 連線', 'color: #9966ff;');

// 添加自助測試函式
window.testWerewolf = function() {
  console.log('%c測試遊戲是否正確載入...', 'color: #9966ff;');
  if (typeof window.Werewolf === 'object' && window.Werewolf instanceof WerewolfGame) {
    console.log('%c遊戲正確載入！可以使用 Werewolf.startGame() 開始遊戲', 'color: #00cc66; font-weight: bold;');
  } else {
    console.log('%c遊戲載入有問題！請重新整理頁面後再試', 'color: #ff3300; font-weight: bold;');
  }
};

// 顯示測試相關資訊
console.log('%c=== 測試功能已就緒 ===', 'color: #0099ff; font-weight: bold;');
console.log('%c執行完整測試流程: WerewolfTest.runFullTest()', 'color: #9966ff;');
console.log('%c測試遊戲設置: WerewolfTest.testGameSetup()', 'color: #9966ff;');
console.log('%c測試角色分配: WerewolfTest.testRoleDistribution()', 'color: #9966ff;');
console.log('%c測試遊戲結束條件: WerewolfTest.testGameOver()', 'color: #9966ff;');
console.log('%c測試遊戲歷史紀錄功能: WerewolfTest.testGameHistory()', 'color: #9966ff;');
console.log('%c測試 AI 啟用功能: WerewolfTest.testAIEnabled()', 'color: #9966ff;');

export default window.Werewolf;