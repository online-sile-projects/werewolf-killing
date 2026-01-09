/**
 * EventEmitter - 簡單的發布-訂閱事件系統
 * 用於遊戲內部的事件通知，解耦各模組之間的依賴
 */

export class EventEmitter {
    constructor() {
        this._events = new Map();
    }

    /**
     * 訂閱事件
     * @param {string} event - 事件名稱
     * @param {Function} listener - 回呼函式
     * @returns {Function} - 取消訂閱的函式
     */
    on(event, listener) {
        if (!this._events.has(event)) {
            this._events.set(event, []);
        }
        this._events.get(event).push(listener);

        // 回傳取消訂閱函式
        return () => this.off(event, listener);
    }

    /**
     * 訂閱一次性事件
     * @param {string} event - 事件名稱
     * @param {Function} listener - 回呼函式
     */
    once(event, listener) {
        const onceWrapper = (...args) => {
            this.off(event, onceWrapper);
            listener.apply(this, args);
        };
        this.on(event, onceWrapper);
    }

    /**
     * 取消訂閱事件
     * @param {string} event - 事件名稱
     * @param {Function} listener - 回呼函式
     */
    off(event, listener) {
        if (!this._events.has(event)) return;

        const listeners = this._events.get(event);
        const index = listeners.indexOf(listener);
        if (index > -1) {
            listeners.splice(index, 1);
        }

        // 清除空的事件列表
        if (listeners.length === 0) {
            this._events.delete(event);
        }
    }

    /**
     * 發送事件
     * @param {string} event - 事件名稱
     * @param {...any} args - 傳遞給監聽器的參數
     */
    emit(event, ...args) {
        if (!this._events.has(event)) return;

        const listeners = this._events.get(event).slice(); // 複製以防止迭代時修改
        for (const listener of listeners) {
            try {
                listener.apply(this, args);
            } catch (error) {
                console.error(`EventEmitter: 處理事件 "${event}" 時發生錯誤:`, error);
            }
        }
    }

    /**
     * 清除所有該事件的監聽器
     * @param {string} event - 事件名稱（可選，不傳則清除所有）
     */
    removeAllListeners(event) {
        if (event) {
            this._events.delete(event);
        } else {
            this._events.clear();
        }
    }

    /**
     * 獲取事件的監聽器數量
     * @param {string} event - 事件名稱
     * @returns {number}
     */
    listenerCount(event) {
        return this._events.has(event) ? this._events.get(event).length : 0;
    }
}

/**
 * 遊戲事件常數
 */
export const GameEvents = {
    // 遊戲生命週期
    GAME_INIT: 'game:init',
    GAME_START: 'game:start',
    GAME_RESET: 'game:reset',
    GAME_OVER: 'game:over',

    // 階段變更
    PHASE_CHANGE: 'phase:change',
    DAY_START: 'phase:day:start',
    NIGHT_START: 'phase:night:start',
    VOTING_START: 'phase:voting:start',

    // 玩家相關
    PLAYER_CREATED: 'player:created',
    PLAYER_DIED: 'player:died',
    PLAYER_ROLE_ASSIGNED: 'player:roleAssigned',
    PLAYER_ACTION: 'player:action',

    // 角色行動
    WEREWOLF_KILL: 'action:werewolf:kill',
    SEER_CHECK: 'action:seer:check',
    WITCH_SAVE: 'action:witch:save',
    WITCH_POISON: 'action:witch:poison',
    GUARD_PROTECT: 'action:guard:protect',
    HUNTER_SHOOT: 'action:hunter:shoot',

    // 投票相關
    VOTE_CAST: 'vote:cast',
    VOTE_RESULT: 'vote:result',

    // 訊息相關
    MESSAGE: 'message',
    LOG: 'log'
};

export default EventEmitter;
