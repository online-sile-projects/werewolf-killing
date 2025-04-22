// 簡單的 Hello World 模組
console.log('初始化模板...');

// 建立全域物件，方便在控制台中訪問
window.MyTemplate = {
  // 簡單的問候函式
  sayHello() {
    console.log('Hello World!');
    return 'Hello World!';
  },
  
  // 顯示目前時間
  currentTime() {
    const now = new Date();
    console.log(`目前時間：${now.toLocaleString('zh-TW')}`);
    return now;
  },
  
  // 顯示使用說明
  help() {
    console.log(`
===== 專案模板說明 =====

這是一個乾淨的專案模板，您可以在控制台使用以下功能：

1. 顯示問候語: 
   MyTemplate.sayHello()
   
2. 顯示目前時間: 
   MyTemplate.currentTime()
   
3. 顯示此說明: 
   MyTemplate.help()

祝您開發愉快！
    `);
  }
};

// 自動顯示使用說明
MyTemplate.help();

export default MyTemplate;
