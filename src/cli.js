#!/usr/bin/env node
/**
 * 狼人殺遊戲 - 命令行版本啟動腳本
 * 使用方式: node cli.js
 */

import { WerewolfGame } from './werewolf/WerewolfGame.js';
import { CommandLineAdapter } from './werewolf/ui/adapters/CommandLineAdapter.js';
import ApiManager from './werewolf/api/apiManager.js';

// ANSI 顏色
const COLORS = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    magenta: '\x1b[35m',
    red: '\x1b[31m',
    gray: '\x1b[90m'
};

/**
 * 顯示歡迎畫面
 */
function showWelcome() {
    console.clear();
    console.log(`
${COLORS.magenta}${COLORS.bold}
    ╔═══════════════════════════════════════════════╗
    ║                                               ║
    ║      🐺  狼 人 殺 遊 戲  🐺                  ║
    ║         命 令 行 版 本                        ║
    ║                                               ║
    ╚═══════════════════════════════════════════════╝
${COLORS.reset}
${COLORS.gray}    在這個村莊中，狼人潛伏在人群之中...
    你能找出他們並拯救村莊嗎？${COLORS.reset}
`);
}

/**
 * 主程式
 */
async function main() {
    showWelcome();

    // 建立遊戲實例
    const game = new WerewolfGame();

    // 建立 API 管理器
    const apiManager = new ApiManager();
    game.apiManager = apiManager;

    // 建立命令行適配器
    const adapter = new CommandLineAdapter();
    adapter.init(game);

    // 監聽遊戲結束事件
    adapter.on('gameOver', (result) => {
        console.log(`\n${COLORS.cyan}感謝遊玩！${COLORS.reset}\n`);
        process.exit(0);
    });

    try {
        // 顯示設定選項
        console.log(`${COLORS.cyan}═══ 遊戲設定 ═══${COLORS.reset}\n`);

        // 詢問玩家名稱
        const playerName = await adapter.askQuestion('請輸入您的名稱:');
        if (playerName && playerName.trim()) {
            // 設定玩家名稱（如果 game 有這個方法的話）
            console.log(`\n${COLORS.green}歡迎, ${playerName}!${COLORS.reset}\n`);
        }

        // 詢問玩家數量
        const playerCountOptions = ['6 人', '8 人', '10 人', '12 人'];
        const playerCountIndex = await adapter.selectOption('請選擇玩家數量:', playerCountOptions);

        if (playerCountIndex === -1) {
            console.log(`\n${COLORS.yellow}遊戲已取消${COLORS.reset}\n`);
            process.exit(0);
        }

        const playerCounts = [6, 8, 10, 12];
        const selectedPlayerCount = playerCounts[playerCountIndex];
        game.settings.playerCount = selectedPlayerCount;

        // 詢問是否使用 AI
        const useAI = await adapter.askYesNo('是否啟用 AI 功能？');
        game.setAIEnabled(useAI);

        if (useAI) {
            console.log(`\n${COLORS.green}AI 功能已啟用${COLORS.reset}`);

            // 檢查 API 金鑰
            if (!apiManager.hasApiKey()) {
                console.log(`${COLORS.yellow}提示: 請設定 Gemini 或 OpenAI API 金鑰以啟用 AI 功能${COLORS.reset}\n`);
            }
        }

        // 開始遊戲
        console.log(`\n${COLORS.magenta}═══ 遊戲開始 ═══${COLORS.reset}\n`);
        console.log(`${COLORS.gray}玩家數量: ${selectedPlayerCount} 人${COLORS.reset}`);
        console.log(`${COLORS.gray}AI 功能: ${useAI ? '啟用' : '停用'}${COLORS.reset}\n`);

        await game.startGame();

    } catch (error) {
        console.error(`\n${COLORS.red}遊戲發生錯誤: ${error.message}${COLORS.reset}`);
        console.error(error.stack);
        process.exit(1);
    } finally {
        adapter.destroy();
    }
}

// 處理 Ctrl+C
process.on('SIGINT', () => {
    console.log(`\n\n${COLORS.yellow}遊戲已中斷${COLORS.reset}\n`);
    process.exit(0);
});

// 執行主程式
main().catch(console.error);
