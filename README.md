# React + Vite 乾淨專案模板

這是一個乾淨的 React + Vite 專案模板，提供最基本的設定，方便您快速開始開發新專案。

## 專案結構

```
.
├── eslint.config.js       # ESLint 設定檔
├── index.html             # HTML 進入點
├── package.json           # 專案相依套件設定
├── README.md              # 專案說明文件
├── vite.config.js         # Vite 設定檔
├── public/                # 靜態資源資料夾
│   └── vite.svg           # Vite 圖示
└── src/                   # 原始碼資料夾
    ├── App.css            # 應用程式樣式
    ├── App.jsx            # 主要應用程式元件
    ├── index.css          # 全域樣式
    ├── main.jsx           # 應用程式進入點
    ├── assets/            # 資源檔案資料夾
    │   └── react.svg      # React 圖示
    └── template/          # 模板功能資料夾
        └── index.js       # 主要功能模組
```

## 快速開始

1. 安裝相依套件：

```bash
npm install
```

2. 啟動開發伺服器：

```bash
npm run dev
```

3. 開啟瀏覽器，進入開發者工具的主控台（按下 F12 或右鍵選擇「檢查」）

4. 在主控台中使用以下指令：

```javascript
MyTemplate.sayHello()     // 顯示問候語
MyTemplate.currentTime()  // 顯示目前時間
MyTemplate.help()         // 顯示使用說明
```

## 建構生產版本

```bash
npm run build
```

## 自訂開發

此模板提供了乾淨的架構，您可以根據需求修改 `src/template/index.js` 或增加更多模組。
