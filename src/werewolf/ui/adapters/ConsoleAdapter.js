/**
 * ConsoleAdapter - 控制台適配器
 * 用於控制台/終端機環境的 UI 適配器
 */

import { GameAdapter, MessageTypes } from './GameAdapter.js';

export class ConsoleAdapter extends GameAdapter {
    constructor() {
        super();
        this._game = null;
        this._pendingResolve = null;
        this._originalMethods = null;
        this._eventListeners = new Map();
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

        return this;
    }

    /**
     * 銷毀適配器，恢復原始方法
     */
    destroy() {
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
                // 觸發事件
                self._emit('message', { text, type: key });
            };
        });
    }

    // ========== 輸入處理 ==========

    async askQuestion(question) {
        this.showMessage(question, MessageTypes.INFO);
        console.log('%c> ', 'color: #00cc99; font-weight: bold;');

        return new Promise(resolve => {
            this._pendingResolve = resolve;
        });
    }

    async selectOption(question, options) {
        this.showMessage(question, MessageTypes.INFO);

        options.forEach((option, index) => {
            console.log(`%c${index + 1}. ${option}`, 'color: #ccccff;');
        });
        console.log('%c0. 取消', 'color: #ff9999;');

        let selection = null;
        while (selection === null) {
            const answer = await this.askQuestion('請輸入選項編號:');
            const choice = parseInt(answer);

            if (isNaN(choice)) {
                this.showMessage('請輸入有效的數字!', MessageTypes.WARNING);
            } else if (choice < 0 || choice > options.length) {
                this.showMessage(`請輸入 0-${options.length} 的數字!`, MessageTypes.WARNING);
            } else {
                selection = choice - 1;
                if (choice === 0) selection = -1;
            }
        }

        return selection;
    }

    async askYesNo(question) {
        this.showMessage(`${question} (y/n)`, MessageTypes.INFO);

        let validAnswer = false;
        let result = false;

        while (!validAnswer) {
            const answer = await this.askQuestion('請輸入 y 或 n:');
            const lowerAnswer = answer.toLowerCase();

            if (lowerAnswer === 'y' || lowerAnswer === 'yes') {
                result = true;
                validAnswer = true;
            } else if (lowerAnswer === 'n' || lowerAnswer === 'no') {
                result = false;
                validAnswer = true;
            } else {
                this.showMessage('請輸入 y 或 n!', MessageTypes.WARNING);
            }
        }

        return result;
    }

    /**
     * 提交答案（由外部呼叫）
     */
    submitAnswer(answer) {
        if (this._pendingResolve) {
            console.log(`%c> ${answer}`, 'color: #ffffff;');
            const resolve = this._pendingResolve;
            this._pendingResolve = null;
            resolve(answer);
            return true;
        }
        return false;
    }

    // ========== 輸出處理 ==========

    showMessage(message, type = MessageTypes.INFO) {
        const styles = {
            [MessageTypes.INFO]: 'color: #cccccc;',
            [MessageTypes.WARNING]: 'color: #ffcc00; font-weight: bold;',
            [MessageTypes.SUCCESS]: 'color: #00ff00; font-weight: bold;',
            [MessageTypes.ERROR]: 'color: #ff0000; font-weight: bold;',
            [MessageTypes.NIGHT]: 'color: #9966ff;',
            [MessageTypes.DAY]: 'color: #ffcc33;',
            [MessageTypes.ROLE]: 'color: #ff6699; font-weight: bold;',
            [MessageTypes.PLAYER]: 'color: #66ccff;',
            [MessageTypes.ACTION]: 'color: #00cc99;',
            [MessageTypes.DEAD]: 'color: #999999;',
            [MessageTypes.SYSTEM]: 'color: #ff9900;',
            [MessageTypes.STORY]: 'color: #ff99cc; font-style: italic;'
        };

        console.log(`%c${message}`, styles[type] || styles[MessageTypes.INFO]);
        this._emit('message', { text: message, type });
    }

    updateGameState(state) {
        this._emit('stateChange', state);
    }

    showGameOver(result) {
        console.log('%c=== 遊戲結束 ===', 'color: #ff6600; font-weight: bold; font-size: 16px;');
        if (result.winner === 'village') {
            this.showMessage('好人陣營獲勝！村莊恢復了和平！', MessageTypes.SUCCESS);
        } else {
            this.showMessage('狼人陣營獲勝！村莊陷入了恐懼...', MessageTypes.WARNING);
        }
        this._emit('gameOver', result);
    }

    showPlayers(players) {
        console.log('%c當前玩家狀態:', 'color: #00ccff; font-weight: bold;');
        players.forEach(player => {
            if (player.isAlive) {
                this.showMessage(`${player.name} (ID: ${player.id})`, MessageTypes.PLAYER);
            } else {
                this.showMessage(`${player.name} (ID: ${player.id}) - 已死亡`, MessageTypes.DEAD);
            }
        });
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
}

export default ConsoleAdapter;
