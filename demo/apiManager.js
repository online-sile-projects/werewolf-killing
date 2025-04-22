/**
 * apiManager.js - API 金鑰管理與呼叫相關功能
 */

class ApiManager {
  constructor() {
    this.providers = ['gemini', 'openai'];
    this.currentProvider = 'gemini';
    this.apiKeys = {
      gemini: '',
      openai: ''
    };
    
    // DOM 元素
    this.settingsBtn = document.getElementById('settings-btn');
    this.settingsPanel = document.getElementById('settings-panel');
    this.closeSettingsBtn = document.getElementById('close-settings-btn');
    this.llmProviderSelect = document.getElementById('llm-provider');
    this.geminiApiKeyInput = document.getElementById('gemini-api-key');
    this.openaiApiKeyInput = document.getElementById('openai-api-key');
    this.saveApiKeyBtn = document.getElementById('save-api-key-btn');
    this.testApiBtn = document.getElementById('test-api-btn');
    this.apiTestResult = document.getElementById('api-test-result');
    this.showApiKeyBtn = document.getElementById('show-api-key-btn');
    
    // 初始化
    this.init();
  }
  
  // 初始化
  init() {
    // 從本地儲存載入 API 金鑰
    this.loadApiKeys();
    
    // 事件監聽器
    this.settingsBtn.addEventListener('click', () => this.openSettings());
    this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
    this.saveApiKeyBtn.addEventListener('click', () => this.saveApiKeys());
    this.testApiBtn.addEventListener('click', () => this.testApiConnection());
    this.showApiKeyBtn.addEventListener('click', () => this.toggleApiKeyVisibility());
    
    // 設定提供商選擇事件
    this.llmProviderSelect.addEventListener('change', () => {
      this.currentProvider = this.llmProviderSelect.value;
    });
  }
  
  // 開啟設定面板
  openSettings() {
    this.settingsPanel.classList.remove('hidden');
  }
  
  // 關閉設定面板
  closeSettings() {
    this.settingsPanel.classList.add('hidden');
  }
  
  // 從 localStorage 載入 API 金鑰
  loadApiKeys() {
    // 載入所有提供商的 API 金鑰
    this.providers.forEach(provider => {
      const key = localStorage.getItem(`${provider}ApiKey`);
      if (key) {
        this.apiKeys[provider] = key;
        
        // 更新輸入框的值
        if (provider === 'gemini') {
          this.geminiApiKeyInput.value = key;
        } else if (provider === 'openai') {
          this.openaiApiKeyInput.value = key;
        }
      }
    });
    
    // 載入當前提供商
    const savedProvider = localStorage.getItem('currentProvider');
    if (savedProvider && this.providers.includes(savedProvider)) {
      this.currentProvider = savedProvider;
      this.llmProviderSelect.value = savedProvider;
    }
  }
  
  // 儲存 API 金鑰到 localStorage
  saveApiKeys() {
    // 獲取輸入的 API 金鑰
    const geminiApiKey = this.geminiApiKeyInput.value.trim();
    const openaiApiKey = this.openaiApiKeyInput.value.trim();
    
    // 儲存 API 金鑰
    if (geminiApiKey) {
      localStorage.setItem('geminiApiKey', geminiApiKey);
      this.apiKeys.gemini = geminiApiKey;
    }
    
    if (openaiApiKey) {
      localStorage.setItem('openaiApiKey', openaiApiKey);
      this.apiKeys.openai = openaiApiKey;
    }
    
    // 儲存當前提供商
    localStorage.setItem('currentProvider', this.currentProvider);
    
    // 顯示成功訊息
    this.apiTestResult.textContent = '已成功儲存 API 金鑰設定';
    this.apiTestResult.className = 'api-test-result success';
    
    // 3秒後清除訊息
    setTimeout(() => {
      this.apiTestResult.textContent = '';
      this.apiTestResult.className = 'api-test-result';
    }, 3000);
  }
  
