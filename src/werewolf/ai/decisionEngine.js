/**
 * DecisionEngine - AI 決策引擎
 * 專門處理狼人殺遊戲的 AI 決策邏輯
 */

import { AIService } from './AIService.js';

/**
 * 決策類型及其對應的 prompt 模板
 */
const DECISION_PROMPTS = {
    kill: {
        instruction: (role, number) =>
            `你正在扮演狼人殺遊戲中的 ${role}${number ? ` 玩家 ${number} 號` : ''}，請決定要擊殺哪一位玩家。回傳格式必須是 JSON: {"targetId": 數字}`,
        parser: 'targetId'
    },
    save: {
        instruction: (role, number) =>
            `你正在扮演狼人殺遊戲中的 ${role}${number ? ` 玩家 ${number} 號` : ''}，請決定是否要使用解藥救活即將被狼人殺死的玩家。回傳格式必須是 JSON: {"save": true/false}`,
        parser: 'boolean'
    },
    poison: {
        instruction: (role, number) =>
            `你正在扮演狼人殺遊戲中的 ${role}${number ? ` 玩家 ${number} 號` : ''}，請決定是否要使用毒藥殺死某位玩家。如果決定使用，請指定目標玩家。回傳格式必須是 JSON: {"poison": true/false, "targetId": 數字或null}`,
        parser: 'poisonDecision'
    },
    guard: {
        instruction: (role, number) =>
            `你正在扮演狼人殺遊戲中的 ${role}${number ? ` 玩家 ${number} 號` : ''}，請決定要保護哪一位玩家。回傳格式必須是 JSON: {"targetId": 數字}`,
        parser: 'targetId'
    },
    check: {
        instruction: (role, number) =>
            `你正在扮演狼人殺遊戲中的 ${role}${number ? ` 玩家 ${number} 號` : ''}，請決定要查驗哪一位玩家的身份。回傳格式必須是 JSON: {"targetId": 數字}`,
        parser: 'targetId'
    },
    vote: {
        instruction: (role, number) =>
            `你正在扮演狼人殺遊戲中的 ${role}${number ? ` 玩家 ${number} 號` : ''}，請決定要投票驅逐哪一位玩家。回傳格式必須是 JSON: {"targetId": 數字}`,
        parser: 'targetId'
    }
};

export class DecisionEngine {
    /**
     * @param {AIService} aiService - AI 服務實例
     */
    constructor(aiService = null) {
        this._aiService = aiService || new AIService();
    }

    /**
     * 設定 AI 服務
     */
    setAIService(aiService) {
        this._aiService = aiService;
    }

    /**
     * 生成 AI 決策
     * @param {Object} params - 決策參數
     * @param {string} params.playerRole - 玩家角色
     * @param {string} params.decisionType - 決策類型 (kill/save/poison/guard/check/vote)
     * @param {Array} params.options - 可選目標
     * @param {string} params.gameContext - 遊戲上下文
     * @param {number} params.playerNumber - 玩家編號
     * @param {Object} params.gameHistory - 遊戲歷史
     * @param {Object} params.gameStatus - 遊戲狀態
     * @param {string} params.customInstruction - 自訂指令
     */
    async generateDecision(params) {
        const {
            playerRole,
            decisionType,
            options,
            gameContext,
            playerNumber = null,
            gameHistory = null,
            gameStatus = null,
            customInstruction = null
        } = params;

        // 取得決策類型配置
        const config = DECISION_PROMPTS[decisionType];
        if (!config) {
            return { error: `未知的決策類型: ${decisionType}` };
        }

        // 建構 prompt
        const systemInstruction = customInstruction || config.instruction(playerRole, playerNumber);
        const prompt = this._buildPrompt(options, gameContext, gameHistory, gameStatus);

        // 呼叫 AI 服務
        const response = await this._aiService.generateText(prompt, { systemInstruction });

        // 解析回應
        return this._parseDecision(response, decisionType, config.parser);
    }

    /**
     * 建構完整的 prompt
     */
    _buildPrompt(options, gameContext, gameHistory, gameStatus) {
        let parts = [];

        // 添加遊戲歷史
        if (gameHistory && gameHistory.length > 0) {
            const historyText = this._formatHistory(gameHistory);
            parts.push(`【遊戲完整上下文】\n${historyText}`);
        }

        // 添加當前情境
        parts.push(`【當前情境】\n${gameContext}`);

        // 添加可選選項
        const optionsText = this._formatOptions(options);
        if (optionsText) {
            parts.push(optionsText);
        }

        // 添加遊戲狀態
        if (gameStatus) {
            parts.push(`【遊戲狀態】\n${JSON.stringify(gameStatus, null, 2)}`);
        }

        return parts.join('\n\n');
    }

    /**
     * 格式化選項列表
     */
    _formatOptions(options) {
        if (!options) return '';

        if (Array.isArray(options)) {
            const lines = options.map(opt => {
                if (typeof opt === 'object') {
                    let text = `ID: ${opt.id}, 名稱: ${opt.name}`;
                    if (opt.role) text += `, 角色: ${opt.role}`;
                    if (opt.isAlive === false) text += ' (已死亡)';
                    return text;
                }
                return String(opt);
            });
            return `可選目標：\n${lines.join('\n')}`;
        }

        return `選項：${JSON.stringify(options)}`;
    }

