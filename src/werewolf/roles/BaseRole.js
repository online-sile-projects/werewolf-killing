/**
 * BaseRole - 角色基類
 * 定義所有角色必須實作的介面和共用邏輯
 */

import { ROLES } from './roleConstants.js';

/**
 * 角色陣營
 */
export const TEAMS = {
    WEREWOLF: 'werewolf',  // 狼人陣營
    VILLAGE: 'village'      // 好人陣營
};

/**
 * 角色行動類型
 */
export const ACTION_TYPES = {
    PASSIVE: 'passive',     // 被動（無夜晚行動）
    ACTIVE_NIGHT: 'night',  // 夜晚主動
    ACTIVE_DAY: 'day',      // 白天主動
    TRIGGER: 'trigger'      // 觸發型（如獵人）
};

/**
 * 角色基類
 */
export class BaseRole {
    /**
     * @param {string} id - 角色識別符 (如 'WEREWOLF', 'SEER')
     * @param {Object} config - 角色配置
     */
    constructor(id, config = {}) {
        this.id = id;
        this.name = config.name || ROLES[id] || id;
        this.team = config.team || TEAMS.VILLAGE;
        this.actionType = config.actionType || ACTION_TYPES.PASSIVE;
        this.actionOrder = config.actionOrder || 99; // 行動順序，數字越小越先行動
        this.description = config.description || '';
    }

    /**
     * 取得角色 ID
     */
    getId() {
        return this.id;
    }

    /**
     * 取得角色名稱
     */
    getName() {
        return this.name;
    }

    /**
     * 取得角色陣營
     */
    getTeam() {
        return this.team;
    }

    /**
     * 是否為狼人陣營
     */
    isWerewolfTeam() {
        return this.team === TEAMS.WEREWOLF;
    }

    /**
     * 是否有夜晚行動
     */
    hasNightAction() {
        return this.actionType === ACTION_TYPES.ACTIVE_NIGHT;
    }

    /**
     * 初始化玩家能力（分配角色時呼叫）
     * @returns {Object} - 玩家的初始能力
     */
    initializeAbilities() {
        return {};
    }

    /**
     * 處理人類玩家的行動
     * @param {Object} game - 遊戲實例
     * @param {Object} player - 玩家實例
     */
    // eslint-disable-next-line no-unused-vars
    async handleAction(game, _player) {
        // 子類別覆寫
        game.log.warning(`${this.name} 沒有定義行動`);
    }

    /**
     * 模擬 AI 玩家的行動
     * @param {Object} game - 遊戲實例
     * @param {Object} player - 玩家實例
     */
    async simulateAction(game, player) {
        // 預設使用隨機邏輯，子類別可覆寫
        game.log.system(`AI ${this.name} ${player.name} 進行了行動`);
    }

    /**
     * 建構 AI 決策的上下文
     * @param {Object} game - 遊戲實例
     * @param {Object} player - 玩家實例
     * @param {string} actionDescription - 行動描述
     */
    buildAIContext(game, player, actionDescription) {
        return `現在是第 ${game.state.day} 天夜晚，你是${this.name}，${actionDescription}`;
    }

    /**
     * 呼叫 AI 決策
     * @param {Object} game - 遊戲實例
     * @param {Object} player - 玩家實例
     * @param {string} decisionType - 決策類型
     * @param {Array} targets - 可選目標
     * @param {string} context - 上下文
     */
    async callAIDecision(game, player, decisionType, targets, context) {
        if (!game.settings.useAI || !game.apiManager) {
            return null;
        }

        try {
            const decision = await game.apiManager.generateAiDecision(
                this.name,
                decisionType,
                targets,
                context,
                player.id
            );

            if (decision && typeof decision.targetId === 'number') {
                const targetPlayer = targets.find(p => p.id === decision.targetId);
                if (targetPlayer) {
                    return decision;
                }
            }
        } catch (error) {
            console.error(`AI ${this.name}決策出錯:`, error);
        }

        return null;
    }

    /**
     * 隨機選擇目標（AI 決策失敗時的備案）
     */
    randomSelectTarget(targets) {
        if (!targets || targets.length === 0) return null;
        return targets[Math.floor(Math.random() * targets.length)];
    }

    /**
     * 處理死亡觸發效果（如獵人）
     * @param {Object} game - 遊戲實例
     * @param {Object} player - 玩家實例
     */
    // eslint-disable-next-line no-unused-vars
    async onDeath(_game, _player) {
        // 子類別覆寫（如獵人開槍）
    }

    /**
     * 描述角色（用於規則說明）
     */
    describe() {
        return {
            id: this.id,
            name: this.name,
            team: this.team,
            actionType: this.actionType,
            description: this.description
        };
    }
}

export default BaseRole;
