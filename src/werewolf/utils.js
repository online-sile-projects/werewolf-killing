/**
 * 公用工具函式
 */

/**
 * 產生隨機玩家名稱
 * @param {Array} usedNames - 已使用的名稱陣列 (可選)
 * @returns {string} 未使用過的隨機名稱
 */
export function generatePlayerName(usedNames = []) {
  const names = [
    '小明', '小華', '小菁', '小玲', '小剛', 
    '阿德', '阿強', '阿美', '阿真', '阿樂',
    '冠宇', '宗翰', '家豪', '詩涵', '雅婷',
    '世傑', '佳穎', '俊傑', '靜怡', '志明'
  ];
  
  // 過濾掉已使用的名稱
  const availableNames = names.filter(name => !usedNames.includes(name));
  
  // 如果還有可用名稱，從中隨機選一個
  if (availableNames.length > 0) {
    return availableNames[Math.floor(Math.random() * availableNames.length)];
  }
  
  // 如果所有名稱都已使用，生成一個帶數字後綴的名稱
  const randomName = names[Math.floor(Math.random() * names.length)];
  const suffix = Math.floor(Math.random() * 100) + 1; // 1-100 的隨機數字
  return `${randomName}${suffix}`;
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
