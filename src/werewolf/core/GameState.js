/**
 * GameState - 遊戲狀態管理
 * 負責管理和追蹤遊戲的所有狀態
 */

import { GAME_PHASES } from '../roles/roleConstants.js';

/**
 * 初始遊戲狀態
 */
const INITIAL_STATE = {
    phase: '遊戲設置',
    day: 0,
    nightKilled: null,
    dayDiscussions: [],
    votes: {},
    seerChecks: [],
    werewolfVotes: {},
    werewolfVoteResult: null,
    witchSaved: false,
    witchPoisoned: false,
    witchPoisonTarget: null,
    guardProtected: null,
    lastProtected: null,
    winner: null
};

export class GameState {
    /**
     * @param {EventEmitter} eventEmitter - 事件發送器
     */
    constructor(eventEmitter = null) {
        this._eventEmitter = eventEmitter;
        this._state = { ...INITIAL_STATE };
        this._gameStarted = false;
    }

    /**
     * 設置事件發送器
     */
    setEventEmitter(eventEmitter) {
        this._eventEmitter = eventEmitter;
    }

    /**
     * 發送狀態變更事件
     */
    _emitChange(key, oldValue, newValue) {
        if (this._eventEmitter) {
            this._eventEmitter.emit('state:change', { key, oldValue, newValue });

            // 特殊事件處理
            if (key === 'phase') {
                this._eventEmitter.emit('phase:change', { from: oldValue, to: newValue });
            }
        }
    }

    // ========== 遊戲控制狀態 ==========

    get gameStarted() {
        return this._gameStarted;
    }

    set gameStarted(value) {
        const oldValue = this._gameStarted;
        this._gameStarted = value;
        this._emitChange('gameStarted', oldValue, value);
    }

    // ========== 階段管理 ==========

    get phase() {
        return this._state.phase;
    }

    set phase(value) {
        const oldValue = this._state.phase;
        this._state.phase = value;
        this._emitChange('phase', oldValue, value);
    }

    get day() {
        return this._state.day;
    }

    set day(value) {
        const oldValue = this._state.day;
        this._state.day = value;
        this._emitChange('day', oldValue, value);
    }

    /**
     * 進入下一天
     */
    nextDay() {
        this.day = this._state.day + 1;
    }

    /**
     * 設置階段
     */
    setPhase(phase) {
        this.phase = phase;
    }

    /**
     * 判斷是否為特定階段
     */
    isPhase(phase) {
        return this._state.phase === phase;
    }

    // ========== 夜晚行動狀態 ==========

    get nightKilled() {
        return this._state.nightKilled;
    }

    set nightKilled(value) {
        this._state.nightKilled = value;
    }

    get werewolfVoteResult() {
        return this._state.werewolfVoteResult;
    }

    set werewolfVoteResult(value) {
        this._state.werewolfVoteResult = value;
    }

    get witchSaved() {
        return this._state.witchSaved;
    }

    set witchSaved(value) {
        this._state.witchSaved = value;
    }

    get witchPoisoned() {
        return this._state.witchPoisoned;
    }

    set witchPoisoned(value) {
        this._state.witchPoisoned = value;
    }

    get witchPoisonTarget() {
        return this._state.witchPoisonTarget;
    }

    set witchPoisonTarget(value) {
        this._state.witchPoisonTarget = value;
    }

    get guardProtected() {
        return this._state.guardProtected;
    }

    set guardProtected(value) {
        this._state.guardProtected = value;
    }

    get lastProtected() {
        return this._state.lastProtected;
    }

    set lastProtected(value) {
        this._state.lastProtected = value;
    }

    // ========== 投票相關 ==========

    get votes() {
        return this._state.votes;
    }

    set votes(value) {
        this._state.votes = value;
    }

    get werewolfVotes() {
        return this._state.werewolfVotes;
    }

    set werewolfVotes(value) {
        this._state.werewolfVotes = value;
    }

    // ========== 預言家查驗 ==========

    get seerChecks() {
        return this._state.seerChecks;
    }

    addSeerCheck(check) {
        this._state.seerChecks.push(check);
    }

    // ========== 白天討論 ==========

    get dayDiscussions() {
        return this._state.dayDiscussions;
    }

    addDiscussion(discussion) {
        this._state.dayDiscussions.push(discussion);
    }

    // ========== 勝利狀態 ==========

    get winner() {
        return this._state.winner;
    }

    set winner(value) {
        const oldValue = this._state.winner;
        this._state.winner = value;
        this._emitChange('winner', oldValue, value);
    }

    // ========== 狀態操作 ==========

    /**
     * 重置遊戲狀態
     */
    reset() {
        this._state = { ...INITIAL_STATE };
        this._gameStarted = false;

        if (this._eventEmitter) {
            this._eventEmitter.emit('state:reset');
        }
    }

    /**
     * 重置夜晚行動狀態（每晚開始時呼叫）
     */
    resetNightActions() {
        this._state.witchSaved = false;
        this._state.witchPoisoned = false;
        this._state.witchPoisonTarget = null;
        this._state.guardProtected = null;
        this._state.werewolfVoteResult = null;
    }

    /**
     * 獲取完整狀態快照（用於 UI 或調試）
     */
    getSnapshot() {
        return {
            ...this._state,
            gameStarted: this._gameStarted
        };
    }

    /**
     * 從快照恢復狀態
     */
    restoreFromSnapshot(snapshot) {
        const { gameStarted, ...state } = snapshot;
        this._state = { ...INITIAL_STATE, ...state };
        this._gameStarted = gameStarted || false;
    }

    /**
     * 檢查遊戲是否在進行中
     */
    isInProgress() {
        return this._gameStarted && this._state.phase !== GAME_PHASES.GAME_OVER;
    }
}

export default GameState;
