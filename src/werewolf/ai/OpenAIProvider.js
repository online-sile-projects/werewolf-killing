/**
 * OpenAI Provider
 * 支援 GPT-4o 文字、DALL-E 3 圖像、TTS 語音
 */

import AIProvider from './AIProvider.js';

export class OpenAIProvider extends AIProvider {
    constructor(apiKey = '') {
        super(apiKey);
        this.name = 'openai';
        this.baseUrl = 'https://api.openai.com/v1';
    }

    getSupportedFeatures() {
        return ['text', 'image', 'voice', 'imageEdit'];
    }

    getSupportedVoices() {
        return [
            { id: 'alloy', name: 'Alloy', description: '中性平衡' },
            { id: 'echo', name: 'Echo', description: '沉穩男聲' },
            { id: 'fable', name: 'Fable', description: '溫暖敘事' },
            { id: 'onyx', name: 'Onyx', description: '深沉男聲' },
            { id: 'nova', name: 'Nova', description: '活潑女聲' },
            { id: 'shimmer', name: 'Shimmer', description: '柔和女聲' }
        ];
    }

    async testConnection() {
        if (!this.hasApiKey()) {
            return { success: false, error: '未設定 OpenAI API Key' };
        }

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: '測試連線' }],
                    max_tokens: 10
                })
            });

            const data = await response.json();

            if (response.ok && data.choices) {
                return { success: true };
            }
            return { success: false, error: data.error?.message || '連線失敗' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async generateText(prompt, systemInstruction = null) {
        if (!this.hasApiKey()) {
            return { error: '未設定 OpenAI API Key' };
        }

        try {
            const messages = [];
            if (systemInstruction) {
                messages.push({ role: 'system', content: systemInstruction });
            }
            messages.push({ role: 'user', content: prompt });

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            const data = await response.json();

            if (response.ok && data.choices?.length > 0) {
                return { response: data.choices[0].message.content.trim() };
            }
            return { error: data.error?.message || '生成失敗' };
        } catch (error) {
            return { error: error.message };
        }
    }

    async generateImage(prompt, options = {}) {
        if (!this.hasApiKey()) {
            return { error: '未設定 OpenAI API Key' };
        }

        try {
            const response = await fetch(`${this.baseUrl}/images/generations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'dall-e-3',
                    prompt: prompt,
                    n: 1,
                    size: options.size || '1024x1024',
                    quality: options.quality || 'standard',
                    response_format: options.responseFormat || 'url'
                })
            });

            const data = await response.json();

            if (response.ok && data.data?.length > 0) {
                const result = data.data[0];
                return {
                    imageUrl: result.url,
                    base64: result.b64_json,
                    revisedPrompt: result.revised_prompt
                };
            }
            return { error: data.error?.message || '圖像生成失敗' };
        } catch (error) {
            return { error: error.message };
        }
    }

    async editImage(baseImageUrl, prompt, options = {}) {
        // OpenAI 的圖像編輯需要先下載圖片再上傳
        // 目前使用 variation 或 inpainting
        // 這裡簡化處理：使用 prompt 描述原圖 + 新需求
        const fullPrompt = `Based on this description: "${options.originalDescription || 'character portrait'}". ${prompt}`;
        return this.generateImage(fullPrompt, options);
    }

    async generateVoice(text, voice = 'alloy', options = {}) {
        if (!this.hasApiKey()) {
            return { error: '未設定 OpenAI API Key' };
        }

        try {
            const response = await fetch(`${this.baseUrl}/audio/speech`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'tts-1',
                    input: text,
                    voice: voice,
                    speed: options.speed || 1.0,
                    response_format: 'mp3'
                })
            });

            if (response.ok) {
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);

                // 轉換為 base64
                const reader = new FileReader();
                const base64Promise = new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(audioBlob);
                });
                const audioBase64 = await base64Promise;

                return { audioUrl, audioBase64 };
            }

            const data = await response.json();
            return { error: data.error?.message || '語音生成失敗' };
        } catch (error) {
            return { error: error.message };
        }
    }
}

export default OpenAIProvider;
