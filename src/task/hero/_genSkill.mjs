import Big from 'big.js';
import { calcWaitTime, timeErrorMsg } from './_util.mjs';

// グローバルまたはシングルトンで管理すべき状態（MPチャージリスト）
const mp_charge_array = [];

export class SkillParser {

    /**
     * @type {KFData}
     * @private
     */
    static kfData = {};

    static usedTextMaps = new Set();

    static getUsedTextMaps() {
        return [...this.usedTextMaps];
    }

    /**
     * 外部データソース（KFData）をクラスに設定します。
     * @param {KFData} kf - スキルとバフの設定データ
     */
    static setKFData(kf) {
        this.kfData = kf;
    }

    /** @private {Object} ロケールデータ（/locales/parser/ja.jsonなど）を保持 */
    static textMap = {};

    /**

     * ロケールデータ（text-map）を設定します。

     * @param {Object} map - 読み込んだロケールオブジェクト。

     */

    static setTextMap(map) {

        if (!map || Object.keys(map).length === 0) {

            console.error("SkillParser: textMapが設定されていません。");

        }

        this.textMap = map;

    }

    /**
     * XML属性の文字列をBigオブジェクトに変換します。
     * 値がない場合（null/undefined/空文字列）や不正な値の場合は、0のBigオブジェクトを返します。
     * @param {string | undefined} value - XML属性の文字列値
     * @returns {Big} Bigオブジェクト
     */
    static toBig(value) {
        if (!value || typeof(value) === 'string' && value.trim() === "") {
            return new Big(0);
        }
        try {
            // Bigオブジェクトに変換
            return new Big(value);
        } catch (e) {
            console.error(`Big変換エラー: 不正な数値文字列 "${value}"`, e);
            return new Big(0);
        }
    }

    static Zero =  new Big(0);

    // --- ユーティリティメソッド (ロケールアクセス) ---

    static getTriggerString(condtype) {
        // 既存の属性キーから文字列を取得するヘルパー
        const getEl = (key) => this.getStaticText(`text.element_${key}`);
        
        // テンプレートを適用するヘルパー
        const apply = (tempKey, elKey) => {
            return this.applyTemplate(this.getStaticText(tempKey), { element: getEl(elKey) });
        };

        switch (condtype) {
            case '無效果': return this.getStaticText("trigger_text.none");
            case '受到傷害': return this.getStaticText("trigger_text.take_damage");
            case '受到持續傷害': return this.getStaticText("trigger_text.take_dot_damage");
            case '自身受擊後': return this.getStaticText("trigger_text.after_hit");

            // 水属性
            case '水屬性隊友發動傷害技能前': return apply("trigger_text.ally_atk_before", "water");
            case '水屬性隊友發動傷害技能後': return apply("trigger_text.ally_atk_after", "water");

            // 火属性
            case '火屬性隊友發動傷害技能前': return apply("trigger_text.ally_atk_before", "fire");
            case '火屬性隊友發動傷害技能後': return apply("trigger_text.ally_atk_after", "fire");

            // 風属性
            case '風屬性隊友發動傷害技能前': return apply("trigger_text.ally_atk_before", "wind");
            case '風屬性隊友發動傷害技能後': return apply("trigger_text.ally_atk_after", "wind");

            // 聖属性
            case '聖屬性隊友發動傷害技能前': return apply("trigger_text.ally_atk_before", "holy");
            case '聖屬性隊友發動傷害技能後': return apply("trigger_text.ally_atk_after", "holy");

            // 魔属性 (magic)
            case '魔屬性隊友發動傷害技能前': return apply("trigger_text.ally_atk_before", "magic");
            case '魔屬性隊友發動傷害技能後': return apply("trigger_text.ally_atk_after", "magic");

            // 想属性 (mind)
            case '想屬性隊友發動傷害技能前': return apply("trigger_text.ally_atk_before", "mind");
            case '想屬性隊友發動傷害技能後': return apply("trigger_text.ally_atk_after", "mind");

            // 属性指定なし
            case '隊友發動傷害技能前': return this.getStaticText("trigger_text.any_ally_atk_before");
            case '隊友發動傷害技能後': return this.getStaticText("trigger_text.any_ally_atk_after");

            default: return condtype;
        }
    }

