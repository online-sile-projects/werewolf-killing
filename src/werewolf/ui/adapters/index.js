/**
 * UI 適配器模組入口
 * 統一匯出所有 UI 適配器
 */

import { GameAdapter, MessageTypes } from './GameAdapter.js';
import { ConsoleAdapter } from './ConsoleAdapter.js';
import { ReactAdapter } from './ReactAdapter.js';
import { CommandLineAdapter } from './CommandLineAdapter.js';

// 匯出類別
export { GameAdapter, MessageTypes, ConsoleAdapter, ReactAdapter, CommandLineAdapter };

/**
 * 建立適配器工廠函式
 * @param {string} type - 適配器類型 ('console' | 'react' | 'cli')
 * @param {Object} callbacks - React 回呼函式 (僅用於 'react' 類型)
 */
export function createAdapter(type, callbacks = {}) {
    switch (type) {
        case 'console':
            return new ConsoleAdapter();
        case 'react': {
            const adapter = new ReactAdapter();
            adapter.setCallbacks(callbacks);
            return adapter;
        }
        case 'cli':
        case 'commandline':
            return new CommandLineAdapter();
        default:
            throw new Error(`未知的適配器類型: ${type}`);
    }
}

export default {
    GameAdapter,
    ConsoleAdapter,
    ReactAdapter,
    CommandLineAdapter,
    MessageTypes,
    createAdapter
};
