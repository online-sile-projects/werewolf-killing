/**
 * GameHistory.js - 遊戲歷史紀錄管理類別
 * 負責記錄、管理和格式化遊戲中的所有訊息和事件
 */

export class GameHistory {
  constructor() {
    // 遊戲歷史紀錄陣列
    this.records = [];
  }

  /**
   * 添加遊戲訊息到歷史紀錄
   * @param {string} role - 訊息來源 (如: '系統', '玩家-1', '旁白')
   * @param {string} message - 訊息內容
   * @param {string} phase - 遊戲階段
   * @param {number} day - 遊戲天數
   */
  addMessage(role, message, phase, day) {
    this.records.push({
      timestamp: new Date().toISOString(),
      role,
      message,
      phase,
      day
    });
    console.log(`紀錄了一則來自 ${role} 的訊息`);
  }

  /**
   * 清除所有歷史紀錄
   */
  clear() {
    this.records = [];
    console.log('已清除遊戲歷史紀錄');
    return true;
  }

  /**
   * 獲取所有歷史紀錄
   * @returns {Array} - 歷史紀錄陣列
   */
  getAllRecords() {
    return this.records;
  }

  /**
   * 獲取特定角色的歷史紀錄
   * @param {string} role - 角色名稱 (如: '玩家-1', '系統')
   * @returns {Array} - 指定角色的歷史紀錄
   */
  getRecordsByRole(role) {
    return this.records.filter(record => record.role === role);
  }

  /**
   * 獲取特定天數的歷史紀錄
   * @param {number} day - 遊戲天數
   * @returns {Array} - 指定天數的歷史紀錄
   */
  getRecordsByDay(day) {
    return this.records.filter(record => record.day === day);
  }

  /**
   * 獲取特定階段的歷史紀錄
   * @param {string} phase - 遊戲階段
   * @returns {Array} - 指定階段的歷史紀錄
   */
  getRecordsByPhase(phase) {
    return this.records.filter(record => record.phase === phase);
  }

  /**
   * 將歷史紀錄格式化為文字描述
   * @returns {string} - 格式化後的文字
   */
  formatToText() {
    if (this.records.length === 0) {
      return '遊戲尚未開始或沒有歷史紀錄。';
    }
    
    let formattedText = '【遊戲歷史紀錄】\n\n';
    let currentDay = null;
    let currentPhase = null;
    
    for (const entry of this.records) {
      // 顯示日期和階段變化
      if (entry.day !== currentDay || entry.phase !== currentPhase) {
        formattedText += `\n=== 第 ${entry.day || '?'} 天 - ${entry.phase || '?'} ===\n\n`;
        currentDay = entry.day;
        currentPhase = entry.phase;
      }
      
      // 添加訊息
      formattedText += `${entry.role}: ${entry.message}\n`;
    }
    
    return formattedText;
  }

  /**
   * 獲取最近 N 則紀錄
   * @param {number} count - 要獲取的記錄數量
   * @returns {Array} - 最近的記錄陣列
   */
  getRecentRecords(count) {
    return this.records.slice(-count);
  }

  /**
   * 將最近的訊息格式化為文字
   * @param {number} count - 要包含的記錄數量
   * @returns {string} - 格式化後的文字
   */
  formatRecentToText(count = 10) {
    const recentRecords = this.getRecentRecords(count);
    
    if (recentRecords.length === 0) {
      return '沒有最近的遊戲紀錄。';
    }
    
    let formattedText = '【最近的遊戲活動】\n\n';
    let currentDay = null;
    let currentPhase = null;
    
    for (const entry of recentRecords) {
      // 顯示日期和階段變化
      if (entry.day !== currentDay || entry.phase !== currentPhase) {
        formattedText += `\n=== 第 ${entry.day || '?'} 天 - ${entry.phase || '?'} ===\n\n`;
        currentDay = entry.day;
        currentPhase = entry.phase;
      }
      
      // 添加訊息
      formattedText += `${entry.role}: ${entry.message}\n`;
    }
    
    return formattedText;
  }
}

export default GameHistory;