    /**
     * 指定されたキーのステータス名をロケールから取得します。
     * @param {string} type - XML属性名 (例: "ATK上升或下降")
     * @returns {string} 日本語名
     */
    static getStatusName(type) {
        switch (type) {
            // --- 基本ステータス系 ---
            case 'HP上限上升或下降': return this.getStaticText('status_name.HP上限上升或下降');
            case 'ATK上升或下降': return this.getStaticText('status_name.ATK上升或下降');
            case 'MATK上升或下降': return this.getStaticText('status_name.MATK上升或下降');
            case 'DEF上升或下降': return this.getStaticText('status_name.DEF上升或下降');
            case 'MDEF上升或下降': return this.getStaticText('status_name.MDEF上升或下降');
            case '命中上升或下降': return this.getStaticText('status_name.命中上升或下降');
            case '迴避上升或下降': return this.getStaticText('status_name.迴避上升或下降');
            case 'ATK爆擊上升或下降': return this.getStaticText('status_name.ATK爆擊上升或下降');
            case 'MATK爆擊上升或下降': return this.getStaticText('status_name.MATK爆擊上升或下降');
            case '速度上升或下降': return this.getStaticText('status_name.速度上升或下降');


            // --- ダメージ加成・増減系 ---
            case '技能傷害上升或下降': return this.getStaticText('status_name.技能傷害上升或下降');
            case '奧義傷害上升或下降': return this.getStaticText('status_name.奧義傷害上升或下降');
            case '受到傷害上限降低': return this.getStaticText('status_name.受到傷害上限降低');
            case '受到普攻傷害上升或下降': return this.getStaticText('status_name.受到普攻傷害上升或下降');
            case '受到技能傷害上升或下降': return this.getStaticText('status_name.受到技能傷害上升或下降');
            case '受到奧義傷害上升或下降': return this.getStaticText('status_name.受到奧義傷害上升或下降');
            case '普攻傷害上升或下降': return this.getStaticText('status_name.普攻傷害上升或下降');
            case '受到傷害上升或下降': return this.getStaticText('status_name.受到傷害上升或下降');
            case '造成傷害上升或下降': return this.getStaticText('status_name.造成傷害上升或下降');
            case '受到一定HIT數傷害上升或下降': return this.getStaticText('status_name.受到一定HIT數傷害上升或下降');
            case '受到HIT數攻擊傷害上升或下降': return this.getStaticText('status_name.受到HIT數攻擊傷害上升或下降');

            // --- 治療系 ---
            case '治療量上升或下降': return this.getStaticText('status_name.治療量上升或下降');
            case '吸血量上升或下降': return this.getStaticText('status_name.吸血量上升或下降');
            case '被治療量上升或下降': return this.getStaticText('status_name.被治療量上升或下降');

            // --- ユーティリティ系 ---
            case '戰鬥後角色經驗值增加': return this.getStaticText('status_name.戰鬥後角色經驗值增加');
            case '戰鬥後遊戲幣獲得增加': return this.getStaticText('status_name.戰鬥後遊戲幣獲得增加');

            // --- 属性攻撃系 ---
            case '風屬性攻擊上升或下降': return this.getStaticText('status_name.風屬性攻擊上升或下降');
            case '水屬性攻擊上升或下降': return this.getStaticText('status_name.水屬性攻擊上升或下降');
            case '火屬性攻擊上升或下降': return this.getStaticText('status_name.火屬性攻擊上升或下降');
            case '聖屬性攻擊上升或下降': return this.getStaticText('status_name.聖屬性攻擊上升或下降');
            case '魔屬性攻擊上升或下降': return this.getStaticText('status_name.魔屬性攻擊上升或下降');
            case '想屬性攻擊上升或下降': return this.getStaticText('status_name.想屬性攻擊上升或下降');

            // --- 属性防御系 ---
            case '風屬性防禦上升或下降': return this.getStaticText('status_name.風屬性防禦上升或下降');
            case '水屬性防禦上升或下降': return this.getStaticText('status_name.水屬性防禦上升或下降');
            case '火屬性防禦上升或下降': return this.getStaticText('status_name.火屬性防禦上升或下降');
            case '聖屬性防禦上升或下降': return this.getStaticText('status_name.聖屬性防禦上升或下降');
            case '魔屬性防禦上升或下降': return this.getStaticText('status_name.魔屬性防禦上升或下降');
            case '想屬性防禦上升或下降': return this.getStaticText('status_name.想屬性防禦上升或下降');

            // --- 属性被ダメージ系 ---
            case '受到風屬性傷害上升或下降': return this.getStaticText('status_name.受到風屬性傷害上升或下降');
            case '受到水屬性傷害上升或下降': return this.getStaticText('status_name.受到水屬性傷害上升或下降');
            case '受到火屬性傷害上升或下降': return this.getStaticText('status_name.受到火屬性傷害上升或下降');
            case '受到聖屬性傷害上升或下降': return this.getStaticText('status_name.受到聖屬性傷害上升或下降');
            case '受到魔屬性傷害上升或下降': return this.getStaticText('status_name.受到魔屬性傷害上升或下降');
            case '受到想屬性傷害上升或下降': return this.getStaticText('status_name.受到想屬性傷害上升或下降');

            // --- 強化コスト減少系 ---
            case '風屬性角色技能強化消耗金幣減少': return this.getStaticText('status_name.風屬性角色技能強化消耗金幣減少');
            case '水屬性角色技能強化消耗金幣減少': return this.getStaticText('status_name.水屬性角色技能強化消耗金幣減少');
            case '火屬性角色技能強化消耗金幣減少': return this.getStaticText('status_name.火屬性角色技能強化消耗金幣減少');
            case '聖屬性角色技能強化消耗金幣減少': return this.getStaticText('status_name.聖屬性角色技能強化消耗金幣減少');
            case '魔屬性角色技能強化消耗金幣減少': return this.getStaticText('status_name.魔屬性角色技能強化消耗金幣減少');
            case '想屬性角色技能強化消耗金幣減少': return this.getStaticText('status_name.想屬性角色技能強化消耗金幣減少');

            // --- 時間・継続系 ---
            case '狀態效果時間上升或下降': return this.getStaticText('status_name.狀態效果時間上升或下降');
            case 'Buff效果時間上升或下降': return this.getStaticText('status_name.Buff效果時間上升或下降');
            case 'Debuff效果時間上升或下降': return this.getStaticText('status_name.Debuff效果時間上升或下降');
            case '狀態持續時間延長或縮短': return this.getStaticText('status_name.狀態持續時間延長或縮短');
            case 'Buff持續時間延長或縮短': return this.getStaticText('status_name.Buff持續時間延長或縮短');
            case 'Debuff持續時間延長或縮短': return this.getStaticText('status_name.Debuff持續時間延長或縮短');

            // --- 防御値バリア・反射系 ---
            case '物理防禦值護盾': return this.getStaticText('status_name.物理防禦值護盾');
            case '魔法防禦值護盾': return this.getStaticText('status_name.魔法防禦值護盾');
            case '綜合防禦值護盾': return this.getStaticText('status_name.綜合防禦值護盾');
            case '物理防禦值反射': return this.getStaticText('status_name.物理防禦值反射');
            case '魔法防禦值反射': return this.getStaticText('status_name.魔法防禦值反射');
            case '綜合防禦值反射': return this.getStaticText('status_name.綜合防禦值反射');

            // --- 特殊追加ダメージ・トリガー系 ---
            case '普攻追加傷害': return this.getStaticText('status_name.普攻追加傷害');
            case '技能追加傷害': return this.getStaticText('status_name.技能追加傷害');
            case '觸發狀態': return this.getStaticText('status_name.觸發狀態');
            case '条件状態': return this.getStaticText('status_name.条件状態');

            default: return type; // 見つからない場合はそのまま返す
        }
    }


    static getTargetHpEffectString(effect) {
        switch (effect) {
            case '魔法傷害':
                return this.getStaticText('text.magic_damage');
            case '物理傷害':
                return this.getStaticText('text.physical_damage');
            case '回復':
                return this.getStaticText('text.heal');
            case '無效果':
            default:
                return '';
        }
    }

    /**
     * 指定されたキーのテンプレート文字列をロケールから取得します。
     * @param {string} key - テンプレートキー (例: "skill_damage_base")
     * @returns {string} テンプレート文字列
     */
    static getTemplateString(key) {
        const full_key = `template.${key}`;
        this.usedTextMaps.add(full_key);

        return this.textMap[full_key] || `[ERR: Template ${full_key}]`;
    }

    /**
     * 指定されたキーの静的テキストをロケールから取得します。
     * @param {string} key - テキストキー (例: "text.up")
     * @returns {string} 静的テキスト
     */
    static getStaticText(key) {
        this.usedTextMaps.add(key);
        return this.textMap[key] || `[ERR: Text ${key}]`;
    }

    /**
     * テンプレート文字列のプレースホルダーを置換します。
     * @param {string} template - テンプレート文字列
     * @param {Object} vars - 置換変数
     * @returns {string} 置換後の文字列
     */
    static applyTemplate(template, vars) {
        let result = template;
        for (const [key, value] of Object.entries(vars)) {
            // valueがundefined/nullの場合は空文字列に置換（テンプレートが崩れるのを防ぐ）
            result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
        }
        return result;
    }

