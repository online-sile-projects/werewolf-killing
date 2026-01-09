/**
 * RoleRegistry - 角色註冊表
 * 管理所有角色類別的註冊和實例化
 */

import { ROLES } from './roleConstants.js';

/**
 * 角色註冊表
 */
class RoleRegistry {
    constructor() {
        this._roles = new Map(); // roleId -> RoleClass
        this._instances = new Map(); // roleId -> RoleInstance
    }

    /**
     * 註冊角色
     * @param {string} roleId - 角色 ID (如 'WEREWOLF')
     * @param {typeof BaseRole} RoleClass - 角色類別
     */
    register(roleId, RoleClass) {
        if (this._roles.has(roleId)) {
            console.warn(`角色 ${roleId} 已經註冊過，將被覆蓋`);
        }
        this._roles.set(roleId, RoleClass);

        // 建立實例快取
        this._instances.set(roleId, new RoleClass());

        return this;
    }

    /**
     * 批次註冊角色
     * @param {Object} roles - { roleId: RoleClass, ... }
     */
    registerAll(roles) {
        for (const [roleId, RoleClass] of Object.entries(roles)) {
            this.register(roleId, RoleClass);
        }
        return this;
    }

    /**
     * 取得角色實例
     * @param {string} roleId - 角色 ID
     * @returns {BaseRole|null}
     */
    get(roleId) {
        return this._instances.get(roleId) || null;
    }

    /**
     * 根據角色名稱取得實例
     * @param {string} roleName - 角色名稱 (如 '狼人')
     */
    getByName(roleName) {
        for (const [, instance] of this._instances) {
            if (instance.getName() === roleName) {
                return instance;
            }
        }
        return null;
    }

    /**
     * 取得角色的初始能力
     * @param {string} roleId - 角色 ID
     */
    getInitialAbilities(roleId) {
        const role = this.get(roleId);
        return role ? role.initializeAbilities() : {};
    }

    /**
     * 是否已註冊角色
     * @param {string} roleId - 角色 ID
     */
    has(roleId) {
        return this._roles.has(roleId);
    }

    /**
     * 取得所有已註冊的角色 ID
     */
    getAllIds() {
        return Array.from(this._roles.keys());
    }

    /**
     * 取得所有角色實例
     */
    getAll() {
        return Array.from(this._instances.values());
    }

    /**
     * 取得特定陣營的角色
     * @param {string} team - 陣營 ('werewolf' | 'village')
     */
    getByTeam(team) {
        return this.getAll().filter(role => role.getTeam() === team);
    }

    /**
     * 取得有夜晚行動的角色（按行動順序排序）
     */
    getNightActionRoles() {
        return this.getAll()
            .filter(role => role.hasNightAction())
            .sort((a, b) => a.actionOrder - b.actionOrder);
    }

    /**
     * 執行角色的夜晚行動
     * @param {Object} game - 遊戲實例
     * @param {Object} player - 玩家實例
     */
    async executeNightAction(game, player) {
        // 根據角色名稱找到對應的角色類別
        const role = this.getByName(player.role);

        if (!role || !role.hasNightAction()) {
            return;
        }

        if (player.isHuman) {
            await role.handleAction(game, player);
        } else {
            await role.simulateAction(game, player);
        }
    }

    /**
     * 處理玩家死亡觸發
     * @param {Object} game - 遊戲實例
     * @param {Object} player - 玩家實例
     */
    async handleDeathTrigger(game, player) {
        const role = this.getByName(player.role);
        if (role) {
            await role.onDeath(game, player);
        }
    }

    /**
     * 取得角色描述列表（用於規則說明）
     */
    describeAll() {
        return this.getAll().map(role => role.describe());
    }

    /**
     * 清空註冊表
     */
    clear() {
        this._roles.clear();
        this._instances.clear();
    }
}

// 單例匯出
export const roleRegistry = new RoleRegistry();
export default roleRegistry;
