/**
 * 狼人殺遊戲測試流程腳本
 * 這個檔案提供了一個完整的測試流程，讓開發者能夠快速測試狼人殺遊戲的各個功能
 */
import { WerewolfGame } from '../WerewolfGame.js';
import ApiManager from '../api/apiManager.js';

// 測試流程控制器
export class TestWorkflow {
  constructor() {
    this.game = null;
    this.apiManager = null;
    this.autoAnswers = [];  // 自動回答佇列
    this.testPromises = []; // 測試承諾追蹤
    this.testConfig = {
      playerCount: 6,      // 玩家數量
      playerName: '測試者', // 玩家名稱
      testSpeed: 'fast',   // 測試速度 'fast', 'normal', 'slow'
      mockApiResponses: true // 模擬 API 回應
    };
    this.speedDelays = {
      fast: 300,
      normal: 1000,
      slow: 2000
    };
  }

  /**
   * 開始測試流程
   */
  async startTest() {
    console.log('%c=== 開始狼人殺遊戲測試流程 ===', 'color: #0099ff; font-weight: bold; font-size: 14px;');
    
    // 初始化遊戲和 API 管理器
    this.initializeGame();
    
    // 註冊測試流程
    this.logInfo('註冊測試流程');
    
    try {
      // 開始遊戲設置階段
      await this.runGameSetupPhase();
      
      // 開始第一個夜晚
      await this.runFirstNight();
      
      // 白天討論階段
      await this.runDayDiscussionPhase();
      
      // 投票階段
      await this.runVotingPhase();
      
      // 第二個夜晚
      await this.runSecondNight();
      
      // 自動完成剩餘遊戲
      await this.autoCompleteGame();
      
      // 測試完成
      this.logSuccess('=== 測試完成，請檢查結果 ===');
      return true;
    } catch(error) {
      this.logError(`測試流程出錯: ${error.message}`);
      console.error(error);
      return false;
    }
  }
  
  /**
   * 初始化遊戲和 API 管理器
   */
  initializeGame() {
    this.logInfo('初始化遊戲和 API 管理器');
    
    // 建立新的遊戲物件
    this.game = new WerewolfGame();
    
    // 建立 API 管理器
    this.apiManager = new ApiManager();
    
    // 將 API 管理器連接到遊戲
    this.game.apiManager = this.apiManager;
    
    // 模擬 API 回應
    if (this.testConfig.mockApiResponses) {
      this.mockApiResponses();
    }
    
    // 覆寫遊戲的 ask 方法以自動回答問題
    this.setupAutoAnswer();
    
    this.logSuccess('遊戲初始化完成');
  }
  
  /**
   * 模擬 API 回應
   */
  mockApiResponses() {
    this.logInfo('模擬 API 回應');
    
    // 修改 API 管理器的方法來模擬回應
    this.apiManager.generateStory = async (context) => {
      return { response: `這是一個模擬的故事敘述：${context}` };
    };
    
    this.apiManager.generateNpcResponse = async (playerRole, context) => {
      return { response: `這是 ${playerRole} 角色的模擬回應。` };
    };
    
    this.apiManager.testApiConnection = async () => {
      return { success: true };
    };
    
    // 啟用 AI 功能
    this.game.settings.useAI = true;
    
    this.logSuccess('API 回應模擬設定完成');
  }
  
  /**
   * 設置自動回答
   */
  setupAutoAnswer() {
    // 儲存原始的 ask 方法
    const originalAsk = this.game.ask.bind(this.game);
    
    // 覆寫遊戲的 ask 方法
    this.game.ask = async (question) => {
      // 正常顯示問題
      this.logQuestion(question);
      
      // 檢查是否有預設的回答
      let answer;
      if (this.autoAnswers.length > 0) {
        answer = this.autoAnswers.shift();
        this.logInfo(`自動回答: ${answer}`);
      } else {
        // 如果沒有預設回答，使用預設值
        if (question.includes('請輸入玩家總數')) {
          answer = this.testConfig.playerCount.toString();
        } else if (question.includes('請輸入您的名字')) {
          answer = this.testConfig.playerName;
        } else if (question.includes('按Enter')) {
          answer = '';
        } else if (question.includes('y/n') || question.includes('y 或 n')) {
          answer = 'y';
        } else if (question.includes('請輸入選項編號')) {
          answer = '1'; // 選擇第一個選項
        } else {
          answer = '';
        }
        this.logInfo(`預設回答: ${answer}`);
      }
      
      // 延遲模擬使用者輸入
      await this.delay();
      
      // 返回自動回答
      return answer;
    };
    
    this.logSuccess('自動回答設置完成');
  }
  
