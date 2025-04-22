/**
 * 狼人殺遊戲主類別
 */
import { createLogger } from './logger.js';
import { ROLES, GAME_PHASES, NIGHT_ACTIONS_ORDER, DEFAULT_ROLE_DISTRIBUTION } from './roles/roleConstants.js';
import { createPlayer, generatePlayerName, shuffleArray } from './utils.js';
import { handleNightPhase } from './phases/nightPhase.js';
import { handleDayDiscussionPhase } from './phases/dayPhase.js';
import { handleVotingPhase, handleVoteResult } from './phases/votingPhase.js';

export class WerewolfGame {
  constructor() {
    this.gameStarted = false;
    this.players = [];
    this.state = {
      phase: '遊戲設置',
      day: 0,
      nightKilled: null,
      dayDiscussions: [],
      votes: {},
      seerChecks: [],
      werewolfVotes: {},
      werewolfVoteResult: null,
      witchSaved: false,
      witchPoisoned: false,
      guardProtected: null,
      lastProtected: null
    };
    
    // 角色設定
    this.roles = ROLES;
    
    // 遊戲階段
    this.gamePhases = GAME_PHASES;
    
    // 夜晚行動順序
    this.nightActionsOrder = NIGHT_ACTIONS_ORDER;
    
    // 預設遊戲設定
    this.settings = {
      playerCount: 8,
      roleDistribution: DEFAULT_ROLE_DISTRIBUTION,
      useAI: false  // 預設不使用 AI
    };
    
    this.humanPlayerId = null;
    this.log = createLogger();
    
    this._waitingForInput = false;
    this._currentResolve = null;
    
    // API 管理器 (由 index.js 設定)
    this.apiManager = null;
  }
  
  /**
   * 獲取還活著的玩家
   */
  getAlivePlayers() {
    return this.players.filter(player => player.isAlive);
  }
  
  /**
   * 獲取人類玩家
   */
  getHumanPlayer() {
    return this.players.find(p => p.isHuman);
  }
  
  /**
   * 獲取指定角色的所有玩家
   */
  getPlayersByRole(role) {
    return this.players.filter(p => p.role === role && p.isAlive);
  }
  
  /**
   * 獲取狼人陣營的玩家
   */
  getWerewolfTeam() {
    return this.getPlayersByRole(this.roles.WEREWOLF);
  }
  
  /**
   * 獲取好人陣營的玩家
   */
  getVillageTeam() {
    return this.players.filter(p => 
      p.role !== this.roles.WEREWOLF && p.isAlive
    );
  }
  
  /**
   * 檢查遊戲是否結束
   */
  isGameOver() {
    const werewolves = this.getWerewolfTeam();
    const villagers = this.getVillageTeam();
    
    if (werewolves.length === 0) {
      this.state.winner = 'village';
      return true;
    }
    
    if (werewolves.length >= villagers.length) {
      this.state.winner = 'werewolf';
      return true;
    }
    
    return false;
  }
  
  /**
   * 使用者輸入的處理函式
   */
  async ask(question) {
    this.log.info(question);
    console.log('%c> ', 'color: #00cc99; font-weight: bold;');
    
    // 在控制台環境中，我們無法直接捕獲使用者輸入
    // 使用者需要在控制台手動呼叫 Werewolf._answerQuestion('xxxx')
    return new Promise(resolve => {
      this._currentResolve = resolve;
      this._waitingForInput = true;
    });
  }
  
  /**
   * 接收使用者的回應
   */
  _answerQuestion(answer) {
    if (this._waitingForInput && this._currentResolve) {
      console.log(`%c> ${answer}`, 'color: #ffffff;');
      this._waitingForInput = false;
      const resolve = this._currentResolve;
      this._currentResolve = null;
      resolve(answer);
      return true;
    } else {
      console.log('%c目前沒有待回答的問題。請先呼叫 Werewolf.startGame() 開始遊戲。', 'color: #ff3300; font-weight: bold;');
    }
    return false;
  }
  
