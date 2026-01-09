/**
 * ApiKeyManager - API 金鑰管理
 * 負責 API 金鑰的儲存、載入和驗證
 * 支援瀏覽器 localStorage 和 Node.js 環境變數
 */

const STORAGE_KEYS = {
    GEMINI_KEY: 'geminiApiKey',
    OPENAI_KEY: 'openaiApiKey',
    CURRENT_PROVIDER: 'currentProvider'
};

// 檢測是否為 Node.js 環境
const isNode = typeof window === 'undefined' && typeof process !== 'undefined';

export class ApiKeyManager {
    constructor() {
        this._providers = ['gemini', 'openai'];
        this._currentProvider = 'gemini';
        this._apiKeys = {
            gemini: '',
            openai: ''
        };
        this._isNode = isNode;
    }

    /**
     * 初始化：從 localStorage 或環境變數載入設定
     */
    init() {
        if (this._isNode) {
            this.loadFromEnv();
        } else {
            this.loadFromStorage();
        }
        return this;
    }

    /**
     * 從環境變數載入 API 金鑰 (Node.js)
     */
    loadFromEnv() {
        try {
            if (typeof process !== 'undefined' && process.env) {
                if (process.env.GEMINI_API_KEY) {
                    this._apiKeys.gemini = process.env.GEMINI_API_KEY;
                }
                if (process.env.OPENAI_API_KEY) {
                    this._apiKeys.openai = process.env.OPENAI_API_KEY;
                }
            }
        } catch (error) {
            console.warn('無法從環境變數載入 API 金鑰:', error.message);
        }
    }

    /**
     * 從 localStorage 載入 API 金鑰 (瀏覽器)
     */
    loadFromStorage() {
        try {
            if (typeof localStorage !== 'undefined') {
                this._providers.forEach(provider => {
                    const key = localStorage.getItem(`${provider}ApiKey`);
                    if (key) {
                        this._apiKeys[provider] = key;
                    }
                });

                const savedProvider = localStorage.getItem(STORAGE_KEYS.CURRENT_PROVIDER);
                if (savedProvider && this._providers.includes(savedProvider)) {
                    this._currentProvider = savedProvider;
                }
            }
        } catch (error) {
            console.warn('無法從 localStorage 載入 API 金鑰:', error);
        }
    }

    /**
     * 儲存 API 金鑰到 localStorage
     */
    saveToStorage() {
        if (this._isNode) {
            // Node.js 環境不儲存到 localStorage
            return;
        }

        try {
            if (typeof localStorage !== 'undefined') {
                this._providers.forEach(provider => {
                    const key = this._apiKeys[provider];
                    if (key) {
                        localStorage.setItem(`${provider}ApiKey`, key);
                    } else {
                        localStorage.removeItem(`${provider}ApiKey`);
                    }
                });
                localStorage.setItem(STORAGE_KEYS.CURRENT_PROVIDER, this._currentProvider);
            }
        } catch (error) {
            console.warn('無法儲存 API 金鑰到 localStorage:', error);
        }
    }

    // ========== 金鑰管理 ==========

    /**
     * 設定 API 金鑰
     */
    setApiKey(provider, apiKey) {
        if (!this._providers.includes(provider)) {
            throw new Error(`不支援的提供商: ${provider}`);
        }
        this._apiKeys[provider] = apiKey || '';
        this.saveToStorage();
        return true;
    }

    /**
     * 取得 API 金鑰
     */
    getApiKey(provider = null) {
        const p = provider || this._currentProvider;
        return this._apiKeys[p] || '';
    }

    /**
     * 檢查是否有設定 API 金鑰
     */
    hasApiKey(provider = null) {
        const p = provider || this._currentProvider;
        return !!this._apiKeys[p];
    }

    /**
     * 檢查是否有任何 API 金鑰
     */
    hasAnyApiKey() {
        return this._providers.some(p => !!this._apiKeys[p]);
    }

    /**
     * 批次設定 API 金鑰
     */
    setApiKeys(geminiKey, openaiKey) {
        if (geminiKey !== undefined) {
            this._apiKeys.gemini = geminiKey || '';
        }
        if (openaiKey !== undefined) {
            this._apiKeys.openai = openaiKey || '';
        }
        this.saveToStorage();
    }

    /**
     * 清除所有 API 金鑰
     */
    clearAll() {
        this._apiKeys = { gemini: '', openai: '' };
        this.saveToStorage();
    }

    // ========== 提供商管理 ==========

    /**
     * 取得當前提供商
     */
    getCurrentProvider() {
        return this._currentProvider;
    }

    /**
     * 設定當前提供商
     */
    setCurrentProvider(provider) {
        if (!this._providers.includes(provider)) {
            throw new Error(`不支援的提供商: ${provider}`);
        }
        this._currentProvider = provider;
        this.saveToStorage();
        return true;
    }

    /**
     * 取得所有支援的提供商
     */
    getSupportedProviders() {
        return [...this._providers];
    }

    /**
     * 自動選擇有金鑰的提供商
     */
    getAvailableProvider() {
        if (this.hasApiKey(this._currentProvider)) {
            return this._currentProvider;
        }

        for (const provider of this._providers) {
            if (this.hasApiKey(provider)) {
                return provider;
            }
        }

        return this._currentProvider;
    }

    // ========== 狀態快照 ==========

    /**
     * 取得當前狀態快照
     */
    getSnapshot() {
        return {
            currentProvider: this._currentProvider,
            hasGeminiKey: this.hasApiKey('gemini'),
            hasOpenaiKey: this.hasApiKey('openai')
        };
    }
}

// 單例匯出
export const apiKeyManager = new ApiKeyManager();
export default ApiKeyManager;