  /**
   * 延遲執行
   */
  async delay(multiplier = 1) {
    const speed = this.testConfig.testSpeed;
    const baseDelay = this.speedDelays[speed] || 500;
    return new Promise(resolve => setTimeout(resolve, baseDelay * multiplier));
  }
  
  /**
   * 預設回答
   */
  addAutoAnswer(answer) {
    this.autoAnswers.push(answer);
  }
  
  /**
   * 執行遊戲設置階段
   */
  async runGameSetupPhase() {
    this.logInfo('開始執行遊戲設置階段');
    
    // 設置自動回答
    this.addAutoAnswer(this.testConfig.playerCount.toString()); // 玩家數量
    this.addAutoAnswer(this.testConfig.playerName); // 玩家名稱
    this.addAutoAnswer(''); // 按Enter開始遊戲
    
    // 啟動遊戲 (這會觸發設置階段的所有操作)
    await this.game.startGame();
    
    this.logSuccess('遊戲設置階段完成');
  }
  
  /**
   * 執行第一個夜晚
   */
  async runFirstNight() {
    this.logInfo('開始執行第一個夜晚階段');
    
    // 由於已經在 startGame 中開始了遊戲循環，
    // 這裡我們只需要等待夜晚行動結束
    // 我們的 ask 方法已經被覆寫，會自動回答問題
    
    this.logSuccess('第一個夜晚階段完成');
  }
  
  /**
   * 執行白天討論階段
   */
  async runDayDiscussionPhase() {
    this.logInfo('開始執行白天討論階段');
    
    // 按Enter進入投票階段
    this.addAutoAnswer('');
    
    this.logSuccess('白天討論階段完成');
  }
  
  /**
   * 執行投票階段
   */
  async runVotingPhase() {
    this.logInfo('開始執行投票階段');
    
    // 投票給第一個玩家
    this.addAutoAnswer('1');
    
    // 按Enter繼續
    this.addAutoAnswer('');
    
    this.logSuccess('投票階段完成');
  }
  
  /**
   * 執行第二個夜晚
   */
  async runSecondNight() {
    this.logInfo('開始執行第二個夜晚階段');
    
    // 準備所有角色的行動
    // 由於遊戲已進入循環，我們的自動回答系統會處理所有選擇
    // 這裡我們可以添加一些特定的回答
    
    this.logSuccess('第二個夜晚階段完成');
  }
  
  /**
   * 自動完成剩餘遊戲直到結束
   */
  async autoCompleteGame() {
    this.logInfo('開始自動完成剩餘遊戲');
    
    // 設置足夠的自動回答以完成遊戲
    // 這裡我們可以讓遊戲自然結束
    for (let i = 0; i < 20; i++) {
      this.addAutoAnswer('1'); // 各種選擇
      this.addAutoAnswer(''); // 各種確認
      this.addAutoAnswer('y'); // 各種是/否選擇
    }
    
    // 等待一段時間確保遊戲結束
    await this.delay(10);
    
    this.logSuccess('剩餘遊戲自動完成');
  }
  
  /**
   * 日誌輸出工具函式
   */
  logInfo(text) {
    console.log(`%c[測試流程] ${text}`, 'color: #9966ff;');
  }
  
  logSuccess(text) {
    console.log(`%c[測試流程] ${text}`, 'color: #00cc66; font-weight: bold;');
  }
  
  logError(text) {
    console.log(`%c[測試流程] ${text}`, 'color: #ff3300; font-weight: bold;');
  }
  
  logQuestion(text) {
    console.log(`%c[問題] ${text}`, 'color: #ff9900;');
  }
}

// 建立測試流程的執行函式
export async function runWerewolfTest() {
  console.log('%c開始狼人殺遊戲測試流程...', 'color: #0099ff; font-weight: bold; font-size: 14px;');
  
  // 建立測試流程物件
  const tester = new TestWorkflow();
  
  // 執行測試
  const result = await tester.startTest();
  
  return result;
}

// 匯出為全域函式
window.runWerewolfTest = runWerewolfTest;

export default { TestWorkflow, runWerewolfTest };
