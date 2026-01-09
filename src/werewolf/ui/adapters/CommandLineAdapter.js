/**
 * CommandLineAdapter - 命令行適配器
 * 用於 Node.js 終端機環境的 UI 適配器
 * 使用 readline 模組處理輸入輸出
 */

import * as readline from 'readline';
import { GameAdapter, MessageTypes } from './GameAdapter.js';

// ANSI 顏色碼
const COLORS = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    italic: '\x1b[3m',

    // 前景色
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',

    // 背景色
    bgBlack: '\x1b[40m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m'
};

// 訊息類型對應的顏色
const MESSAGE_STYLES = {
    [MessageTypes.INFO]: COLORS.white,
    [MessageTypes.WARNING]: `${COLORS.bold}${COLORS.yellow}`,
    [MessageTypes.SUCCESS]: `${COLORS.bold}${COLORS.green}`,
    [MessageTypes.ERROR]: `${COLORS.bold}${COLORS.red}`,
    [MessageTypes.NIGHT]: COLORS.magenta,
    [MessageTypes.DAY]: COLORS.yellow,
    [MessageTypes.ROLE]: `${COLORS.bold}${COLORS.cyan}`,
    [MessageTypes.PLAYER]: COLORS.cyan,
    [MessageTypes.ACTION]: COLORS.green,
    [MessageTypes.DEAD]: COLORS.gray,
    [MessageTypes.SYSTEM]: `${COLORS.bold}${COLORS.blue}`,
    [MessageTypes.STORY]: `${COLORS.italic}${COLORS.magenta}`
};

export class CommandLineAdapter extends GameAdapter {
    constructor() {
        super();
        this._game = null;
        this._rl = null;
        this._originalMethods = null;
        this._eventListeners = new Map();
        this._isInitialized = false;
    }

    /**
     * 初始化適配器，連接到遊戲
     */
    init(game) {
        this._game = game;

        // 建立 readline 介面
        this._rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // 儲存原始方法
        this._originalMethods = {
            ask: game.ask.bind(game),
            selectOption: game.selectOption.bind(game),
            askYesNo: game.askYesNo.bind(game),
            log: { ...game.log }
        };

        // 覆寫遊戲的互動方法
        this._overrideMethods();
        this._isInitialized = true;

        return this;
    }

    /**
     * 銷毀適配器
     */
    destroy() {
        if (this._rl) {
            this._rl.close();
            this._rl = null;
        }

        if (this._game && this._originalMethods) {
            this._game.ask = this._originalMethods.ask;
            this._game.selectOption = this._originalMethods.selectOption;
            this._game.askYesNo = this._originalMethods.askYesNo;
            this._game.log = this._originalMethods.log;
        }

        this._game = null;
        this._eventListeners.clear();
        this._isInitialized = false;
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
                self.showMessage(text, key);
            };
        });
    }

    // ========== 輸入處理 ==========

    async askQuestion(question) {
        this.showMessage(question, MessageTypes.INFO);

        return new Promise((resolve) => {
            this._rl.question(`${COLORS.green}> ${COLORS.reset}`, (answer) => {
                resolve(answer);
            });
        });
    }

    async selectOption(question, options) {
        this.showMessage(question, MessageTypes.INFO);

        // 顯示選項
        this._print('');
        options.forEach((option, index) => {
            this._print(`  ${COLORS.cyan}${index + 1}.${COLORS.reset} ${option}`);
        });
        this._print(`  ${COLORS.red}0.${COLORS.reset} 取消`);
        this._print('');

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
        let validAnswer = false;
        let result = false;

        while (!validAnswer) {
            const answer = await this.askQuestion(`${question} (y/n)`);
            const lowerAnswer = answer.toLowerCase().trim();

            if (lowerAnswer === 'y' || lowerAnswer === 'yes' || lowerAnswer === '是') {
                result = true;
                validAnswer = true;
            } else if (lowerAnswer === 'n' || lowerAnswer === 'no' || lowerAnswer === '否') {
                result = false;
                validAnswer = true;
            } else {
                this.showMessage('請輸入 y 或 n!', MessageTypes.WARNING);
            }
        }

        return result;
    }

    // ========== 輸出處理 ==========

    /**
     * 內部列印方法
     */
    _print(text) {
        process.stdout.write(text + '\n');
    }

    showMessage(message, type = MessageTypes.INFO) {
        const style = MESSAGE_STYLES[type] || MESSAGE_STYLES[MessageTypes.INFO];
        this._print(`${style}${message}${COLORS.reset}`);
        this._emit('message', { text: message, type });
    }

    updateGameState(state) {
        this._emit('stateChange', state);
    }

    showGameOver(result) {
        this._print('');
        this._print(`${COLORS.bold}${COLORS.bgBlue}${COLORS.white} ═══════════════════════════════ ${COLORS.reset}`);
        this._print(`${COLORS.bold}${COLORS.bgBlue}${COLORS.white}         遊戲結束               ${COLORS.reset}`);
        this._print(`${COLORS.bold}${COLORS.bgBlue}${COLORS.white} ═══════════════════════════════ ${COLORS.reset}`);
        this._print('');

        if (result.winner === 'village') {
            this.showMessage('🎉 好人陣營獲勝！村莊恢復了和平！', MessageTypes.SUCCESS);
        } else {
            this.showMessage('🐺 狼人陣營獲勝！村莊陷入了恐懼...', MessageTypes.WARNING);
        }

        this._print('');
        this._emit('gameOver', result);
    }

    showPlayers(players) {
        this._print('');
        this._print(`${COLORS.bold}${COLORS.cyan}═══ 玩家狀態 ═══${COLORS.reset}`);

        players.forEach(player => {
            const status = player.isAlive
                ? `${COLORS.green}✓${COLORS.reset}`
                : `${COLORS.red}✗${COLORS.reset}`;
            const humanMark = player.isHuman ? ` ${COLORS.yellow}(你)${COLORS.reset}` : '';
            const style = player.isAlive ? COLORS.white : COLORS.gray;

            this._print(`  ${status} ${style}${player.name} (ID: ${player.id})${COLORS.reset}${humanMark}`);
        });

        this._print('');
    }

    /**
     * 顯示標題
     */
    showTitle(title) {
        const line = '═'.repeat(title.length + 4);
        this._print('');
        this._print(`${COLORS.bold}${COLORS.cyan}╔${line}╗${COLORS.reset}`);
        this._print(`${COLORS.bold}${COLORS.cyan}║  ${title}  ║${COLORS.reset}`);
        this._print(`${COLORS.bold}${COLORS.cyan}╚${line}╝${COLORS.reset}`);
        this._print('');
    }

    /**
     * 顯示分隔線
     */
    showDivider() {
        this._print(`${COLORS.dim}${'─'.repeat(40)}${COLORS.reset}`);
    }

    /**
     * 清除螢幕
     */
    clearScreen() {
        process.stdout.write('\x1Bc');
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
     * 是否已初始化
     */
    isInitialized() {
        return this._isInitialized;
    }
}

export default CommandLineAdapter;