  /**
   * 選擇選單選項
   */
  async selectOption(options, question = '請選擇一個選項:') {
    this.log.info(question);
    
    options.forEach((option, index) => {
      console.log(`%c${index + 1}. ${option}`, 'color: #ccccff;');
    });
    console.log('%c0. 取消', 'color: #ff9999;');
    
    let selection = null;
    while (selection === null) {
      const answer = await this.ask('請輸入選項編號:');
      const choice = parseInt(answer);
      
      if (isNaN(choice)) {
        this.log.warning('請輸入有效的數字!');
      } else if (choice < 0 || choice > options.length) {
        this.log.warning(`請輸入 0-${options.length} 的數字!`);
      } else {
        selection = choice - 1; // 轉為以 0 為起始的索引
        if (choice === 0) selection = -1; // 取消選擇
      }
    }
    
    return selection;
  }
  
  /**
   * 是/否問題
   */
  async askYesNo(question) {
    this.log.info(`${question} (y/n)`);
    
    let validAnswer = false;
    let result = false;
    
    while (!validAnswer) {
      const answer = await this.ask('請輸入 y 或 n:');
      const lowerAnswer = answer.toLowerCase();
      
      if (lowerAnswer === 'y' || lowerAnswer === 'yes') {
        result = true;
        validAnswer = true;
      } else if (lowerAnswer === 'n' || lowerAnswer === 'no') {
        result = false;
        validAnswer = true;
      } else {
        this.log.warning('請輸入 y 或 n!');
      }
    }
    
    return result;
  }
  
  /**
   * 重置遊戲狀態
   */
  resetGame() {
    // 清空玩家列表
    this.players = [];
    this.humanPlayerId = null;
    
    // 重置遊戲狀態
    this.gameStarted = false;
    this.state = {
      phase: '遊戲設置',
      day: 0,
      nightKilled: null,
      dayDiscussions: [],
      votes: {},
      seerChecks: [],
      werewolfVotes: {},
      werewolfVoteResult: null,
      witchSaved: false,
      witchPoisoned: false,
      guardProtected: null,
      lastProtected: null
    };
  }

  /**
   * 啟動遊戲
   */
  async startGame() {
    // 重置遊戲狀態
    this.resetGame();
    
    this.log.title('=== 歡迎來到狼人殺遊戲（控制台版本）===');
    this.log.system('輸入 Werewolf._answerQuestion("您的回答") 來回答問題');
    this.log.divider();
    
    // 初始化遊戲
    await this.setupInitialGame();
    
    // 等待玩家準備好
    await this.ask('按Enter開始遊戲...');
    
    // 開始第一個夜晚
    this.state.phase = this.gamePhases.NIGHT;
    this.printGameStatus();
    
    // 開始遊戲主循環
    await this.gameLoop();
  }
  
  /**
   * 初始化遊戲
   */
  async setupInitialGame() {
    this.log.system('遊戲設置中...');
    
    // 創建玩家
    await this.createPlayers();
    
    // 分配角色
    this.assignRoles();
    
    this.log.success('遊戲設置完成！');
    this.log.success(`總玩家數: ${this.players.length}`);
    
    // 取得人類玩家
    const humanPlayer = this.getHumanPlayer();
    this.log.role(`您的角色: ${humanPlayer.role}`);
    
    // 如果是狼人，顯示其他狼人
    if (humanPlayer.role === this.roles.WEREWOLF) {
      const otherWerewolves = this.getWerewolfTeam().filter(p => p.id !== humanPlayer.id);
      if (otherWerewolves.length > 0) {
        this.log.info('您的隊友是:');
        otherWerewolves.forEach(wolf => {
          this.log.player(`- ${wolf.name} (ID: ${wolf.id})`);
        });
      } else {
        this.log.info('您是唯一的狼人！');
      }
    }
  }
  
