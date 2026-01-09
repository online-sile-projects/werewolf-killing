/**
 * ReactAdapter - React 適配器
 * 用於 React 應用的 UI 適配器
 */

import { GameAdapter, MessageTypes } from './GameAdapter.js';

export class ReactAdapter extends GameAdapter {
    constructor() {
        super();
        this._game = null;
        this._pendingResolve = null;
        this._originalMethods = null;
        this._eventListeners = new Map();
        this._stateUpdateInterval = null;

        // React 回呼函式
        this._callbacks = {
            onStateChange: null,
            onQuestion: null,
            onOptions: null,
            onMessage: null,
            onGameOver: null
        };
    }

    /**
     * 設定 React 回呼函式
     */
    setCallbacks(callbacks) {
        this._callbacks = { ...this._callbacks, ...callbacks };
        return this;
    }

    /**
     * 初始化適配器，連接到遊戲
     */
    init(game) {
        this._game = game;
        this._originalMethods = {
            ask: game.ask.bind(game),
            selectOption: game.selectOption.bind(game),
            askYesNo: game.askYesNo.bind(game),
            log: { ...game.log }
        };

        // 覆寫遊戲的互動方法
        this._overrideMethods();

        // 啟動狀態監控
        this._startStateMonitoring();

        return this;
    }

    /**
     * 銷毀適配器
     */
    destroy() {
        if (this._stateUpdateInterval) {
            clearInterval(this._stateUpdateInterval);
        }

        if (this._game && this._originalMethods) {
            this._game.ask = this._originalMethods.ask;
            this._game.selectOption = this._originalMethods.selectOption;
            this._game.askYesNo = this._originalMethods.askYesNo;
            this._game.log = this._originalMethods.log;
        }

        this._game = null;
        this._pendingResolve = null;
        this._eventListeners.clear();
    }

    /**
     * 覆寫遊戲的互動方法
     */
    _overrideMethods() {
        const self = this;

        // 覆寫 ask
        this._game.ask = async (question) => {
            return self.askQuestion(question);
        };

        // 覆寫 selectOption
        this._game.selectOption = async (options, question) => {
            return self.selectOption(question, options);
        };

        // 覆寫 askYesNo
        this._game.askYesNo = async (question) => {
            return self.askYesNo(question);
        };

        // 覆寫 log 方法
        Object.keys(this._originalMethods.log).forEach(key => {
            this._game.log[key] = (text) => {
                // 呼叫原始方法
                self._originalMethods.log[key](text);
                // 發送到 React
                self.showMessage(text, key);
            };
        });
    }

    /**
     * 啟動狀態監控
     */
    _startStateMonitoring() {
        this._stateUpdateInterval = setInterval(() => {
            this._updateState();

            // 檢查遊戲結束
            if (this._game && this._game.state.phase === this._game.gamePhases.GAME_OVER) {
                this.showGameOver({
                    winner: this._game.state.winner,
                    players: this._game.players
                });
            }
        }, 500);
    }

    /**
     * 更新狀態到 React
     */
    _updateState() {
        if (!this._game) return;

        const state = {
            gamePhase: this._game.state.phase,
            day: this._game.state.day,
            players: [...this._game.players],
            gameStarted: this._game.gameStarted
        };

        this.updateGameState(state);
    }

    // ========== 輸入處理 ==========

    async askQuestion(question) {
        if (this._callbacks.onQuestion) {
            this._callbacks.onQuestion(question, 'text');
        }
        this._emit('question', { question, type: 'text' });

        return new Promise(resolve => {
            this._pendingResolve = resolve;
        });
    }

    async selectOption(question, options) {
        if (this._callbacks.onOptions) {
            this._callbacks.onOptions(question, options);
        }
        this._emit('question', { question, type: 'options', options });

        return new Promise(resolve => {
            this._pendingResolve = resolve;
        });
    }

    async askYesNo(question) {
        if (this._callbacks.onQuestion) {
            this._callbacks.onQuestion(question, 'yesno');
        }
        this._emit('question', { question, type: 'yesno' });

        const answer = await new Promise(resolve => {
            this._pendingResolve = resolve;
        });

        // 解析是/否答案
        if (typeof answer === 'boolean') {
            return answer;
        }
        return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
    }

    /**
     * 提交答案（由 React 元件呼叫）
     */
    submitAnswer(answer) {
        if (this._pendingResolve) {
            const resolve = this._pendingResolve;
            this._pendingResolve = null;
            resolve(answer);
            return true;
        }
        return false;
    }

    /**
     * 是否正在等待輸入
     */
    isWaitingForInput() {
        return this._pendingResolve !== null;
    }

    // ========== 輸出處理 ==========

    showMessage(message, type = MessageTypes.INFO) {
        if (this._callbacks.onMessage) {
            this._callbacks.onMessage(message, type);
        }
        this._emit('message', { text: message, type });
    }

    updateGameState(state) {
        if (this._callbacks.onStateChange) {
            this._callbacks.onStateChange(state);
        }
        this._emit('stateChange', state);
    }

    showGameOver(result) {
        if (this._callbacks.onGameOver) {
            this._callbacks.onGameOver(result);
        }
        this._emit('gameOver', result);

        // 停止狀態監控
        if (this._stateUpdateInterval) {
            clearInterval(this._stateUpdateInterval);
            this._stateUpdateInterval = null;
        }
    }

    showPlayers(players) {
        this._emit('playersUpdate', players);
    }

    // ========== 事件處理 ==========

    on(event, callback) {
        if (!this._eventListeners.has(event)) {
            this._eventListeners.set(event, []);
        }
        this._eventListeners.get(event).push(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (!this._eventListeners.has(event)) return;
        const listeners = this._eventListeners.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    _emit(event, data) {
        if (!this._eventListeners.has(event)) return;
        for (const callback of this._eventListeners.get(event)) {
            try {
                callback(data);
            } catch (error) {
                console.error(`事件處理錯誤 [${event}]:`, error);
            }
        }
    }

    // ========== 便捷方法 ==========

    /**
     * 取得遊戲實例
     */
    getGame() {
        return this._game;
    }

    /**
     * 取得當前遊戲狀態
     */
    getCurrentState() {
        if (!this._game) return null;

        return {
            gamePhase: this._game.state.phase,
            day: this._game.state.day,
            players: [...this._game.players],
            gameStarted: this._game.gameStarted
        };
    }
}

export default ReactAdapter;
