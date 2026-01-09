/**
 * NPC 服務模組 - 管理 NPC 角色與 AI 生成
 */

import { NPC_CHARACTERS, EMOTIONS, PERSONALITY_TYPES } from './npcCharacters.js';

/**
 * NPC 服務類別
 */
export class NpcService {
    constructor() {
        this.characters = [...NPC_CHARACTERS];
        this.assignedNpcs = new Map(); // playerId -> npcCharacter
    }

    /**
     * 取得所有 NPC 角色
     */
    getAllCharacters() {
        return this.characters;
    }

    /**
     * 根據 ID 取得 NPC
     */
    getCharacterById(id) {
        return this.characters.find(c => c.id === id);
    }

    /**
     * 為遊戲玩家分配 NPC
     * @param {Array} players - 遊戲玩家列表 (排除人類玩家)
     */
    assignNpcsToPlayers(players) {
        const shuffled = [...this.characters].sort(() => Math.random() - 0.5);
        const npcPlayers = players.filter(p => !p.isHuman);

        npcPlayers.forEach((player, index) => {
            if (index < shuffled.length) {
                this.assignedNpcs.set(player.id, shuffled[index]);
            }
        });

        return this.assignedNpcs;
    }

    /**
     * 取得玩家的 NPC 資料
     */
    getNpcForPlayer(playerId) {
        return this.assignedNpcs.get(playerId);
    }

    /**
     * 上傳自訂 NPC 圖像
     * @param {string} npcId - NPC ID
     * @param {string} imageUrl - 圖像 URL 或 base64
     */
    setNpcBaseImage(npcId, imageUrl) {
        const npc = this.characters.find(c => c.id === npcId);
        if (npc) {
            npc.appearance.baseImageUrl = imageUrl;
            return true;
        }
        return false;
    }

    /**
     * 生成圖像 prompt (用於 AI 圖像生成)
     * 結合年齡、職業、外觀描述
     */
    generateImagePrompt(npcId, emotion = null) {
        const npc = this.getCharacterById(npcId);
        if (!npc) return null;

        const { age, profession, appearance } = npc;
        const { gender, physicalDesc, style } = appearance;

        // 基礎描述
        let prompt = `A ${age} year old ${gender === 'male' ? '亞洲男性' : '亞洲女性'}, `;
        prompt += `profession: ${profession}, `;
        prompt += `${physicalDesc}, `;
        prompt += `style: ${style}`;

        // 如果有情緒，加入表情描述
        if (emotion && EMOTIONS[emotion]) {
            prompt += `, facial expression: ${EMOTIONS[emotion].name}`;
        }

        prompt += `. High quality portrait, game character art style.`;

        return prompt;
    }

    /**
     * 生成對話圖像 prompt (基於原圖 + 情緒)
     * @param {string} npcId - NPC ID
     * @param {string} emotion - 情緒狀態
     * @returns 圖像生成所需資訊
     */
    generateDialogueImagePrompt(npcId, emotion) {
        const npc = this.getCharacterById(npcId);
        if (!npc) return null;

        const emotionData = EMOTIONS[emotion] || EMOTIONS.calm;

        return {
            baseImageUrl: npc.appearance.baseImageUrl,
            prompt: `Same character, ${emotionData.name} expression, ${emotionData.description}`,
            emotion: emotion,
            npcId: npcId
        };
    }

    /**
     * 生成 NPC 個性化 system prompt (用於 AI 對話)
     * @param {string} npcId - NPC ID
     * @param {string} gameRole - 遊戲角色 (狼人/村民等)
     */
    generatePersonalityPrompt(npcId, gameRole = null) {
        const npc = this.getCharacterById(npcId);
        if (!npc) return '';

        const { name, age, profession, personality } = npc;
        const personalityType = PERSONALITY_TYPES[personality.type];

        let prompt = `你是「${name}」，${age}歲，職業是${profession}。\n\n`;
        prompt += `【個性特徵】\n`;
        prompt += `- 性格類型：${personalityType.name}\n`;
        prompt += `- 特質：${personality.traits.join('、')}\n`;
        prompt += `- 說話風格：${personality.speechStyle}\n`;
        prompt += `- 行為傾向：${personalityType.behavior}\n\n`;

        if (gameRole) {
            const roleBehavior = personalityType.roleAffinity[gameRole === '狼人' ? 'werewolf' : 'villager'];
            prompt += `【角色行為】\n`;
            prompt += `作為${gameRole}，你會：${roleBehavior}\n\n`;
        }

        prompt += `【回應要求】\n`;
        prompt += `- 用第一人稱「我」說話\n`;
        prompt += `- 保持角色個性一致\n`;
        prompt += `- 回應長度約 50-100 字\n`;
        prompt += `- 回應必須包含情緒標記：[emotion:happy/scared/angry/sad/suspicious/confident/nervous/calm]`;

        return prompt;
    }

    /**
     * 解析 AI 回應中的情緒標記
     * @param {string} response - AI 回應文字
     */
    parseEmotionFromResponse(response) {
        const emotionMatch = response.match(/\[emotion:(\w+)\]/);
        if (emotionMatch && EMOTIONS[emotionMatch[1]]) {
            return {
                text: response.replace(/\[emotion:\w+\]/g, '').trim(),
                emotion: emotionMatch[1]
            };
        }
        return {
            text: response,
            emotion: 'calm'
        };
    }

    /**
     * 生成語音參數 (用於 TTS)
     * @param {string} npcId - NPC ID
     * @param {string} text - 對話文字
     * @param {string} emotion - 情緒狀態
     */
    generateVoiceParams(npcId, text, emotion) {
        const npc = this.getCharacterById(npcId);
        if (!npc) return null;

        const emotionData = EMOTIONS[emotion] || EMOTIONS.calm;

        return {
            text: text,
            voice: npc.voice.type,
            emotion: emotion,
            emotionDesc: emotionData.description,
            // 語速/語調調整 (根據情緒)
            speed: this._getSpeedByEmotion(emotion),
            pitch: this._getPitchByEmotion(emotion)
        };
    }

    /**
     * 根據情緒調整語速
     */
    _getSpeedByEmotion(emotion) {
        const speeds = {
            happy: 1.1,
            scared: 1.2,
            angry: 1.15,
            sad: 0.85,
            suspicious: 0.9,
            confident: 1.0,
            nervous: 1.25,
            calm: 1.0
        };
        return speeds[emotion] || 1.0;
    }

    /**
     * 根據情緒調整音調
     */
    _getPitchByEmotion(emotion) {
        const pitches = {
            happy: 1.1,
            scared: 1.2,
            angry: 1.15,
            sad: 0.9,
            suspicious: 0.95,
            confident: 1.0,
            nervous: 1.1,
            calm: 1.0
        };
        return pitches[emotion] || 1.0;
    }

    /**
     * 清除分配
     */
    clearAssignments() {
        this.assignedNpcs.clear();
    }
}

// 單例匯出
export const npcService = new NpcService();
export default npcService;
