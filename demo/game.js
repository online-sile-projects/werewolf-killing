/**
 * 網頁版狼人殺遊戲
 * 這個檔案作為網頁和遊戲核心邏輯之間的橋樑
 */

// 模擬模組系統，將原始命令列遊戲轉換為網頁版
class WebGame {
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
      werewolfVoteResult: null
    };
    
    // LLM API 相關設定
    this.llmConfig = {
      devMode: {
        enabled: true,
        showThinking: false  // 是否顯示思考過程
      }
    };
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
    
    // UI元素
    this.playersListElement = document.getElementById('players-list');
    this.dayCounterElement = document.getElementById('day-counter');
    this.gamePhaseElement = document.getElementById('game-phase');
    
    // 夜晚行動順序
    this.nightActionsOrder = ['GUARD', 'WEREWOLF', 'WITCH', 'SEER'];
    
    // 模擬 readline-sync
    this.readlineSync = {
      question: (text) => {
        return new Promise(resolve => {
          webConsole.question(text, (answer) => {
            resolve(answer);
          });
        });
      },
      
      questionInt: (text, defaultValue) => {
        return new Promise(resolve => {
          webConsole.questionInt(text, (answer) => {
            resolve(answer || defaultValue);
          }, defaultValue);
        });
      },
      
      keyInSelect: (items, text) => {
        return new Promise(resolve => {
          webConsole.keyInSelect(items, text, (index) => {
            resolve(index);
          });
        });
      },
      
      keyInYN: (text) => {
        return new Promise(resolve => {
          webConsole.keyInYN(text, (answer) => {
            resolve(answer);
          });
        });
      }
    };
    
    // LLM API 相關設定
    this.llmConfig = {
      devMode: {
        enabled: true,
        showThinking: false  // 是否顯示思考過程
      }
    };
  }
  
  // 啟動遊戲
  async startGame() {
    webConsole.println('=== 歡迎來到狼人殺遊戲 ===', 'text-cyan');
    
    // 初始化遊戲
    await this.setupInitialGame();
    
    // 等待玩家準備好
    await this.readlineSync.question(webChalk.yellow('按Enter鍵開始遊戲...'));
    
    // 開始第一個夜晚
    this.state.phase = this.gamePhases.NIGHT;
    this.updateUI();
    
    // 開始遊戲主循環
    await this.gameLoop();
  }
  
  // 初始化遊戲
  async setupInitialGame() {
    webConsole.println('遊戲設置中...', 'text-yellow');
    
    // 獲取玩家數量
    const playerCount = await this.readlineSync.questionInt(
      webChalk.green(`請輸入玩家總數 (默認 ${this.settings.playerCount}): `),
      this.settings.playerCount
    );
    
    this.settings.playerCount = playerCount;
    
    // 創建玩家
    await this.createPlayers();
    
    // 分配角色
    this.assignRoles();
    
    // 更新UI
    this.updateUI();
    
    webConsole.println('遊戲設置完成！', 'text-green');
    webConsole.println(`總玩家數: ${this.players.length}`, 'text-green');
    webConsole.println(`您的角色: ${this.getHumanPlayer().role}`, 'text-green');
  }
  
  // 創建玩家
  async createPlayers() {
    // 創建人類玩家
    const humanName = await this.readlineSync.question(webChalk.green('請輸入您的名字: '));
    const humanPlayer = this.createPlayer(1, humanName || '玩家1', true);
    this.players.push(humanPlayer);
    this.humanPlayerId = 1;
    
    // 創建AI玩家
    for (let i = 2; i <= this.settings.playerCount; i++) {
      const aiPlayer = this.createPlayer(i, this.generatePlayerName(), false);
      this.players.push(aiPlayer);
    }
    
    // 輸出所有玩家的名稱和ID以便確認
    webConsole.println(`已創建 ${this.players.length} 名玩家:`, 'text-green');
    this.players.forEach(player => {
      webConsole.println(`- ID: ${player.id}, 名稱: ${player.name}${player.isHuman ? ' (人類玩家)' : ''}`, 'text-cyan');
    });
  }
  
  // 分配角色
  assignRoles() {
    webConsole.println('分配角色中...', 'text-yellow');
    
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
  
  // 遊戲主循環
  async gameLoop() {
    webConsole.println('=== 遊戲開始 ===', 'text-cyan');
    
    let gameRunning = true;
    while (gameRunning) {
      // 處理夜晚階段
      if (this.state.phase === this.gamePhases.NIGHT) {
        // 檢查遊戲是否結束（在進入夜晚階段時）
        if (this.isGameOver()) {
          this.state.phase = this.gamePhases.GAME_OVER;
          this.updateUI();
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
          this.updateUI();
        } else {
          this.state.phase = this.gamePhases.NIGHT;
          this.updateUI();
        }
      }
      
      // 處理遊戲結束
      else if (this.state.phase === this.gamePhases.GAME_OVER) {
        this.handleGameOver();
        gameRunning = false; // 結束遊戲循環
      }
    }
  }
  
  // 處理夜晚階段
  async handleNightPhase() {
    // 增加天數
    this.state.day++;
    webConsole.println(`\n=== 第 ${this.state.day} 天夜晚 ===`, 'text-blue');
    this.updateUI();
    
    // 按角色順序執行夜晚行動
    for (const role of this.nightActionsOrder) {
      await this.handleNightAction(role);
    }
    
    // 處理夜晚結果
    this.resolveNightActions();
    
    // 轉入白天討論階段
    this.state.phase = this.gamePhases.DAY_DISCUSSION;
    this.updateUI();
  }
  
  // 處理特定角色的夜晚行動
  async handleNightAction(role) {
    const players = this.players.filter(p => p.role === this.roles[role] && p.isAlive);
    if (players.length === 0) return;
    
    for (const player of players) {
      // 人類玩家直接在控制台交互
      if (player.isHuman) {
        // 只顯示角色信息給人類玩家本人，因為這是他自己的回合
        webConsole.println(`\n${player.role} 的回合`, 'text-yellow');
        await this.handleHumanNightAction(player);
      } else {
        // AI玩家行動 - 不要直接顯示角色
        await this.handleAiNightAction(player);
      }
    }
  }
  
  // 處理人類玩家的夜晚行動
  async handleHumanNightAction(player) {
    switch (player.role) {
      case this.roles.WEREWOLF:
        await this.handleWerewolfAction(player);
        break;
        
      case this.roles.SEER:
        await this.handleSeerAction(player);
        break;
        
      case this.roles.WITCH:
        await this.handleWitchAction(player);
        break;
        
      case this.roles.GUARD:
        await this.handleGuardAction(player);
        break;
        
      default:
        webConsole.println(`${player.role} 沒有夜晚行動`, 'text-gray');
        break;
    }
  }
  
  // 處理AI玩家的夜晚行動
  async handleAiNightAction(player) {
    // 修改此行，不顯示角色信息，只顯示AI玩家名稱
    webConsole.println(`\nAI玩家 ${player.name} 正在思考...`, 'text-yellow');
    
    const action = await this.simulateAiAction(player);
    
    switch (player.role) {
      case this.roles.WEREWOLF:
        // 處理 AI 狼人的投票行動
        await this.handleAiWerewolfAction(player, action);
        break;
        
      case this.roles.SEER:
        await this.handleAiSeerAction(player, action);
        break;
        
      case this.roles.WITCH:
        await this.handleAiWitchAction(player, action);
        break;
        
      case this.roles.GUARD:
        await this.handleAiGuardAction(player, action);
        break;
        
      default:
        webConsole.println(`AI玩家進行了行動...`, 'text-gray');
        break;
    }
  }
  
  // 處理狼人行動
  async handleWerewolfAction(player) {
    // 獲取存活的狼人
    const aliveWerewolves = this.players.filter(p => p.isAlive && p.role === this.roles.WEREWOLF);
    
    // 首先顯示其他狼人的信息
    if (this.state.day === 1) {
      webConsole.println('=== 狼人身份確認 ===', 'text-red');
      if (aliveWerewolves.length > 1) {
        const otherWerewolves = aliveWerewolves.filter(w => w.id !== player.id);
        webConsole.println(`你的狼人同伴是：`, 'text-red');
        otherWerewolves.forEach(w => {
          webConsole.println(`- ${w.name} (ID: ${w.id})`, 'text-red');
        });
      } else {
        webConsole.println('你是唯一的狼人', 'text-red');
      }
      webConsole.println('===================', 'text-red');
    }
    
    // 如果只有一個狼人，直接選擇目標
    if (aliveWerewolves.length === 1) {
      return await this.handleSingleWerewolfAction(player);
    } 
    
    // 多個狼人，進行投票
    return await this.handleMultipleWerewolfesAction(player, aliveWerewolves);
  }
  
  // 處理單個狼人的殺人行動
  async handleSingleWerewolfAction(player) {
    webConsole.println('請選擇一名玩家殺死:', 'text-red');
    
    const alivePlayers = this.players.filter(p => p.isAlive && p.role !== this.roles.WEREWOLF);
    const choices = alivePlayers.map(p => `${p.id}: ${p.name}`);
    
    const index = await this.readlineSync.keyInSelect(choices, '選擇目標:');
    if (index === -1) {
      webConsole.println('狼人選擇放棄殺人', 'text-gray');
      return;
    }
    
    const targetId = alivePlayers[index].id;
    this.state.werewolfTarget = this.players.find(p => p.id === targetId);
    webConsole.println(`你選擇了 ${this.state.werewolfTarget.name}`, 'text-red');
  }
  
  // 處理多個狼人的投票殺人行動
  async handleMultipleWerewolfesAction(player, aliveWerewolves) {
    webConsole.println(`狼人們需要投票決定殺死誰`, 'text-red');
    
    // 獲取可選目標 (非狼人且存活的玩家)
    const alivePlayers = this.players.filter(p => p.isAlive && p.role !== this.roles.WEREWOLF);
    const choices = alivePlayers.map(p => `${p.id}: ${p.name}`);
    
    // 人類玩家投票
    if (player.isHuman) {
      const index = await this.readlineSync.keyInSelect(choices, '請投票選擇要殺死的目標:');
      if (index === -1) {
        webConsole.println('你選擇了棄權', 'text-gray');
        this.state.werewolfVotes[player.id] = null;
      } else {
        const targetId = alivePlayers[index].id;
        this.state.werewolfVotes[player.id] = targetId;
        webConsole.println(`你投票給了 ${alivePlayers[index].name}`, 'text-red');
      }
    }
    
    // 檢查是否所有狼人都已投票
    const allWerewolvesVoted = aliveWerewolves.every(w => w.id in this.state.werewolfVotes);
    
    // 統計投票結果
    if (allWerewolvesVoted || player.id === aliveWerewolves[aliveWerewolves.length - 1].id) {
      // 計算每個玩家獲得的票數
      const voteCounts = {};
      for (const [werewolfId, targetId] of Object.entries(this.state.werewolfVotes)) {
        if (targetId !== null) {
          voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
        }
      }
      
      // 找出票數最多的玩家
      let maxVotes = 0;
      let maxVotedPlayers = [];
      
      for (const [playerId, votes] of Object.entries(voteCounts)) {
        if (votes > maxVotes) {
          maxVotes = votes;
          maxVotedPlayers = [parseInt(playerId)];
        } else if (votes === maxVotes) {
          maxVotedPlayers.push(parseInt(playerId));
        }
      }
      
      // 如果只有一个人票数最多，则设为目标
      if (maxVotedPlayers.length === 1 && maxVotes > 0) {
        this.state.werewolfTarget = this.players.find(p => p.id === maxVotedPlayers[0]);
        webConsole.println(`經過投票，狼人們決定殺死 ${this.state.werewolfTarget.name}`, 'text-red');
      } else if (maxVotedPlayers.length > 1) {
        // 平局隨機決定
        const randomIndex = Math.floor(Math.random() * maxVotedPlayers.length);
        const targetId = maxVotedPlayers[randomIndex];
        this.state.werewolfTarget = this.players.find(p => p.id === targetId);
        webConsole.println(`投票平局，隨機選擇了 ${this.state.werewolfTarget.name}`, 'text-red');
      } else {
        // 沒有人獲得投票或者都棄權
        webConsole.println('狼人們選擇放棄殺人', 'text-gray');
        this.state.werewolfTarget = null;
      }
    } else {
      webConsole.println('等待其他狼人投票...', 'text-red');
    }
  }
  
  // 處理AI狼人行動
  async handleAiWerewolfAction(player, action) {
    const aliveWerewolves = this.players.filter(p => p.isAlive && p.role === this.roles.WEREWOLF);
    
    // 如果只有一個狼人，直接設置目標
    if (aliveWerewolves.length === 1) {
      this.state.werewolfTarget = this.players.find(p => p.id.toString() === action);
      webConsole.println(`夜晚行動中...`, 'text-gray'); // 不顯示角色身分
    } else {
      // 多個狼人，記錄這個 AI 狼人的投票
      this.state.werewolfVotes[player.id] = action ? parseInt(action) : null;
      
      // 檢查是否所有狼人都已投票
      const allWerewolvesVoted = aliveWerewolves.every(w => w.id in this.state.werewolfVotes);
      
      // 如果是最後一個投票的狼人，則計算結果
      if (allWerewolvesVoted || player.id === aliveWerewolves[aliveWerewolves.length - 1].id) {
        // 統計投票結果
        const voteCounts = {};
        for (const [werewolfId, targetId] of Object.entries(this.state.werewolfVotes)) {
          if (targetId !== null) {
            voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
          }
        }
        
        // 找出票數最多的玩家
        let maxVotes = 0;
        let maxVotedPlayers = [];
        
        for (const [playerId, votes] of Object.entries(voteCounts)) {
          if (votes > maxVotes) {
            maxVotes = votes;
            maxVotedPlayers = [parseInt(playerId)];
          } else if (votes === maxVotes) {
            maxVotedPlayers.push(parseInt(playerId));
          }
        }
        
        // 如果只有一個人票數最多，則設為目標
        if (maxVotedPlayers.length === 1 && maxVotes > 0) {
          this.state.werewolfTarget = this.players.find(p => p.id === maxVotedPlayers[0]);
          webConsole.println(`夜晚行動完成...`, 'text-gray'); // 不顯示角色身分
        } else if (maxVotedPlayers.length > 1) {
          // 平局隨機決定
          const randomIndex = Math.floor(Math.random() * maxVotedPlayers.length);
          const targetId = maxVotedPlayers[randomIndex];
          this.state.werewolfTarget = this.players.find(p => p.id === targetId);
          webConsole.println(`夜晚行動完成...`, 'text-gray'); // 不顯示角色身分
        } else {
          // 沒有人獲得投票或者都棄權
          webConsole.println('夜晚無行動', 'text-gray');
          this.state.werewolfTarget = null;
        }
      } else {
        webConsole.println(`玩家行動中...`, 'text-gray'); // 不顯示角色身分
      }
    }
  }
  
  // 處理預言家行動
  async handleSeerAction(player) {
    webConsole.println('請選擇一名玩家查驗:', 'text-blue');
    
    const alivePlayers = this.players.filter(p => p.isAlive && p.id !== player.id);
    const choices = alivePlayers.map(p => `${p.id}: ${p.name}`);
    
    const index = await this.readlineSync.keyInSelect(choices, '選擇目標:');
    if (index === -1) {
      webConsole.println('預言家選擇放棄查驗', 'text-gray');
      return;
    }
    
    const targetId = alivePlayers[index].id;
    const targetPlayer = this.players.find(p => p.id === targetId);
    const isWerewolf = targetPlayer.role === this.roles.WEREWOLF;
    
    webConsole.println(`查驗結果: ${targetPlayer.name} 是 ${isWerewolf ? '狼人' : '好人'}`, 'text-blue');
    
    this.state.seerChecks.push({
      day: this.state.day,
      playerName: targetPlayer.name,
      isWerewolf
    });
  }
  
  // 處理AI預言家行動
  async handleAiSeerAction(player, action) {
    const targetPlayer = this.players.find(p => p.id.toString() === action);
    if (targetPlayer) {
      const isWerewolf = targetPlayer.role === this.roles.WEREWOLF;
      this.state.seerChecks.push({
        day: this.state.day,
        playerName: targetPlayer.name,
        isWerewolf
      });
      webConsole.println(`玩家行動完成...`, 'text-gray'); // 不顯示角色身分
    }
  }
  
  // 處理女巫行動
  async handleWitchAction(player) {
    // 解藥
    if (this.state.nightKilled && player.abilities.hasMedicine) {
      webConsole.println(`今晚 ${this.state.nightKilled.name} 被殺了`, 'text-green');
      const useMedicine = await this.readlineSync.keyInYN('要使用解藥救他嗎?');
      
      if (useMedicine) {
        this.state.witchSave = true;
        player.abilities.hasMedicine = false;
        webConsole.println('你使用了解藥', 'text-green');
      }
    }
    
    // 毒藥
    if (player.abilities.hasPoison) {
      const usePoison = await this.readlineSync.keyInYN('要使用毒藥殺人嗎?');
      
      if (usePoison) {
        webConsole.println('請選擇一名玩家毒死:', 'text-magenta');
        
        const alivePlayers = this.players.filter(p => p.isAlive);
        const choices = alivePlayers.map(p => `${p.id}: ${p.name}`);
        
        const index = await this.readlineSync.keyInSelect(choices, '選擇目標:');
        if (index === -1) {
          webConsole.println('女巫選擇放棄使用毒藥', 'text-gray');
          return;
        }
        
        const targetId = alivePlayers[index].id;
        this.state.witchKillTarget = this.players.find(p => p.id === targetId);
        player.abilities.hasPoison = false;
        webConsole.println(`你選擇了 ${this.state.witchKillTarget.name}`, 'text-magenta');
      }
    }
  }
  
  // 處理AI女巫行動
  async handleAiWitchAction(player, action) {
    if (this.state.nightKilled && player.abilities.hasMedicine && action === 'yes') {
      this.state.witchSave = true;
      player.abilities.hasMedicine = false;
      webConsole.println(`玩家使用了特殊能力...`, 'text-gray'); // 不顯示角色身分
    } else if (action !== 'no' && player.abilities.hasPoison) {
      this.state.witchKillTarget = this.players.find(p => p.id.toString() === action);
      player.abilities.hasPoison = false;
      webConsole.println(`玩家使用了特殊能力...`, 'text-gray'); // 不顯示角色身分
    }
  }
  
  // 處理守衛行動
  async handleGuardAction(player) {
    webConsole.println('請選擇一名玩家保護:', 'text-cyan');
    
    // 守衛不能連續兩晚保護同一個人
    const lastProtected = player.abilities.lastProtected;
    const alivePlayers = this.players.filter(p => p.isAlive && p.id !== lastProtected);
    
    if (lastProtected) {
      webConsole.println(`上一晚你保護了 ${this.players.find(p => p.id === lastProtected).name}`, 'text-cyan');
    }
    
    const choices = alivePlayers.map(p => `${p.id}: ${p.name}`);
    
    const index = await this.readlineSync.keyInSelect(choices, '選擇目標:');
    if (index === -1) {
      webConsole.println('守衛選擇放棄保護', 'text-gray');
      return;
    }
    
    const targetId = alivePlayers[index].id;
    this.state.guardTarget = this.players.find(p => p.id === targetId);
    player.abilities.lastProtected = targetId;
    webConsole.println(`你選擇保護 ${this.state.guardTarget.name}`, 'text-cyan');
  }
  
  // 處理AI守衛行動
  async handleAiGuardAction(player, action) {
    this.state.guardTarget = this.players.find(p => p.id.toString() === action);
    if (this.state.guardTarget) {
      player.abilities.lastProtected = this.state.guardTarget.id;
      webConsole.println(`守衛保護了一名玩家...`, 'text-cyan');
    }
  }
  
  // 處理夜晚結果
  resolveNightActions() {
    // 沒有狼人目標，直接返回
    if (!this.state.werewolfTarget) {
      webConsole.println('\n今晚平安夜，沒有人被殺', 'text-yellow');
      return;
    }
    
    this.state.nightKilled = this.state.werewolfTarget;
    
    // 判斷守衛是否保護了目標
    if (this.state.guardTarget && this.state.guardTarget.id === this.state.werewolfTarget.id) {
      this.state.nightKilled = null;
      webConsole.println('\n今晚平安夜，沒有人被殺', 'text-yellow');
      return;
    }
    
    // 判斷女巫是否救人
    if (this.state.witchSave) {
      this.state.nightKilled = null;
      webConsole.println('\n今晚平安夜，沒有人被殺', 'text-yellow');
    } else {
      this.state.werewolfTarget.isAlive = false;
      webConsole.println(`\n今晚 ${this.state.werewolfTarget.name} 被狼人殺死了`, 'text-red');
      this.updateUI();
    }
    
    // 判斷女巫是否毒人
    if (this.state.witchKillTarget) {
      this.state.witchKillTarget.isAlive = false;
      webConsole.println(`今晚 ${this.state.witchKillTarget.name} 被毒死了`, 'text-magenta');
      this.updateUI();
    }
    
    // 清除夜晚狀態
    this.clearNightState();
  }
  
  // 清除夜晚狀態
  clearNightState() {
    this.state.werewolfTarget = null;
    this.state.guardTarget = null;
    this.state.witchSave = false;
    this.state.witchKillTarget = null;
    // 清空狼人投票
    this.state.werewolfVotes = {};
  }
  
  // 處理白天討論階段
  async handleDayDiscussionPhase() {
    webConsole.println(`\n=== 第 ${this.state.day} 天白天 ===`, 'text-yellow');
    webConsole.println('討論開始，請各位玩家發表意見\n', 'text-yellow');
    
    // 清空當天討論紀錄
    this.state.dayDiscussions = [];
    
    // 存活的玩家按順序發言
    const alivePlayers = this.players.filter(p => p.isAlive);
    
    for (const player of alivePlayers) {
      if (player.isHuman) {
        // 人類玩家發言
        const discussion = await this.readlineSync.question(webChalk.green(`${player.name}，請發表你的看法: `));
        this.state.dayDiscussions.push({
          day: this.state.day,
          playerId: player.id,
          playerName: player.name,
          content: discussion
        });
      } else {
        // AI玩家發言 - 不顯示角色信息
        webConsole.println(`AI玩家 ${player.name} 正在思考...`, 'text-yellow');
        const discussion = await this.simulateAiDiscussion(player);
        
        webConsole.println(`${player.name}: ${discussion}`, 'text-cyan');
        
        this.state.dayDiscussions.push({
          day: this.state.day,
          playerId: player.id,
          playerName: player.name,
          content: discussion
        });
        
        // 給人類玩家時間閱讀
        await this.delay(1000);
      }
    }
    
    webConsole.println('\n討論結束，進入投票階段', 'text-yellow');
    this.state.phase = this.gamePhases.VOTING;
    this.updateUI();
  }
  
  // 處理投票階段
  async handleVotingPhase() {
    webConsole.println(`\n=== 第 ${this.state.day} 天投票 ===`, 'text-magenta');
    
    // 清空投票紀錄
    this.state.votes = {};
    
    // 存活的玩家進行投票
    const alivePlayers = this.players.filter(p => p.isAlive);
    
    for (const player of alivePlayers) {
      if (player.isHuman) {
        // 人類玩家投票
        await this.handleHumanVote(player);
      } else {
        // AI玩家投票
        await this.handleAiVote(player);
      }
    }
    
    // 統計投票結果
    const voteResult = this.countVotes();
    
    return voteResult;
  }
  
  // 處理人類玩家投票
  async handleHumanVote(player) {
    webConsole.println('\n請選擇一名玩家投票:', 'text-green');
    
    const alivePlayers = this.players.filter(p => p.isAlive && p.id !== player.id);
    const choices = alivePlayers.map(p => `${p.id}: ${p.name}`);
    
    const index = await this.readlineSync.keyInSelect(choices, '投票給:');
    if (index === -1) {
      webConsole.println('你選擇了棄權', 'text-gray');
      this.state.votes[player.id] = null;
      return;
    }
    
    const targetId = alivePlayers[index].id;
    this.state.votes[player.id] = targetId;
    webConsole.println(`你投票給了 ${this.players.find(p => p.id === targetId).name}`, 'text-green');
  }
  
  // 處理AI玩家投票
  async handleAiVote(player) {
    webConsole.println(`${player.name} 正在投票...`, 'text-yellow');
    
    const vote = await this.simulateAiVote(player);
    if (vote) {
      const targetId = parseInt(vote);
      this.state.votes[player.id] = targetId;
      webConsole.println(`${player.name} 投票給了 ${this.players.find(p => p.id === targetId).name}`, 'text-cyan');
    } else {
      webConsole.println(`${player.name} 選擇了棄權`, 'text-gray');
      this.state.votes[player.id] = null;
    }
  }
  
  // 統計投票結果
  countVotes() {
    // 計算每個玩家獲得的票數
    const voteCounts = {};
    
    for (const [voterId, targetId] of Object.entries(this.state.votes)) {
      if (targetId !== null) {
        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
      }
    }
    
    // 找出票數最多的玩家
    let maxVotes = 0;
    let maxVotedPlayers = [];
    
    for (const [playerId, votes] of Object.entries(voteCounts)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        maxVotedPlayers = [parseInt(playerId)];
      } else if (votes === maxVotes) {
        maxVotedPlayers.push(parseInt(playerId));
      }
    }
    
    // 如果只有一個人票數最多，則被處決
    if (maxVotedPlayers.length === 1 && maxVotes > 0) {
      const player = this.players.find(p => p.id === maxVotedPlayers[0]);
      return { player, votes: maxVotes };
    }
    
    // 平局或沒有人獲得票
    return null;
  }
  
  // 處理投票結果
  async handleVoteResult(voteResult) {
    if (voteResult) {
      voteResult.player.isAlive = false;
      webConsole.println(`${voteResult.player.name} 被投票出局`, 'text-red');
      this.updateUI();
      
      // 獵人技能判斷
      if (voteResult.player.role === this.roles.HUNTER && voteResult.player.abilities.canShoot) {
        await this.handleHunterAbility(voteResult.player);
      }
    } else {
      webConsole.println('投票平局，沒有人被處決', 'text-yellow');
    }
  }
  
  // 處理獵人技能
  async handleHunterAbility(hunter) {
    // 不顯示角色信息，只顯示玩家名稱
    webConsole.println(`\n${hunter.name} 被處決，他可以開槍帶走一名玩家`, 'text-red');
    
    if (hunter.isHuman) {
      // 人類獵人
      webConsole.println('請選擇一名玩家帶走:', 'text-green');
      
      const alivePlayers = this.players.filter(p => p.isAlive);
      const choices = alivePlayers.map(p => `${p.id}: ${p.name}`);
      
      const index = await this.readlineSync.keyInSelect(choices, '選擇目標:');
      if (index === -1) {
        webConsole.println('選擇放棄開槍', 'text-gray');
        return;
      }
      
      const targetId = alivePlayers[index].id;
      const targetPlayer = this.players.find(p => p.id === targetId);
      targetPlayer.isAlive = false;
      webConsole.println(`${hunter.name} 帶走了 ${targetPlayer.name}`, 'text-red');
      this.updateUI();
    } else {
      // AI獵人
      webConsole.println(`${hunter.name} 正在思考...`, 'text-yellow');
      
      // 隨機選擇一名存活玩家
      const alivePlayers = this.players.filter(p => p.isAlive);
      const targetId = await this.simulateAiHunterAction(hunter);
      
      if (targetId) {
        const targetPlayer = this.players.find(p => p.id.toString() === targetId);
        if (targetPlayer) {
          targetPlayer.isAlive = false;
          webConsole.println(`${hunter.name} 帶走了 ${targetPlayer.name}`, 'text-red');
          this.updateUI();
        }
      }
    }
  }
  
  // 處理遊戲結束
  handleGameOver() {
    webConsole.println('\n=== 遊戲結束 ===', 'text-cyan');
    
    // 判斷獲勝陣營
    const werewolves = this.getAlivePlayersByRole(this.roles.WEREWOLF);
    const villagers = this.getAliveVillagers();
    
    if (werewolves.length === 0) {
      webConsole.println('好人陣營勝利！所有狼人都被處決了', 'text-green');
    } else if (werewolves.length >= villagers.length) {
      webConsole.println('狼人陣營勝利！狼人數量已經大於或等於好人數量', 'text-red');
    }
    
    // 顯示所有玩家的身份
    webConsole.println('\n所有玩家身份:', 'text-yellow');
    this.players.forEach(player => {
      const status = player.isAlive ? 'text-green' : 'text-red';
      const statusText = player.isAlive ? '存活' : '死亡';
      webConsole.println(`${player.name}: ${player.role} (${statusText})`, status);
    });
    
    // 顯示重新開始遊戲的訊息
    webConsole.println('\n按下F5重新載入頁面以開始新的遊戲');
  }
  
  // 更新UI
  updateUI() {
    // 更新玩家列表
    this.updatePlayersList();
    
    // 更新遊戲狀態
    this.dayCounterElement.textContent = this.state.day;
    this.gamePhaseElement.textContent = this.state.phase;
  }
  
  // 更新玩家列表UI
  updatePlayersList() {
    this.playersListElement.innerHTML = '';
    
    this.players.forEach(player => {
      const playerItem = document.createElement('li');
      
      if (player.isHuman) {
        playerItem.classList.add('human-player');
      }
      
      if (!player.isAlive) {
        playerItem.classList.add('dead');
      } else {
        playerItem.classList.add('alive');
      }
      
      // 對於人類玩家，顯示自己的角色
      const roleInfo = player.isHuman ? ` (${player.role})` : '';
      playerItem.textContent = `${player.name}${roleInfo} ${player.isAlive ? '👤' : '💀'}`;
      
      this.playersListElement.appendChild(playerItem);
    });
  }
  
  // 呼叫 LLM API
  async callLlmApi(prompt, role) {
    webConsole.println(`AI 正在思考...`, 'text-yellow');
    
    // 只在 Chrome 控制台顯示提示詞
    console.log('=== LLM 提示詞 ===');
    console.log(prompt);
    
    try {
      // 使用 apiManager 呼叫 API
      const response = await apiManager.getResponse(prompt);
      
      if (response.error) {
        console.error('API 呼叫錯誤:', response.error);
        webConsole.println(`AI 回應錯誤: ${response.error}`, 'text-red');
        return null;
      }
      
      // 取得回應內容
      const answer = response.response || response;
      
      // 只在 Chrome 控制台顯示回應
      console.log('=== LLM 回應 ===');
      console.log(answer);
      
      return answer;
    } catch (error) {
      console.error('API 呼叫異常:', error);
      return null;
    }
  }
  
  // 獲取角色決策
  async getLlmDecision(prompt, options) {
    const response = await this.callLlmApi(prompt);
    if (!response) return null;
    
    // 尋找回應中的選項
    const normalizedResponse = response.toLowerCase().trim();
    
    for (const option of options) {
      const normalizedOption = String(option).toLowerCase();
      if (normalizedResponse.includes(normalizedOption)) {
        return option;
      }
    }
    
    // 如果沒有找到匹配項，隨機選擇一個選項
    console.log(`LLM 回應 "${response}" 未匹配任何可用選項，隨機選擇一個選項`);
    return options[Math.floor(Math.random() * options.length)];
  }
  
  // 模擬AI行動
  async simulateAiAction(player) {
    // 嘗試使用 LLM 來做決策，如果失敗則使用隨機決策
    try {
      // 根據角色生成提示詞
      let prompt = '';
      let options = [];
      
      switch (player.role) {
        case this.roles.WEREWOLF:
          // 狼人提示詞
          prompt = `你是遊戲中的狼人，你的目標是殺死所有好人。
目前存活玩家: ${this.players.filter(p => p.isAlive).map(p => `${p.id}:${p.name}`).join(', ')}
請選擇一名非狼人的玩家殺死。只需回答玩家ID。`;
          
          // 可選目標 - 非狼人的存活玩家
          options = this.players
            .filter(p => p.isAlive && p.role !== this.roles.WEREWOLF)
            .map(p => p.id.toString());
          break;
          
        case this.roles.SEER:
          // 預言家提示詞
          prompt = `你是遊戲中的預言家，你的目標是找出所有狼人。
目前存活玩家: ${this.players.filter(p => p.isAlive).map(p => `${p.id}:${p.name}`).join(', ')}
請選擇一名玩家查驗他的身份。只需回答玩家ID。`;
          
          // 可選目標 - 非自己的存活玩家
          options = this.players
            .filter(p => p.isAlive && p.id !== player.id)
            .map(p => p.id.toString());
          break;
          
        case this.roles.WITCH:
          if (this.state.nightKilled && player.abilities.hasMedicine) {
            // 女巫救人提示詞
            prompt = `你是遊戲中的女巫，你有一瓶解藥。
今晚 ${this.state.nightKilled.name} 被狼人殺死了。
你要使用解藥救他嗎？只需回答「yes」或「no」。`;
            
            options = ['yes', 'no'];
          } else if (player.abilities.hasPoison) {
            // 女巫毒人提示詞
            prompt = `你是遊戲中的女巫，你有一瓶毒藥。
目前存活玩家: ${this.players.filter(p => p.isAlive).map(p => `${p.id}:${p.name}`).join(', ')}
你要使用毒藥殺死某個玩家嗎？如果要，請回答玩家ID；如果不要，請回答「no」。`;
            
            // 可選目標 - 所有存活玩家加上「no」選項
            options = this.players
              .filter(p => p.isAlive)
              .map(p => p.id.toString())
              .concat(['no']);
          }
          break;
          
        case this.roles.GUARD:
          // 守衛提示詞
          prompt = `你是遊戲中的守衛，你的目標是保護好人不被狼人殺死。
目前存活玩家: ${this.players.filter(p => p.isAlive).map(p => `${p.id}:${p.name}`).join(', ')}`;
          
          // 如果有上次守護的玩家，添加到提示詞中
          if (player.abilities.lastProtected) {
            const lastProtectedPlayer = this.players.find(p => p.id === player.abilities.lastProtected);
            prompt += `\n上一晚你保護了 ${lastProtectedPlayer.name}，守衛不能連續兩晚保護同一個人。`;
          }
          
          prompt += `\n請選擇一名玩家進行保護。只需回答玩家ID。`;
          
          // 可選目標 - 非上一次保護的存活玩家
          options = this.players
            .filter(p => p.isAlive && p.id !== player.abilities.lastProtected)
            .map(p => p.id.toString());
          break;
      }
      
      // 如果有提示詞和選項，則嘗試獲取 LLM 決策
      if (prompt && options.length > 0) {
        const decision = await this.getLlmDecision(prompt, options);
        if (decision) return decision;
      }
    } catch (error) {
      console.error('AI 決策錯誤:', error);
    }
    
    // 如果 LLM 決策失敗，使用原來的隨機決策邏輯
    // 此版本簡化為隨機行動
    switch (player.role) {
      case this.roles.WEREWOLF:
        // 隨機選擇一名非狼人的存活玩家
        const werewolfTargets = this.players.filter(p => p.isAlive && p.role !== this.roles.WEREWOLF);
        if (werewolfTargets.length > 0) {
          const randomTarget = werewolfTargets[Math.floor(Math.random() * werewolfTargets.length)];
          return randomTarget.id.toString();
        }
        break;
        
      case this.roles.SEER:
        // 隨機選擇一名非自己的存活玩家
        const seerTargets = this.players.filter(p => p.isAlive && p.id !== player.id);
        if (seerTargets.length > 0) {
          const randomTarget = seerTargets[Math.floor(Math.random() * seerTargets.length)];
          return randomTarget.id.toString();
        }
        break;
        
      case this.roles.WITCH:
        if (this.state.nightKilled && player.abilities.hasMedicine) {
          // 50%機率使用解藥
          return Math.random() < 0.5 ? 'yes' : 'no';
        } else if (player.abilities.hasPoison) {
          // 30%機率使用毒藥
          if (Math.random() < 0.3) {
            const witchTargets = this.players.filter(p => p.isAlive && p.id !== player.id);
            if (witchTargets.length > 0) {
              const randomTarget = witchTargets[Math.floor(Math.random() * witchTargets.length)];
              return randomTarget.id.toString();
            }
          }
          return 'no';
        }
        break;
        
      case this.roles.GUARD:
        // 隨機選擇一名非上一次保護的存活玩家
        const guardTargets = this.players.filter(p => p.isAlive && p.id !== player.abilities.lastProtected);
        if (guardTargets.length > 0) {
          const randomTarget = guardTargets[Math.floor(Math.random() * guardTargets.length)];
          return randomTarget.id.toString();
        }
        break;
    }
    
    return null;
  }
  
  // 模擬AI討論
  async simulateAiDiscussion(player) {
    try {
      // 嘗試使用 LLM API 來生成討論內容
      let prompt = '';
      
      // 建立遊戲當前狀態的描述
      const alivePlayersInfo = this.players
        .filter(p => p.isAlive)
        .map(p => `${p.id}:${p.name}`)
        .join(', ');
      
      const dayCount = this.state.day;
      const deadPlayersToday = this.players
        .filter(p => !p.isAlive && !p.deathDay && (p.deathDay === this.state.day))
        .map(p => p.name)
        .join(', ');
      
      // 獲取最近的討論記錄（最多取最近 5 條，以避免提示詞太長）
      const recentDiscussions = this.getRecentDiscussions(5);
      const discussionHistory = recentDiscussions.length > 0 
        ? `\n最近的討論內容：\n${recentDiscussions.map(d => `${d.playerName}: ${d.content}`).join('\n')}` 
        : '';
      
      // 整理當前玩家的查驗歷史（只對預言家有用）
      const playerChecks = player.role === this.roles.SEER 
        ? this.state.seerChecks.filter(check => check.day < this.state.day) 
        : [];
      const checkHistory = playerChecks.length > 0 
        ? `\n你的查驗結果：\n${playerChecks.map(check => `第 ${check.day} 天查驗 ${check.playerName} 是${check.isWerewolf ? '狼人' : '好人'}`).join('\n')}`
        : '';
      
      // 根據角色生成不同的提示詞
      if (player.role === this.roles.WEREWOLF) {
        prompt = `你是狼人殺遊戲中的狼人玩家 ${player.name}。現在是第 ${dayCount} 天的白天討論階段。
遊戲狀態：
- 存活玩家: ${alivePlayersInfo}
- ${deadPlayersToday ? `今天被殺的玩家: ${deadPlayersToday}` : '今天沒有玩家被殺'}
${discussionHistory}

作為狼人，你的目標是隱藏身份並混淆視聽。請根據上述討論情況，給出你的討論發言，內容需要讓其他玩家相信你是好人。
可以針對其他玩家的發言做出回應，表達自己的看法。如果有人對你提出質疑，請適當為自己辯護。
發言需要簡短（40-60字），要聽起來自然且不要明顯表露你是狼人。`;
      } else if (player.role === this.roles.SEER) {
        prompt = `你是狼人殺遊戲中的預言家玩家 ${player.name}。現在是第 ${dayCount} 天的白天討論階段。
遊戲狀態：
- 存活玩家: ${alivePlayersInfo}
- ${deadPlayersToday ? `今天被殺的玩家: ${deadPlayersToday}` : '今天沒有玩家被殺'}
${checkHistory}
${discussionHistory}

作為預言家，你的目標是幫助村民找出狼人，但同時也要保護自己不被狼人發現。請根據上述討論和你的查驗結果，給出你的討論發言。
可以針對其他玩家的發言做出回應，特別是關注可疑的發言。
發言需要簡短（40-60字），可以提供一些資訊但不要過於明顯地暴露自己是預言家，除非你認為現在是時候站出來指認狼人。`;
      } else if (player.role === this.roles.WITCH) {
        prompt = `你是狼人殺遊戲中的女巫玩家 ${player.name}。現在是第 ${dayCount} 天的白天討論階段。
遊戲狀態：
- 存活玩家: ${alivePlayersInfo}
- ${deadPlayersToday ? `今天被殺的玩家: ${deadPlayersToday}` : '今天沒有玩家被殺'}
- 你${player.abilities.hasMedicine ? '還有' : '已經用掉'}解藥。
- 你${player.abilities.hasPoison ? '還有' : '已經用掉'}毒藥。
${discussionHistory}

作為女巫，你可以救人或毒人。請根據上述討論情況，給出你的討論發言，幫助村民找出狼人，但也要謹慎保護自己。
可以針對其他玩家的發言做出回應，尤其是對可疑玩家表達懷疑。
發言需要簡短（40-60字），內容要自然不要明顯表露你是女巫。`;
      } else if (player.role === this.roles.HUNTER) {
        prompt = `你是狼人殺遊戲中的獵人玩家 ${player.name}。現在是第 ${dayCount} 天的白天討論階段。
遊戲狀態：
- 存活玩家: ${alivePlayersInfo}
- ${deadPlayersToday ? `今天被殺的玩家: ${deadPlayersToday}` : '今天沒有玩家被殺'}
${discussionHistory}

作為獵人，你死亡時可以帶走一名玩家。請根據上述討論情況，給出你的討論發言，幫助村民找出狼人，但也要謹慎保護自己。
可以針對其他玩家的發言做出回應，分析誰可能是狼人。
發言需要簡短（40-60字），內容要自然不要明顯表露你是獵人。`;
      } else if (player.role === this.roles.GUARD) {
        prompt = `你是狼人殺遊戲中的守衛玩家 ${player.name}。現在是第 ${dayCount} 天的白天討論階段。
遊戲狀態：
- 存活玩家: ${alivePlayersInfo}
- ${deadPlayersToday ? `今天被殺的玩家: ${deadPlayersToday}` : '今天沒有玩家被殺'}
${discussionHistory}

作為守衛，你每晚可以保護一名玩家不被狼人殺死。請根據上述討論情況，給出你的討論發言，幫助村民找出狼人，但也要謹慎保護自己。
可以針對其他玩家的發言做出回應，特別是分析哪些人值得保護或懷疑。
發言需要簡短（40-60字），內容要自然不要明顯表露你是守衛。`;
      } else {
        prompt = `你是狼人殺遊戲中的村民玩家 ${player.name}。現在是第 ${dayCount} 天的白天討論階段。
遊戲狀態：
- 存活玩家: ${alivePlayersInfo}
- ${deadPlayersToday ? `今天被殺的玩家: ${deadPlayersToday}` : '今天沒有玩家被殺'}
${discussionHistory}

作為村民，你的目標是找出狼人。請根據上述討論情況，給出你的討論發言，分析遊戲中的線索，表達你的懷疑。
可以針對其他玩家的發言做出回應，說出你認為哪些人可能是狼人，哪些人應該是好人。
發言需要簡短（40-60字），內容要自然且符合村民的角色。`;
      }
      
      // 呼叫 API 取得回應
      const response = await this.callLlmApi(prompt);
      if (response) {
        return response;
      }
    } catch (error) {
      console.error('AI 討論生成錯誤:', error);
    }
    
    // 如果 API 呼叫失敗，使用原本的預設短句作為備用方案
    console.log('API 呼叫失敗，使用預設短句...');
    
    // 根據角色生成不同的對話內容
    const phrases = [
      '我覺得這局遊戲很難猜測誰是狼人。',
      '昨晚有人被殺了，我覺得可能是狼人的陷阱。',
      '我認為應該仔細觀察每個人的發言。',
      '前幾輪的線索很重要，大家要記得之前的討論。',
      '這次投票要謹慎，不要隨便投錯人。',
      '如果有預言家，希望能提供一些資訊。',
      '昨晚的結果很奇怪，我懷疑有人在說謊。',
      '大家要相信自己的直覺，狼人往往會有破綻。',
      '我覺得我們應該信任彼此，一起找出狼人。',
      '請大家冷靜分析，不要被情緒左右。'
    ];
    
    if (player.role === this.roles.WEREWOLF) {
      // 狼人會試圖混淆視聽
      const wolfPhrases = [
        '我認為我們應該懷疑那些太安靜的人。',
        '如果有人一直指責別人，可能他才是狼人。',
        '我是好人，我可以保證。',
        '我們應該相信預言家，但要注意可能有人假扮預言家。',
        '昨晚的死亡很明顯是狼人想要混淆視聽。'
      ];
      phrases.push(...wolfPhrases);
    } else if (player.role === this.roles.SEER) {
      // 預言家會試圖提供資訊但不會太明顯
      const seerPhrases = [
        '我有一些線索，但現在說出來可能不太安全。',
        '我觀察了一些人，感覺有幾個人很可疑。',
        '根據我的觀察，我懷疑某些人可能不是好人。',
        '請大家相信我，我有重要的資訊。',
        '我們需要更多的資訊才能確定誰是狼人。'
      ];
      phrases.push(...seerPhrases);
    }
    
    // 隨機選擇一個對話
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
  
  // 模擬AI投票
  async simulateAiVote(player) {
    // 獲取可投票的目標（除了自己）
    const voteTargets = this.players.filter(p => p.isAlive && p.id !== player.id);
    
    if (voteTargets.length === 0) return null;
    
    // 狼人不會投票給其他狼人
    if (player.role === this.roles.WEREWOLF) {
      const nonWerewolves = voteTargets.filter(p => p.role !== this.roles.WEREWOLF);
      if (nonWerewolves.length > 0) {
        const target = nonWerewolves[Math.floor(Math.random() * nonWerewolves.length)];
        return target.id.toString();
      }
    }
    
    // 隨機選擇一個目標
    const target = voteTargets[Math.floor(Math.random() * voteTargets.length)];
    return target.id.toString();
  }
  
  // 模擬AI獵人行動
  async simulateAiHunterAction(hunter) {
    const alivePlayers = this.players.filter(p => p.isAlive);
    
    if (alivePlayers.length === 0) return null;
    
    // 狼人獵人會優先射殺非狼人
    if (hunter.role === this.roles.WEREWOLF) {
      const nonWerewolves = alivePlayers.filter(p => p.role !== this.roles.WEREWOLF);
      if (nonWerewolves.length > 0) {
        const target = nonWerewolves[Math.floor(Math.random() * nonWerewolves.length)];
        return target.id.toString();
      }
    } else {
      // 好人獵人會嘗試射殺狼人，但這裡我們假設他不知道誰是狼人
      const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      return target.id.toString();
    }
    
    return null;
  }
  
  // 建立新玩家
  createPlayer(id, name, isHuman) {
    return {
      id,
      name: name || this.generatePlayerName(),
      role: null,
      isAlive: true,
      isHuman,
      abilities: {}
    };
  }
  
  // 生成玩家名字
  generatePlayerName() {
    const names = [
      '小明', '小華', '小芳', '小雲', '小龍', 
      '大壯', '大勇', '大慧', '大力', '大山',
      '阿強', '阿慧', '阿杰', '阿明', '阿麗',
      '子涵', '子軒', '子萱', '子翔', '子豪',
      'Alex', 'Ben', 'Charlie', 'David', 'Eric',
      'Frank', 'George', 'Henry', 'Ian', 'Jack',
      '大老虎', '小兔子', '笑笑生', '開心果', '暴走族',
      '天線寶寶', '麻辣燙', '雲朵兒', '小可愛', '大聰明'
    ];
    
    return names[Math.floor(Math.random() * names.length)];
  }
  
  // 工具函數：打亂數組
  shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
  
  // 獲取人類玩家
  getHumanPlayer() {
    return this.players.find(p => p.isHuman);
  }
  
  // 獲取存活的特定角色玩家
  getAlivePlayersByRole(role) {
    return this.players.filter(p => p.isAlive && p.role === role);
  }
  
  // 獲取存活的好人玩家
  getAliveVillagers() {
    return this.players.filter(p => p.isAlive && p.role !== this.roles.WEREWOLF);
  }
  
  // 獲取最近的討論記錄
  getRecentDiscussions(count = 5) {
    // 只獲取當天的討論
    const currentDayDiscussions = this.state.dayDiscussions.filter(d => d.day === this.state.day);
    
    // 取最近的 N 條討論記錄
    return currentDayDiscussions.slice(-count);
  }
  
  // 檢查遊戲是否結束
  isGameOver() {
    // 判斷狼人是否全部死亡
    const werewolves = this.getAlivePlayersByRole(this.roles.WEREWOLF);
    if (werewolves.length === 0) {
      return true;
    }
    
    // 判斷狼人數量是否大於或等於好人數量
    // 但是至少要進行一個完整的晝夜循環（即至少到第一天投票結束後）
    if (this.state.day >= 1 && this.state.phase === this.gamePhases.NIGHT) {
      const villagers = this.getAliveVillagers();
      if (werewolves.length >= villagers.length) {
        return true;
      }
    }
    
    return false;
  }
  
  // 工具函數：延遲
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 啟動遊戲
document.addEventListener('DOMContentLoaded', async () => {
  const game = new WebGame();
  await game.startGame();
});
