/**
 * 狼人殺遊戲主類別 (重構版)
 * 使用核心模組進行狀態和玩家管理
 */
import { createLogger } from './logger.js';
import { ROLES, GAME_PHASES, NIGHT_ACTIONS_ORDER, DEFAULT_ROLE_DISTRIBUTION } from './roles/roleConstants.js';
import { handleNightPhase } from './phases/nightPhase.js';
import { handleDayDiscussionPhase } from './phases/dayPhase.js';
import { handleVotingPhase, handleVoteResult } from './phases/votingPhase.js';

// 匯入核心模組
import { EventEmitter, GameEvents } from './core/EventEmitter.js';
import { GameState } from './core/GameState.js';
import { PlayerManager } from './core/PlayerManager.js';

export class WerewolfGame {
  constructor() {
    // 初始化核心系統
    this._eventEmitter = new EventEmitter();
    this._gameState = new GameState(this._eventEmitter);
    this._playerManager = new PlayerManager(this._eventEmitter);

    // 角色設定（保持向後相容）
    this.roles = ROLES;
    this.gamePhases = GAME_PHASES;
    this.nightActionsOrder = NIGHT_ACTIONS_ORDER;

    // 遊戲設定
    this.settings = {
      playerCount: 8,
      roleDistribution: DEFAULT_ROLE_DISTRIBUTION,
      useAI: false
    };

    // 日誌和輸入管理
    this.log = createLogger();
    this._waitingForInput = false;
    this._currentResolve = null;

    // API 管理器 (由外部設定)
    this.apiManager = null;

    // 設置內部事件監聽
    this._setupEventListeners();
  }

  /**
   * 設置內部事件監聽器
   */
  _setupEventListeners() {
    // 監聽玩家死亡事件
    this._eventEmitter.on(GameEvents.PLAYER_DIED, ({ playerId, playerName }) => {
      this.log.dead(`${playerName} (ID: ${playerId}) 已死亡`);
    });

    // 監聯階段變更
    this._eventEmitter.on('phase:change', ({ from, to }) => {
      this.log.system(`階段變更: ${from} -> ${to}`);
    });
  }

  // ========== 向後相容的存取器 ==========

  /**
   * 向後相容: 存取 players 陣列
   */
  get players() {
    return this._playerManager.players;
  }

  /**
   * 向後相容: 存取 humanPlayerId
   */
  get humanPlayerId() {
    return this._playerManager.humanPlayerId;
  }

  /**
   * 向後相容: 存取 gameStarted
   */
  get gameStarted() {
    return this._gameState.gameStarted;
  }

  set gameStarted(value) {
    this._gameState.gameStarted = value;
  }

  /**
   * 向後相容: 存取 state 物件
   * 這是為了讓現有的 phases 程式碼能夠運作
   * 使用閉包捕獲 _gameState 參考
   */
  get state() {
    const gs = this._gameState;
    return {
      get phase() { return gs.phase; },
      set phase(v) { gs.phase = v; },
      get day() { return gs.day; },
      set day(v) { gs.day = v; },
      get nightKilled() { return gs.nightKilled; },
      set nightKilled(v) { gs.nightKilled = v; },
      get dayDiscussions() { return gs.dayDiscussions; },
      get votes() { return gs.votes; },
      set votes(v) { gs.votes = v; },
      get seerChecks() { return gs.seerChecks; },
      get werewolfVotes() { return gs.werewolfVotes; },
      set werewolfVotes(v) { gs.werewolfVotes = v; },
      get werewolfVoteResult() { return gs.werewolfVoteResult; },
      set werewolfVoteResult(v) { gs.werewolfVoteResult = v; },
      get witchSaved() { return gs.witchSaved; },
      set witchSaved(v) { gs.witchSaved = v; },
      get witchPoisoned() { return gs.witchPoisoned; },
      set witchPoisoned(v) { gs.witchPoisoned = v; },
      get witchPoisonTarget() { return gs.witchPoisonTarget; },
      set witchPoisonTarget(v) { gs.witchPoisonTarget = v; },
      get guardProtected() { return gs.guardProtected; },
      set guardProtected(v) { gs.guardProtected = v; },
      get lastProtected() { return gs.lastProtected; },
      set lastProtected(v) { gs.lastProtected = v; },
      get winner() { return gs.winner; },
      set winner(v) { gs.winner = v; }
    };
  }