    // --- XML属性値の解析 ---

 /**
     * @_target または @_buff_target から表示対象文字列を取得します。
     * SkillBuffTargetのすべての値に対応します。
     * @param {string} targetAttr - XMLの @_target または @_buff_target 属性値
     * @returns {string} 表示対象テキスト
     */
    static parseTarget(targetAttr) {
        switch (targetAttr) {
            // --- 基本的なターゲット ---
            case '技能對象':
                return this.getStaticText('text.target_skill_target');
            case '特定對象':
                return this.getStaticText('text.target_specific_target');
            case '自身':
                return this.getStaticText('text.target_self');
            case '敵方全體':
                return this.getStaticText('text.target_enemy_all');
            case '我方全體':
            case '我方全體(自身を除く)':
                return this.getStaticText('text.target_ally_all');

            // --- 距離依存 ---
            case '最近敵方':
                return this.getStaticText('text.target_nearest_enemy');
            case '最遠敵方':
                return this.getStaticText('text.target_farthest_enemy');
            case '最近我方':
                return this.getStaticText('text.target_nearest_ally');
            case '最遠我方':
                return this.getStaticText('text.target_farthest_ally');

            // --- HP/MP依存 ---
            case '敵方HP最高':
                return this.getStaticText('text.target_highest_hp_enemy');
            case '敵方HP最低':
                return this.getStaticText('text.target_lowest_hp_enemy');
            case '我方HP最高':
                return this.getStaticText('text.target_highest_hp_ally');
            case '我方HP最低':
                return this.getStaticText('text.target_lowest_hp_ally');
            case '敵方MP最高':
                return this.getStaticText('text.target_highest_mp_enemy');
            case '敵方MP最低':
                return this.getStaticText('text.target_lowest_mp_enemy');
            case '我方MP最高':
                return this.getStaticText('text.target_highest_mp_ally');
            case '我方MP最低':
                return this.getStaticText('text.target_lowest_mp_ally');
            
            // --- 位置依存（前中後列・最前最後） ---
            case '前面我方全體':
                // SkillTargetに存在するが、SkillBuffTargetにはない表現をサポート
                return this.getStaticText('text.target_front_ally_all'); 
            case '後面我方全體':
                // SkillTargetに存在するが、SkillBuffTargetにはない表現をサポート
                return this.getStaticText('text.target_rear_ally_all'); 
            case '敵方前排':
                return this.getStaticText('text.target_front_enemy');
            case '敵方中排':
                return this.getStaticText('text.target_middle_enemy');
            case '敵方後排':
                return this.getStaticText('text.target_rear_enemy');
            case '我方前排':
                return this.getStaticText('text.target_front_ally');
            case '我方中排':
                return this.getStaticText('text.target_middle_ally');
            case '我方後排':
                return this.getStaticText('text.target_rear_ally');
            case '我方最前':
                return this.getStaticText('text.target_very_front_ally');
            case '我方最後':
                return this.getStaticText('text.target_very_rear_ally');
            case '敵方最前':
                return this.getStaticText('text.target_very_front_enemy');
            case '敵方最後':
                return this.getStaticText('text.target_very_rear_enemy');
            
            // --- ステータス依存（攻撃力、防御力、クリティカル、最大HP、命中、ブロック） ---
            case '敵方物理攻擊最高':
                return this.getStaticText('text.target_highest_patk_enemy');
            case '我方物理攻擊最高':
                return this.getStaticText('text.target_highest_patk_ally');
            case '我方物理攻擊最低':
                return this.getStaticText('text.target_lowest_patk_ally');
            case '敵方物理攻擊最低':
                return this.getStaticText('text.target_lowest_patk_enemy');
            
            case '敵方魔法攻擊最高':
                return this.getStaticText('text.target_highest_matk_enemy');
            case '我方魔法攻擊最高':
                return this.getStaticText('text.target_highest_matk_ally');
            case '我方魔法攻擊最低':
                return this.getStaticText('text.target_lowest_matk_ally');
            case '敵方魔法攻擊最低':
                return this.getStaticText('text.target_lowest_matk_enemy');

            // --- 以降、SkillBuffTargetにのみ存在する詳細なターゲット ---
            case '我方物理爆擊最高':
                return this.getStaticText('text.target_highest_pcrit_ally');
            case '敵方物理爆擊最高':
                return this.getStaticText('text.target_highest_pcrit_enemy');
            case '我方物理爆擊最低':
                return this.getStaticText('text.target_lowest_pcrit_ally');
            case '敵方物理爆擊最低':
                return this.getStaticText('text.target_lowest_pcrit_enemy');
            
            case '我方魔法爆擊最高':
                return this.getStaticText('text.target_highest_mcrit_ally');
            case '敵方魔法爆擊最高':
                return this.getStaticText('text.target_highest_mcrit_enemy');
            case '我方魔法爆擊最低':
                return this.getStaticText('text.target_lowest_mcrit_ally');
            case '敵方魔法爆擊最低':
                return this.getStaticText('text.target_lowest_mcrit_enemy');

            case '敵方物理防禦最高':
                return this.getStaticText('text.target_highest_pdef_enemy');
            case '敵方魔法防禦最高':
                return this.getStaticText('text.target_highest_mdef_enemy');
            case '敵方物理防禦最低':
                return this.getStaticText('text.target_lowest_pdef_enemy');
            case '敵方魔法防禦最低':
                return this.getStaticText('text.target_lowest_mdef_enemy');
            case '我方物理防禦最低':
                return this.getStaticText('text.target_lowest_pdef_ally');
            case '我方魔法防禦最低':
                return this.getStaticText('text.target_lowest_mdef_ally');
            case '我方物理防禦最高':
                return this.getStaticText('text.target_highest_pdef_ally');
            case '我方魔法防禦最高':
                return this.getStaticText('text.target_highest_mdef_ally');

            case '我方最大HP最高':
                return this.getStaticText('text.target_highest_maxhp_ally');
            case '我方最大HP最低':
                return this.getStaticText('text.target_lowest_maxhp_ally');
            case '敵方最大HP最高':
                return this.getStaticText('text.target_highest_maxhp_enemy');
            case '敵方最大HP最低':
                return this.getStaticText('text.target_lowest_maxhp_enemy');

            case '我方格擋最高':
                return this.getStaticText('text.target_highest_block_ally');
            case '我方格擋最低':
                return this.getStaticText('text.target_lowest_block_ally');
            case '敵方格擋最高':
                return this.getStaticText('text.target_highest_block_enemy');
            case '敵方格擋最低':
                return this.getStaticText('text.target_lowest_block_enemy');
            
            case '我方命中最高':
                return this.getStaticText('text.target_highest_accuracy_ally');
            case '我方命中最低':
                return this.getStaticText('text.target_lowest_accuracy_ally');
            case '敵方命中最高':
                return this.getStaticText('text.target_highest_accuracy_enemy');
            case '敵方命中最低':
                return this.getStaticText('text.target_lowest_accuracy_enemy');
            
            // --- 属性・型・武器種依存 ---
            case '我方火屬性角色':
                return this.getStaticText('text.target_ally_fire');
            case '我方水屬性角色':
                return this.getStaticText('text.target_ally_water');
            case '我方風屬性角色':
                return this.getStaticText('text.target_ally_wind');
            case '我方聖屬性角色':
                return this.getStaticText('text.target_ally_holy');
            case '我方魔屬性角色':
                return this.getStaticText('text.target_ally_dark');
            case '我方想屬性角色':
                return this.getStaticText('text.target_ally_thought');
            case '敵方火屬性角色':
                return this.getStaticText('text.target_enemy_fire');
            case '敵方水屬性角色':
                return this.getStaticText('text.target_enemy_water');
            case '敵方風屬性角色':
                return this.getStaticText('text.target_enemy_wind');
            case '敵方聖屬性角色':
                return this.getStaticText('text.target_enemy_holy');
            case '敵方魔屬性角色':
                return this.getStaticText('text.target_enemy_dark');
            case '敵方想屬性角色':
                return this.getStaticText('text.target_enemy_thought');
            
            case '我方斬武器角色':
                return this.getStaticText('text.target_ally_slash');
            case '我方突武器角色':
                return this.getStaticText('text.target_ally_pierce');
            case '我方打武器角色':
                return this.getStaticText('text.target_ally_strike');
            case '我方射武器角色':
                return this.getStaticText('text.target_ally_shoot');
            case '我方投武器角色':
                return this.getStaticText('text.target_ally_throw');
                
            case '我方物理型角色':
                return this.getStaticText('text.target_ally_physical_type');
            case '敵方物理型角色':
                return this.getStaticText('text.target_enemy_physical_type');
            case '我方魔法型角色':
                return this.getStaticText('text.target_ally_magic_type');
            case '敵方魔法型角色':
                return this.getStaticText('text.target_enemy_magic_type');
            
            default:
                // 未知のターゲット属性はそのまま返す
                return targetAttr || '';
        }
    }
    /**
     * ダメージ/回復量をHTMLフォーマットで返します。
     * @param {string} value - ダメージ/回復量の文字列 (例: "5.6%+1000")
     * @param {'down' | 'up' | 'heal' | ''} type - 値の傾向 ('down', 'up', 'heal', または空文字)
     * @returns {string} HTMLタグ付きの値
     */
    static formatValueHTML(value, type = '') {
        // classNameの初期値は 'general' または空
        let className = ''; 

        switch (type) {
            case 'down':
                // デバフ/ダメージ減少など、ネガティブな影響
                className = 'down'; 
                break;
            case 'up':
                // バフ/ダメージ増加など、ポジティブな影響
                className = 'up'; 
                break;
            case 'heal':
                // 回復
                className = 'heal'; 
                break;
            case '':
            default:
                // タイプなし (例: 状態異常の固定値など、色分けが不要な場合)
                className = '';
                break;
        }
        const classString = `value${className ? ' ' + className : ''}`;   
        return `<span class="${classString}">${value}</span>`;
    }

