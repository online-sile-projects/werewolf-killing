/**
 * AIService - 統一的 AI 服務層
 * 整合所有 AI 提供商的呼叫，提供一致的介面
 */

import { ApiKeyManager } from '../config/ApiKeyManager.js';

export class AIService {
    /**
     * @param {ApiKeyManager} keyManager - API 金鑰管理器
     */
    constructor(keyManager = null) {
        this._keyManager = keyManager || new ApiKeyManager().init();
    }

    /**
     * 設定金鑰管理器
     */
    setKeyManager(keyManager) {
        this._keyManager = keyManager;
    }

    // ========== 連線測試 ==========

    /**
     * 測試 API 連線（含重試機制）
     */
    async testConnection(provider = null) {
        const targetProvider = provider || this._keyManager.getAvailableProvider();
        const apiKey = this._keyManager.getApiKey(targetProvider);

        if (!apiKey) {
            return {
                success: false,
                error: `請先設定 ${targetProvider} API 金鑰`
            };
        }

        const maxRetries = 2;
        let retryCount = 0;
        let lastError = null;

        while (retryCount <= maxRetries) {
            try {
                const result = targetProvider === 'gemini'
                    ? await this._testGemini(apiKey)
                    : await this._testOpenAI(apiKey);

                if (result.success) {
                    return result;
                }

                lastError = result.error;

                // 503 或網路錯誤可重試
                if (this._isRetryableError(lastError)) {
                    retryCount++;
                    if (retryCount <= maxRetries) {
                        await this._delay(1000);
                        continue;
                    }
                }

                return result;
            } catch (error) {
                lastError = error.message;
                if (this._isRetryableError(error.message)) {
                    retryCount++;
                    if (retryCount <= maxRetries) {
                        await this._delay(1000);
                        continue;
                    }
                }
                return { success: false, error: lastError };
            }
        }

        return { success: false, error: lastError || '重試後仍然失敗' };
    }

    _isRetryableError(errorMsg) {
        return errorMsg && (
            errorMsg.includes('503') ||
            errorMsg.includes('服務暫時不可用') ||
            errorMsg.includes('網路')
        );
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async _testGemini(apiKey) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: '測試連線' }] }],
                        generationConfig: { temperature: 0.7, maxOutputTokens: 10 }
                    })
                }
            );

            if (!response.ok) {
                return {
                    success: false,
                    error: this._parseGeminiError(response.status)
                };
            }

            const data = await response.json();
            return {
                success: !!(data.candidates && data.candidates.length > 0)
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    _parseGeminiError(status) {
        const errors = {
            400: '請求格式錯誤',
            401: 'API 金鑰無效或未獲授權',
            403: '無權限使用此 API',
            429: 'API 呼叫次數超過限制',
            500: 'Gemini 伺服器內部錯誤',
            503: 'Gemini 服務暫時不可用'
        };
        return errors[status] || `API 回應錯誤 (HTTP ${status})`;
    }

    async _testOpenAI(apiKey) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: '測試連線' }],
                    temperature: 0.7,
                    max_tokens: 10
                })
            });

            const data = await response.json();
            return {
                success: response.ok && !!(data.choices && data.choices.length > 0),
                error: data.error?.message
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ========== 文字生成 ==========

    /**
     * 生成文字回應
     * @param {string} prompt - 使用者提示
     * @param {Object} options - 選項
     * @param {string} options.systemInstruction - 系統指令
     * @param {string} options.provider - 指定提供商
     * @param {number} options.maxTokens - 最大 token 數
     */
    async generateText(prompt, options = {}) {
        const { systemInstruction, provider, maxTokens = 500 } = options;
        const targetProvider = provider || this._keyManager.getAvailableProvider();
        const apiKey = this._keyManager.getApiKey(targetProvider);

        if (!apiKey) {
            return { error: `未設定 ${targetProvider} API Key` };
        }

        try {
            if (targetProvider === 'gemini') {
                return await this._callGemini(prompt, systemInstruction, maxTokens, apiKey);
            } else {
                return await this._callOpenAI(prompt, systemInstruction, maxTokens, apiKey);
            }
        } catch (error) {
            console.error(`呼叫 ${targetProvider} API 出錯:`, error);
            return { error: error.message };
        }
    }

    async _callGemini(prompt, systemInstruction, maxTokens, apiKey) {
        const requestBody = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens }
        };

        if (systemInstruction) {
            requestBody.system_instruction = { parts: [{ text: systemInstruction }] };
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            }
        );

        const data = await response.json();

        if (response.ok && data.candidates && data.candidates.length > 0) {
            const text = data.candidates[0].content.parts[0].text;
            return this._parseResponse(text);
        }

        return { error: data.error?.message || '未知錯誤' };
    }

    async _callOpenAI(prompt, systemInstruction, maxTokens, apiKey) {
        const messages = [];
        if (systemInstruction) {
            messages.push({ role: 'system', content: systemInstruction });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages,
                temperature: 0.7,
                max_tokens: maxTokens
            })
        });

        const data = await response.json();

        if (response.ok && data.choices && data.choices.length > 0) {
            const text = data.choices[0].message.content.trim();
            return this._parseResponse(text);
        }

        return { error: data.error?.message || '未知錯誤' };
    }

    /**
     * 嘗試解析回應為 JSON，否則返回原始文字
     */
    _parseResponse(text) {
        if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
            try {
                return JSON.parse(text);
            } catch {
                // 解析失敗，返回原始文字
            }
        }
        return { response: text };
    }

    // ========== 便捷方法（委託給金鑰管理器）==========

    setApiKey(provider, key) {
        return this._keyManager.setApiKey(provider, key);
    }

    getApiKey(provider) {
        return this._keyManager.getApiKey(provider);
    }

    setProvider(provider) {
        return this._keyManager.setCurrentProvider(provider);
    }

    getCurrentProvider() {
        return this._keyManager.getCurrentProvider();
    }
}

// 單例匯出
export const aiService = new AIService();
export default AIService;
