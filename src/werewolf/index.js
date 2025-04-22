// 狼人殺遊戲 - 控制台版本
console.log('初始化狼人殺遊戲...');

/**
 * 狼人殺遊戲控制台版本
 * 這個模組提供一個純文字介面的狼人殺遊戲，可以直接在瀏覽器控制台中執行
 */
class WerewolfGame {
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
    this.roles = {
      WEREWOLF: '狼人',
      VILLAGER: '村民',
      SEER: '預言家',
      WITCH: '女巫',
      HUNTER: '獵人',
      GUARD: '守衛'
    };
    
    // 遊戲階段
    this.gamePhases = {
      GAME_SETUP: '遊戲設置',
      NIGHT: '夜晚',
      DAY_DISCUSSION: '白天討論',
      VOTING: '投票',
      GAME_OVER: '遊戲結束'
    };
    
    // 夜晚行動順序
    this.nightActionsOrder = ['GUARD', 'WEREWOLF', 'WITCH', 'SEER'];
    
    // 預設遊戲設定
    this.settings = {
      playerCount: 8,
      roleDistribution: {      
        WEREWOLF: 2,
        SEER: 1,
        WITCH: 1,
        HUNTER: 1,
        GUARD: 1,
        VILLAGER: 2
      }
    };
    
    this.humanPlayerId = null;
    this.log = this.createLogger();
  }

  /**
   * 建立格式化日誌紀錄工具
   */
  createLogger() {
    // 定義樣式
    const styles = {
      title: 'color: #0099ff; font-weight: bold; font-size: 14px;',
      warning: 'color: #ff9900; font-weight: bold;',
      error: 'color: #ff3300; font-weight: bold;',
      success: 'color: #00cc66; font-weight: bold;',
      info: 'color: #9966ff;',
      normal: 'color: #666666;',
      player: 'color: #ff6699;',
      night: 'color: #3366ff; font-style: italic;',
      day: 'color: #ff9933; font-weight: bold;',
      role: 'color: #00cc99; font-weight: bold;',
      action: 'color: #cc6633;',
      dead: 'color: #cc0000; text-decoration: line-through;',
      system: 'color: #999999; font-style: italic;'
    };

    return {
      title: (text) => console.log(`%c${text}`, styles.title),
      warning: (text) => console.log(`%c${text}`, styles.warning),
      error: (text) => console.log(`%c${text}`, styles.error),
      success: (text) => console.log(`%c${text}`, styles.success),
      info: (text) => console.log(`%c${text}`, styles.info),
      normal: (text) => console.log(`%c${text}`, styles.normal),
      player: (text) => console.log(`%c${text}`, styles.player),
      night: (text) => console.log(`%c${text}`, styles.night),
      day: (text) => console.log(`%c${text}`, styles.day),
      role: (text) => console.log(`%c${text}`, styles.role),
      action: (text) => console.log(`%c${text}`, styles.action),
      dead: (text) => console.log(`%c${text}`, styles.dead),
      system: (text) => console.log(`%c${text}`, styles.system),
      divider: () => console.log('%c' + '-'.repeat(50), 'color: #cccccc;')
    };
  }
  
  /**
   * 創建玩家物件
   */
  createPlayer(id, name, isHuman = false) {
    return {
      id,
      name,
      isHuman,
      isAlive: true,
      role: null,
      abilities: {},
      history: []
    };
  }
  
  /**
   * 產生隨機玩家名稱
   */
  generatePlayerName() {
    const names = [
      '小明', '小華', '小菁', '小玲', '小剛', 
      '阿德', '阿強', '阿美', '阿真', '阿樂',
      '冠宇', '宗翰', '家豪', '詩涵', '雅婷',
      '世傑', '佳穎', '俊傑', '靜怡', '志明'
    ];
    return names[Math.floor(Math.random() * names.length)];
  }
  
  /**
   * 隨機排序陣列（Fisher-Yates 洗牌演算法）
   */
  shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
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
   * 啟動遊戲
   */
  async startGame() {
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
    const humanPlayer = this.createPlayer(1, humanName || '玩家1', true);
    this.players.push(humanPlayer);
    this.humanPlayerId = 1;
    
    // 創建AI玩家
    for (let i = 2; i <= this.settings.playerCount; i++) {
      const aiPlayer = this.createPlayer(i, this.generatePlayerName(), false);
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
    rolePool = this.shuffleArray(rolePool);
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
          await this.handleNightPhase();
        }
      }
      
      // 處理白天討論階段
      else if (this.state.phase === this.gamePhases.DAY_DISCUSSION) {
        await this.handleDayDiscussionPhase();
      }
      
      // 處理投票階段
      else if (this.state.phase === this.gamePhases.VOTING) {
        const voteResult = await this.handleVotingPhase();
        await this.handleVoteResult(voteResult);
        
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
   * 處理夜晚階段
   */
  async handleNightPhase() {
    // 增加天數
    this.state.day++;
    this.log.night(`=== 第 ${this.state.day} 天夜晚 ===`);
    this.state.witchSaved = false;
    this.state.witchPoisoned = false;
    this.state.guardProtected = null;
    this.printGameStatus();
    
    // 按角色順序執行夜晚行動
    for (const role of this.nightActionsOrder) {
      await this.handleNightAction(role);
    }
    
    // 處理夜晚結果
    this.resolveNightActions();
    
    // 轉入白天討論階段
    this.state.phase = this.gamePhases.DAY_DISCUSSION;
    this.printGameStatus();
  }
  
  /**
   * 處理特定角色的夜晚行動
   */
  async handleNightAction(roleKey) {
    const roleName = this.roles[roleKey];
    const players = this.players.filter(p => p.role === roleName && p.isAlive);
    
    if (players.length === 0) return;
    
    this.log.night(`${roleName}的回合...`);
    
    // 查找人類玩家是否是此角色
    const humanPlayer = players.find(p => p.isHuman);
    
    if (humanPlayer) {
      // 人類玩家的行動
      switch (roleKey) {
        case 'WEREWOLF':
          await this.handleWerewolfAction(humanPlayer);
          break;
        case 'SEER':
          await this.handleSeerAction(humanPlayer);
          break;
        case 'WITCH':
          await this.handleWitchAction(humanPlayer);
          break;
        case 'GUARD':
          await this.handleGuardAction(humanPlayer);
          break;
      }
    } else {
      // 模擬AI玩家行動
      for (const player of players) {
        switch (roleKey) {
          case 'WEREWOLF':
            await this.simulateWerewolfAction(player);
            break;
          case 'SEER':
            await this.simulateSeerAction(player);
            break;
          case 'WITCH':
            await this.simulateWitchAction(player);
            break;
          case 'GUARD':
            await this.simulateGuardAction(player);
            break;
        }
      }
    }
  }
  
  /**
   * 處理狼人行動
   */
  async handleWerewolfAction(player) {
    this.log.night('您是狼人，請選擇一位玩家擊殺:');
    
    // 獲取可以擊殺的玩家列表（排除狼人自己）
    const targets = this.getAlivePlayers().filter(p => p.role !== this.roles.WEREWOLF);
    
    if (targets.length === 0) {
      this.log.warning('沒有可以擊殺的目標!');
      return;
    }
    
    const options = targets.map(p => `${p.name} (ID: ${p.id})`);
    const selectedIndex = await this.selectOption(options, '請選擇擊殺目標:');
    
    if (selectedIndex === -1) {
      this.log.warning('您選擇放棄擊殺!');
      return;
    }
    
    const selectedTarget = targets[selectedIndex];
    this.state.werewolfVoteResult = selectedTarget.id;
    this.log.action(`您選擇擊殺: ${selectedTarget.name}`);
  }
  
  /**
   * 模擬AI狼人行動
   */
  async simulateWerewolfAction(player) {
    // 如果已經有狼人投票結果，則跳過（其他狼人已決定）
    if (this.state.werewolfVoteResult !== null) return;
    
    // 獲取可以擊殺的玩家列表（排除狼人自己）
    const targets = this.getAlivePlayers().filter(p => p.role !== this.roles.WEREWOLF);
    
    if (targets.length === 0) return;
    
    // AI隨機選擇一個目標
    const selectedTarget = targets[Math.floor(Math.random() * targets.length)];
    this.state.werewolfVoteResult = selectedTarget.id;
    
    this.log.system(`AI狼人 ${player.name} 選擇了擊殺目標 (對你隱藏)`);
  }
  
  /**
   * 處理預言家行動
   */
  async handleSeerAction(player) {
    this.log.night('您是預言家，請選擇一位玩家查驗身份:');
    
    // 排除自己
    const targets = this.getAlivePlayers().filter(p => p.id !== player.id);
    
    if (targets.length === 0) {
      this.log.warning('沒有可以查驗的目標!');
      return;
    }
    
    const options = targets.map(p => `${p.name} (ID: ${p.id})`);
    const selectedIndex = await this.selectOption(options, '請選擇查驗目標:');
    
    if (selectedIndex === -1) {
      this.log.warning('您選擇放棄查驗!');
      return;
    }
    
    const selectedTarget = targets[selectedIndex];
    const isWerewolf = selectedTarget.role === this.roles.WEREWOLF;
    
    // 記錄查驗結果
    this.state.seerChecks.push({
      night: this.state.day,
      targetId: selectedTarget.id,
      result: isWerewolf ? '狼人' : '好人'
    });
    
    this.log.action(`您查驗了 ${selectedTarget.name}，結果是: ${isWerewolf ? '狼人' : '好人'}`);
  }
  
  /**
   * 模擬AI預言家行動
   */
  async simulateSeerAction(player) {
    // 排除自己
    const targets = this.getAlivePlayers().filter(p => p.id !== player.id);
    
    if (targets.length === 0) return;
    
    // AI隨機選擇一個目標
    const selectedTarget = targets[Math.floor(Math.random() * targets.length)];
    const isWerewolf = selectedTarget.role === this.roles.WEREWOLF;
    
    // 記錄查驗結果
    this.state.seerChecks.push({
      night: this.state.day,
      targetId: selectedTarget.id,
      result: isWerewolf ? '狼人' : '好人'
    });
    
    this.log.system(`AI預言家 ${player.name} 查驗了一名玩家 (對你隱藏)`);
  }
  
  /**
   * 處理女巫行動
   */
  async handleWitchAction(player) {
    this.log.night('您是女巫，請選擇您的行動:');
    
    // 檢查狼人擊殺結果
    const killedPlayerId = this.state.werewolfVoteResult;
    const killedPlayer = killedPlayerId !== null ? this.players.find(p => p.id === killedPlayerId) : null;
    
    // 1. 解藥
    if (player.abilities.hasMedicine && killedPlayer) {
      this.log.info(`今晚 ${killedPlayer.name} 將被狼人殺死`);
      const willSave = await this.askYesNo('您是否要使用解藥救人？');
      
      if (willSave) {
        player.abilities.hasMedicine = false;
        this.state.witchSaved = true;
        this.log.action(`您使用解藥救了 ${killedPlayer.name}`);
      }
    } else if (player.abilities.hasMedicine && killedPlayer === null) {
      this.log.info('今晚沒有人被狼人選中');
    } else if (!player.abilities.hasMedicine) {
      this.log.info('您已經沒有解藥了');
    }
    
    // 2. 毒藥
    if (player.abilities.hasPoison) {
      const willPoison = await this.askYesNo('您是否要使用毒藥？');
      
      if (willPoison) {
        // 選擇毒藥目標
        const targets = this.getAlivePlayers().filter(p => p.id !== player.id);
        
        if (targets.length === 0) {
          this.log.warning('沒有可以毒殺的目標!');
        } else {
          const options = targets.map(p => `${p.name} (ID: ${p.id})`);
          const selectedIndex = await this.selectOption(options, '請選擇毒殺目標:');
          
          if (selectedIndex !== -1) {
            const poisonTarget = targets[selectedIndex];
            player.abilities.hasPoison = false;
            this.state.witchPoisoned = true;
            this.state.witchPoisonTarget = poisonTarget.id;
            this.log.action(`您使用毒藥毒殺了 ${poisonTarget.name}`);
          } else {
            this.log.warning('您取消了使用毒藥');
          }
        }
      }
    } else {
      this.log.info('您已經沒有毒藥了');
    }
  }
  
  /**
   * 模擬AI女巫行動
   */
  async simulateWitchAction(player) {
    const killedPlayerId = this.state.werewolfVoteResult;
    const killedPlayer = killedPlayerId !== null ? this.players.find(p => p.id === killedPlayerId) : null;
    
    // 使用解藥的機率
    if (player.abilities.hasMedicine && killedPlayer && Math.random() > 0.3) {
      player.abilities.hasMedicine = false;
      this.state.witchSaved = true;
      this.log.system(`AI女巫 ${player.name} 做出了選擇 (對你隱藏)`);
    }
    
    // 使用毒藥的機率較低
    if (player.abilities.hasPoison && Math.random() > 0.7) {
      // 隨機選擇毒殺目標
      const targets = this.getAlivePlayers().filter(p => p.id !== player.id);
      
      if (targets.length > 0) {
        const poisonTarget = targets[Math.floor(Math.random() * targets.length)];
        player.abilities.hasPoison = false;
        this.state.witchPoisoned = true;
        this.state.witchPoisonTarget = poisonTarget.id;
        this.log.system(`AI女巫 ${player.name} 做出了選擇 (對你隱藏)`);
      }
    }
  }
  
  /**
   * 處理守衛行動
   */
  async handleGuardAction(player) {
    this.log.night('您是守衛，請選擇一位玩家保護:');
    
    // 獲取可以保護的玩家
    const targets = this.getAlivePlayers().filter(p => {
      // 不能連續兩晚保護同一個人
      return p.id !== player.abilities.lastProtected;
    });
    
    if (targets.length === 0) {
      this.log.warning('沒有可以保護的目標!');
      return;
    }
    
    const options = targets.map(p => `${p.name} (ID: ${p.id})`);
    const selectedIndex = await this.selectOption(options, '請選擇保護目標:');
    
    if (selectedIndex === -1) {
      this.log.warning('您選擇不保護任何人!');
      return;
    }
    
    const selectedTarget = targets[selectedIndex];
    this.state.guardProtected = selectedTarget.id;
    player.abilities.lastProtected = selectedTarget.id;
    this.log.action(`您選擇保護: ${selectedTarget.name}`);
  }
  
  /**
   * 模擬AI守衛行動
   */
  async simulateGuardAction(player) {
    // 獲取可以保護的玩家
    const targets = this.getAlivePlayers().filter(p => {
      // 不能連續兩晚保護同一個人
      return p.id !== player.abilities.lastProtected;
    });
    
    if (targets.length === 0) return;
    
    // AI隨機選擇一個目標
    const selectedTarget = targets[Math.floor(Math.random() * targets.length)];
    this.state.guardProtected = selectedTarget.id;
    player.abilities.lastProtected = selectedTarget.id;
    
    this.log.system(`AI守衛 ${player.name} 選擇了保護目標 (對你隱藏)`);
  }
  
  /**
   * 處理夜晚行動結果
   */
  resolveNightActions() {
    this.log.night('黎明即將到來...');
    
    // 計算夜晚死亡情況
    let nightDeathText = '';
    let nightDeaths = [];
    
    // 處理狼人擊殺
    const killedPlayerId = this.state.werewolfVoteResult;
    if (killedPlayerId !== null) {
      const killedPlayer = this.players.find(p => p.id === killedPlayerId);
      
      // 確認是否被女巫救或被守衛保護
      if ((this.state.witchSaved) || (this.state.guardProtected === killedPlayerId)) {
        this.log.night('狼人的獵物被救回來了！');
      } else {
        killedPlayer.isAlive = false;
        nightDeaths.push(killedPlayer);
        nightDeathText += `${killedPlayer.name} 被狼人殺死了！\n`;
      }
    }
    
    // 處理女巫毒藥
    if (this.state.witchPoisoned && this.state.witchPoisonTarget) {
      const poisonedPlayerId = this.state.witchPoisonTarget;
      const poisonedPlayer = this.players.find(p => p.id === poisonedPlayerId);
      
      if (poisonedPlayer && poisonedPlayer.isAlive) {
        poisonedPlayer.isAlive = false;
        // 只有當該玩家還沒有被計算死亡時才添加
        if (!nightDeaths.some(p => p.id === poisonedPlayerId)) {
          nightDeaths.push(poisonedPlayer);
          nightDeathText += `${poisonedPlayer.name} 被毒死了！\n`;
        }
      }
    }
    
    // 記錄夜晚結果
    this.state.nightKilled = nightDeaths.length > 0 ? nightDeaths.map(p => p.id) : null;
    
    // 重置投票結果
    this.state.werewolfVoteResult = null;
    this.state.witchPoisonTarget = null;
  }
  
  /**
   * 處理白天討論階段
   */
  async handleDayDiscussionPhase() {
    this.log.day(`=== 第 ${this.state.day} 天白天 ===`);
    
    // 宣佈昨晚死亡情況
    if (this.state.nightKilled && this.state.nightKilled.length > 0) {
      this.log.warning(`昨晚，以下玩家不幸遇難:`);
      
      for (const id of this.state.nightKilled) {
        const player = this.players.find(p => p.id === id);
        this.log.dead(`- ${player.name} (ID: ${player.id})`);
        
        // 獵人死亡時可以開槍
        if (player.role === this.roles.HUNTER && player.abilities.canShoot) {
          if (player.isHuman) {
            await this.handleHunterAbility(player);
          } else {
            await this.simulateHunterAbility(player);
          }
        }
      }
    } else {
      this.log.success('昨晚是平安夜，沒有人死亡！');
    }
    
    // 更新遊戲狀態
    this.printGameStatus();
    
    // 檢查遊戲是否應該結束
    if (this.isGameOver()) {
      this.state.phase = this.gamePhases.GAME_OVER;
      return;
    }
    
    // 討論階段
    this.log.day('現在進入討論階段，請玩家們自由發言...');
    await this.ask('按Enter進入投票階段...');
    
    // 進入投票階段
    this.state.phase = this.gamePhases.VOTING;
    this.log.system('討論結束，進入投票階段');
  }
  
  /**
   * 處理人類獵人技能
   */
  async handleHunterAbility(player) {
    this.log.role('您是獵人，死亡時可以開槍帶走一名玩家');
    const willShoot = await this.askYesNo('是否使用獵人能力開槍？');
    
    if (willShoot) {
      // 選擇開槍目標
      const targets = this.getAlivePlayers();
      
      if (targets.length === 0) {
        this.log.warning('沒有可以射擊的目標!');
        return;
      }
      
      const options = targets.map(p => `${p.name} (ID: ${p.id})`);
      const selectedIndex = await this.selectOption(options, '請選擇射擊目標:');
      
      if (selectedIndex !== -1) {
        const shootTarget = targets[selectedIndex];
        shootTarget.isAlive = false;
        player.abilities.canShoot = false;
        this.log.action(`獵人 ${player.name} 開槍擊中了 ${shootTarget.name}！`);
      } else {
        this.log.warning('獵人放棄了開槍');
      }
    }
  }
  
  /**
   * 模擬AI獵人技能
   */
  async simulateHunterAbility(player) {
    // AI獵人有較高機率開槍
    if (Math.random() > 0.2) {
      const targets = this.getAlivePlayers();
      
      if (targets.length > 0) {
        // 隨機選擇一個目標
        const shootTarget = targets[Math.floor(Math.random() * targets.length)];
        shootTarget.isAlive = false;
        player.abilities.canShoot = false;
        this.log.action(`獵人 ${player.name} 開槍擊中了 ${shootTarget.name}！`);
      }
    } else {
      this.log.action(`獵人 ${player.name} 沒有開槍就嚥下了最後一口氣...`);
    }
  }
  
  /**
   * 處理投票階段
   */
  async handleVotingPhase() {
    this.log.day('現在進入投票階段，將決定驅逐一名玩家');
    this.state.votes = {};
    
    // 人類玩家先投票
    const humanPlayer = this.getHumanPlayer();
    if (humanPlayer.isAlive) {
      await this.handlePlayerVote(humanPlayer);
    }
    
    // AI玩家投票
    const aiPlayers = this.getAlivePlayers().filter(p => !p.isHuman);
    for (const player of aiPlayers) {
      await this.simulatePlayerVote(player);
    }
    
    // 計算投票結果
    const voteResults = {};
    for (const [voterId, targetId] of Object.entries(this.state.votes)) {
      if (!voteResults[targetId]) {
        voteResults[targetId] = 0;
      }
      voteResults[targetId]++;
    }
    
    // 找出票數最多的玩家
    let maxVotes = 0;
    let maxVotedPlayers = [];
    
    for (const [targetId, votes] of Object.entries(voteResults)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        maxVotedPlayers = [parseInt(targetId)];
      } else if (votes === maxVotes) {
        maxVotedPlayers.push(parseInt(targetId));
      }
    }
    
    // 處理平票情況
    let votedOutPlayerId = null;
    
    if (maxVotedPlayers.length === 1) {
      votedOutPlayerId = maxVotedPlayers[0];
    } else if (maxVotedPlayers.length > 1) {
      // 平票情況，隨機選擇一個
      this.log.warning('投票出現平局！將隨機選擇一名玩家');
      votedOutPlayerId = maxVotedPlayers[Math.floor(Math.random() * maxVotedPlayers.length)];
    }
    
    return votedOutPlayerId;
  }
  
  /**
   * 處理人類玩家投票
   */
  async handlePlayerVote(player) {
    // 獲取可以投票的玩家（排除自己）
    const targets = this.getAlivePlayers().filter(p => p.id !== player.id);
    
    if (targets.length === 0) {
      this.log.warning('沒有可以投票的目標!');
      return;
    }
    
    const options = targets.map(p => `${p.name} (ID: ${p.id})`);
    const selectedIndex = await this.selectOption(options, '請選擇要投票驅逐的玩家:');
    
    if (selectedIndex === -1) {
      this.log.warning('您選擇棄票!');
      return;
    }
    
    const selectedTarget = targets[selectedIndex];
    this.state.votes[player.id] = selectedTarget.id;
    this.log.action(`您投票驅逐 ${selectedTarget.name}`);
  }
  
  /**
   * 模擬AI玩家投票
   */
  async simulatePlayerVote(player) {
    // 獲取可以投票的玩家（排除自己）
    const targets = this.getAlivePlayers().filter(p => p.id !== player.id);
    
    if (targets.length === 0) return;
    
    // AI隨機選擇一個目標（這裡可以加入更複雜的AI邏輯）
    const selectedTarget = targets[Math.floor(Math.random() * targets.length)];
    this.state.votes[player.id] = selectedTarget.id;
    
    this.log.system(`${player.name} 進行了投票 (對你隱藏)`);
  }
  
  /**
   * 處理投票結果
   */
  async handleVoteResult(votedOutPlayerId) {
    if (votedOutPlayerId === null) {
      this.log.warning('投票結束，沒有玩家被驅逐');
      return;
    }
    
    const votedOutPlayer = this.players.find(p => p.id === votedOutPlayerId);
    
    this.log.warning(`投票結束，${votedOutPlayer.name} 被驅逐出村莊`);
    votedOutPlayer.isAlive = false;
    
    // 顯示身份
    this.log.role(`${votedOutPlayer.name} 的真實身份是: ${votedOutPlayer.role}`);
    
    // 獵人死亡時可以開槍
    if (votedOutPlayer.role === this.roles.HUNTER && votedOutPlayer.abilities.canShoot) {
      if (votedOutPlayer.isHuman) {
        await this.handleHunterAbility(votedOutPlayer);
      } else {
        await this.simulateHunterAbility(votedOutPlayer);
      }
    }
    
    await this.ask('按Enter繼續...');
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
}

// 建立全域變數
window.Werewolf = new WerewolfGame();

console.log('%c=== 狼人殺遊戲（控制台版本）已載入 ===', 'color: #0099ff; font-weight: bold; font-size: 14px;');
console.log('%c請輸入 Werewolf.startGame() 開始遊戲', 'color: #00cc66; font-weight: bold;');
console.log('%c提示：在遊戲中回答問題時，請使用 Werewolf._answerQuestion("您的回答") 來輸入', 'color: #ff9900;');

export default window.Werewolf;
