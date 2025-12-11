export const srcBase = './src'
export const distBase = './dist'
export const srcPath = {
    'scss': srcBase + '/scss/**/*.scss',
    'img': srcBase + '/img/**/*',
    'js': srcBase + '/js/**/*.js',
    'json': srcBase + '/**/*.json',
    'xml': srcBase + '/xml/*',
    'ejs': srcBase + '/**/*.ejs',
    'herolist': [
        srcBase + '/_inc/_order_by_range.ejs', 
        srcBase + '/_inc/_list.ejs', 
        srcBase + '/_inc/_head.ejs', 
        srcBase + '/index.ejs'
    ],
    'hero': [
        srcBase + '/hero/hero.ejs', 
        srcBase + '/_inc/_contents.ejs', 
        srcBase + '/_inc/_head.ejs'
    ],
    '_ejs': '!' + srcBase + '/_inc/**/*.ejs',
};

export const distPath = {
    'css': distBase + '/css',
    'img': distBase + '/img',
    'js': distBase + '/js',
    'hero': distBase + '/hero',
};

export const def = {
    "単体攻撃": "a",
    "複数攻撃": "b",
    "六人攻撃": "c",
    "全体攻撃": "d",
    "バフのみ": "e",
    "HP回復": "f",
    "自身HP回復": "g",
    "自身MP回復": "h",
    "自身物理攻撃UP": "i",
    "自身魔法攻撃UP": "j",
    "自身物理クリティカルUP": "k",
    "自身魔法クリティカルUP": "l",
    "自身行動速度UP": "m",
    "自身属性攻撃UP": "n",
    "自身ダメージUP": "o",
    "自身条件付ダメージUP": "p",
    "自身回数付ダメージUP": "q",
    "自身回数付物理ダメージUP": "r",
    "自身回数付魔法ダメージUP": "s",
    "W攻撃": "t",
    "自身スキルダメージUP": "u",
    "自身奥義ダメージUP": "v",
    "自身デバフ耐性": "w",
    "MP回復": "x",
    "物理攻撃UP": "y",
    "魔法攻撃UP": "z",
    "物理クリティカルUP": "aa",
    "魔法クリティカルUP": "ab",
    "行動速度UP": "ac",
    "スキルダメージUP": "ad",
    "奥義ダメージUP": "ae",
    "属性攻撃UP": "af",
    "ダメージUP": "ag",
    "デバフ耐性": "ah",
    "物理防御DOWN": "ai",
    "魔法防御DOWN": "aj",
    "行動速度DOWN": "ak",
    "被ダメージUP": "al",
    "回数付ダメージUP": "am",
    "回数付物理ダメージUP": "an",
    "回数付魔法ダメージUP": "ao",
    "デバフ解除": "ap",
    "挑発": "aq",
    "毒": "ar",
    "火傷": "as",
    "凍結": "at",
    "石化": "au",
    "睡眠": "av",
    "沈黙": "aw",
    "眩暈": "ax",
    "麻痺": "ay",
    "混乱": "az",
    "魅了": "ba",
    "呪い": "bb",
    "盲目": "bc",
    "解消": "bd",
    "挑発耐性": "be",
    "毒耐性": "bf",
    "火傷耐性": "bg",
    "凍結耐性": "bh",
    "石化耐性": "bi",
    "睡眠耐性": "bj",
    "沈黙耐性": "bk",
    "眩暈耐性": "bl",
    "麻痺耐性": "bm",
    "混乱耐性": "bn",
    "魅了耐性": "bo",
    "呪い耐性": "bp",
    "盲目耐性": "bq",
    "解消耐性": "br",
    "出血": "bs",
    "出血耐性": "bt",
    "恐怖": "bu",
    "恐怖耐性": "bv",
    "行動速度UP_A": "bw",
    "行動速度UP_B": "bx",
    "行動速度DOWN_A": "by",
    "行動速度DOWN_B": "bz",
    "自身行動速度UP_A": "ca",
    "自身行動速度UP_B": "cb",
    "デバフ時間短縮": "cc",
    "バフ時間短縮": "cd",
    "状態異常時間短縮": "ce"
};