    static formatValue(scaleValue, fixedValue) {

        const s = this.toBig(scaleValue);
        const f = this.toBig(fixedValue);

        const scale_zero = s.eq(0);
        const fixed_zero = f.eq(0);

        if (scale_zero && fixed_zero) {
            return "0";
        }
        if (scale_zero && !fixed_zero) {
            return f.gt(0) ? `${f.toString()}` : `-${f.abs().toString()}`;
        }
        if (!scale_zero && fixed_zero) {
            return s.gt(0) ? `${s.toString()}%` : `-${s.abs().toString()}%`;
        }
        return `${s.gt(0) ? `${s.toString()}%` : `-${s.abs().toString()}%`}${f.gt(0) ? `+${f.toString()}` : `-${f.abs().toString()}`}`;
    }

    static formatValueHTML_Standard(vars, lv, value1, value2, value3, isDebuff, isHeal, upText, downText)
    {
        const scale = this.toBig(value1);
        const add = this.toBig(value2);
        const grow = this.toBig(value3);

        const fixedValue = grow.mul(lv).plus(add);

        vars.value_html = this.formatValueHTML(this.formatValue(scale, fixedValue), isDebuff ? 'down' : isHeal ? 'heal' : 'up');

        if (scale.gt(0)) {
            vars.up_down = upText;
        }
        else if (scale.lt(0)) {
            vars.up_down = downText;
        }
        else {
            vars.up_down = "";
        }
    }

    static formatValueHTML_UpDown(vars, lv, value1, value2, value3, isDebuff) {
        return formatValueHTML_Standard(vars, lv, value1, value2, value3, isDebuff, false, this.getStaticText('text.up'), this.getStaticText('text.down'));
    }

    static formatValueHTML_TimeEffect(vars, lv, value1, value2, value3, isDebuff) {
        return formatValueHTML_Standard(vars, lv, value1, value2, value3, isDebuff, false, this.getStaticText('text.extend'), this.getStaticText('text.shorten'));
    }

    static formatValueHTML_AddSub(vars, lv, value1, value2, value3, isDebuff, isHeal) {
        return formatValueHTML_Standard(vars, lv, value1, value2, value3, isDebuff, isHeal, this.getStaticText('text.up'), this.getStaticText('text.down'));
    }

    static appendUpDown(vars, scale) {
        if (scale.gt(0)) {
            vars.up_down = this.getStaticText('text.up');
        }
        else if (scale.lt(0)) {
            vars.up_down = this.getStaticText('text.down');
        }
        else {
            vars.up_down = "";
        }
    }

    static formatValueHTML_FixedBarrier(vars, lv, value1, value2, value3) {
        const add = this.toBig(value1);
        const grow = this.toBig(value2);
        const heal = this.toBig(value3);
        const fixedValue = grow.mul(lv).plus(add);
        vars.value_html = this.formatValueHTML(this.formatValue(this.Zero, fixedValue));
        vars.healing_value_html = this.formatValueHTML(this.formatValue(heal, 0), 'heal');
    }

    static formatValueHTML_PercentBarrier(vars, lv, value1, value2, value3, value4, value5) {
        const scale = this.toBig(value1);
        const count = this.toBig(value2);
        const heal = this.toBig(value3);
        const add = this.toBig(value4);
        const grow = this.toBig(value5);
        vars.count_html = count.lt(999) ? this.formatValueHTML(count.toString()) : "";
        vars.healing_value_html = heal.gt(0) ? this.formatValueHTML(this.formatValue(heal, 0), 'heal') : "";
        const fixedValue = grow.mul(lv).plus(add);
        vars.value_html = this.formatValueHTML(this.formatValue(scale, fixedValue));
        this.appendUpDown(vars, scale);
    }