  // 測試 API 連線（增加重試機制）
  async testApiConnection() {
    // 顯示測試中訊息
    this.apiTestResult.textContent = '正在測試 API 連線...';
    this.apiTestResult.className = 'api-test-result testing';
    this.apiTestResult.style.display = 'block'; // 確保元素顯示
    
    // 獲取當前提供商和 API 金鑰
    const provider = this.currentProvider;
    const apiKey = this.apiKeys[provider];
    
    if (!apiKey) {
      this.apiTestResult.textContent = `請先輸入 ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} API 金鑰`;
      this.apiTestResult.className = 'api-test-result error';
      this.apiTestResult.style.display = 'block'; // 確保元素顯示
      return;
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
          this.apiTestResult.textContent = `${provider === 'gemini' ? 'Gemini' : 'OpenAI'} API 連線測試成功！`;
          this.apiTestResult.className = 'api-test-result success';
          this.apiTestResult.style.display = 'block';
          return;
        } else {
          lastError = response?.error || '未知錯誤';
          
          // 如果是 503 錯誤，重試
          if (lastError.includes('503') || lastError.includes('服務暫時不可用')) {
            retryCount++;
            if (retryCount <= maxRetries) {
              this.apiTestResult.textContent = `遇到服務暫時不可用錯誤，正在重試 (${retryCount}/${maxRetries})...`;
              this.apiTestResult.className = 'api-test-result testing';
              
              // 等待一秒後重試
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
          }
          
          // 其他錯誤或重試次數用完，顯示錯誤
          this.apiTestResult.textContent = `API 測試失敗: ${lastError}`;
          this.apiTestResult.className = 'api-test-result error';
          break;
        }
      } catch (error) {
        console.error('API 測試出錯:', error);
        lastError = error.message;
        
        // 網路或連線錯誤可能適合重試
        if (error.name === 'TypeError' || error.message.includes('網路')) {
          retryCount++;
          if (retryCount <= maxRetries) {
            this.apiTestResult.textContent = `遇到網路錯誤，正在重試 (${retryCount}/${maxRetries})...`;
            this.apiTestResult.className = 'api-test-result testing';
            
            // 等待一秒後重試
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
        
        this.apiTestResult.textContent = `API 測試出錯: ${error.message}`;
        this.apiTestResult.className = 'api-test-result error';
        break;
      }
    }
    
    // 確保顯示元素
    this.apiTestResult.style.display = 'block';
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
  
  // 切換 API 金鑰可見性
  toggleApiKeyVisibility() {
    const currentType = this.geminiApiKeyInput.type;
    this.geminiApiKeyInput.type = currentType === 'password' ? 'text' : 'password';
    this.openaiApiKeyInput.type = currentType === 'password' ? 'text' : 'password';
    
    // 更改按鈕文字
    this.showApiKeyBtn.textContent = currentType === 'password' ? '🔒' : '👁️';
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
  async callGeminiApi(prompt) {
    const apiKey = this.getApiKey('gemini');
    
    if (!apiKey) {
      console.error('未設定 Gemini API Key');
      return { error: '未設定 Gemini API Key，請先在設定中輸入 API Key' };
    }
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
              response_mime_type: "application/json"
            },
            system_instruction: {
              parts: [{ text: "請以 JSON 格式回應，包含以下欄位：\n- response: 最終答案\n- thinking: 思考過程（若有）" }]
            }
          })
        }
      );
      
      const data = await response.json();
      
      if (response.ok && data.candidates && data.candidates.length > 0) {
        const jsonResponse = data.candidates[0].content.parts[0].text;
        
        try {
          // 嘗試解析 JSON 回應
          const parsedResponse = JSON.parse(jsonResponse);
          return parsedResponse;
        } catch (error) {
          // 如果解析失敗，返回原始文本
          console.warn('無法解析JSON回應，返回原始文本', error);
          return { response: jsonResponse };
        }
      } else {
        return { error: data.error?.message || '未知錯誤' };
      }
    } catch (error) {
      console.error('呼叫 Gemini API 出錯:', error);
      return { error: error.message };
    }
  }
  
  // 呼叫 OpenAI API
  async callOpenAiApi(prompt) {
    const apiKey = this.getApiKey('openai');
    
    if (!apiKey) {
      console.error('未設定 OpenAI API Key');
      return { error: '未設定 OpenAI API Key，請先在設定中輸入 API Key' };
    }
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 500
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.choices && data.choices.length > 0) {
        return { response: data.choices[0].message.content.trim() };
      } else {
        return { error: data.error?.message || '未知錯誤' };
      }
    } catch (error) {
      console.error('呼叫 OpenAI API 出錯:', error);
      return { error: error.message };
    }
  }
  
  // 獲取 LLM 回應
  async getResponse(prompt) {
    // 根據當前提供商選擇不同的 API
    if (this.currentProvider === 'gemini') {
      return await this.callGeminiApi(prompt);
    } else if (this.currentProvider === 'openai') {
      return await this.callOpenAiApi(prompt);
    } else {
      return { error: `未支援的提供商: ${this.currentProvider}` };
    }
  }
}

// 建立全域 apiManager 實例
const apiManager = new ApiManager();