    /**
     * 格式化遊戲歷史
     */
    _formatHistory(history) {
        if (Array.isArray(history)) {
            return history.map(h => `[${h.role}] ${h.message}`).join('\n');
        }
        if (typeof history === 'string') {
            return history;
        }
        return JSON.stringify(history);
    }

    /**
     * 解析 AI 回應為決策結果
     */
    // eslint-disable-next-line no-unused-vars
    _parseDecision(response, decisionType, _parserType) {
        // 已經是錯誤
        if (response.error) {
            return response;
        }

        // 如果已經是解析好的物件
        if (response.targetId !== undefined || response.save !== undefined || response.poison !== undefined) {
            return response;
        }

        // 如果是純文字回應
        const text = response.response;
        if (!text) {
            return { error: '未獲得有效回應' };
        }

        // 嘗試從文字中提取 JSON
        const jsonMatch = text.match(/\{[^]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch {
                // JSON 解析失敗，繼續嘗試文字解析
            }
        }

        // 根據決策類型進行文字解析
        return this._parseFromText(text, decisionType);
    }

    /**
     * 從純文字中提取決策
     */
    _parseFromText(text, decisionType) {
        switch (decisionType) {
            case 'kill':
            case 'guard':
            case 'check':
            case 'vote':
                return this._extractTargetId(text);

            case 'save':
                return this._extractBooleanDecision(text, 'save');

            case 'poison':
                return this._extractPoisonDecision(text);

            default:
                return { error: '無法解析決策', raw: text };
        }
    }

    /**
     * 從文字中提取目標 ID
     */
    _extractTargetId(text) {
        const patterns = [
            /ID[:\s]*(\d+)/i,
            /玩家[:\s]*(\d+)/,
            /選擇[:\s]*(\d+)/,
            /(\d+)\s*號/,
            /targetId["\s:]+(\d+)/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return { targetId: parseInt(match[1]) };
            }
        }

        return { error: '無法從回應中提取目標 ID', raw: text };
    }

    /**
     * 提取布林決策
     */
    _extractBooleanDecision(text, field) {
        const yesPatterns = /是|同意|使用|救活|選擇使用|true/i;
        const noPatterns = /否|不|放棄|不使用|不救|false/i;

        const hasYes = yesPatterns.test(text);
        const hasNo = noPatterns.test(text);

        return { [field]: hasYes && !hasNo };
    }

    /**
     * 提取毒藥決策
     */
    _extractPoisonDecision(text) {
        const yesPatterns = /是|同意|使用|毒死|選擇使用|true/i;
        const noPatterns = /否|不|放棄|不使用|不毒|false/i;

        const usePoison = yesPatterns.test(text) && !noPatterns.test(text);

        if (usePoison) {
            const targetResult = this._extractTargetId(text);
            return {
                poison: true,
                targetId: targetResult.targetId || null
            };
        }

        return { poison: false, targetId: null };
    }

    // ========== 便捷方法 ==========

    /**
     * 狼人殺人決策
     */
    async generateKillDecision(role, targets, context, playerNumber, gameHistory, gameStatus) {
        return this.generateDecision({
            playerRole: role,
            decisionType: 'kill',
            options: targets,
            gameContext: context,
            playerNumber,
            gameHistory,
            gameStatus
        });
    }

    /**
     * 女巫救人決策
     */
    async generateSaveDecision(role, targetInfo, context, playerNumber, gameHistory, gameStatus) {
        return this.generateDecision({
            playerRole: role,
            decisionType: 'save',
            options: targetInfo,
            gameContext: context,
            playerNumber,
            gameHistory,
            gameStatus
        });
    }

    /**
     * 女巫毒人決策
     */
    async generatePoisonDecision(role, targets, context, playerNumber, gameHistory, gameStatus) {
        return this.generateDecision({
            playerRole: role,
            decisionType: 'poison',
            options: targets,
            gameContext: context,
            playerNumber,
            gameHistory,
            gameStatus
        });
    }

    /**
     * 守衛保護決策
     */
    async generateGuardDecision(role, targets, context, playerNumber, gameHistory, gameStatus) {
        return this.generateDecision({
            playerRole: role,
            decisionType: 'guard',
            options: targets,
            gameContext: context,
            playerNumber,
            gameHistory,
            gameStatus
        });
    }

    /**
     * 預言家查驗決策
     */
    async generateCheckDecision(role, targets, context, playerNumber, gameHistory, gameStatus) {
        return this.generateDecision({
            playerRole: role,
            decisionType: 'check',
            options: targets,
            gameContext: context,
            playerNumber,
            gameHistory,
            gameStatus
        });
    }

    /**
     * 投票決策
     */
    async generateVoteDecision(role, targets, context, playerNumber, gameHistory, gameStatus) {
        return this.generateDecision({
            playerRole: role,
            decisionType: 'vote',
            options: targets,
            gameContext: context,
            playerNumber,
            gameHistory,
            gameStatus
        });
    }
}

// 單例匯出
export const decisionEngine = new DecisionEngine();
export default DecisionEngine;
