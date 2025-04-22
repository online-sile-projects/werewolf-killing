/**
 * WebConsole 類別
 * 用來模擬命令列介面，讓使用者通過網頁輸入指令來與遊戲互動
 */
class WebConsole {
  constructor() {
    this.outputElement = document.getElementById('console-output');
    this.inputElement = document.getElementById('console-input');
    this.sendButton = document.getElementById('send-btn');
    
    this.commandHistory = [];
    this.historyIndex = -1;
    this.promptCallbacks = {};
    this.isWaitingForInput = false;
    this.currentPrompt = null;
    
    this.initEventListeners();
  }

  // 初始化事件監聽器
  initEventListeners() {
    // 送出按鈕點擊事件
    this.sendButton.addEventListener('click', () => {
      this.handleInput();
    });
    
    // 輸入框按下 Enter 鍵事件
    this.inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleInput();
      } else if (e.key === 'ArrowUp') {
        this.navigateHistory(-1);
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        this.navigateHistory(1);
        e.preventDefault();
      }
    });
  }
  
  // 處理輸入
  handleInput() {
    const input = this.inputElement.value.trim();
    if (!input) return;
    
    // 顯示使用者輸入
    this.println(`> ${input}`, 'user-input');
    
    // 儲存指令歷史
    this.commandHistory.push(input);
    this.historyIndex = this.commandHistory.length;
    
    // 清空輸入框
    this.inputElement.value = '';
    
    // 如果正在等待輸入，則呼叫對應的回呼函式
    if (this.isWaitingForInput && this.currentPrompt) {
      const callback = this.promptCallbacks[this.currentPrompt];
      if (callback) {
        this.isWaitingForInput = false;
        delete this.promptCallbacks[this.currentPrompt];
        this.currentPrompt = null;
        callback(input);
      }
    }
    
    return input;
  }
  
  // 導航指令歷史
  navigateHistory(direction) {
    if (this.commandHistory.length === 0) return;
    
    this.historyIndex += direction;
    
    if (this.historyIndex < 0) {
      this.historyIndex = 0;
    } else if (this.historyIndex > this.commandHistory.length) {
      this.historyIndex = this.commandHistory.length;
      this.inputElement.value = '';
      return;
    }
    
    if (this.historyIndex === this.commandHistory.length) {
      this.inputElement.value = '';
    } else {
      this.inputElement.value = this.commandHistory[this.historyIndex];
    }
  }
  
  // 輸出文字到控制台
  print(text, className = '') {
    const span = document.createElement('span');
    span.textContent = text;
    if (className) {
      span.className = className;
    }
    this.outputElement.appendChild(span);
    this.scrollToBottom();
  }
  
  // 輸出一行文字到控制台
  println(text, className = '') {
    this.print(text + '\n', className);
  }
  
  // 清空控制台
  clear() {
    this.outputElement.innerHTML = '';
  }
  
  // 將控制台滾動到底部
  scrollToBottom() {
    this.outputElement.scrollTop = this.outputElement.scrollHeight;
  }
  
  // 模擬 readline.question
  question(text, callback) {
    const promptId = Date.now().toString();
    this.println(text);
    this.isWaitingForInput = true;
    this.currentPrompt = promptId;
    this.promptCallbacks[promptId] = callback;
    this.inputElement.focus();
  }
  
  // 模擬 readline.keyInSelect
  keyInSelect(items, text, callback) {
    const promptId = Date.now().toString();
    this.println(text);
    
    // 顯示選項
    items.forEach((item, index) => {
      this.println(`[${index + 1}] ${item}`);
    });
    this.println('[0] 取消');
    
    this.isWaitingForInput = true;
    this.currentPrompt = promptId;
    
    // 註冊回呼函式處理使用者選擇
    this.promptCallbacks[promptId] = (input) => {
      const num = parseInt(input);
      if (isNaN(num) || num < 0 || num > items.length) {
        this.println('無效的選擇，請重新輸入', 'text-red');
        this.keyInSelect(items, text, callback);
        return;
      }
      
      if (num === 0) {
        callback(-1);
      } else {
        callback(num - 1);
      }
    };
    
    this.inputElement.focus();
  }
  
  // 模擬 readline.keyInYN
  keyInYN(text, callback) {
    const promptId = Date.now().toString();
    this.println(`${text} (y/n)`);
    
    this.isWaitingForInput = true;
    this.currentPrompt = promptId;
    
    // 註冊回呼函式處理使用者選擇
    this.promptCallbacks[promptId] = (input) => {
      const lowerInput = input.toLowerCase();
      if (lowerInput === 'y' || lowerInput === 'yes') {
        callback(true);
      } else if (lowerInput === 'n' || lowerInput === 'no') {
        callback(false);
      } else {
        this.println('請輸入 y 或 n', 'text-red');
        this.keyInYN(text, callback);
      }
    };
    
    this.inputElement.focus();
  }
  
  // 模擬 readline.questionInt
  questionInt(text, callback, defaultValue = null) {
    const promptId = Date.now().toString();
    if (defaultValue !== null) {
      this.println(`${text}`);
    } else {
      this.println(text);
    }
    
    this.isWaitingForInput = true;
    this.currentPrompt = promptId;
    
    // 註冊回呼函式處理使用者輸入
    this.promptCallbacks[promptId] = (input) => {
      if (input === '' && defaultValue !== null) {
        callback(defaultValue);
        return;
      }
      
      const num = parseInt(input);
      if (isNaN(num)) {
        this.println('請輸入有效的數字', 'text-red');
        this.questionInt(text, callback, defaultValue);
        return;
      }
      
      callback(num);
    };
    
    this.inputElement.focus();
  }
}

// 建立全域 webConsole 實例
const webConsole = new WebConsole();

// 模擬 chalk 顏色功能
const webChalk = {
  red: (text) => {
    webConsole.print(text, 'text-red');
    return text;
  },
  green: (text) => {
    webConsole.print(text, 'text-green');
    return text;
  },
  blue: (text) => {
    webConsole.print(text, 'text-blue');
    return text;
  },
  yellow: (text) => {
    webConsole.print(text, 'text-yellow');
    return text;
  },
  cyan: (text) => {
    webConsole.print(text, 'text-cyan');
    return text;
  },
  magenta: (text) => {
    webConsole.print(text, 'text-magenta');
    return text;
  },
  gray: (text) => {
    webConsole.print(text, 'text-gray');
    return text;
  },
  white: (text) => {
    webConsole.print(text);
    return text;
  }
};

// 導出 webConsole 和 webChalk 給遊戲模組使用
window.webConsole = webConsole;
window.webChalk = webChalk;
