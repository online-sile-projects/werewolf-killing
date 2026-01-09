/**
 * 階段模組入口
 * 統一匯出所有階段類別和 PhaseManager
 */

// 基礎類別
export { BasePhase } from './BasePhase.js';
export { PhaseManager, phaseManager } from './PhaseManager.js';

// 階段類別
export { NightPhase, handleNightPhase } from './nightPhase.js';
export { DayPhase, handleDayDiscussionPhase } from './dayPhase.js';
export {
    VotingPhase,
    handleVotingPhase,
    handlePlayerVote,
    simulatePlayerVote,
    handleVoteResult
} from './votingPhase.js';

// 匯入以進行註冊
import { phaseManager } from './PhaseManager.js';
import { NightPhase } from './nightPhase.js';
import { DayPhase } from './dayPhase.js';
import { VotingPhase } from './votingPhase.js';

/**
 * 自動註冊所有內建階段
 */
phaseManager.registerAll({
    NIGHT: new NightPhase(),
    DAY_DISCUSSION: new DayPhase(),
    VOTING: new VotingPhase()
});

// 匯出已註冊的階段管理器
export default phaseManager;
