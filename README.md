# 狼人殺 Web 控制台

這是一個使用 React + Vite 建立的狼人殺遊戲控制台專案。

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
    ├── template/          # 模板功能資料夾
    │   └── index.js       # 主要功能模組
    └── werewolf/          # 狼人殺遊戲核心功能
        ├── index.js       # 遊戲主模組
        ├── logger.js      # 日誌處理
        ├── utils.js       # 工具函式
        ├── WerewolfGame.js # 狼人殺遊戲主類別
        ├── api/           # API 相關功能
        │   └── apiManager.js # API 管理器
        ├── history/       # 遊戲歷史記錄
        │   └── GameHistory.js # 遊戲歷史記錄類別
        ├── phases/        # 遊戲階段
        │   ├── dayPhase.js     # 白天階段
        │   ├── nightPhase.js   # 夜晚階段
        │   └── votingPhase.js  # 投票階段
        ├── roles/         # 角色相關
        │   ├── guard.js        # 守衛角色
        │   ├── hunter.js       # 獵人角色
        │   ├── roleConstants.js # 角色常數
        │   ├── seer.js         # 預言家角色
        │   ├── werewolf.js     # 狼人角色
        │   └── witch.js        # 女巫角色
        └── test/          # 測試相關
            ├── index.js        # 測試主模組
            └── testWorkflow.js # 測試工作流程
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

3. 開啟瀏覽器，進入開發伺服器提供的網址（通常是 http://localhost:5173）

## 建構生產版本

```bash
npm run build
```
