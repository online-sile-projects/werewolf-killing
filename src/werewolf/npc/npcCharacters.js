/**
 * NPC 角色定義 - 狼人殺遊戲
 * 每個 NPC 都有獨特的個性、外觀和語音設定
 */

export const NPC_CHARACTERS = [
    {
        id: "npc_001",
        name: "阿德",
        age: 45,
        profession: "鐵匠",
        personality: {
            type: "aggressive",
            traits: ["直接", "衝動", "熱心"],
            speechStyle: "說話直接粗獷，喜歡用俗語"
        },
        appearance: {
            gender: "male",
            physicalDesc: "短髮，肌肉結實，穿著厚重的工作圍裙",
            style: "樸實勞動者",
            baseImageUrl: null  // 支援上傳自訂圖像
        },
        voice: {
            type: "onyx",
            defaultEmotion: "confident"
        }
    },
    {
        id: "npc_002",
        name: "小菁",
        age: 22,
        profession: "教師",
        personality: {
            type: "analytical",
            traits: ["理性", "細心", "溫和"],
            speechStyle: "說話有條理，常用問句引導思考"
        },
        appearance: {
            gender: "female",
            physicalDesc: "長髮馬尾，戴眼鏡，穿著整潔的襯衫",
            style: "知性優雅",
            baseImageUrl: null
        },
        voice: {
            type: "nova",
            defaultEmotion: "calm"
        }
    },
    {
        id: "npc_003",
        name: "老王",
        age: 65,
        profession: "退休村長",
        personality: {
            type: "cautious",
            traits: ["沉穩", "老練", "多疑"],
            speechStyle: "說話緩慢沉穩，常引用過往經驗"
        },
        appearance: {
            gender: "male",
            physicalDesc: "白髮蒼蒼，穿著傳統中式服裝",
            style: "老者智者",
            baseImageUrl: null
        },
        voice: {
            type: "echo",
            defaultEmotion: "suspicious"
        }
    },
    {
        id: "npc_004",
        name: "阿美",
        age: 28,
        profession: "護士",
        personality: {
            type: "emotional",
            traits: ["善良", "敏感", "衝動"],
            speechStyle: "說話帶感情，容易激動"
        },
        appearance: {
            gender: "female",
            physicalDesc: "短髮俐落，穿著護士服",
            style: "親切可靠",
            baseImageUrl: null
        },
        voice: {
            type: "shimmer",
            defaultEmotion: "nervous"
        }
    },
    {
        id: "npc_005",
        name: "小剛",
        age: 19,
        profession: "大學生",
        personality: {
            type: "aggressive",
            traits: ["熱血", "正義感", "莽撞"],
            speechStyle: "說話直接，充滿活力"
        },
        appearance: {
            gender: "male",
            physicalDesc: "運動風穿搭，高大健壯",
            style: "陽光男孩",
            baseImageUrl: null
        },
        voice: {
            type: "fable",
            defaultEmotion: "confident"
        }
    },
    {
        id: "npc_006",
        name: "靜怡",
        age: 35,
        profession: "會計師",
        personality: {
            type: "analytical",
            traits: ["精明", "冷靜", "謹慎"],
            speechStyle: "說話精準，喜歡用數據和邏輯"
        },
        appearance: {
            gender: "female",
            physicalDesc: "黑色套裝，氣質幹練",
            style: "職業女性",
            baseImageUrl: null
        },
        voice: {
            type: "alloy",
            defaultEmotion: "calm"
        }
    },
    {
        id: "npc_007",
        name: "阿強",
        age: 40,
        profession: "農夫",
        personality: {
            type: "cautious",
            traits: ["憨厚", "樸實", "沉默"],
            speechStyle: "話不多，但每句話都有份量"
        },
        appearance: {
            gender: "male",
            physicalDesc: "皮膚黝黑，穿著簡單的農民服裝",
            style: "樸實農民",
            baseImageUrl: null
        },
        voice: {
            type: "onyx",
            defaultEmotion: "nervous"
        }
    },
    {
        id: "npc_008",
        name: "雅婷",
        age: 25,
        profession: "咖啡店老闆",
        personality: {
            type: "emotional",
            traits: ["熱情", "八卦", "直覺強"],
            speechStyle: "說話快速，喜歡觀察別人"
        },
        appearance: {
            gender: "female",
            physicalDesc: "時尚休閒穿搭，微捲長髮",
            style: "時尚文青",
            baseImageUrl: null
        },
        voice: {
            type: "shimmer",
            defaultEmotion: "happy"
        }
    }
];

/**
 * 情緒狀態定義
 */
export const EMOTIONS = {
    happy: { name: '開心', description: '語調輕快愉悅' },
    scared: { name: '害怕', description: '語調顫抖緊張' },
    angry: { name: '憤怒', description: '語調激動高亢' },
    sad: { name: '悲傷', description: '語調低沉緩慢' },
    suspicious: { name: '懷疑', description: '語調質疑探究' },
    confident: { name: '自信', description: '語調堅定有力' },
    nervous: { name: '緊張', description: '語調急促不安' },
    calm: { name: '平靜', description: '語調穩定溫和' }
};

/**
 * 個性類型定義
 */
export const PERSONALITY_TYPES = {
    aggressive: {
        name: '積極型',
        behavior: '主動發言、喜歡指控、容易與人爭論',
        roleAffinity: { werewolf: '會積極找目標攻擊', villager: '主動帶風向投票' }
    },
    cautious: {
        name: '謹慎型',
        behavior: '觀察多於發言、不輕易表態、喜歡收集證據',
        roleAffinity: { werewolf: '潛伏觀察、最後才動手', villager: '小心求證、不會亂投' }
    },
    analytical: {
        name: '分析型',
        behavior: '邏輯推理、整合資訊、喜歡分析發言內容',
        roleAffinity: { werewolf: '會精心設計不在場證明', villager: '善於抓出邏輯漏洞' }
    },
    emotional: {
        name: '情緒型',
        behavior: '容易受情緒影響、直覺導向、容易被煽動',
        roleAffinity: { werewolf: '演技派、善於博取同情', villager: '容易被誤導但直覺準' }
    }
};

export default NPC_CHARACTERS;
