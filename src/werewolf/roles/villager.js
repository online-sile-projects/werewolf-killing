/**
 * 村民角色類別
 */

import { BaseRole, TEAMS, ACTION_TYPES } from './BaseRole.js';
import { ROLES } from './roleConstants.js';

export class VillagerRole extends BaseRole {
    constructor() {
        super('VILLAGER', {
            name: ROLES.VILLAGER,
            team: TEAMS.VILLAGE,
            actionType: ACTION_TYPES.PASSIVE,
            actionOrder: 99,
            description: '普通村民，沒有特殊能力，依靠推理和投票來消滅狼人'
        });
    }

    /**
     * 村民沒有夜晚行動
     */
    hasNightAction() {
        return false;
    }
}

export default VillagerRole;
