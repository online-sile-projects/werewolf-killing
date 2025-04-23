import './App.css'
// 引入初始化狼人殺遊戲
import './werewolf/index.js'
// 引入遊戲 UI 元件
import GameUI from './werewolf/ui/GameUI'

function App() {
  return (
    <div className="app-container">
      <div className="game-ui-container">
        <GameUI />
      </div>
    </div>
  )
}

export default App
