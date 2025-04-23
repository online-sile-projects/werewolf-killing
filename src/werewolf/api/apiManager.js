/**
 * apiManager.js - API 金鑰管理與呼叫相關功能
 * 應用於狼人殺遊戲的控制台版本
 */
import { GameHistory } from '../history/GameHistory.js';

export class ApiManager {
  constructor() {
    this.providers = ['gemini', 'openai'];
    this.currentProvider = 'gemini';
    this.apiKeys = {
      gemini: '',
      openai: ''
    };
    
    // 建立遊戲歷史紀錄物件
    this.gameHistory = new GameHistory();
    
    // 初始化
    this.init();
  }
  
  // 初始化
  init() {
    // 從本地儲存載入 API 金鑰
    this.loadApiKeys();
    
    console.log('%c=== API 管理器已初始化 ===', 'color: #0099ff; font-weight: bold; font-size: 12px;');
    console.log('%c提示：使用 window.WerewolfApi.testApiConnection() 測試 API 連線', 'color: #ff9900;');
  }
  
  // 從 localStorage 載入 API 金鑰
  loadApiKeys() {
    // 載入所有提供商的 API 金鑰
    this.providers.forEach(provider => {
      const key = localStorage.getItem(`${provider}ApiKey`);
      if (key) {
        this.apiKeys[provider] = key;
        console.log(`已載入 ${provider} API 金鑰`);
      }
    });
    
    // 載入當前提供商
    const savedProvider = localStorage.getItem('currentProvider');
    if (savedProvider && this.providers.includes(savedProvider)) {
      this.currentProvider = savedProvider;
    }
  }
  
  // 儲存 API 金鑰到 localStorage
  saveApiKeys(geminiApiKey, openaiApiKey) {
    // 儲存 API 金鑰
    if (geminiApiKey !== undefined) {
      localStorage.setItem('geminiApiKey', geminiApiKey);
      this.apiKeys.gemini = geminiApiKey;
    }
    
    if (openaiApiKey !== undefined) {
      localStorage.setItem('openaiApiKey', openaiApiKey);
      this.apiKeys.openai = openaiApiKey;
    }
    
    // 儲存當前提供商
    localStorage.setItem('currentProvider', this.currentProvider);
    
    console.log('已成功儲存 API 金鑰設定');
  }
  
  // 設定 API 金鑰
  setApiKey(provider, apiKey) {
    if (!this.providers.includes(provider)) {
      console.error(`不支援的提供商: ${provider}`);
      return false;
    }
    
    this.apiKeys[provider] = apiKey;
    localStorage.setItem(`${provider}ApiKey`, apiKey);
    console.log(`已設定 ${provider} API 金鑰`);
    return true;
  }
  
  // 設定當前提供商
  setProvider(provider) {
    if (!this.providers.includes(provider)) {
      console.error(`不支援的提供商: ${provider}`);
      return false;
    }
    
    this.currentProvider = provider;
    localStorage.setItem('currentProvider', provider);
    console.log(`已切換至 ${provider} 提供商`);
    return true;
  }
  
  // 添加遊戲訊息到歷史紀錄 (與 WerewolfGame.recordGameMessage 呼叫相匹配)
  addGameMessage(role, message, phase, day) {
    this.gameHistory.addMessage(role, message, phase, day);
  }
  
  // 清除遊戲歷史紀錄
  clearGameHistory() {
    return this.gameHistory.clear();
  }
  
  // 獲取遊戲歷史紀錄
  getGameHistory() {
    return this.gameHistory.getAllRecords();
  }
  