  /**
   * 創建玩家
   */
  async createPlayers() {
    // 獲取玩家數量
    const playerCountInput = await this.ask(`請輸入玩家總數 (默認 ${this.settings.playerCount}): `);
    const playerCount = parseInt(playerCountInput) || this.settings.playerCount;
    this.settings.playerCount = playerCount;
    
    // 創建人類玩家
    const humanName = await this.ask('請輸入您的名字: ');
    const humanPlayer = createPlayer(1, humanName || '玩家1', true);
    this.players.push(humanPlayer);
    this.humanPlayerId = 1;
    
    // 創建AI玩家
    for (let i = 2; i <= this.settings.playerCount; i++) {
      const aiPlayer = createPlayer(i, generatePlayerName(), false);
      this.players.push(aiPlayer);
    }
    
    // 輸出所有玩家的名稱和ID以便確認
    this.log.success(`已創建 ${this.players.length} 名玩家:`);
    this.players.forEach(player => {
      this.log.player(`- ID: ${player.id}, 名稱: ${player.name}${player.isHuman ? ' (人類玩家)' : ''}`);
    });
  }
  
  /**
   * 分配角色
   */
  assignRoles() {
    this.log.system('分配角色中...');
    
    // 調整角色分配
    const totalPlayers = this.players.length;
    let roleDistribution = { ...this.settings.roleDistribution };
    
    // 檢查玩家人數，調整狼人數量
    if (totalPlayers <= 4 && roleDistribution.WEREWOLF > 1) {
      this.log.system('玩家人數少於或等於4人，狼人數量調整為1');
      const werewolfDiff = roleDistribution.WEREWOLF - 1;
      roleDistribution.WEREWOLF = 1;
      roleDistribution.VILLAGER += werewolfDiff; // 多餘的狼人變成村民
    }
    
    // 計算總角色數
    const totalRoles = Object.values(roleDistribution).reduce((sum, count) => sum + count, 0);
    
    // 如果角色數與玩家數不匹配，調整村民數量
    if (totalRoles !== totalPlayers) {
      const diff = totalPlayers - totalRoles;
      roleDistribution.VILLAGER += diff;
    }
    
    // 創建角色池
    let rolePool = [];
    for (const [role, count] of Object.entries(roleDistribution)) {
      for (let i = 0; i < count; i++) {
        rolePool.push(role);
      }
    }
    
    // 隨機分配角色
    rolePool = shuffleArray(rolePool);
    this.players.forEach(player => {
      player.role = this.roles[rolePool.pop()];
      
      // 根據角色設置特殊能力
      switch (player.role) {
        case this.roles.WITCH:
          player.abilities = {
            hasMedicine: true, // 解藥
            hasPoison: true    // 毒藥
          };
          break;
        case this.roles.HUNTER:
          player.abilities = {
            canShoot: true     // 獵人能力
          };
          break;
        case this.roles.GUARD:
          player.abilities = {
            lastProtected: null // 上一次保護的玩家ID（守衛不能連續兩晚保護同一個人）
          };
          break;
        default:
          player.abilities = {};
          break;
      }
    });
  }
  
  /**
   * 列印遊戲狀態
   */
  printGameStatus() {
    this.log.divider();
    this.log.title(`階段: ${this.state.phase}`);
    if (this.state.day > 0) {
      this.log.info(`第 ${this.state.day} 天`);
    }
    
    this.log.system('當前玩家狀態:');
    this.players.forEach(player => {
      if (player.isAlive) {
        this.log.player(`${player.name} (ID: ${player.id}) ${player.isHuman ? '(你)' : ''}`);
      } else {
        this.log.dead(`${player.name} (ID: ${player.id}) ${player.isHuman ? '(你)' : ''} - 已死亡`);
      }
    });
    this.log.divider();
  }
  
