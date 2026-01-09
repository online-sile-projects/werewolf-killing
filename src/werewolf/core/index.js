/**
 * Core 模組入口
 * 統一匯出所有核心元件
 */

import { EventEmitter, GameEvents } from './EventEmitter.js';
import { GameState } from './GameState.js';
import { PlayerManager } from './PlayerManager.js';

// 匯出類別
export { EventEmitter, GameEvents, GameState, PlayerManager };

/**
 * 工廠函式：建立完整的核心系統
 * @returns {{ eventEmitter: EventEmitter, gameState: GameState, playerManager: PlayerManager }}
 */
export function createCoreSystem() {
    const eventEmitter = new EventEmitter();
    const gameState = new GameState(eventEmitter);
    const playerManager = new PlayerManager(eventEmitter);

    return {
        eventEmitter,
        gameState,
        playerManager
    };
}

export default {
    EventEmitter,
    GameEvents,
    GameState,
    PlayerManager,
    createCoreSystem
};
