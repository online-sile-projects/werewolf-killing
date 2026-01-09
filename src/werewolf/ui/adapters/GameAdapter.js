/**
 * GameAdapter - 遊戲 UI 適配器介面
 * 定義遊戲與 UI 層溝通的統一介面
 */

/**
 * 訊息類型
 */
export const MessageTypes = {
    INFO: 'info',
    WARNING: 'warning',
    SUCCESS: 'success',
    ERROR: 'error',
    NIGHT: 'night',
    DAY: 'day',
    ROLE: 'role',
    PLAYER: 'player',
    ACTION: 'action',
    DEAD: 'dead',
    SYSTEM: 'system',
    STORY: 'story'
};

/**
 * 遊戲適配器介面
 * 抽象類別，定義所有適配器必須實作的方法
 */
export class GameAdapter {
    constructor() {
        if (this.constructor === GameAdapter) {
            throw new Error('GameAdapter 是抽象類別，不能直接實例化');
        }
    }

    /**
     * 初始化適配器
     * @param {Object} _game - 遊戲實例
     */
    // eslint-disable-next-line no-unused-vars
    init(_game) {
        throw new Error('子類別必須實作 init 方法');
    }

    /**
     * 銷毀適配器，釋放資源
     */
    destroy() {
        throw new Error('子類別必須實作 destroy 方法');
    }

    // ========== 輸入處理 ==========

    /**
     * 顯示問題並等待文字輸入
     * @param {string} _question - 問題文字
     * @returns {Promise<string>} - 使用者輸入
     */
    // eslint-disable-next-line no-unused-vars
    async askQuestion(_question) {
        throw new Error('子類別必須實作 askQuestion 方法');
    }

    /**
     * 顯示選項並等待選擇
     * @param {string} _question - 問題文字
     * @param {Array<string>} _options - 選項列表
     * @returns {Promise<number>} - 選擇的索引 (-1 表示取消)
     */
    // eslint-disable-next-line no-unused-vars
    async selectOption(_question, _options) {
        throw new Error('子類別必須實作 selectOption 方法');
    }

    /**
     * 顯示是/否問題
     * @param {string} _question - 問題文字
     * @returns {Promise<boolean>} - 是/否
     */
    // eslint-disable-next-line no-unused-vars
    async askYesNo(_question) {
        throw new Error('子類別必須實作 askYesNo 方法');
    }

    // ========== 輸出處理 ==========

    /**
     * 顯示訊息
     * @param {string} _message - 訊息內容
     * @param {string} _type - 訊息類型 (MessageTypes)
     */
    // eslint-disable-next-line no-unused-vars
    showMessage(_message, _type = MessageTypes.INFO) {
        throw new Error('子類別必須實作 showMessage 方法');
    }

    /**
     * 更新遊戲狀態顯示
     * @param {Object} _state - 遊戲狀態
     */
    // eslint-disable-next-line no-unused-vars
    updateGameState(_state) {
        throw new Error('子類別必須實作 updateGameState 方法');
    }

    /**
     * 顯示遊戲結束畫面
     * @param {Object} _result - 遊戲結果
     */
    // eslint-disable-next-line no-unused-vars
    showGameOver(_result) {
        throw new Error('子類別必須實作 showGameOver 方法');
    }

    /**
     * 顯示玩家列表
     * @param {Array} _players - 玩家列表
     */
    // eslint-disable-next-line no-unused-vars
    showPlayers(_players) {
        throw new Error('子類別必須實作 showPlayers 方法');
    }

    // ========== 事件處理 ==========

    /**
     * 註冊事件監聽器
     * @param {string} _event - 事件名稱
     * @param {Function} _callback - 回呼函式
     */
    // eslint-disable-next-line no-unused-vars
    on(_event, _callback) {
        throw new Error('子類別必須實作 on 方法');
    }

    /**
     * 移除事件監聽器
     * @param {string} _event - 事件名稱
     * @param {Function} _callback - 回呼函式
     */
    // eslint-disable-next-line no-unused-vars
    off(_event, _callback) {
        throw new Error('子類別必須實作 off 方法');
    }
}

export default GameAdapter;
