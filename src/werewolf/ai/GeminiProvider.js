/**
 * Gemini Provider
 * 支援 Gemini 2.0 文字、Imagen 圖像、Gemini TTS
 */

import AIProvider from './AIProvider.js';

export class GeminiProvider extends AIProvider {
    constructor(apiKey = '') {
        super(apiKey);
        this.name = 'gemini';
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    }

    getSupportedFeatures() {
        return ['text', 'image', 'voice'];
    }

    getSupportedVoices() {
        // Gemini TTS 目前聲音選項較少
        return [
            { id: 'default', name: 'Default', description: '預設聲音' },
            { id: 'male', name: 'Male', description: '男聲' },
            { id: 'female', name: 'Female', description: '女聲' }
        ];
    }

    async testConnection() {
        if (!this.hasApiKey()) {
            return { success: false, error: '未設定 Gemini API Key' };
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: '測試連線' }] }],
                        generationConfig: { maxOutputTokens: 10 }
                    })
                }
            );

            const data = await response.json();

            if (response.ok && data.candidates?.length > 0) {
                return { success: true };
            }
            return { success: false, error: data.error?.message || '連線失敗' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async generateText(prompt, systemInstruction = null) {
        if (!this.hasApiKey()) {
            return { error: '未設定 Gemini API Key' };
        }

        try {
            const requestBody = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500
                }
            };

            if (systemInstruction) {
                requestBody.system_instruction = {
                    parts: [{ text: systemInstruction }]
                };
            }

            const response = await fetch(
                `${this.baseUrl}/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                }
            );

            const data = await response.json();

            if (response.ok && data.candidates?.length > 0) {
                const text = data.candidates[0].content.parts[0].text;
                return { response: text };
            }
            return { error: data.error?.message || '生成失敗' };
        } catch (error) {
            return { error: error.message };
        }
    }

    // eslint-disable-next-line no-unused-vars
    async generateImage(prompt, options = {}) {
        if (!this.hasApiKey()) {
            return { error: '未設定 Gemini API Key' };
        }

        try {
            // 使用 Gemini 2.0 的圖像生成功能
            const response = await fetch(
                `${this.baseUrl}/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: `Generate an image: ${prompt}` }]
                        }],
                        generationConfig: {
                            responseModalities: ['IMAGE', 'TEXT']
                        }
                    })
                }
            );

            const data = await response.json();

            if (response.ok && data.candidates?.length > 0) {
                const parts = data.candidates[0].content.parts;
                const imagePart = parts.find(p => p.inlineData);

                if (imagePart) {
                    return {
                        base64: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
                        mimeType: imagePart.inlineData.mimeType
                    };
                }
            }
            return { error: data.error?.message || '圖像生成失敗' };
        } catch (error) {
            return { error: error.message };
        }
    }

    // eslint-disable-next-line no-unused-vars
    async editImage(baseImageUrl, prompt, options = {}) {
        // Gemini 支援圖片+文字輸入
        if (!this.hasApiKey()) {
            return { error: '未設定 Gemini API Key' };
        }

        try {
            // 如果 baseImageUrl 是 base64
            let imageData = baseImageUrl;
            let mimeType = 'image/jpeg';

            if (baseImageUrl.startsWith('data:')) {
                const match = baseImageUrl.match(/data:(.*?);base64,(.*)/);
                if (match) {
                    mimeType = match[1];
                    imageData = match[2];
                }
            }

            const response = await fetch(
                `${this.baseUrl}/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { inlineData: { mimeType, data: imageData } },
                                { text: `Edit this image: ${prompt}` }
                            ]
                        }],
                        generationConfig: {
                            responseModalities: ['IMAGE', 'TEXT']
                        }
                    })
                }
            );

            const data = await response.json();

            if (response.ok && data.candidates?.length > 0) {
                const parts = data.candidates[0].content.parts;
                const imagePart = parts.find(p => p.inlineData);

                if (imagePart) {
                    return {
                        base64: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
                    };
                }
            }
            return { error: data.error?.message || '圖像編輯失敗' };
        } catch (error) {
            return { error: error.message };
        }
    }

    // eslint-disable-next-line no-unused-vars
    async generateVoice(text, voice = 'default', options = {}) {
        // Gemini TTS - 使用 Cloud Text-to-Speech 或內建功能
        // 目前 Gemini 的 TTS 能力有限，這裡提供基本實作
        if (!this.hasApiKey()) {
            return { error: '未設定 Gemini API Key' };
        }

        // 注意：Gemini 原生 TTS 可能需要不同的 API
        // 這裡暫時返回錯誤建議使用 OpenAI TTS
        return {
            error: 'Gemini TTS 功能開發中，建議使用 OpenAI TTS',
            fallback: 'openai'
        };
    }
}

export default GeminiProvider;