    static formatValueHTML_PercentReflect(vars, lv, value1, value2, value3, value4) {
        const scale = this.toBig(value1);
        const count = this.toBig(value2);
        const add = this.toBig(value3);
        const grow = this.toBig(value4);
        vars.count_html = count.lt(999) ? this.formatValueHTML(count.toString()) : "";
        const fixedValue = grow.mul(lv).plus(add);
        vars.value_html = this.formatValueHTML(this.formatValue(scale, fixedValue));
        this.appendUpDown(vars, scale);
    }

    static formatValueHTML_PercentDamageUp(vars, lv, value1, value2, value3, value4) {
        const scale = this.toBig(value1);
        const count = this.toBig(value2);
        const add = this.toBig(value3);
        const grow = this.toBig(value4);
        vars.count_html = count.lt(999) ? this.formatValueHTML(count.toString()) : "";
        const fixedValue = grow.mul(lv).plus(add);
        vars.value_html = this.formatValueHTML(this.formatValue(scale, fixedValue));
        this.appendUpDown(vars, scale);
    }

    static formatValueHTML_DamageLimitReduction(vars, value1, value2) {
        const reduction = (new Big(100)).minus(this.toBig(value1));
        const threshold = this.toBig(value2);
        vars.threshold_html = this.formatValueHTML(this.formatValue(0, threshold));
        vars.reduction_html = this.formatValueHTML(this.formatValue(reduction, 0));
    }


    static formatValueHTML_Crit(vars, lv, value1, value2, value3, isDebuff) {

        const scale = this.toBig(value1);
        const add = this.toBig(value2);
        const grow = this.toBig(value3);

        const fixedValue = grow.mul(lv).plus(add);

    
        if (scale.gt(0)) {
            vars.value_html = this.formatValueHTML(this.formatValue(scale, fixedValue), isDebuff ? 'down' : 'up');
            vars.up_down = this.getStaticText('text.up');
        }
        else if (scale.lt(0)) {
            vars.value_html = this.formatValueHTML(this.formatValue(scale, fixedValue), isDebuff ? 'down' : 'up');
            vars.up_down = this.getStaticText('text.down');
        }
        else {
            const fixedValueCrit = (fixedValue.gt(0) ? "+" : "") + `${fixedValue.mul("0.05").round(2, Big.roundHalfEven).toString()}%`;
            vars.value_html = this.formatValueHTML(fixedValueCrit, isDebuff ? 'down' : 'up');
            vars.up_down = "";
        }
    }


// --- メインパースロジック ---

    /**
     * スキルや奥義本体の効果（ダメージや全体回復）のテキストをパースします。
     * @param {Object} skill - スキルXMLノード
     * @param {number} lv - スキルレベル
     * @param {Object} info - レベル依存値情報
     * @returns {string} 生成されたスキルテキスト
     */
    static parseTargetHp(skill, lv, info) {
        const type = skill['@_target_hp_effect'];
        const targetAttr = skill['@_target'];
        const targetText = this.parseTarget(targetAttr);

        const hpScale = skill['@_target_hp_scale'];
        const hpAdd = skill['@_target_hp_add'];
        const hpGrow = skill['@_target_hp_add_grow'];

        // ダメージ/回復量の計算: hpScale% + (hpAdd + hpGrow * lv)
        const baseValue = this.toBig(hpGrow).mul(lv).plus(hpAdd);
        const damageValue = `${this.toBig(hpScale).mul(100).round(0, Big.roundDown).toString()}%${baseValue.cmp(0) !== 0 ? `+${baseValue.toString()}` : ''}`;


        const vars = {
            damage_type: this.getTargetHpEffectString(type), // ダメージ or 回復
            target_text: targetText
        }

        if (type.includes('傷害')) {
            vars.value_html = this.formatValueHTML(damageValue);
            return this.applyTemplate(this.getTemplateString('skill_damage_base'), vars);
        } 
        
        if (type.includes('回復')) {
            vars.value_html = this.formatValueHTML(damageValue, 'heal');
            return this.applyTemplate(this.getTemplateString('skill_heal_base'), vars);
        }

        return '';
    }

    /**
     * スキルや奥義本体の吸収効果のテキストをパースします。
     * @param {Object} skill  - スキルXMLノード
     * @param {number} lv - スキルレベル
     * @param {Object} info - レベル依存値情報
     * @returns {string} 生成されたスキルテキスト
     */
    static parseDmgSuckHp(skill, lv, info) {
        const targetText = this.parseTarget('自身');
 
        const suckScale = this.toBig(skill['@_dmg_suck_hp_scale']);
        const suckAdd = this.toBig(skill['@_dmg_suck_hp_add']);
        const suckGrow = this.toBig(skill['@_dmg_suck_hp_add_grow']);

        if (suckScale.cmp(0) === 0) {
            return "";
        }
        const baseValue = this.toBig(suckGrow).mul(lv).plus(suckAdd);
        const suckValue = `${this.toBig(suckScale).mul(100).round(0, Big.roundDown).toString()}%${baseValue.cmp(0) !== 0 ? `+${baseValue.toString()}` : ''}`;
        

        vars.damage_type = this.getStaticText('text.suck'); // 吸収
        const vars = {
            target_text: targetText,
            damage_type: damageType,
            value_html: this.formatValueHTML(suckValue, 'heal'),
        };
        return this.applyTemplate(this.getTemplateString('skill_suck_base'), vars);
    }

    /**
     * スキルや奥義本体の必中効果のテキストをパースします。
     * @param {Object} skill  - スキルXMLノード
     * @param {number} lv - スキルレベル
     * @param {Object} info - レベル依存値情報
     * @returns {string} 生成されたスキルテキスト
     */
    static parseTrueHit(skill, lv, info) {
        const trueHit = skill['@_target_hp_must_hit'];
        if (trueHit && trueHit === "true") {
            return this.getStaticText('text.true_hit');
        }
        return "";
    }

    /**
     * スキルや奥義本体の必クリティカル効果のテキストをパースします。
     * @param {Object} skill  - スキルXMLノード
     * @param {number} lv - スキルレベル
     * @param {Object} info - レベル依存値情報
     * @returns {string} 生成されたスキルテキスト
     */
    static parseTrueCrit(skill, lv, info) {
        const trueCrit = skill['@_target_hp_must_crit'];
        if (trueCrit && trueCrit === "true") {
            return this.getStaticText('text.true_crit');
        }
        return "";
    }

