/**
 * BasePhase - 階段基類
 * 定義所有遊戲階段必須實作的介面
 */

export class BasePhase {
    /**
     * @param {string} id - 階段識別符
     * @param {Object} config - 階段配置
     */
    constructor(id, config = {}) {
        this.id = id;
        this.name = config.name || id;
        this.description = config.description || '';
        this.order = config.order || 0; // 階段順序
    }

    /**
     * 取得階段 ID
     */
    getId() {
        return this.id;
    }

    /**
     * 取得階段名稱
     */
    getName() {
        return this.name;
    }

    /**
     * 執行階段邏輯
     * @param {Object} game - 遊戲實例
     * @returns {Promise<string|null>} - 下一個階段 ID，或 null 使用預設流程
     */
    // eslint-disable-next-line no-unused-vars
    async execute(_game) {
        throw new Error(`${this.name} 階段未實作 execute 方法`);
    }

    /**
     * 進入階段時的初始化
     * @param {Object} game - 遊戲實例
     */
    async onEnter(game) {
        game.log.system(`進入 ${this.name} 階段`);
    }

    /**
     * 離開階段時的清理
     * @param {Object} game - 遊戲實例
     */
    // eslint-disable-next-line no-unused-vars
    async onExit(_game) {
        // 子類別可覆寫
    }

    /**
     * 描述階段
     */
    describe() {
        return {
            id: this.id,
            name: this.name,
            description: this.description
        };
    }
}

export default BasePhase;
