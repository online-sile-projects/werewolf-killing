/**
 * AI 模組入口
 * 統一匯出所有 AI 相關元件
 */

// 原有的 Provider 架構（用於更進階的使用場景）
import AIProvider from './AIProvider.js';
import OpenAIProvider from './OpenAIProvider.js';
import GeminiProvider from './GeminiProvider.js';

// 新的統一服務層
import { AIService, aiService } from './AIService.js';
import { DecisionEngine, decisionEngine } from './decisionEngine.js';

/**
 * AIManager - 管理多個 Provider（保持向後相容）
 */
export class AIManager {
    constructor() {
        this.providers = {
            openai: new OpenAIProvider(),
            gemini: new GeminiProvider()
        };
        this.currentProvider = 'gemini';
    }

    /**
     * 設定 API Key
     */
    setApiKey(providerName, apiKey) {
        if (this.providers[providerName]) {
            this.providers[providerName].setApiKey(apiKey);
            return true;
        }
        return false;
    }

    /**
     * 切換當前 Provider
     */
    setProvider(providerName) {
        if (this.providers[providerName]) {
            this.currentProvider = providerName;
            return true;
        }
        return false;
    }

    /**
     * 取得當前 Provider
     */
    getProvider() {
        return this.providers[this.currentProvider];
    }

    /**
     * 取得指定 Provider
     */
    getProviderByName(name) {
        return this.providers[name];
    }

    /**
     * 文字生成 (使用當前 Provider)
     */
    async generateText(prompt, systemInstruction = null) {
        return this.getProvider().generateText(prompt, systemInstruction);
    }

    /**
     * 圖像生成 (優先使用支援的 Provider)
     */
    async generateImage(prompt, options = {}) {
        const provider = options.provider
            ? this.providers[options.provider]
            : this.getProvider();

        if (!provider.supports('image')) {
            // 嘗試其他 Provider
            for (const p of Object.values(this.providers)) {
                if (p.supports('image') && p.hasApiKey()) {
                    return p.generateImage(prompt, options);
                }
            }
            return { error: '沒有可用的圖像生成 Provider' };
        }

        return provider.generateImage(prompt, options);
    }

    /**
     * 圖像編輯
     */
    async editImage(baseImageUrl, prompt, options = {}) {
        const provider = options.provider
            ? this.providers[options.provider]
            : this.getProvider();

        if (!provider.supports('imageEdit')) {
            for (const p of Object.values(this.providers)) {
                if (p.supports('imageEdit') && p.hasApiKey()) {
                    return p.editImage(baseImageUrl, prompt, options);
                }
            }
            return { error: '沒有可用的圖像編輯 Provider' };
        }

        return provider.editImage(baseImageUrl, prompt, options);
    }

    /**
     * 語音生成
     */
    async generateVoice(text, voice, options = {}) {
        // 優先使用 OpenAI TTS
        const openai = this.providers.openai;
        if (openai.hasApiKey()) {
            return openai.generateVoice(text, voice, options);
        }

        return { error: '請設定 OpenAI API Key 以使用語音功能' };
    }

    /**
     * 測試所有 Provider
     */
    async testAllConnections() {
        const results = {};
        for (const [name, provider] of Object.entries(this.providers)) {
            if (provider.hasApiKey()) {
                results[name] = await provider.testConnection();
            } else {
                results[name] = { success: false, error: '未設定 API Key' };
            }
        }
        return results;
    }
}

// ========== 匯出 ==========

// Provider 架構
export { AIProvider, OpenAIProvider, GeminiProvider };

// 新的服務層
export { AIService, aiService, DecisionEngine, decisionEngine };

// AIManager（向後相容）
export const aiManager = new AIManager();

export default aiManager;
