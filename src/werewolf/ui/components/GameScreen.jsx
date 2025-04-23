import { useState } from 'react';
import '../styles/GameScreen.css';
import PlayerList from './PlayerList';
import GameLog from './GameLog';
import InputPanel from './InputPanel';
import PhaseIndicator from './PhaseIndicator';

/**
 * 遊戲主畫面元件
 * 顯示遊戲進行中的所有必要元素
 */
function GameScreen({ gameState, onSubmitAnswer, onShowSettings, onHideSettings }) {
  // 設定狀態
  const [showLog, setShowLog] = useState(true);
  
  // 處理回答提交
  const handleAnswerSubmit = (answer) => {
    onSubmitAnswer(answer);
  };

  return (
    <div className="game-screen">
      {/* 頂部區域：階段指示和遊戲狀態 */}
      <div className="game-header">
        <PhaseIndicator phase={gameState.gamePhase} day={gameState.day} />
        
        <div className="game-controls">
          <button className="settings-btn" onClick={onShowSettings}>
            設定
          </button>
          <button 
            className="toggle-log-btn" 
            onClick={() => setShowLog(!showLog)}
          >
            {showLog ? '隱藏記錄' : '顯示記錄'}
          </button>
        </div>
      </div>

      {/* 主要遊戲區域 */}
      <div className="game-main">
        {/* 左側：玩家列表 */}
        <div className="game-sidebar">
          <PlayerList players={gameState.players} />
        </div>
        
        {/* 中間：主要遊戲內容 */}
        <div className="game-content">
          {/* 遊戲記錄 */}
          {showLog && (
            <GameLog messages={gameState.messages} />
          )}
          
          {/* 輸入區域 */}
          <InputPanel 
            question={gameState.currentQuestion}
            options={gameState.currentOptions}
            isWaiting={gameState.isWaitingForInput}
            onSubmit={handleAnswerSubmit}
          />
        </div>
      </div>

      {/* 設定面板（如果顯示） */}
      {gameState.showSettings && (
        <div className="settings-overlay">
          <div className="settings-panel">
            <h2>遊戲設定</h2>
            <div className="settings-content">
              <div className="setting-item">
                <p><strong>玩家名稱：</strong> {gameState.playerName}</p>
                <p><strong>總玩家數：</strong> {gameState.playerCount}</p>
                <p><strong>AI 功能：</strong> {gameState.useAI ? '已啟用' : '已停用'}</p>
              </div>
              
              <div className="setting-item">
                <h3>快速說明</h3>
                <ul>
                  <li>白天討論階段：所有玩家輪流發言</li>
                  <li>投票階段：選擇要驅逐的玩家</li>
                  <li>夜晚階段：各角色依順序執行特殊能力</li>
                </ul>
              </div>
            </div>
            <button onClick={onHideSettings} className="close-settings-btn">
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameScreen;
