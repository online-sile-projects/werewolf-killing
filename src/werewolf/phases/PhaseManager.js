/**
 * PhaseManager - 階段控制器
 * 管理遊戲階段的註冊、切換和執行
 */

import { GAME_PHASES } from '../roles/roleConstants.js';

export class PhaseManager {
    constructor(game = null) {
        this._game = game;
        this._phases = new Map(); // phaseId -> PhaseInstance
        this._currentPhase = null;
        this._phaseHistory = []; // 記錄階段歷史
    }

    /**
     * 設定遊戲實例
     */
    setGame(game) {
        this._game = game;
    }

    /**
     * 註冊階段
     * @param {string} phaseId - 階段 ID
     * @param {BasePhase} phaseInstance - 階段實例
     */
    register(phaseId, phaseInstance) {
        this._phases.set(phaseId, phaseInstance);
        return this;
    }

    /**
     * 批次註冊階段
     * @param {Object} phases - { phaseId: PhaseInstance, ... }
     */
    registerAll(phases) {
        for (const [phaseId, phaseInstance] of Object.entries(phases)) {
            this.register(phaseId, phaseInstance);
        }
        return this;
    }

    /**
     * 取得階段實例
     * @param {string} phaseId - 階段 ID
     */
    get(phaseId) {
        return this._phases.get(phaseId) || null;
    }

    /**
     * 取得當前階段
     */
    getCurrentPhase() {
        return this._currentPhase;
    }

    /**
     * 取得當前階段 ID
     */
    getCurrentPhaseId() {
        return this._currentPhase ? this._currentPhase.getId() : null;
    }

    /**
     * 切換到指定階段
     * @param {string} phaseId - 階段 ID
     */
    async transitionTo(phaseId) {
        const nextPhase = this._phases.get(phaseId);
        if (!nextPhase) {
            console.error(`找不到階段: ${phaseId}`);
            return false;
        }

        // 離開當前階段
        if (this._currentPhase && this._game) {
            await this._currentPhase.onExit(this._game);
        }

        // 記錄歷史
        if (this._currentPhase) {
            this._phaseHistory.push({
                phaseId: this._currentPhase.getId(),
                timestamp: Date.now()
            });
        }

        // 切換階段
        this._currentPhase = nextPhase;

        // 更新遊戲狀態
        if (this._game) {
            this._game.state.phase = nextPhase.getName();
            await nextPhase.onEnter(this._game);
        }

        return true;
    }

    /**
     * 執行當前階段
     * @returns {Promise<string|null>} - 下一個階段 ID
     */
    async executeCurrentPhase() {
        if (!this._currentPhase || !this._game) {
            console.error('沒有當前階段或遊戲實例');
            return null;
        }

        return await this._currentPhase.execute(this._game);
    }

    /**
     * 執行遊戲主迴圈
     * 從指定階段開始，根據階段返回值自動切換
     */
    async runGameLoop(startPhaseId) {
        if (!this._game) {
            throw new Error('請先設定遊戲實例');
        }

        await this.transitionTo(startPhaseId);

        let gameRunning = true;
        while (gameRunning) {
            const nextPhaseId = await this.executeCurrentPhase();

            if (nextPhaseId === null || nextPhaseId === 'GAME_OVER') {
                gameRunning = false;
            } else if (nextPhaseId && this._phases.has(nextPhaseId)) {
                await this.transitionTo(nextPhaseId);
            } else {
                // 使用預設流程
                const defaultNext = this._getDefaultNextPhase();
                if (defaultNext) {
                    await this.transitionTo(defaultNext);
                } else {
                    gameRunning = false;
                }
            }
        }
    }

    /**
     * 取得預設的下一個階段
     */
    _getDefaultNextPhase() {
        const currentId = this.getCurrentPhaseId();

        // 預設流程: NIGHT -> DAY_DISCUSSION -> VOTING -> NIGHT
        const defaultFlow = {
            'NIGHT': 'DAY_DISCUSSION',
            'DAY_DISCUSSION': 'VOTING',
            'VOTING': 'NIGHT'
        };

        return defaultFlow[currentId] || null;
    }

    /**
     * 取得階段歷史
     */
    getHistory() {
        return [...this._phaseHistory];
    }

    /**
     * 清空歷史
     */
    clearHistory() {
        this._phaseHistory = [];
    }

    /**
     * 取得所有已註冊的階段
     */
    getAllPhases() {
        return Array.from(this._phases.values());
    }

    /**
     * 描述所有階段
     */
    describeAll() {
        return this.getAllPhases().map(phase => phase.describe());
    }
}

// 單例匯出
export const phaseManager = new PhaseManager();
export default PhaseManager;