  // 測試 API 連線（增加重試機制）
  async testApiConnection(provider = null) {
    provider = provider || this.currentProvider;
    console.log(`正在測試 ${provider} API 連線...`);
    
    // 獲取 API 金鑰
    const apiKey = this.apiKeys[provider];
    
    if (!apiKey) {
      console.error(`請先設定 ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} API 金鑰`);
      return { success: false, error: `請先設定 ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} API 金鑰` };
    }
    
    // 最大重試次數
    const maxRetries = 2;
    let retryCount = 0;
    let lastError = null;
    
    while (retryCount <= maxRetries) {
      try {
        // 根據提供商選擇不同的 API 測試
        let response;
        if (provider === 'gemini') {
          response = await this.testGeminiApi(apiKey);
        } else if (provider === 'openai') {
          response = await this.testOpenAiApi(apiKey);
        }
        
        // 檢查響應
        if (response && response.success) {
          console.log(`${provider === 'gemini' ? 'Gemini' : 'OpenAI'} API 連線測試成功！`);
          return { success: true };
        } else {
          lastError = response?.error || '未知錯誤';
          
          // 如果是 503 錯誤，重試
          if (lastError.includes('503') || lastError.includes('服務暫時不可用')) {
            retryCount++;
            if (retryCount <= maxRetries) {
              console.log(`遇到服務暫時不可用錯誤，正在重試 (${retryCount}/${maxRetries})...`);
              
              // 等待一秒後重試
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
          }
          
          console.error(`API 測試失敗: ${lastError}`);
          return { success: false, error: lastError };
        }
      } catch (error) {
        console.error('API 測試出錯:', error);
        lastError = error.message;
        
        // 網路或連線錯誤可能適合重試
        if (error.name === 'TypeError' || error.message.includes('網路')) {
          retryCount++;
          if (retryCount <= maxRetries) {
            console.log(`遇到網路錯誤，正在重試 (${retryCount}/${maxRetries})...`);
            
            // 等待一秒後重試
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
        
        return { success: false, error: error.message };
      }
    }
    
    return { success: false, error: lastError || '重試後仍然失敗' };
  }
  
  // 測試 Gemini API
  async testGeminiApi(apiKey) {
    try {
      console.log('測試 Gemini API 連線中...');
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: '測試連線' }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 10
            }
          })
        }
      );
      
      console.log('API 回應狀態碼:', response.status);
      
      // 如果回應不是 200 系列，提供更詳細的錯誤訊息
      if (!response.ok) {
        let errorMessage = '';
        
        // 處理特定的HTTP狀態碼
        switch (response.status) {
          case 400:
            errorMessage = '請求格式錯誤，請確認 API 參數設定';
            break;
          case 401:
            errorMessage = 'API 金鑰無效或未獲授權';
            break;
          case 403:
            errorMessage = '無權限使用此 API，請確認您的 API 金鑰權限設定';
            break;
          case 429:
            errorMessage = 'API 呼叫次數超過限制，請稍後再試';
            break;
          case 500:
            errorMessage = 'Gemini 伺服器內部錯誤';
            break;
          case 503:
            errorMessage = 'Gemini 服務暫時不可用，請稍後再試';
            break;
          default:
            errorMessage = `API 回應錯誤 (HTTP ${response.status})`;
        }
        
        try {
          // 嘗試獲取更詳細的錯誤訊息
          const data = await response.json();
          if (data.error) {
            errorMessage += `: ${data.error.message || JSON.stringify(data.error)}`;
          }
        } catch (jsonError) {
          // 無法解析 JSON 回應，使用預設錯誤訊息
          console.warn('無法解析錯誤回應內容:', jsonError);
        }
        
        console.error('Gemini API 測試失敗:', errorMessage);
        return { success: false, error: errorMessage };
      }
      
      // 處理成功的回應
      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        console.log('Gemini API 測試成功');
        return { success: true };
      } else {
        console.error('回應未包含有效內容:', data);
        return { success: false, error: '回應格式不正確，但連線成功' };
      }
    } catch (error) {
      console.error('測試 Gemini API 時發生錯誤:', error);
      
      // 提供更有用的網路相關錯誤訊息
      let errorMessage = error.message;
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = '網路連線錯誤，請確認您的網路連線是否正常';
      }
      
      return { success: false, error: errorMessage };
    }
  }
  
  // 測試 OpenAI API
  async testOpenAiApi(apiKey) {
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
      
      if (response.ok && data.choices && data.choices.length > 0) {
        return { success: true };
      } else {
        return { success: false, error: data.error?.message || '回應格式不正確' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // 獲取 API 金鑰
  getApiKey(provider = null) {
    provider = provider || this.currentProvider;
    return this.apiKeys[provider] || '';
  }
  
  // 獲取當前提供商
  getCurrentProvider() {
    return this.currentProvider;
  }
  
  // 呼叫 Gemini API
  async callGeminiApi(prompt, systemInstruction = null) {
    const apiKey = this.getApiKey('gemini');
    
    if (!apiKey) {
      console.error('未設定 Gemini API Key');
      return { error: '未設定 Gemini API Key，請先設定 API Key' };
    }
    
    try {
      const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      };
      
      // 如果有系統指令，加入請求
      if (systemInstruction) {
        requestBody.system_instruction = {
          parts: [{ text: systemInstruction }]
        };
      }
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );
      
      const data = await response.json();
      
      if (response.ok && data.candidates && data.candidates.length > 0) {
        let textResponse = data.candidates[0].content.parts[0].text;
        
        // 判斷是否為 JSON 格式
        if (textResponse.trim().startsWith('{') && textResponse.trim().endsWith('}')) {
          try {
            // 嘗試解析 JSON 回應
            const parsedResponse = JSON.parse(textResponse);
            return parsedResponse;
          } catch (error) {
            // 如果解析失敗，返回原始文本
            console.warn('無法解析JSON回應，返回原始文本', error);
          }
        }
        
        return { response: textResponse };
      } else {
        return { error: data.error?.message || '未知錯誤' };
      }
    } catch (error) {
      console.error('呼叫 Gemini API 出錯:', error);
      return { error: error.message };
    }
  }
  
  // 呼叫 OpenAI API
  async callOpenAiApi(prompt, systemInstruction = null) {
    const apiKey = this.getApiKey('openai');
    
    if (!apiKey) {
      console.error('未設定 OpenAI API Key');
      return { error: '未設定 OpenAI API Key，請先設定 API Key' };
    }
    
    try {
      const messages = [];
      
      // 如果有系統指令，加入請求
      if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
      }
      
      // 加入使用者訊息
      messages.push({ role: 'user', content: prompt });
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages,
          temperature: 0.7,
          max_tokens: 500
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.choices && data.choices.length > 0) {
        const textResponse = data.choices[0].message.content.trim();
        
        // 判斷是否為 JSON 格式
        if (textResponse.startsWith('{') && textResponse.endsWith('}')) {
          try {
            // 嘗試解析 JSON 回應
            const parsedResponse = JSON.parse(textResponse);
            return parsedResponse;
          } catch (error) {
            // 如果解析失敗，返回原始文本
            console.warn('無法解析JSON回應，返回原始文本', error);
          }
        }
        
        return { response: textResponse };
      } else {
        return { error: data.error?.message || '未知錯誤' };
      }
    } catch (error) {
      console.error('呼叫 OpenAI API 出錯:', error);
      return { error: error.message };
    }
  }
  
  // 獲取 LLM 回應
  async getResponse(prompt, systemInstruction = null) {
    console.log(prompt, systemInstruction);
    // 根據當前提供商選擇不同的 API
    if (this.currentProvider === 'gemini') {
      return await this.callGeminiApi(prompt, systemInstruction);
    } else if (this.currentProvider === 'openai') {
      return await this.callOpenAiApi(prompt, systemInstruction);
    } else {
      return { error: `未支援的提供商: ${this.currentProvider}` };
    }
  }
  
  // 狼人遊戲專用 - 故事生成
  async generateStory(context, systemInstruction = null) {
    const defaultInstruction = '你是狼人殺遊戲的旁白者，請根據以下遊戲情境生成生動的故事描述，長度約100字左右。';
    return await this.getResponse(context, systemInstruction || defaultInstruction);
  }
  
  // 狼人遊戲專用 - NPC 回應生成
  async generateNpcResponse(playerRole, gameContext, playerNumber = null, systemInstruction = null) {
    // 基本角色指示
    const roleDescription = playerNumber ? `${playerRole} 玩家 ${playerNumber} 號` : playerRole;
    const defaultInstruction = `你正在扮演狼人殺遊戲中的 ${roleDescription} 角色，請根據遊戲情境生成符合角色特性的對話回應。`;
    
    // 結合遊戲歷史紀錄和當前上下文
    let fullContext = gameContext;
    
    // 如果有遊戲歷史，添加到上下文中
    if (this.gameHistory.getAllRecords().length > 0) {
      const historyText = this.gameHistory.formatToText();
      fullContext = `【遊戲完整上下文】\n${historyText}\n\n【當前情境】\n${gameContext}`;
    }
    
    // 用更豐富的上下文呼叫 API
    return await this.getResponse(fullContext, systemInstruction || defaultInstruction);
  }
  
  // 狼人遊戲專用 - AI 決策生成
  async generateAiDecision(playerRole, decisionType, options, gameContext, playerNumber = null, systemInstruction = null) {
    // 基本角色決策指示
    const roleDescription = playerNumber ? `${playerRole} 玩家 ${playerNumber} 號` : playerRole;
    
    // 根據決策類型調整指示詞
    let defaultInstruction = '';
    
    switch (decisionType) {
      case 'kill': // 狼人刀人
        defaultInstruction = `你正在扮演狼人殺遊戲中的 ${roleDescription}，請決定要擊殺哪一位玩家。回傳格式必須是 JSON: {"targetId": 數字}`;
        break;
      case 'save': // 女巫救人
        defaultInstruction = `你正在扮演狼人殺遊戲中的 ${roleDescription}，請決定是否要使用解藥救活即將被狼人殺死的玩家。回傳格式必須是 JSON: {"save": true/false}`;
        break;
      case 'poison': // 女巫毒人
        defaultInstruction = `你正在扮演狼人殺遊戲中的 ${roleDescription}，請決定是否要使用毒藥殺死某位玩家。如果決定使用，請指定目標玩家。回傳格式必須是 JSON: {"poison": true/false, "targetId": 數字或null}`;
        break;
      case 'guard': // 守衛守人
        defaultInstruction = `你正在扮演狼人殺遊戲中的 ${roleDescription}，請決定要保護哪一位玩家。回傳格式必須是 JSON: {"targetId": 數字}`;
        break;
      case 'check': // 預言家查驗
        defaultInstruction = `你正在扮演狼人殺遊戲中的 ${roleDescription}，請決定要查驗哪一位玩家的身份。回傳格式必須是 JSON: {"targetId": 數字}`;
        break;
      case 'vote': // 投票
        defaultInstruction = `你正在扮演狼人殺遊戲中的 ${roleDescription}，請決定要投票驅逐哪一位玩家。回傳格式必須是 JSON: {"targetId": 數字}`;
        break;
      default:
        defaultInstruction = `你正在扮演狼人殺遊戲中的 ${roleDescription}，請根據遊戲情境做出決策。回傳格式必須是 JSON，包含你的決策結果。`;
    }
    
    // 將可選選項轉換為文字描述
    const optionsText = Array.isArray(options) 
      ? `可選目標：\n${options.map(opt => 
          typeof opt === 'object' 
            ? `ID: ${opt.id}, 名稱: ${opt.name}${opt.role ? ', 角色: ' + opt.role : ''}${opt.isAlive === false ? ' (已死亡)' : ''}`
            : opt
        ).join('\n')}`
      : `選項：${JSON.stringify(options)}`;
    
    // 結合遊戲歷史紀錄和當前上下文
    let fullContext = `${gameContext}\n\n${optionsText}`;
    
    // 如果有遊戲歷史，添加到上下文中
    if (this.gameHistory.getAllRecords().length > 0) {
      const historyText = this.gameHistory.formatToText();
      fullContext = `【遊戲完整上下文】\n${historyText}\n\n【當前情境】\n${gameContext}\n\n${optionsText}`;
    }
    
    // 用更豐富的上下文呼叫 API
    const response = await this.getResponse(fullContext, systemInstruction || defaultInstruction);
    
    // 印出 response 變數以便除錯
    console.log('API 回應結果:', response);
    
    // 處理回應結果，嘗試解析為有效的決策
    if (response && response.response) {
      try {
        // 如果回應已經是物件（表示已成功解析為 JSON），直接返回
        if (typeof response.response === 'object') {
          return response.response;
        }
        
        // 嘗試從回應文字中解析 JSON
        const responseText = response.response;
        // 尋找 JSON 格式的內容 (從 { 到 })
        const jsonMatch = responseText.match(/\{[^]*\}/);
        
        if (jsonMatch) {
          const jsonString = jsonMatch[0];
          return JSON.parse(jsonString);
        } else {
          // 如果無法解析出 JSON，嘗試從文字中提取決策信息
          if (decisionType === 'kill' || decisionType === 'guard' || decisionType === 'check' || decisionType === 'vote') {
            // 嘗試匹配 ID 數字
            const idMatch = responseText.match(/ID[:\s]*(\d+)|玩家[:\s]*(\d+)|選擇[:\s]*(\d+)|(\d+)\s*號/);
            if (idMatch) {
              const id = parseInt(idMatch[1] || idMatch[2] || idMatch[3] || idMatch[4]);
              return { targetId: id };
            }
          } else if (decisionType === 'save' || decisionType === 'poison') {
            // 嘗試匹配是/否決策
            const yesMatch = responseText.match(/是|同意|使用|救活|毒死|選擇使用/);
            const noMatch = responseText.match(/否|不|放棄|不使用|不救|不毒/);
            
            if (decisionType === 'save') {
              return { save: yesMatch !== null && noMatch === null };
            } else {
              // 對於毒藥，如果決定使用，嘗試找出目標 ID
              const usePoison = yesMatch !== null && noMatch === null;
              if (usePoison) {
                const idMatch = responseText.match(/ID[:\s]*(\d+)|玩家[:\s]*(\d+)|選擇[:\s]*(\d+)|(\d+)\s*號/);
                const targetId = idMatch ? parseInt(idMatch[1] || idMatch[2] || idMatch[3] || idMatch[4]) : null;
                return { poison: true, targetId };
              } else {
                return { poison: false, targetId: null };
              }
            }
          }
        }
        
        // 如果無法解析出有效的決策，返回一個錯誤
        console.warn('無法從 AI 回應中解析出有效的決策:', responseText);
        return { error: '無法解析決策', raw: responseText };
      } catch (error) {
        console.error('解析 AI 決策時發生錯誤:', error);
        return { error: error.message, raw: response.response };
      }
    } else if (response && response.error) {
      return { error: response.error };
    } else {
      return { error: '未獲得有效回應' };
    }
  }
}

// 建立並匯出 ApiManager 類別
export default ApiManager;