  // ========== 玩家查詢方法 (委託給 PlayerManager) ==========

  getAlivePlayers() {
    return this._playerManager.getAlivePlayers();
  }

  getHumanPlayer() {
    return this._playerManager.getHumanPlayer();
  }

  getPlayersByRole(role) {
    return this._playerManager.getPlayersByRole(role);
  }

  getWerewolfTeam() {
    return this._playerManager.getWerewolfTeam();
  }

  getVillageTeam() {
    return this._playerManager.getVillageTeam();
  }

  // ========== 遊戲結束檢查 ==========

  isGameOver() {
    const result = this._playerManager.checkGameOver();
    if (result.isOver) {
      this._gameState.winner = result.winner;
    }
    return result.isOver;
  }

  // ========== 使用者輸入處理 ==========

  async ask(question) {
    this.log.info(question);
    console.log('%c> ', 'color: #00cc99; font-weight: bold;');

    return new Promise(resolve => {
      this._currentResolve = resolve;
      this._waitingForInput = true;
    });
  }

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
        selection = choice - 1;
        if (choice === 0) selection = -1;
      }
    }

    return selection;
  }

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

  // ========== 遊戲控制 ==========

  resetGame() {
    this._playerManager.reset();
    this._gameState.reset();

    // 清除遊戲歷史
    if (this.apiManager) {
      this.apiManager.clearGameHistory();
    }
  }

  async startGame() {
    this.resetGame();

    this.log.title('=== 歡迎來到狼人殺遊戲（控制台版本）===');
    this.log.system('輸入 Werewolf._answerQuestion("您的回答") 來回答問題');
    this.log.divider();

    await this.setupInitialGame();
    await this.ask('按Enter開始遊戲...');

    this._gameState.phase = this.gamePhases.NIGHT;
    this._gameState.gameStarted = true;
    this.printGameStatus();

    await this.gameLoop();
  }

  async setupInitialGame() {
    this.log.system('遊戲設置中...');

    await this.createPlayers();
    this.assignRoles();

    this.log.success('遊戲設置完成！');
    this.log.success(`總玩家數: ${this._playerManager.playerCount}`);

    const humanPlayer = this.getHumanPlayer();
    this.log.role(`您的角色: ${humanPlayer.role}`);

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

  async createPlayers() {
    const playerCountInput = await this.ask(`請輸入玩家總數 (默認 ${this.settings.playerCount}): `);
    const playerCount = parseInt(playerCountInput) || this.settings.playerCount;
    this.settings.playerCount = playerCount;

    const humanName = await this.ask('請輸入您的名字: ');

    const humanPlayer = this._playerManager.createPlayers(playerCount, humanName);

    this.log.success(`已創建 ${this._playerManager.playerCount} 名玩家:`);
    this._playerManager.forEach(player => {
      this.log.player(`- ID: ${player.id}, 名稱: ${player.name}${player.isHuman ? ' (人類玩家)' : ''}`);
    });

    return humanPlayer;
  }

  assignRoles() {
    this.log.system('分配角色中...');

    // 調整分配（少於4人時只有1隻狼人）
    if (this._playerManager.playerCount <= 4) {
      this.log.system('玩家人數少於或等於4人，狼人數量調整為1');
    }

    this._playerManager.assignRoles(this.settings.roleDistribution);
  }

  printGameStatus() {
    this.log.divider();
    this.log.title(`階段: ${this._gameState.phase}`);
    if (this._gameState.day > 0) {
      this.log.info(`第 ${this._gameState.day} 天`);
    }

    this.log.system('當前玩家狀態:');
    this._playerManager.forEach(player => {
      if (player.isAlive) {
        this.log.player(`${player.name} (ID: ${player.id}) ${player.isHuman ? '(你)' : ''}`);
      } else {
        this.log.dead(`${player.name} (ID: ${player.id}) ${player.isHuman ? '(你)' : ''} - 已死亡`);
      }
    });
    this.log.divider();
  }

  async gameLoop() {
    this.log.title('=== 遊戲開始 ===');

    let gameRunning = true;
    while (gameRunning) {
      if (this._gameState.phase === this.gamePhases.NIGHT) {
        if (this.isGameOver()) {
          this._gameState.phase = this.gamePhases.GAME_OVER;
          this.printGameStatus();
        } else {
          await handleNightPhase(this);
        }
      }
      else if (this._gameState.phase === this.gamePhases.DAY_DISCUSSION) {
        await handleDayDiscussionPhase(this);
      }
      else if (this._gameState.phase === this.gamePhases.VOTING) {
        const voteResult = await handleVotingPhase(this);
        await handleVoteResult(this, voteResult);

        if (this.isGameOver()) {
          this._gameState.phase = this.gamePhases.GAME_OVER;
          this.printGameStatus();
        } else {
          this._gameState.phase = this.gamePhases.NIGHT;
          this.printGameStatus();
        }
      }
      else if (this._gameState.phase === this.gamePhases.GAME_OVER) {
        this.handleGameOver();
        gameRunning = false;
      }
    }
  }

  handleGameOver() {
    this.log.title('=== 遊戲結束 ===');

    if (this._gameState.winner === 'village') {
      this.log.success('好人陣營獲勝！村莊恢復了和平！');
    } else if (this._gameState.winner === 'werewolf') {
      this.log.warning('狼人陣營獲勝！村莊陷入了恐懼...');
    }

    this.log.info('所有玩家角色：');
    this._playerManager.forEach(player => {
      const status = player.isAlive ? '存活' : '死亡';
      this.log.player(`${player.name} (ID: ${player.id}) - ${player.role} (${status})`);
    });

    this.log.divider();
    this.log.system('遊戲已結束，感謝您的參與！');
    this.log.system('若要再次遊玩，請呼叫 Werewolf.startGame()');
  }

  getRoleName(roleKey) {
    return this.roles[roleKey] || roleKey;
  }

  // ========== AI 相關方法 ==========

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

  async generateNpcResponseWithAI(playerId, context) {
    if (!this.apiManager || !this.settings.useAI) {
      return null;
    }

    const player = this._playerManager.getPlayerById(playerId);
    if (!player || player.isHuman) {
      return null;
    }

    const gameStatus = {
      phase: this._gameState.phase,
      day: this._gameState.day,
      alivePlayers: this.getAlivePlayers().map(p => ({
        id: p.id,
        name: p.name,
        role: player.role === this.roles.WEREWOLF && p.role === this.roles.WEREWOLF ? p.role : '未知'
      })),
      deadPlayers: this._playerManager.getDeadPlayers().map(p => ({
        id: p.id,
        name: p.name,
        role: p.role
      })),
      playerRole: player.role,
      playerId: player.id
    };

    try {
      const response = await this.apiManager.generateNpcResponse(player.role, context, player.id, null, gameStatus);
      if (response && response.response) {
        return response.response;
      }
      return null;
    } catch (error) {
      console.error('生成 NPC 回應時發生錯誤:', error);
      return null;
    }
  }

  setAIEnabled(enabled) {
    if (typeof enabled !== 'boolean') {
      throw new Error('AI 啟用狀態必須是布林值');
    }
    this.settings.useAI = enabled;
    this.log.info(`AI 功能已${enabled ? '啟用' : '停用'}`);
    return this.settings.useAI;
  }

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

  recordGameMessage(role, message) {
    if (this.apiManager) {
      this.apiManager.addGameMessage(
        role,
        message,
        this._gameState.phase,
        this._gameState.day
      );
    }

    if (role.startsWith('玩家-')) {
      const playerId = parseInt(role.split('-')[1]);
      this._playerManager.addPlayerHistory(
        playerId,
        this._gameState.day,
        this._gameState.phase,
        message
      );
    }
  }

  // ========== 新增：事件系統存取 ==========

  /**
   * 註冊事件監聽器
   */
  on(event, listener) {
    return this._eventEmitter.on(event, listener);
  }

  /**
   * 發送事件
   */
  emit(event, data) {
    this._eventEmitter.emit(event, data);
  }
}