export const sk_buttons = [
    // [翻訳キー, データ値 (そのまま), 対象範囲]

    // --- 汎用 ---
    ["sk_type.w_attack", "W攻撃", ""], 
    ["sk_type.buff_only", "バフのみ", ""],
    
    // --- 👥 味方全体 (all) ---
    ["sk_type.mp_recovery", "MP回復", "all"],
    ["sk_type.attack_up", "物理攻撃UP,魔法攻撃UP", "all"],
    ["sk_type.critical_up", "物理クリティカルUP,魔法クリティカルUP", "all"],
    ["sk_type.speed_up", "行動速度UP", "all"],
    ["sk_type.speed_up_a", "行動速度UP_A", "all"],
    ["sk_type.speed_up_b", "行動速度UP_B", "all"],
    ["sk_type.skill_damage_up", "スキルダメージUP", "all"],
    ["sk_type.ub_damage_up", "奥義ダメージUP", "all"],
    ["sk_type.attribute_attack_up", "属性攻撃UP", "all"],
    ["sk_type.count_damage_up", "回数付ダメージUP,回数付物理ダメージUP,回数付魔法ダメージUP", "all"],
    ["sk_type.damage_up", "ダメージUP", "all"],
    ["sk_type.debuff_resistance", "デバフ耐性", "all"],
    
    // --- 👤 自身 (self) ---
    ["sk_type.self_mp_recovery", "自身MP回復", "self"],
    ["sk_type.self_attack_up", "自身物理攻撃UP,自身魔法攻撃UP", "self"],
    ["sk_type.self_critical_up", "自身物理クリティカルUP,自身魔法クリティカルUP", "self"],
    ["sk_type.self_speed_up", "自身行動速度UP", "self"],
    ["sk_type.self_speed_up_a", "自身行動速度UP_A", "self"],
    ["sk_type.self_speed_up_b", "自身行動速度UP_B", "self"],
    ["sk_type.self_skill_damage_up", "自身スキルダメージUP", "self"],
    ["sk_type.self_ub_damage_up", "自身奥義ダメージUP", "self"],
    ["sk_type.self_attribute_attack_up", "自身属性攻撃UP", "self"],
    ["sk_type.self_count_damage_up", "自身回数付ダメージUP,自身回数付物理ダメージUP,自身回数付魔法ダメージUP", "self"],
    ["sk_type.self_damage_up", "自身ダメージUP,自身条件付ダメージUP", "self"],
    ["sk_type.self_debuff_resistance", "自身デバフ耐性", "self"],
    ["sk_type.taunt_resistance", "挑発耐性", "self"], // 自身へのバフではないが、アイコンのため self に分類

    // --- 👹 敵 (enemy) ---
    ["sk_type.taunt", "挑発", "enemy"],
    ["sk_type.defense_down", "物理防御DOWN,魔法防御DOWN", "enemy"],
    ["sk_type.speed_down", "行動速度DOWN", "enemy"],
    ["sk_type.damage_taken_up", "被ダメージUP", "enemy"],
    ["sk_type.status_effect", "毒,火傷,凍結,出血,沈黙,解消,麻痺,睡眠,石化,眩暈,混乱,魅了,呪い,盲目,恐怖,解消", "enemy"],
    ["sk_type.speed_down_a", "行動速度DOWN_A", "enemy"],
    ["sk_type.speed_down_b", "行動速度DOWN_B", "enemy"],
];

export const ub_buttons = [
    // [表示用翻訳キー, データ参照用キー (defの日本語キー), 対象範囲]

    // --- 汎用 (攻撃タイプ/バフタイプ) ---
    ["ub_type.single_attack", "単体攻撃", ""],
    ["ub_type.multi_attack", "複数攻撃", ""],
    ["ub_type.six_person_attack", "六人攻撃", ""], // 六人攻撃はdefに「六人攻撃」として存在
    ["ub_type.full_attack", "全体攻撃", ""],
    ["ub_type.buff_only", "バフのみ", ""],

    // --- 👥 味方全体 (all) ---
    ["ub_type.hp_recovery", "HP回復", "all"],
    ["ub_type.mp_recovery", "MP回復", "all"],
    ["ub_type.attack_up", "物理攻撃UP,魔法攻撃UP", "all"],
    ["ub_type.critical_up", "物理クリティカルUP,魔法クリティカルUP", "all"],
    ["ub_type.speed_up", "行動速度UP", "all"],
    ["ub_type.attribute_attack_up", "属性攻撃UP", "all"],
    ["ub_type.count_damage_up", "回数付ダメージUP,回数付物理ダメージUP,回数付魔法ダメージUP", "all"],
    ["ub_type.damage_up", "ダメージUP", "all"],
    ["ub_type.debuff_resistance", "デバフ耐性", "all"],
    
    // --- 👤 自身 (self) ---
    ["ub_type.self_mp_recovery", "自身MP回復", "self"],
    ["ub_type.self_attack_up", "自身物理攻撃UP,自身魔法攻撃UP", "self"],
    ["ub_type.self_critical_up", "自身物理クリティカルUP,自身魔法クリティカルUP", "self"],
    ["ub_type.self_speed_up", "自身行動速度UP", "self"],
    ["ub_type.self_attribute_attack_up", "自身属性攻撃UP", "self"],
    ["ub_type.self_count_damage_up", "自身回数付ダメージUP,自身回数付物理ダメージUP,自身回数付魔法ダメージUP", "self"],
    ["ub_type.self_damage_up", "自身ダメージUP,自身条件付ダメージUP", "self"],

    // --- 👹 敵 (enemy) ---
    ["ub_type.taunt", "挑発", "enemy"],
    ["ub_type.defense_down", "物理防御DOWN,魔法防御DOWN", "enemy"],
    ["ub_type.speed_down", "行動速度DOWN", "enemy"],
    ["ub_type.damage_taken_up", "被ダメージUP", "enemy"],
    ["ub_type.status_ailments", "毒,火傷,凍結,出血,沈黙,解消,麻痺,睡眠,石化,眩暈,混乱,魅了,呪い,盲目,恐怖,解消", "enemy"],
];