  /**
   * 遊戲主循環
   */
  async gameLoop() {
    this.log.title('=== 遊戲開始 ===');
    
    let gameRunning = true;
    while (gameRunning) {
      // 處理夜晚階段
      if (this.state.phase === this.gamePhases.NIGHT) {
        // 檢查遊戲是否結束（在進入夜晚階段時）
        if (this.isGameOver()) {
          this.state.phase = this.gamePhases.GAME_OVER;
          this.printGameStatus();
        } else {
          await handleNightPhase(this);
        }
      }
      
      // 處理白天討論階段
      else if (this.state.phase === this.gamePhases.DAY_DISCUSSION) {
        await handleDayDiscussionPhase(this);
      }
      
      // 處理投票階段
      else if (this.state.phase === this.gamePhases.VOTING) {
        const voteResult = await handleVotingPhase(this);
        await handleVoteResult(this, voteResult);
        
        // 檢查投票後是否遊戲結束
        if (this.isGameOver()) {
          this.state.phase = this.gamePhases.GAME_OVER;
          this.printGameStatus();
        } else {
          this.state.phase = this.gamePhases.NIGHT;
          this.printGameStatus();
        }
      }
      
      // 處理遊戲結束
      else if (this.state.phase === this.gamePhases.GAME_OVER) {
        this.handleGameOver();
        gameRunning = false; // 結束遊戲循環
      }
    }
  }
  
  /**
   * 處理遊戲結束
   */
  handleGameOver() {
    this.log.title('=== 遊戲結束 ===');
    
    if (this.state.winner === 'village') {
      this.log.success('好人陣營獲勝！村莊恢復了和平！');
    } else if (this.state.winner === 'werewolf') {
      this.log.warning('狼人陣營獲勝！村莊陷入了恐懼...');
    }
    
    // 顯示所有玩家的角色信息
    this.log.info('所有玩家角色：');
    this.players.forEach(player => {
      const status = player.isAlive ? '存活' : '死亡';
      this.log.player(`${player.name} (ID: ${player.id}) - ${player.role} (${status})`);
    });
    
    this.log.divider();
    this.log.system('遊戲已結束，感謝您的參與！');
    this.log.system('若要再次遊玩，請呼叫 Werewolf.startGame()');
  }
  
  /**
   * 獲取角色名稱
   */
  getRoleName(roleKey) {
    return this.roles[roleKey] || roleKey;
  }
  
  /**
   * 使用 AI 生成故事敘述
   */
  async generateStoryWithAI(context) {
    if (!this.apiManager || !this.settings.useAI) {
      return null;
    }
    
    try {
      const response = await this.apiManager.generateStory(context);
      if (response && response.response) {
        return response.response;
      }
      return null;
    } catch (error) {
      console.error('生成故事時發生錯誤:', error);
      return null;
    }
  }
  
  /**
   * 使用 AI 生成 NPC 回應
   */
  async generateNpcResponseWithAI(playerId, context) {
    if (!this.apiManager || !this.settings.useAI) {
      return null;
    }
    
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.isHuman) {
      return null;
    }
    
    try {
      const response = await this.apiManager.generateNpcResponse(player.role, context);
      if (response && response.response) {
        return response.response;
      }
      return null;
    } catch (error) {
      console.error('生成 NPC 回應時發生錯誤:', error);
      return null;
    }
  }
  
  /**
   * 啟用或禁用 AI 功能
   */
  setAIEnabled(enabled) {
    if (!this.apiManager && enabled) {
      this.log.warning('未設定 API 管理器，無法啟用 AI 功能。');
      return false;
    }
    
    // 如果要啟用 AI，先測試連線
    if (enabled) {
      this.testAIConnection();
    }
    
    this.settings.useAI = enabled;
    this.log.system(`已${enabled ? '啟用' : '禁用'} AI 輔助功能`);
    return true;
  }
  
  /**
   * 測試 AI API 連線
   */
  async testAIConnection() {
    if (!this.apiManager) {
      this.log.error('未設定 API 管理器，無法測試 AI 連線。');
      return false;
    }
    
    this.log.system('正在測試 AI API 連線...');
    
    const result = await this.apiManager.testApiConnection();
    if (result.success) {
      this.log.success('AI API 連線測試成功！');
      return true;
    } else {
      this.log.error(`AI API 連線測試失敗: ${result.error || '未知錯誤'}`);
      return false;
    }
  }
}
