/**
 * 公用工具函式
 */

/**
 * 產生隨機玩家名稱
 */
export function generatePlayerName() {
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
export function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * 創建玩家物件
 */
export function createPlayer(id, name, isHuman = false) {
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
