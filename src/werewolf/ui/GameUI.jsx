import { useState, useEffect } from 'react';
import './styles/GameUI.css';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import { createGameManager } from './GameManager';

/**
 * 狼人殺遊戲使用者介面主元件
 * 負責協調不同的遊戲畫面和管理遊戲狀態
 */
function GameUI() {
  // 遊戲狀態
  const [gameState, setGameState] = useState({
    isStarted: false,             // 遊戲是否已開始
    currentScreen: 'start',       // 目前畫面 ('start', 'game', 'end')
    playerCount: 8,               // 預設玩家數量
    playerName: '',               // 玩家名稱
    useAI: false,                 // 是否使用 AI
    gamePhase: null,              // 遊戲階段
    day: 0,                       // 天數
    players: [],                  // 玩家列表
    messages: [],                 // 遊戲訊息
    showSettings: false,          // 是否顯示設定
    isWaitingForInput: false,     // 是否等待輸入
    currentQuestion: '',          // 目前問題
    currentOptions: []            // 目前選項
  });

  // 初始化遊戲管理器
  const [gameManager, setGameManager] = useState(null);

  // 初始化
  useEffect(() => {
    // 當元件掛載時建立遊戲管理器
    const manager = createGameManager({
      onStateChange: handleGameStateChange,
      onQuestion: handleGameQuestion,
      onOptions: handleGameOptions,
      onGameMessage: handleGameMessage,
      onGameEnd: handleGameEnd
    });

    setGameManager(manager);

    // 清理函式
    return () => {
      // 如果需要清理遊戲資源
      if (manager) {
        manager.cleanup();
      }
    };
  }, []);

  // 處理遊戲狀態變化
  const handleGameStateChange = (newState) => {
    setGameState(prevState => ({
      ...prevState,
      ...newState
    }));
  };

  // 處理遊戲問題
  const handleGameQuestion = (question) => {
    setGameState(prevState => ({
      ...prevState,
      isWaitingForInput: true,
      currentQuestion: question,
      currentOptions: []
    }));
  };

  // 處理遊戲選項
  const handleGameOptions = (question, options) => {
    setGameState(prevState => ({
      ...prevState,
      isWaitingForInput: true,
      currentQuestion: question,
      currentOptions: options
    }));
  };

  // 處理遊戲訊息
  const handleGameMessage = (message, type = 'info') => {
    setGameState(prevState => ({
      ...prevState,
      messages: [...prevState.messages, { text: message, type, timestamp: Date.now() }]
    }));
  };

  // 處理遊戲結束
  const handleGameEnd = (result) => {
    setGameState(prevState => ({
      ...prevState,
      isStarted: false,
      currentScreen: 'end',
      gameResult: result
    }));
  };

  // 開始遊戲
  const handleStartGame = (settings) => {
    if (!gameManager) return;

    // 更新設定
    setGameState(prevState => ({
      ...prevState,
      playerName: settings.playerName,
      playerCount: settings.playerCount,
      useAI: settings.useAI,
      isStarted: true,
      currentScreen: 'game',
      messages: [] // 清空訊息
    }));

    // 通知遊戲管理器開始遊戲
    gameManager.startGame({
      playerName: settings.playerName,
      playerCount: settings.playerCount, 
      useAI: settings.useAI
    });
  };

  // 提交回答
  const handleSubmitAnswer = (answer) => {
    if (!gameManager || !gameState.isWaitingForInput) return;

    // 通知遊戲管理器提交回答
    gameManager.submitAnswer(answer);

    // 更新狀態
    setGameState(prevState => ({
      ...prevState,
      isWaitingForInput: false,
      currentQuestion: '',
      currentOptions: []
    }));
  };

  // 顯示設定
  const handleShowSettings = () => {
    setGameState(prevState => ({
      ...prevState,
      showSettings: true
    }));
  };

  // 隱藏設定
  const handleHideSettings = () => {
    setGameState(prevState => ({
      ...prevState,
      showSettings: false
    }));
  };

  // 返回開始畫面
  const handleBackToStart = () => {
    if (gameManager) {
      gameManager.resetGame();
    }

    setGameState({
      isStarted: false,
      currentScreen: 'start',
      playerCount: 8,
      playerName: gameState.playerName,
      useAI: gameState.useAI,
      gamePhase: null,
      day: 0,
      players: [],
      messages: [],
      showSettings: false,
      isWaitingForInput: false,
      currentQuestion: '',
      currentOptions: []
    });
  };

  // 根據目前畫面渲染不同內容
  return (
    <div className="werewolf-game-ui">
      {gameState.currentScreen === 'start' && (
        <StartScreen 
          onStartGame={handleStartGame}
          defaultPlayerCount={gameState.playerCount}
          defaultPlayerName={gameState.playerName}
          defaultUseAI={gameState.useAI}
        />
      )}

      {gameState.currentScreen === 'game' && (
        <GameScreen 
          gameState={gameState}
          onSubmitAnswer={handleSubmitAnswer}
          onShowSettings={handleShowSettings}
          onHideSettings={handleHideSettings}
        />
      )}

      {gameState.currentScreen === 'end' && (
        <div className="game-end-screen">
          <h2>遊戲結束</h2>
          <p className={gameState.gameResult?.winner === 'village' ? 'winner-village' : 'winner-werewolf'}>
            {gameState.gameResult?.winner === 'village' ? '好人陣營獲勝！' : '狼人陣營獲勝！'}
          </p>
          <button className="back-to-start-btn" onClick={handleBackToStart}>
            返回主畫面
          </button>
        </div>
      )}
    </div>
  );
}

export default GameUI;
