import { useState } from 'react'
import './App.css'
// 引入初始化狼人殺遊戲
import './werewolf/index.js'
// 引入遊戲 UI 元件
import GameUI from './werewolf/ui/GameUI'

function App() {
  // 狀態控制是否顯示舊版控制台提示
  const [showConsoleHint, setShowConsoleHint] = useState(false);
  
  return (
    <div className="app-container">
      {showConsoleHint ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
          <h1 className="text-3xl font-bold mb-4">狼人殺控制台模式</h1>
          <p className="mb-4">這是一個簡單的狼人殺遊戲，可在 Chrome 控制台中互動</p>
          <p className="text-lg">請按 F12 或右鍵選擇「檢查」開啟開發者工具</p>
          <p className="text-lg">然後切換到「控制台」標籤開始使用</p>
          <div className="mt-8 p-4 bg-gray-200 rounded-lg">
            <h2 className="text-xl font-bold mb-2">基本指令：</h2>
            <pre className="font-mono bg-gray-800 text-green-400 p-4 rounded">
              Werewolf.startGame()  // 開始遊戲
              WerewolfApi.testApiConnection()  // 測試 API 連線
              testWerewolf()        // 測試遊戲是否正確載入
            </pre>
          </div>
          <button 
            className="mt-6 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => setShowConsoleHint(false)}
          >
            切換到視覺介面模式
          </button>
        </div>
      ) : (
        <div className="game-ui-container">
          <GameUI />
          <button 
            className="console-mode-btn"
            onClick={() => setShowConsoleHint(true)}
          >
            切換到控制台模式
          </button>
        </div>
      )}
    </div>
  )
}

export default App