    /**
     * バフやデバフ効果のテキストをパースします。
     * @param {Object} skill - バフXMLノード
     * @param {number} lv - スキルレベル
     * @param {Object} info - レベル依存値情報
     * @returns {string} 生成されたバフ/デバフテキスト
     */
    static parseBuff(skill, lv, info) {

        //const postfix = info.postFix; // A or B or C or D
        //const iftype = info.buffIf;
        //const id = info.buffId;
        //const probability = info.buffProb;

        const buff = info.buff;
        const buffTargetAttr = info.buffTarget;
        const duration = info.buffDur;

        const targetAttr = skill['@_target'];
        const targetText = buffTargetAttr === "技能對象" ? this.parseTarget(targetAttr) : this.parseTarget(buffTargetAttr);



        const type = buff['@_effect_type'];
        const value = buff['@_value'] || '---';
        const isDebuff = buff['@_debuff'] === "true";
        const isStack = buff['@_group_stack'] === 'true';


        // --- テンプレート置換変数を初期化 ---
        const vars = {
            target_text: targetText,

            status_name: this.getStatusName(type), // 例: 上升或下降系の文 ◯◯◯+10%UP の◯の部分
            duration: this.formatValueHTML(duration),
            per_second: this.getStaticText('text.per_second'),
        };

        // --- 処理分岐 ---

        // クリティカル増減 (Fixedのみの場合は%表記する)
        if (type.includes('爆擊上升或下降')) {
            this.formatValueHTML_Crit(
                vars,
                lv, 
                buff['@_effect_val1'],
                buff['@_effect_val2'],
                buff['@_effect_val3'],
                isDebuff                
            );
            return this.applyTemplate(this.getTemplateString('buff_status_crit'), vars);
        }

        // 速度増減 (Fixedは省略する)
        if (type.includes('速度上升或下降')) {
            this.formatValueHTML_UpDown(
                vars,
                lv,
                buff['@_effect_val1'],
                "0",
                "0",
                isDebuff
            );
            return this.applyTemplate(this.getTemplateString('buff_status_updown'), vars);
        }

        // 1. ステータス増減 (最も多いタイプ)
        if (type.includes('上升或下降')) {
            this.formatValueHTML_UpDown(
                vars,
                lv,
                buff['@_effect_val1'],
                buff['@_effect_val2'],
                buff['@_effect_val3'],
                isDebuff
            );
            return this.applyTemplate(this.getTemplateString('buff_status_updown'), vars);
        }

        // 2. 継続回復/継続ダメージ (中毒、火傷など)
        if (type === '中毒') {
            // 中毒は特殊なテンプレートを使用
            this.formatValueHTML_AddSub(
                vars,
                lv,
                buff['@_effect_val1'],
                buff['@_effect_val2'],
                buff['@_effect_val3'],
                isDebuff,
                false
            );

            return this.applyTemplate(this.getTemplateString(isStack ? 'ailment_strong_poison' : 'ailment_poison'), {
                ...vars,
                stackable: this.getStaticText('text.stackable')
            });
        }

        if (type === '燒傷') {
            this.formatValueHTML_AddSub(
                vars,
                lv,
                buff['@_effect_val1'],
                buff['@_effect_val2'],
                buff['@_effect_val3'],
                isDebuff,
                false
            );

            return this.applyTemplate(this.getTemplateString(isStack ? 'ailment_strong_burn' : 'ailment_burn'), {
                ...vars,
                stackable: this.getStaticText('text.stackable')
            });
        }

        if (type === '凍結') {
            this.formatValueHTML_AddSub(
                vars,
                lv,
                buff['@_effect_val1'],
                buff['@_effect_val2'],
                buff['@_effect_val3'],
                isDebuff,
                false
            );

            return this.applyTemplate(this.getTemplateString('ailment_freeze'), {
                ...vars,
                stackable: this.getStaticText('text.stackable')
            });
        }

        if (type === '恐懼') {
            this.formatValueHTML_AddSub(
                vars,
                lv,
                buff['@_effect_val1'],
                buff['@_effect_val2'],
                buff['@_effect_val3'],
                isDebuff,
                false
            );

            return this.applyTemplate(this.getTemplateString('ailment_fear'), {
                ...vars,
                stackable: this.getStaticText('text.stackable')
            });
        }
        if (type === '流血') {
            this.formatValueHTML_AddSub(
                vars,
                lv, 
                buff['@_effect_val1'],
                buff['@_effect_val2'],
                buff['@_effect_val3'],
                isDebuff,
                false
            );

            return this.applyTemplate(this.getTemplateString('ailment_bleed'), {
                ...vars,
                stackable: this.getStaticText('text.stackable')
            });
        }

        if (type.includes('HP回復')) {
            // 継続回復
            this.formatValueHTML_AddSub(
                vars,
                lv, 
                buff['@_effect_val1'],
                buff['@_effect_val2'],
                buff['@_effect_val3'],
                isDebuff,
                true
            );

            return this.applyTemplate(this.getTemplateString('buff_charge_base'), {
                ...vars,
                status_name: this.getStaticText('text.hphot')
            });
        }
        if (type.includes('MP回復')) {
            // 継続回復
            this.formatValueHTML_AddSub(
                vars,
                lv,
                buff['@_effect_val1'],
                buff['@_effect_val2'],
                buff['@_effect_val3'],
                isDebuff,
                true
            );

            return this.applyTemplate(this.getTemplateString('buff_charge_base'), {
                ...vars,
                status_name: duration !== "0" ? this.getStaticText('text.mphot') : this.getStaticText('text.mpcharge')
            });
        }


        // 3. バリア

        if (type.includes('定值傷害吸收')) {
            let damage_prefix = '';
            if (type.includes('物理')) {
                damage_prefix = this.getStaticText('text.physical_prefix');
            }
            else if (type.includes('魔法')) {
                damage_prefix = this.getStaticText('text.magic_prefix');
            }
            this.formatValueHTML_FixedBarrier(
                vars,
                lv,
                buff['@_effect_val1'],
                buff['@_effect_val2'],
                buff['@_effect_val3']
            );

            const template_name = `barrier${vars.healing_value_html ? "_heal" : "_base"}`;

            return this.applyTemplate(this.getTemplateString(template_name), {
                ...vars,
                damage_prefix: damage_prefix
            });
        }

        if (type.includes('次數傷害吸收')) {
            let damage_prefix = '';
            if (type.includes('物理')) {
                damage_prefix = this.getStaticText('text.physical_prefix');
            }
            else if (type.includes('魔法')) {
                damage_prefix = this.getStaticText('text.magic_prefix');
            }
            const val2 = this.toBig(buff['@_effect_val2']);
            const unlimited = val2.gte(999);

            this.formatValueHTML_PercentBarrier(
                vars,
                lv,
                buff['@_effect_val1'],
                buff['@_effect_val2'],
                buff['@_effect_val3'],
                buff['@_effect_val4'],
                buff['@_effect_val5']
            );

            const template_name = `barrier${vars.healing_value_html ? "_heal" : "_base"}${unlimited ? "" : "_count"}`;

            return this.applyTemplate(
                this.getTemplateString(template_name), {
                ...vars,
                damage_prefix: damage_prefix
            });
        }

        if (type.includes('次數傷害反彈')) {
            let damage_prefix = '';
            if (type.includes('物理')) {
                damage_prefix = this.getStaticText('text.physical_prefix');
            }
            else if (type.includes('魔法')) {
                damage_prefix = this.getStaticText('text.magic_prefix');
            }
            const val2 = this.toBig(buff['@_effect_val2']);
            const unlimited = val2.gte(999);

            this.formatValueHTML_PercentReflect(
                vars,
                lv,
                buff['@_effect_val1'],
                buff['@_effect_val2'],
                buff['@_effect_val3'],
                buff['@_effect_val4'],
            );

            const template_name = `barrier_reflect${unlimited ? "" : "_count"}`;

            return this.applyTemplate(
                this.getTemplateString(template_name), {
                ...vars,
                damage_prefix: damage_prefix
            });
        }

        if (type.includes('次數傷害加成')) {
            let damage_prefix = '';
            if (type.includes('物理')) {
                damage_prefix = this.getStaticText('text.physical_prefix');
            }
            else if (type.includes('魔法')) {
                damage_prefix = this.getStaticText('text.magic_prefix');
            }
            const val2 = this.toBig(buff['@_effect_val2']);
            const unlimited = val2.gte(999);

            this.formatValueHTML_PercentDamageUp(
                vars,
                lv,
                buff['@_effect_val1'],
                buff['@_effect_val2'],
                buff['@_effect_val3'],
                buff['@_effect_val4'],
            );

            const template_name = `damage_up_base${unlimited ? "" : "_count"}`;

            return this.applyTemplate(
                this.getTemplateString(template_name), {
                ...vars,
                damage_prefix: damage_prefix
            });
        }

        if (type.includes('受到傷害上限降低')) {
            this.formatValueHTML_DamageLimitReduction(vars, buff['@_effect_val1'], buff['@_effect_val2']);
            return this.applyTemplate(this.getTemplateString("damage_limit_reduction"), vars)
        }

        if (type.includes("技能強化消耗金幣減少")) {
            this.formatValueHTML_UpDown(
                vars, 
                lv,
                buff['@_effect_val1'],
                buff['@_effect_val2'],
                buff['@_effect_val3'],
                isDebuff
            );
            return this.applyTemplate(this.getTemplateString("buff_status_updown"), vars);
        }

        if (type.includes("時間延長或縮短")) {
            this.formatValueHTML_TimeEffect(
                vars, 
                lv,
                buff['@_effect_val1'],
                buff['@_effect_val2'],
                buff['@_effect_val3'],
                isDebuff
            );
            return this.applyTemplate(this.getTemplateString("time_effect"), {
                ...vars,
                unit: this.getStaticText("text.sec_short"),
            });
        }

        if (type.includes("防禦值護盾")) {
            this.formatValueHTML_UpDown(
                vars, 
                lv,
                buff['@_effect_val1'],
                buff['@_effect_val2'],
                buff['@_effect_val3'],
                isDebuff
            );
            return this.applyTemplate(this.getTemplateString("barrier_def"), vars);
        }

        if (type.includes("防禦值反射")) {
            this.formatValueHTML_UpDown(
                vars, 
                lv,
                buff['@_effect_val1'],
                buff['@_effect_val2'],
                buff['@_effect_val3'],
                isDebuff
            );
            return this.applyTemplate(this.getTemplateString("reflect_def"), vars);
        }

        if(type.includes('普攻追加傷害')) {

            const val2 = this.toBig(buff['@_effect_val2']);
            vars.damage_percent = this.formatValueHTML(buff['@_effect_val1']);
            vars.count = val2.toString();
            
            // 1. 中身（attack_text）を作成
            const innerTemplate = val2.eq(1) 
                ? this.getTemplateString('chase_normal_attack_single')
                : this.getTemplateString('chase_normal_attack_multi');
            vars.attack_text = this.applyTemplate(innerTemplate, vars);

            // 2. 外枠に流し込む（例：通常攻撃時
            return this.applyTemplate(this.getTemplateString("chase_normal_attack_on_normal"), vars);
        }

        if(type.includes('技能追加傷害')) {

            const val2 = this.toBig(buff['@_effect_val2']);
            vars.damage_percent = this.formatValueHTML(buff['@_effect_val1']);
            vars.count = val2.toString();
            
            // 1. 中身（attack_text）を作成
            const innerTemplate = val2.eq(1) 
                ? this.getTemplateString('chase_normal_attack_single')
                : this.getTemplateString('chase_normal_attack_multi');
            vars.attack_text = this.applyTemplate(innerTemplate, vars);

            // 2. 外枠に流し込む（例：通常攻撃時
            return this.applyTemplate(this.getTemplateString("chase_normal_attack_on_skill"), vars);
        }

        if (type.includes('觸發狀態')) {
            // ペトラギルスの奥義の同調効果

            const triggerCond = buff['@_trigger_condition'];
            const mpCharge = this.toBig(buff['@_trigger_effect_val1']);
            const callSkillId = buff['@_trigger_effect_val2'];

            const callSkill = this.kfData.SkillSetting.find(x => x['@_id'] === callSkillId);
            const callName = callSkill['@_name'].replace(/&#x[AD];/ig, "").replace(/<ruby=(.+?)>(.+?)<\/ruby>/ig, "<ruby>$2<rt>$1</rt></ruby>")
            return this.applyTemplate(this.getTemplateString("pursuit_status"), {
                ...vars,
                value_html: this.formatValueHTML(this.formatValue(this.toBig(100).minus(mpCharge), 0), 'down'),
                up_down: this.getStaticText("text.down"),
                call_skill_name: callName,
                trigger: this.getTriggerString(triggerCond)
            });
        }

        if (type.includes('抗性')) {
            this.formatValueHTML_UpDown(
                vars,
                lv,
                this.toBig(buff['@_effect_val1']).mul(100).toString(),
                "0",
                "0",
                isDebuff,
                false
            );
            return this.applyTemplate(this.getTemplateString('ailment_resistance'), vars)
        }


        
        // 4. 無敵・状態異常 (値を使わないもの)
        switch (type) {
            case '石化':
                return this.applyTemplate(this.getTemplateString('ailment_petrify'), vars);
            case '沉睡':
                return this.applyTemplate(this.getTemplateString('ailment_sleep'), vars);
            case '沉默':
                return this.applyTemplate(this.getTemplateString('ailment_silence'), vars);
            case '暈眩':
                return this.applyTemplate(this.getTemplateString('ailment_stun'), vars);
            case '麻痺':
                return this.applyTemplate(this.getTemplateString('ailment_paralysis'), vars);
            case '混亂':
                return this.applyTemplate(this.getTemplateString('ailment_confusion'), vars);
            case '魅惑':
                return this.applyTemplate(this.getTemplateString('ailment_charm'), vars);
            case '詛咒':
                return this.applyTemplate(this.getTemplateString('ailment_curse'), vars);
            case '目盲':
                return this.applyTemplate(this.getTemplateString('ailment_blind'), vars);
            case '驅散':
                return this.applyTemplate(this.getTemplateString('dispell'), vars);
            case '無敵':
                return this.applyTemplate(this.getTemplateString('invincible_base'), vars);
            case '物理無敵':
                return this.applyTemplate(this.getTemplateString('invincible_physical'), vars);
            case '魔法無敵':
                return this.applyTemplate(this.getTemplateString('invincible_magic'), vars);
            case '嘲諷':
                if (this.toBig(buff['@_effect_val1']).lt(100)) {
                    return this.applyTemplate(this.getTemplateString('taunt_weak'), vars);
                } else {
                    return this.applyTemplate(this.getTemplateString('taunt_strong'), vars);
                }
            case '技能傷害加成無效':
                return this.applyTemplate(this.getTemplateString('nullify_skill_dmg_up'), vars);
            case '奧義傷害加成無效':
                return this.applyTemplate(this.getTemplateString('nullify_ultimate_dmg_up'), vars);
            case '普攻傷害加成無效':
                return this.applyTemplate(this.getTemplateString('nullify_normal_attack_dmg_up'), vars);
                // ... (他の状態異常を追加)
            default:
                // 未知のバフタイプ
                return `[未対応バフタイプ: ${type} ${value}]`;
        }
    }

    static parseSkill(sid, lv) {
        const skill = this.kfData.SkillSetting.find(item => item['@_id'] === sid);

        const info = {};

        const mainDamageText = this.parseTargetHp(skill, lv, info);
        const trueHitText = this.parseTrueHit(skill, lv, info);
        const trueCritText = this.parseTrueCrit(skill, lv, info);
        const suckDamageText = this.parseDmgSuckHp(skill, lv, info);

        const checkVars = {
            mp_charge_array: [],
            speed_value: this.toBig(0)
        };

        const lines = [
            mainDamageText,
            trueHitText,
            trueCritText,
            suckDamageText
        ];

        for (const postFix of ['A', 'B', 'C', 'D']) {
            const buffId = skill['@_buff_id'+postFix[0]];
            if (buffId) {
                const buff = this.kfData.BuffSetting.find(item => item['@_id'] === buffId);
                if (buff) {
                    const line = this.parseBuff(skill, lv, { 
                        buff: buff,
                        buffDur: skill['@_buff_dur'+postFix],
                        buffTarget: skill['@_buff_target'+postFix]
                    });
                    lines.push(line);
                    this.checkMp(checkVars, buff);
                    this.checkSpeedValue(checkVars, buff);
                    const line2 = this.parseDelayBuff(buff);
                    lines.push(line2);
                }
            }
        }

        const result = {
            icon: skill['@_icon'],
            name: skill[`@_name`].replace(/&#x[AD];/ig, "").replace(/<ruby=(.+?)>(.+?)<\/ruby>/ig, "<ruby>$2<rt>$1</rt></ruby>"),
            text: lines.filter(Boolean).map(line => line.replace(/ +/g, ' ').trim()).join("<br>")
        };

        this.calcMp(result, checkVars.mp_charge_array);
        this.calcTime(result, skill, checkVars.speed_value);
        return result;
    }

    static parseDelayBuff(buff) {
        const delayBuffId = buff['@_end_add_buff_id'];
        if (delayBuffId) {
            const buff = this.kfData.BuffSetting.find(item => item['@_id'] === delayBuffId);
            if (buff) {
                return this.parseBuff(skill, lv, { 
                    buff: buff,
                    buffDur: skill['@_end_add_buff_dur'],
                    buffTarget: skill['@_end_add_buff_target']
                });
            }
        }
    }

    static checkMp(vars, buff) {
        if (buff["@_get_counter"] && buff["@_get_counter"] != "0") {
            throw "Error: get_counterのあるバフをパースしようとしてる [buff id="+buff["@_id"] + "]";
        }
        const type = buff['@_effect_type'];
        const val1 = buff['@_effect_val1'] ? new Big(buff['@_effect_val1']).round(2, Big.roundHalfEven) : new Big(0);
        const val2 = buff['@_effect_val2'] ? new Big(buff['@_effect_val2']).round(2, Big.roundHalfEven) :new Big(0);
        const val3 = buff['@_effect_val3'] ? new Big(buff['@_effect_val3']).round(2, Big.roundHalfEven) :new Big(0);

        if (type === "MP回復") {
            if (info.target == "自身" || info.target === "我方全體" || (info.target === "技能對象" && (info.skillTarget === "自身" || info.skillTarget === "我方全體")))
            vars.mp_charge_array.push({mp_charge_time: parseInt(info.duration), mp_charge_value: val2.plus(val3.mul(lv)).toNumber(), mp_charge_if: info.if});
        }
    }

    static calcMp(vars, mp_charge_array) {
        vars.mp_charge_array = mp_charge_array.map(item => {
            return {
                mp_charge_time: item.mp_charge_time,
                mp_charge_value: item.mp_charge_value,
                mp_charge_if: item.mp_charge_if
            }; 
        });
    }

    static checkSpeedValue(vars, buff) {
        if (buff && buff['@_effect_type'] === '速度上升或下降') {
            vars.speed_value.plus(this.toBig(buff['@_effect_val1']))
                .plus(this.toBig(buff["@_counter_effect_val1"]));
        }        
    }

    static calcTime(vars, skill, speedValue) {
        const effectid = skill['@_effect_id'];
        const freezeTime = this.toBig(skill['@_freeze_time']);
        let waitShowTime= this.toBig(0);
        if (effectid && this.kfData.SkillEffectSetting.find(x => x['@_id'] === skill['@_effect_id'])) {
            const seEntity = this.kfData.SkillEffectSetting.find(x => x['@_id'] === skill['@_effect_id']);
            waitShowTime = this.toBig(seEntity['@_WaitShowTime']);
        }

        vars.speed_buff = speedValue.toNumber();
        vars.time = calcWaitTime(freezeTime.toString(), waitShowTime.toString()).toFixed(2, Big.roundUp);
        vars.time2 = calcWaitTime(freezeTime.toString(), waitShowTime.toString()).toFixed(2, Big.roundUp);
        vars.freezeTime = freezeTime;
        vars.waitShowTime = waitShowTime;

        vars.time_error_msg = timeErrorMsg(freezeTime.toString(), waitShowTime.toString());
    }
}
