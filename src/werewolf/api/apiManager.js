/**
 * ApiManager - API 管理器 (重構版)
 * 使用新的模組化架構，同時保持向後相容
 */
import { GameHistory } from '../history/GameHistory.js';
import { ApiKeyManager } from '../config/ApiKeyManager.js';
import { AIService } from '../ai/AIService.js';
import { DecisionEngine } from '../ai/decisionEngine.js';

export class ApiManager {
  constructor() {
    // 使用新的模組化元件
    this._keyManager = new ApiKeyManager();
    this._aiService = new AIService(this._keyManager);
    this._decisionEngine = new DecisionEngine(this._aiService);

    // 遊戲歷史紀錄
    this.gameHistory = new GameHistory();

    // 初始化
    this.init();
  }

  // ========== 初始化 ==========

  init() {
    this._keyManager.init();
    console.log('%c=== API 管理器已初始化 ===', 'color: #0099ff; font-weight: bold; font-size: 12px;');
    console.log('%c提示：使用 window.WerewolfApi.testApiConnection() 測試 API 連線', 'color: #ff9900;');
  }

  // ========== 向後相容的屬性 ==========

  get providers() {
    return this._keyManager.getSupportedProviders();
  }

  get currentProvider() {
    return this._keyManager.getCurrentProvider();
  }

  set currentProvider(value) {
    this._keyManager.setCurrentProvider(value);
  }

  get apiKeys() {
    return {
      gemini: this._keyManager.getApiKey('gemini'),
      openai: this._keyManager.getApiKey('openai')
    };
  }

  // ========== API 金鑰管理 (委託給 ApiKeyManager) ==========

  loadApiKeys() {
    this._keyManager.loadFromStorage();
    // 向後相容的日誌
    if (this._keyManager.hasApiKey('gemini')) {
      console.log('已載入 gemini API 金鑰');
    }
    if (this._keyManager.hasApiKey('openai')) {
      console.log('已載入 openai API 金鑰');
    }
  }

  saveApiKeys(geminiApiKey, openaiApiKey) {
    this._keyManager.setApiKeys(geminiApiKey, openaiApiKey);
    console.log('已成功儲存 API 金鑰設定');
  }

  setApiKey(provider, apiKey) {
    try {
      this._keyManager.setApiKey(provider, apiKey);
      console.log(`已設定 ${provider} API 金鑰`);
      return true;
    } catch (error) {
      console.error(error.message);
      return false;
    }
  }

  getApiKey(provider = null) {
    return this._keyManager.getApiKey(provider);
  }

  setProvider(provider) {
    try {
      this._keyManager.setCurrentProvider(provider);
      console.log(`已切換至 ${provider} 提供商`);
      return true;
    } catch (error) {
      console.error(error.message);
      return false;
    }
  }

  getCurrentProvider() {
    return this._keyManager.getCurrentProvider();
  }

  // ========== 遊戲歷史紀錄 ==========

  addGameMessage(role, message, phase, day) {
    this.gameHistory.addMessage(role, message, phase, day);
  }

  clearGameHistory() {
    return this.gameHistory.clear();
  }

  getGameHistory() {
    return this.gameHistory.getAllRecords();
  }

  // ========== API 連線測試 (委託給 AIService) ==========

  async testApiConnection(provider = null) {
    const targetProvider = provider || this._keyManager.getCurrentProvider();
    console.log(`正在測試 ${targetProvider} API 連線...`);

    const result = await this._aiService.testConnection(targetProvider);

    if (result.success) {
      console.log(`${targetProvider} API 連線測試成功！`);
    } else {
      console.error(`API 測試失敗: ${result.error}`);
    }

    return result;
  }

  // 向後相容：保留舊的測試方法（委託給 AIService 內部實作）
  async testGeminiApi(apiKey) {
    // 暫時設定金鑰並測試
    const oldKey = this._keyManager.getApiKey('gemini');
    this._keyManager.setApiKey('gemini', apiKey);
    const result = await this._aiService.testConnection('gemini');
    this._keyManager.setApiKey('gemini', oldKey);
    return result;
  }

  async testOpenAiApi(apiKey) {
    const oldKey = this._keyManager.getApiKey('openai');
    this._keyManager.setApiKey('openai', apiKey);
    const result = await this._aiService.testConnection('openai');
    this._keyManager.setApiKey('openai', oldKey);
    return result;
  }

  // ========== API 呼叫 (委託給 AIService) ==========

  async callGeminiApi(prompt, systemInstruction = null) {
    return this._aiService.generateText(prompt, {
      systemInstruction,
      provider: 'gemini'
    });
  }

  async callOpenAiApi(prompt, systemInstruction = null) {
    return this._aiService.generateText(prompt, {
      systemInstruction,
      provider: 'openai'
    });
  }

  async getResponse(prompt, systemInstruction = null) {
    return this._aiService.generateText(prompt, { systemInstruction });
  }

  // ========== 狼人遊戲專用功能 ==========

  async generateStory(context, systemInstruction = null) {
    const defaultInstruction = '你是狼人殺遊戲的旁白者，請根據以下遊戲情境生成生動的故事描述，長度約100字左右。';
    return this._aiService.generateText(context, {
      systemInstruction: systemInstruction || defaultInstruction
    });
  }

  async generateNpcResponse(playerRole, gameContext, playerNumber = null, systemInstruction = null, gameStatus = null) {
    const roleDescription = playerNumber ? `${playerRole} 玩家 ${playerNumber} 號` : playerRole;
    const defaultInstruction = `你正在扮演狼人殺遊戲中的 ${roleDescription} 角色，請根據遊戲情境生成符合角色特性的對話回應。`;

    // 建構完整上下文
    let fullContext = gameContext;

    // 添加遊戲歷史
    const records = this.gameHistory.getAllRecords();
    if (records.length > 0) {
      const historyText = this.gameHistory.formatToText();
      fullContext = `【遊戲完整上下文】\n${historyText}\n\n【當前情境】\n${gameContext}`;
    }

    // 添加遊戲狀態
    if (gameStatus) {
      fullContext = `${fullContext}\n\n【遊戲狀態】\n${JSON.stringify(gameStatus, null, 2)}`;
    }

    return this._aiService.generateText(fullContext, {
      systemInstruction: systemInstruction || defaultInstruction
    });
  }

  async generateAiDecision(playerRole, decisionType, options, gameContext, playerNumber = null, systemInstruction = null, gameStatus = null) {
    // 使用決策引擎
    const result = await this._decisionEngine.generateDecision({
      playerRole,
      decisionType,
      options,
      gameContext,
      playerNumber,
      gameHistory: this.gameHistory.getAllRecords(),
      gameStatus,
      customInstruction: systemInstruction
    });

    console.log('API 回應結果:', result);
    return result;
  }

  // ========== 存取內部元件 ==========

  getKeyManager() {
    return this._keyManager;
  }

  getAIService() {
    return this._aiService;
  }

  getDecisionEngine() {
    return this._decisionEngine;
  }
}

export default ApiManager;
