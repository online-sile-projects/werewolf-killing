/**
 * 角色常數定義
 */

// 角色設定
export const ROLES = {
  WEREWOLF: '狼人',
  VILLAGER: '村民',
  SEER: '預言家',
  WITCH: '女巫',
  HUNTER: '獵人',
  GUARD: '守衛'
};

// 遊戲階段
export const GAME_PHASES = {
  GAME_SETUP: '遊戲設置',
  NIGHT: '夜晚',
  DAY_DISCUSSION: '白天討論',
  VOTING: '投票',
  GAME_OVER: '遊戲結束'
};

// 夜晚行動順序
export const NIGHT_ACTIONS_ORDER = ['GUARD', 'WEREWOLF', 'WITCH', 'SEER'];

// 預設角色分配
export const DEFAULT_ROLE_DISTRIBUTION = {
  WEREWOLF: 2,
  SEER: 1,
  WITCH: 1,
  HUNTER: 1,
  GUARD: 1,
  VILLAGER: 2
};
