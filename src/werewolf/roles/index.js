/**
 * 角色模組入口
 * 統一匯出所有角色類別和註冊角色
 */

// 基礎類別
export { BaseRole, TEAMS, ACTION_TYPES } from './BaseRole.js';
export { roleRegistry } from './RoleRegistry.js';

// 常數
export { ROLES, GAME_PHASES, NIGHT_ACTIONS_ORDER, DEFAULT_ROLE_DISTRIBUTION } from './roleConstants.js';

// 角色類別
export { WerewolfRole } from './werewolf.js';
export { SeerRole } from './seer.js';
export { WitchRole } from './witch.js';
export { GuardRole } from './guard.js';
export { HunterRole } from './hunter.js';
export { VillagerRole } from './villager.js';

// 向後相容的函式匯出
export { handleWerewolfAction, simulateWerewolfAction } from './werewolf.js';
export { handleSeerAction, simulateSeerAction } from './seer.js';
export { handleWitchAction, simulateWitchAction } from './witch.js';
export { handleGuardAction, simulateGuardAction } from './guard.js';
export { handleHunterAbility, simulateHunterAbility } from './hunter.js';

// 匯入角色類別以進行註冊
import { roleRegistry } from './RoleRegistry.js';
import { WerewolfRole } from './werewolf.js';
import { SeerRole } from './seer.js';
import { WitchRole } from './witch.js';
import { GuardRole } from './guard.js';
import { HunterRole } from './hunter.js';
import { VillagerRole } from './villager.js';

/**
 * 自動註冊所有內建角色
 */
roleRegistry.registerAll({
    WEREWOLF: WerewolfRole,
    SEER: SeerRole,
    WITCH: WitchRole,
    GUARD: GuardRole,
    HUNTER: HunterRole,
    VILLAGER: VillagerRole
});

// 匯出已註冊的角色表
export default roleRegistry;
