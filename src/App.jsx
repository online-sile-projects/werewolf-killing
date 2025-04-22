import { useState } from 'react'
import './App.css'
import MyTemplate from './template/index.js'

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">專案模板</h1>
      <p className="mb-4">這是一個簡單的專案模板，可在 Chrome 控制台中互動</p>
      <p className="text-lg">請按 F12 或右鍵選擇「檢查」開啟開發者工具</p>
      <p className="text-lg">然後切換到「控制台」標籤開始使用</p>
      <div className="mt-8 p-4 bg-gray-200 rounded-lg">
        <h2 className="text-xl font-bold mb-2">基本指令：</h2>
        <pre className="font-mono bg-gray-800 text-green-400 p-4 rounded">
          MyTemplate.sayHello()     // 顯示問候語
          MyTemplate.currentTime()  // 顯示目前時間
          MyTemplate.help()         // 顯示說明
        </pre>
      </div>
    </div>
  )
}

export default App
