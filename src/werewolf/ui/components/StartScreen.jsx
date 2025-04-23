import { useState } from 'react';
import '../styles/StartScreen.css';

/**
 * 遊戲開始畫面元件
 * 顯示遊戲標題、規則說明和開始遊戲設定
 */
function StartScreen({ onStartGame, defaultPlayerCount = 8, defaultPlayerName = '', defaultUseAI = false, defaultGeminiKey = '' }) {
  // 設定狀態
  const [showRules, setShowRules] = useState(false);
  const [playerCount, setPlayerCount] = useState(defaultPlayerCount);
  const [playerName, setPlayerName] = useState(defaultPlayerName);
  const [useAI, setUseAI] = useState(defaultUseAI);
  const [geminiKey, setGeminiKey] = useState(defaultGeminiKey);

  // 處理遊戲開始
  const handleStartGame = (e) => {
    e.preventDefault();
    
    // 驗證玩家名稱
    if (!playerName.trim()) {
      alert('請輸入您的名字！');
      return;
    }
    
    // 如果啟用 AI 但未提供 Gemini API Key
    if (useAI && !geminiKey.trim()) {
      alert('啟用 AI 功能時，請提供 Gemini API Key！');
      return;
    }
    
    // 傳送設定到父元件
    onStartGame({
      playerCount: playerCount,
      playerName: playerName,
      useAI: useAI,
      geminiKey: geminiKey
    });
  };

  return (
    <div className="start-screen">
      <div className="game-title">
        <h1>狼人殺遊戲</h1>
        <p className="subtitle">網頁版控制台</p>
      </div>

      <div className="start-content">
        <div className="start-menu">
          <form onSubmit={handleStartGame}>
            <div className="form-group">
              <label htmlFor="playerName">玩家名稱</label>
              <input 
                type="text" 
                id="playerName" 
                value={playerName} 
                onChange={e => setPlayerName(e.target.value)}
                placeholder="請輸入您的名字"
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="playerCount">玩家數量</label>
              <select 
                id="playerCount" 
                value={playerCount} 
                onChange={e => setPlayerCount(parseInt(e.target.value))}
              >
                {[4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                  <option key={num} value={num}>{num} 人</option>
                ))}
              </select>
            </div>

            <div className="form-group checkbox">
              <input 
                type="checkbox" 
                id="useAI" 
                checked={useAI} 
                onChange={e => setUseAI(e.target.checked)} 
              />
              <label htmlFor="useAI">啟用 AI 功能</label>
            </div>

            {useAI && (
              <div className="form-group">
                <label htmlFor="geminiKey">Gemini API Key</label>
                <input 
                  type="text" 
                  id="geminiKey" 
                  value={geminiKey} 
                  onChange={e => setGeminiKey(e.target.value)}
                  placeholder="請輸入您的 Gemini API Key"
                />
              </div>
            )}

            <div className="actions">
              <button type="submit" className="start-game-btn">開始遊戲</button>
              <button 
                type="button" 
                className="show-rules-btn" 
                onClick={() => setShowRules(!showRules)}
              >
                {showRules ? '隱藏規則' : '查看規則'}
              </button>
            </div>
          </form>
        </div>

        {showRules && (
          <div className="game-rules">
            <h2>遊戲規則</h2>
            <div className="rules-content">
              <h3>角色介紹</h3>
              <ul>
                <li><strong>狼人：</strong>每晚可選擇一位玩家擊殺</li>
                <li><strong>村民：</strong>沒有特殊能力，但可以參與投票</li>
                <li><strong>預言家：</strong>每晚可查驗一位玩家的身份</li>
                <li><strong>女巫：</strong>有一瓶解藥可救人，有一瓶毒藥可殺人</li>
                <li><strong>獵人：</strong>死亡時可開槍帶走一名玩家</li>
                <li><strong>守衛：</strong>每晚可保護一位玩家，不能連續兩晚保護同一人</li>
              </ul>

              <h3>遊戲流程</h3>
              <ol>
                <li>遊戲開始時，每位玩家獲得一個角色。</li>
                <li>每天包含「夜晚」和「白天」兩個階段。</li>
                <li>夜晚：各角色按順序行動（守衛→狼人→女巫→預言家）。</li>
                <li>白天：公布夜晚死亡情況，存活的玩家進行討論並投票驅逐一名玩家。</li>
                <li>重複上述流程，直到遊戲結束。</li>
              </ol>

              <h3>勝利條件</h3>
              <ul>
                <li><strong>好人陣營：</strong>消滅所有狼人</li>
                <li><strong>狼人陣營：</strong>狼人數量大於或等於好人數量</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StartScreen;
