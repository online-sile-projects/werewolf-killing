/**
 * AI Provider 抽象介面
 * 定義所有 AI 提供商必須實作的方法
 */

export class AIProvider {
    constructor(apiKey) {
        if (new.target === AIProvider) {
            throw new Error('AIProvider 是抽象類別，不能直接實例化');
        }
        this.apiKey = apiKey;
        this.name = 'abstract';
    }

    /**
     * 取得提供商名稱
     */
    getName() {
        return this.name;
    }

    /**
     * 設定 API Key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * 檢查是否已設定 API Key
     */
    hasApiKey() {
        return !!this.apiKey;
    }

    /**
     * 測試 API 連線
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async testConnection() {
        throw new Error('子類別必須實作 testConnection()');
    }

    /**
     * 文字生成
     * @param {string} prompt - 使用者提示
     * @param {string} systemInstruction - 系統指令
     * @returns {Promise<{response?: string, error?: string}>}
     */
    // eslint-disable-next-line no-unused-vars
    async generateText(prompt, systemInstruction = null) {
        throw new Error('子類別必須實作 generateText()');
    }

    /**
     * 圖像生成
     * @param {string} prompt - 圖像描述
     * @param {Object} options - 選項 (size, quality 等)
     * @returns {Promise<{imageUrl?: string, base64?: string, error?: string}>}
     */
    // eslint-disable-next-line no-unused-vars
    async generateImage(prompt, options = {}) {
        throw new Error('子類別必須實作 generateImage()');
    }

    /**
     * 圖像編輯 (基於現有圖像生成)
     * @param {string} baseImageUrl - 基礎圖像 URL 或 base64
     * @param {string} prompt - 編輯描述
     * @param {Object} options - 選項
     * @returns {Promise<{imageUrl?: string, base64?: string, error?: string}>}
     */
    // eslint-disable-next-line no-unused-vars
    async editImage(baseImageUrl, prompt, options = {}) {
        throw new Error('子類別必須實作 editImage()');
    }

    /**
     * 語音生成 (TTS)
     * @param {string} text - 要轉換的文字
     * @param {string} voice - 聲音類型
     * @param {Object} options - 選項 (speed, emotion 等)
     * @returns {Promise<{audioUrl?: string, audioBase64?: string, error?: string}>}
     */
    // eslint-disable-next-line no-unused-vars
    async generateVoice(text, voice, options = {}) {
        throw new Error('子類別必須實作 generateVoice()');
    }

    /**
     * 取得支援的聲音類型列表
     * @returns {Array<{id: string, name: string, description: string}>}
     */
    getSupportedVoices() {
        throw new Error('子類別必須實作 getSupportedVoices()');
    }

    /**
     * 檢查是否支援某功能
     * @param {string} feature - 功能名稱 (text/image/voice/imageEdit)
     */
    supports(feature) {
        const supported = this.getSupportedFeatures();
        return supported.includes(feature);
    }

    /**
     * 取得支援的功能列表
     * @returns {Array<string>}
     */
    getSupportedFeatures() {
        return ['text']; // 預設只支援文字
    }
}

export default AIProvider;
