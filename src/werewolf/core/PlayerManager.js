/**
 * PlayerManager - 玩家管理模組
 * 負責玩家的建立、角色分配和查詢
 */

import { ROLES, DEFAULT_ROLE_DISTRIBUTION } from '../roles/roleConstants.js';
import { createPlayer, generatePlayerName, shuffleArray } from '../utils.js';

export class PlayerManager {
    /**
     * @param {EventEmitter} eventEmitter - 事件發送器
     */
    constructor(eventEmitter = null) {
        this._eventEmitter = eventEmitter;
        this._players = [];
        this._humanPlayerId = null;
    }

    /**
     * 設置事件發送器
     */
    setEventEmitter(eventEmitter) {
        this._eventEmitter = eventEmitter;
    }

    /**
     * 發送事件
     */
    _emit(event, data) {
        if (this._eventEmitter) {
            this._eventEmitter.emit(event, data);
        }
    }

    // ========== 基本存取 ==========

    get players() {
        return this._players;
    }

    get humanPlayerId() {
        return this._humanPlayerId;
    }

    get playerCount() {
        return this._players.length;
    }

    // ========== 玩家查詢 ==========

    /**
     * 根據 ID 取得玩家
     */
    getPlayerById(id) {
        return this._players.find(p => p.id === id);
    }

    /**
     * 取得所有活著的玩家
     */
    getAlivePlayers() {
        return this._players.filter(p => p.isAlive);
    }

    /**
     * 取得所有死亡的玩家
     */
    getDeadPlayers() {
        return this._players.filter(p => !p.isAlive);
    }

    /**
     * 取得人類玩家
     */
    getHumanPlayer() {
        return this._players.find(p => p.isHuman);
    }

    /**
     * 取得特定角色的玩家
     */
    getPlayersByRole(role) {
        return this._players.filter(p => p.role === role && p.isAlive);
    }

    /**
     * 取得狼人陣營
     */
    getWerewolfTeam() {
        return this.getPlayersByRole(ROLES.WEREWOLF);
    }

    /**
     * 取得好人陣營
     */
    getVillageTeam() {
        return this._players.filter(p => p.role !== ROLES.WEREWOLF && p.isAlive);
    }

    /**
     * 檢查玩家是否存活
     */
    isPlayerAlive(playerId) {
        const player = this.getPlayerById(playerId);
        return player ? player.isAlive : false;
    }

    // ========== 玩家建立 ==========

    /**
     * 建立玩家
     * @param {number} totalCount - 玩家總數
     * @param {string} humanName - 人類玩家名稱
     * @returns {Object} - 人類玩家
     */
    createPlayers(totalCount, humanName) {
        this._players = [];

        // 隨機決定人類玩家的 ID
        const humanId = Math.floor(Math.random() * totalCount) + 1;
        this._humanPlayerId = humanId;

        // 建立人類玩家
        const humanPlayer = createPlayer(humanId, humanName || `玩家${humanId}`, true);
        this._players.push(humanPlayer);

        // 建立 AI 玩家
        const usedNames = [humanPlayer.name];

        for (let i = 1; i <= totalCount; i++) {
            if (i === humanId) continue;

            const aiName = generatePlayerName(usedNames);
            const aiPlayer = createPlayer(i, aiName, false);
            usedNames.push(aiName);
            this._players.push(aiPlayer);
        }

        // 依 ID 排序
        this._players.sort((a, b) => a.id - b.id);

        this._emit('players:created', { players: this._players });

        return humanPlayer;
    }

    /**
     * 分配角色
     * @param {Object} customDistribution - 自訂角色分配（可選）
     */
    assignRoles(customDistribution = null) {
        const totalPlayers = this._players.length;
        let distribution = customDistribution || { ...DEFAULT_ROLE_DISTRIBUTION };

        // 調整狼人數量（少於等於4人時只有1隻狼人）
        if (totalPlayers <= 4 && distribution.WEREWOLF > 1) {
            const diff = distribution.WEREWOLF - 1;
            distribution.WEREWOLF = 1;
            distribution.VILLAGER = (distribution.VILLAGER || 0) + diff;
        }

        // 調整村民數量以匹配玩家總數
        const totalRoles = Object.values(distribution).reduce((sum, count) => sum + count, 0);
        if (totalRoles !== totalPlayers) {
            distribution.VILLAGER = (distribution.VILLAGER || 0) + (totalPlayers - totalRoles);
        }

        // 建立角色池
        let rolePool = [];
        for (const [role, count] of Object.entries(distribution)) {
            for (let i = 0; i < count; i++) {
                rolePool.push(role);
            }
        }

        // 隨機分配
        rolePool = shuffleArray(rolePool);

        this._players.forEach(player => {
            const roleKey = rolePool.pop();
            player.role = ROLES[roleKey];
            player.abilities = this._getInitialAbilities(roleKey);

            this._emit('player:roleAssigned', {
                playerId: player.id,
                role: player.role
            });
        });
    }

    /**
     * 取得角色的初始能力
     */
    _getInitialAbilities(roleKey) {
        switch (roleKey) {
            case 'WITCH':
                return { hasMedicine: true, hasPoison: true };
            case 'HUNTER':
                return { canShoot: true };
            case 'GUARD':
                return { lastProtected: null };
            default:
                return {};
        }
    }

    // ========== 玩家狀態操作 ==========

    /**
     * 標記玩家死亡
     */
    killPlayer(playerId) {
        const player = this.getPlayerById(playerId);
        if (player && player.isAlive) {
            player.isAlive = false;
            this._emit('player:died', {
                playerId,
                playerName: player.name,
                role: player.role
            });
            return true;
        }
        return false;
    }

    /**
     * 紀錄玩家訊息到歷史
     */
    addPlayerHistory(playerId, day, phase, message) {
        const player = this.getPlayerById(playerId);
        if (player) {
            if (!player.history) {
                player.history = [];
            }
            player.history.push({ day, phase, message });
        }
    }

    // ========== 遊戲結束檢查 ==========

    /**
     * 檢查遊戲是否結束
     * @returns {{ isOver: boolean, winner?: string }}
     */
    checkGameOver() {
        const werewolves = this.getWerewolfTeam();
        const villagers = this.getVillageTeam();

        if (werewolves.length === 0) {
            return { isOver: true, winner: 'village' };
        }

        if (werewolves.length >= villagers.length) {
            return { isOver: true, winner: 'werewolf' };
        }

        return { isOver: false };
    }

    // ========== 資料迭代 ==========

    /**
     * 遍歷所有玩家
     */
    forEach(callback) {
        this._players.forEach(callback);
    }

    /**
     * 遍歷活著的玩家
     */
    forEachAlive(callback) {
        this.getAlivePlayers().forEach(callback);
    }

    // ========== 重置 ==========

    /**
     * 重置玩家管理器
     */
    reset() {
        this._players = [];
        this._humanPlayerId = null;
        this._emit('players:reset');
    }

    /**
     * 取得玩家資料快照（用於 UI 或調試）
     */
    getSnapshot() {
        return {
            players: this._players.map(p => ({ ...p })),
            humanPlayerId: this._humanPlayerId
        };
    }
}

export default PlayerManager;
