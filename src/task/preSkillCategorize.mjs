// gulpプラグインの読み込み
import log from 'fancy-log';
import { def } from './_config.mjs';

class SkillCheck {
    constructor(kf, sid) {
        this.kf = kf;
        this.DamageUp = false;
        const skills = kf.skill_hero_1.root.skill_hero_1;
        let s1 = skills.find(item => item['@_id'] === sid);

        if (s1['@_awake_change_skill_id'] !== "0") {
            s1 = skills.find(item => item['@_id'] === s1['@_awake_change_skill_id']);
        }

        const list = [];

        list.push(s1);

        if (s1['@_group'] !== "0") {
            const groups = skills.filter(item => item['@_group'] === s1['@_group']);
            if (groups[0]['@_id'] === s1['@_id']) {
                for (let i = 1; i < groups.length; i++) {
                    let s2 = groups[i];

                    if (s2['@_awake_change_skill_id'] !== "0") {
                        s2 = skills.find(item => item['@_id'] === s2['@_awake_change_skill_id']);
                    }
                    if (list.indexOf(s2) < 0) {
                        list.push(s2);
                    }
                }
            }
        }

        const list2 = [];

        for (const s3 of list) {
            if (s3['@_change_skill_id'] !== "0") {
                const s4 = skills.find(item => item['@_id'] === s3['@_change_skill_id']);
                if (list2.indexOf(s4) < 0 && list.indexOf(s4) < 0) {

                    list2.push(s4);

                    if (s3["@_target_hp_effect"] && 
                        s3["@_target_hp_scale"] &&
                        s4["@_target_hp_scale"] &&
                        s3["@_target_hp_effect"].endsWith("傷害") &&
                        !isNaN(s3["@_target_hp_scale"]) &&
                        !isNaN(s4["@_target_hp_scale"]) &&
                        parseFloat(s3["@_target_hp_scale"]) < parseFloat(s4["@_target_hp_scale"])
                        ) {
                            this.DamageUp = true;
                    }
                }
            }
        }

        this.list = list.concat(list2)
    }

    is_buff(func) {
        for (const postFix of [
            ['A', "{5}", "{6}"],  //  バフ属性名の末尾, バフ効果量挿入文字列, バフ効果時間挿入文字列
            ['B', "{7}", "{8}"],
            ['C', "{12}", "{13}"]]) {
            for (const s of this.list) {
                if (s['@_buff_id' + postFix[0]]) {
                    const info = {
                        id: s['@_buff_id' + postFix[0]],
                        duration: s['@_buff_dur' + postFix[0]],
                        if: s['@_buff_if' + postFix[0]],
                        target: s['@_buff_target' + postFix[0]],
                        debuff: false,
                        type: null,
                        buff: null,
                    };

                    if (info.target === '技能對象') {
                        info.target = s['@_target'];
                    }

                    const buff = this.kf.buff_1.root.buff_1.find(item => item['@_id'] === info.id);
                    if (buff !== undefined) {
                        info.type = buff["@_effect_type"];
                        info.buff = buff;

                        info.debuff = buff['@_debuff'] === "true";

                        if (func(info)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    is_physical_attack(x) {
        return x["@_target_hp_effect"] === "物理傷害";
    }

    is_magic_attack(x) {
        return x["@_target_hp_effect"] === "魔法傷害";
    }

    is_attack(x) {
        return x["@_target_hp_effect"].endsWith("傷害");
    }

    is_healing(x) {
        return x["@_target_hp_effect"] === "回復";
    }

    is_buffonly(x) {
        return x["@_target_hp_effect"] === "無效果";
    }

    get_targetCount(x) {
        if (!x["@_sort_order"]) 
            return 1;

        return x["@_sort_order"].split("#").length;
    }

    is_allrange(x) {
        return x["@_target"].endsWith("全體");
    }

    // Ultimate ----------------------------------------------------

    Test() {
        return this.list.some(x => {
            const result = x["@_effect_text"] && x["@_effect_text"].indexOf("敵1人") !== -1 && !x["@_sort_order"];
            if (result) {
                this.message = x["@_sort_order"];
            }
            return result;
        });
    }

    isSingleAttack() {
        return this.list.some(x => this.is_attack(x) && this.get_targetCount(x) === 1);
    }

    isMultiAttack() {
        return this.list.some(x => {
            const count = this.get_targetCount(x);
            return this.is_attack(x) && 1 < count && count < 6;
        })
    }


    isSixAttack() {
        return this.list.some(x => this.is_attack(x) && 6 <= this.get_targetCount(x));
    }

    isAllAttack() {
        return this.list.some(x => this.is_attack(x) && this.is_allrange(x));
    }

    isBuffOnly() {
        return this.list.some(x => this.is_buffonly(x));
    }

    isHealing(party = "我方") {
        return this.list.some(x => (this.is_healing(x) && x["@_target"].indexOf(party) !== -1 ) || this.isHpHeal(party));
    }


    

    // Skill -------------------------------------------------------
    isDamageSkill() {
        return this.list.some(x => this.is_attack(x));
    }

    // Buff ----------------------------------------------------------

    isHpHeal(party = "我方") {
        return this.is_buff((info) => info.target.indexOf(party) != -1 && info.debuff == false && info.type == "HP回復");
    }

    isMpHeal(party = "我方") {
        return this.is_buff((info) => info.target.indexOf(party) != -1 && info.debuff == false && info.type == "MP回復");
    }

    isIncreasesATK(party = "我方") {
        return this.is_buff((info) => info.target.indexOf(party) != -1 && info.debuff == false && info.type == "ATK上升或下降");
    }

    isIncreasesMATK(party = "我方") {
        return this.is_buff((info) => info.target.indexOf(party) != -1 && info.debuff == false && info.type == "MATK上升或下降");
    }

    isIncreasesCRT(party = "我方") {
        return this.is_buff((info) => info.target.indexOf(party) != -1 && info.debuff == false && info.type == "ATK爆擊上升或下降");
    }

    isIncreasesMCRT(party = "我方") {
        return this.is_buff((info) => info.target.indexOf(party) != -1 && info.debuff == false && info.type == "MATK爆擊上升或下降");
    }

    isIncreasesSPD(party = "我方") {
        return this.is_buff((info) => info.target.indexOf(party) != -1 && info.debuff == false && info.type == "速度上升或下降");
    }

    isIncreasesSkillDamage(party = "我方") {
        return this.is_buff((info) => info.target.indexOf(party) != -1 && info.debuff == false && info.type == "技能傷害上升或下降");
    }

    isIncreasesUltimateDamage(party = "我方") {
        return this.is_buff((info) => info.target.indexOf(party) != -1 && info.debuff == false && info.type == "奧義傷害上升或下降");
    }

    isIncreasesElementAttack(party = "我方") {
        return this.is_buff((info) => info.target.indexOf(party) != -1 && info.debuff == false && info.type.endsWith("屬性攻擊上升或下降"));
    }


    isIncreasedDamage(party = "我方") {
        return this.is_buff((info) => {
            const val2 = parseInt(info.buff['@_effect_val2']);
            return info.target.indexOf(party) != -1 && info.debuff == false && info.type.endsWith("次數傷害加成") && !isNaN(val2) && val2 > 100;
        });
    }

    isIncreasedDamageForNAttacks(party = "我方") {
        return this.is_buff((info) => {
            const val2 = parseInt(info.buff['@_effect_val2']);
            return info.target.indexOf(party) != -1 && info.debuff == false && info.type == "次數傷害加成" && !isNaN(val2) && val2 < 100;
        });
    }

    isIncreasedPhysicalDamageForNAttacks(party = "我方") {
        return this.is_buff((info) => {
            const val2 = parseInt(info.buff['@_effect_val2']);
            return info.target.indexOf(party) != -1 && info.debuff == false && info.type == "物理次數傷害加成" && !isNaN(val2) && val2 < 100;
        });
    }

    isIncreasedMagicDamageForNAttacks(party = "我方") {
        return this.is_buff((info) => {
            const val2 = parseInt(info.buff['@_effect_val2']);
            return info.target.indexOf(party) != -1 && info.debuff == false && info.type == "魔法次數傷害加成" && !isNaN(val2) && val2 < 100;
        });
    }

    isProvoke() {
        return this.is_buff((info) => info.target == "自身" && info.type == "嘲諷");
    }

    isDebuffResistance(party = "我方") {
        return this.is_buff((info) => info.target.indexOf(party) != -1 && info.debuff == false && info.type == "負面狀態抗性" && info.buff['@_effect_val1'] !== "1");
    }

    isDebuffCure(party = "我方") {
        return this.is_buff((info) => info.target.indexOf(party) != -1 && info.debuff == false && info.type == "負面狀態抗性" && info.buff['@_effect_val1'] === "1");
    }

    isProvokeResistance() {
        return this.is_buff((info) => info.target.indexOf("自身") != -1 && info.type == "嘲諷抗性");
    }

    isPoisonResistance() {
        return this.is_buff((info) => info.target.indexOf("自身") != -1 && info.type == "中毒抗性");
    }

    isBurnResistance() {
        return this.is_buff((info) => info.target.indexOf("自身") != -1 && info.type == "燒傷抗性");
    }

    isFreezeResistance() {
        return this.is_buff((info) => info.target.indexOf("自身") != -1 && info.type == "凍結抗性");
    }

    isStoneResistance() {
        return this.is_buff((info) => info.target.indexOf("自身") != -1 && info.type == "石化抗性");
    }

    isSleepResistance() {
        return this.is_buff((info) => info.target.indexOf("自身") != -1 && info.type == "沉睡抗性");
    }

    isSilentResistance() {
        return this.is_buff((info) => info.target.indexOf("自身") != -1 && info.type == "沉默抗性");
    }

    isFlashResistance() {
        return this.is_buff((info) => info.target.indexOf("自身") != -1 && info.type == "暈眩抗性");
    }

    isPararaizeResistance() {
        return this.is_buff((info) => info.target.indexOf("自身") != -1 && info.type == "麻痺抗性");
    }

    isConfueResistance() {
        return this.is_buff((info) => info.target.indexOf("自身") != -1 && info.type == "混亂抗性");
    }

    isCharmResistance() {
        return this.is_buff((info) => info.target.indexOf("自身") != -1 && info.type == "魅惑抗性");
    }

    isCurseResistance() {
        return this.is_buff((info) => info.target.indexOf("自身") != -1 && info.type == "詛咒抗性");
    }

    isDarknessResistance() {
        return this.is_buff((info) => info.target.indexOf("自身") != -1 && info.type == "目盲抗性");
    }

    isResetResistance() {
        return this.is_buff((info) => info.target.indexOf("自身") != -1 && info.type == "驅散抗性");
    }
    isBleedResistance() {
        return this.is_buff((info) => info.target.indexOf("自身") != -1 && info.type == "流血抗性");
    }
    isFearResistance() {
        return this.is_buff((info) => info.target.indexOf("自身") != -1 && info.type == "恐懼抗性");
    }

    // Debuff -----------------------------------------------------------------------

    isDecreasesDEF() {
        return this.is_buff((info) => info.target.indexOf("敵方") != -1 && info.debuff == true && info.type == "DEF上升或下降");
    }

    isDecreasesMDEF() {
        return this.is_buff((info) => info.target.indexOf("敵方") != -1 && info.debuff == true && info.type == "MDEF上升或下降");
    }

    isDecreasesSPD() {
        return this.is_buff((info) => info.target.indexOf("敵方") != -1 && info.debuff == true && info.type == "速度上升或下降");
    }

    isIncreasesDamageTaken() {
        return this.is_buff((info) => info.target.indexOf("敵方") != -1 && info.debuff == true && info.type.startsWith("受到") && info.type.endsWith("傷害上升或下降"));
    }

    isPoison() {
        return this.is_buff((info) => info.target.indexOf("敵方") != -1 && info.type == "中毒");
    }

    isBurn() {
        return this.is_buff((info) => info.target.indexOf("敵方") != -1 && info.type == "燒傷");
    }

    isFreeze() {
        return this.is_buff((info) => info.target.indexOf("敵方") != -1 && info.type == "凍結");
    }

    isStone() {
        return this.is_buff((info) => info.target.indexOf("敵方") != -1 && info.type == "石化");
    }

    isSleep() {
        return this.is_buff((info) => info.target.indexOf("敵方") != -1 && info.type == "沉睡");
    }

    isSilent() {
        return this.is_buff((info) => info.target.indexOf("敵方") != -1 && info.type == "沉默");
    }

    isFlash() {
        return this.is_buff((info) => info.target.indexOf("敵方") != -1 && info.type == "暈眩");
    }

    isPararaize() {
        return this.is_buff((info) => info.target.indexOf("敵方") != -1 && info.type == "麻痺");
    }

    isConfue() {
        return this.is_buff((info) => info.target.indexOf("敵方") != -1 && info.type == "混亂");
    }

    isCharm() {
        return this.is_buff((info) => info.target.indexOf("敵方") != -1 && info.type == "魅惑");
    }

    isCurse() {
        return this.is_buff((info) => info.target.indexOf("敵方") != -1 && info.type == "詛咒");
    }

    isDarkness() {
        return this.is_buff((info) => info.target.indexOf("敵方") != -1 && info.type == "目盲");
    }

    isReset() {
        return this.is_buff((info) => info.target.indexOf("敵方") != -1 && info.type == "驅散");
    }

    isBleed() {
        return this.is_buff((info) => info.target.indexOf("敵方") != -1 && info.type == "流血");
    }
    isFear() {
        return this.is_buff((info) => info.target.indexOf("敵方") != -1 && info.type == "恐懼");
    }
}


export class PreSkillCategorize {
    constructor(kf) {
        this.kf = kf;
    }

    categorize() {

        const heroList = this.kf.hero_1.root.hero_1.filter(item => item['@_id'] !== undefined && parseInt(item['@_id']) < 10000);

        const jsonList = {

        }

        for (const hero of heroList) {
            const id = hero['@_id'];

            const actives = []

            const passives = []

            const ultimate = [];

            const json = {
                name: hero['@_name'],
                sk_type: [],
                ub_type: []
            };

            if (hero['@_passive_skill3'] && hero['@_passive_skill3'] != "0") {
                actives.push(new SkillCheck(this.kf, hero['@_skill1'] + "2"));
                actives.push(new SkillCheck(this.kf, hero['@_skill2'] + "2"));
                ultimate.push(new SkillCheck(this.kf, hero['@_ub_skill'] + "2"));
            } else {
                actives.push(new SkillCheck(this.kf, hero['@_skill1']));
                actives.push(new SkillCheck(this.kf, hero['@_skill2']));
                ultimate.push(new SkillCheck(this.kf, hero['@_ub_skill']));
            }

            passives.push(new SkillCheck(this.kf, hero['@_passive_skill1']));
            passives.push(new SkillCheck(this.kf, hero['@_passive_skill2']));
            if (hero['@_passive_skill3'] && hero['@_passive_skill3'] != "0") {
                passives.push(new SkillCheck(this.kf, hero['@_passive_skill3']));
            }

            const skills = actives.concat(passives);

            // スキルチェック
            this.checkSkillComposition(json.sk_type, actives);
            this.checkBoth(json.sk_type, skills);
            this.checkActiveOnly(json.sk_type, actives);
            this.checkSelf(json.sk_type, actives, passives, skills);

            // 奥義チェック
            this.checkUltimateType(json.ub_type, ultimate);
            this.checkBoth(json.ub_type, ultimate);
            this.checkActiveOnly(json.ub_type, ultimate);


            if (json.sk_type.length > 0 || json.ub_type.length > 0) {
                jsonList[id] = json;
            }
        }

        return jsonList;
    }

    checkUltimateType(type, ultimate) {

        if (ultimate.some(v => v.isSingleAttack())) {
            type.push(def["単体攻撃"]);
        }

        if (ultimate.some(v => v.isMultiAttack())) {
            type.push(def["複数攻撃"]);
        }

        if (ultimate.some(v => v.isSixAttack())) {
            type.push(def["六人攻撃"]);
        }

        if (ultimate.some(v => v.isAllAttack())) {
            type.push(def["全体攻撃"]);
        }

        if (ultimate.some(v => v.isBuffOnly())) {
            type.push(def["バフのみ"]);
        }

        if (ultimate.some(v => v.isHealing())) {
            type.push(def["HP回復"]);
        }

        const self = "自身";

        if (ultimate.some(v => v.isHealing(self))) {
            type.push(def["自身HP回復"]);
        }

        if (ultimate.some(v => v.isMpHeal(self))) {
            type.push(def["自身MP回復"]);
        }
        if (ultimate.some(v => v.isIncreasesATK(self))) {
            type.push(def["自身物理攻撃UP"]);
        }

        if (ultimate.some(v => v.isIncreasesMATK(self))) {
            type.push(def["自身魔法攻撃UP"]);
        }

        if (ultimate.some(v => v.isIncreasesCRT(self))) {
            type.push(def["自身物理クリティカルUP"]);
        }

        if (ultimate.some(v => v.isIncreasesMCRT(self))) {
            type.push(def["自身魔法クリティカルUP"]);
        }

        if (ultimate.some(v => v.isIncreasesSPD(self))) {
            type.push(def["自身行動速度UP"]);
        }

        if (ultimate.some(v => v.isIncreasesElementAttack(self))) {
            type.push(def["自身属性攻撃UP"]);
        }

        if (ultimate.some(v => v.isIncreasedDamage(self))) {
            type.push(def["自身ダメージUP"]);
        }

        if (ultimate.some(v => v.DamageUp)) {
            type.push(def["自身条件付ダメージUP"]);
        }

        if (ultimate.some(v => v.isIncreasedDamageForNAttacks(self))) {
            type.push(def["自身回数付ダメージUP"]);
        }

        if (ultimate.some(v => v.isIncreasedPhysicalDamageForNAttacks(self))) {
            type.push(def["自身回数付物理ダメージUP"]);
        }

        if (ultimate.some(v => v.isIncreasedMagicDamageForNAttacks(self))) {
            type.push(def["自身回数付魔法ダメージUP"]);
        }

    }

    checkSkillComposition(type, actives) {
        if (actives.every(v => v.isDamageSkill())) {
            type.push(def["W攻撃"]);
        }

        if (actives.every(v => !v.isDamageSkill())) {
            type.push(def["バフのみ"]);
        }

        if (actives.some(v => v.isHealing())) {
            type.push(def["HP回復"]);
        }
    }

    checkSelf(type, actives, passives, skills) {
        const self = "自身";
        if (actives.some(v => v.isHealing(self))) {
            type.push(def["自身HP回復"]);
        }

        if (skills.some(v => v.isMpHeal(self))) {
            type.push(def["自身MP回復"]);
        }
        if (actives.some(v => v.isIncreasesATK(self))) {
            type.push(def["自身物理攻撃UP"]);
        }

        if (actives.some(v => v.isIncreasesMATK(self))) {
            type.push(def["自身魔法攻撃UP"]);
        }

        if (actives.some(v => v.isIncreasesCRT(self))) {
            type.push(def["自身物理クリティカルUP"]);
        }

        if (actives.some(v => v.isIncreasesMCRT(self))) {
            type.push(def["自身魔法クリティカルUP"]);
        }

        if (actives.some(v => v.isIncreasesSPD(self))) {
            type.push(def["自身行動速度UP"]);
        }

        if (passives.some(v => v.isIncreasesSkillDamage(self))) {
            type.push(def["自身スキルダメージUP"]);
        }

        if (passives.some(v => v.isIncreasesUltimateDamage(self))) {
            type.push(def["自身奥義ダメージUP"]);
        }

        if (actives.some(v => v.isIncreasesElementAttack(self))) {
            type.push(def["自身属性攻撃UP"]);
        }

        if (actives.some(v => v.isIncreasedDamage(self))) {
            type.push(def["自身ダメージUP"]);
        }

        if (actives.some(v => v.DamageUp)) {
            type.push(def["自身条件付ダメージUP"])
        }

        if (skills.some(v => v.isDebuffResistance(self))) {
            type.push(def["自身デバフ耐性"]);
        }

        if (actives.some(v => v.isIncreasedDamageForNAttacks(self))) {
            type.push(def["自身回数付ダメージUP"]);
        }

        if (actives.some(v => v.isIncreasedPhysicalDamageForNAttacks(self))) {
            type.push(def["自身回数付物理ダメージUP"]);
        }

        if (actives.some(v => v.isIncreasedMagicDamageForNAttacks(self))) {
            type.push(def["自身回数付魔法ダメージUP"]);
        }

        this._checkResistance(type, skills);
    }

    checkBoth(type, skills) {
        if (skills.some(v => v.isMpHeal())) {
            type.push(def["MP回復"]);
        }
        if (skills.some(v => v.isIncreasesATK())) {
            type.push(def["物理攻撃UP"]);
        }

        if (skills.some(v => v.isIncreasesMATK())) {
            type.push(def["魔法攻撃UP"]);
        }

        if (skills.some(v => v.isIncreasesCRT())) {
            type.push(def["物理クリティカルUP"]);
        }

        if (skills.some(v => v.isIncreasesMCRT())) {
            type.push(def["魔法クリティカルUP"]);
        }

        if (skills.some(v => v.isIncreasesSPD())) {
            type.push(def["行動速度UP"]);
        }

        if (skills.some(v => v.isIncreasesSkillDamage())) {
            type.push(def["スキルダメージUP"]);
        }

        if (skills.some(v => v.isIncreasesUltimateDamage())) {
            type.push(def["奥義ダメージUP"]);
        }

        if (skills.some(v => v.isIncreasesElementAttack())) {
            type.push(def["属性攻撃UP"]);
        }

        if (skills.some(v => v.isIncreasedDamage())) {
            type.push(def["ダメージUP"]);
        }

        if (skills.some(v => v.isDebuffResistance())) {
            type.push(def["デバフ耐性"]);
        }

        if (skills.some(v => v.isDecreasesDEF())) {
            type.push(def["物理防御DOWN"]);
        }

        if (skills.some(v => v.isDecreasesMDEF())) {
            type.push(def["魔法防御DOWN"]);
        }

        if (skills.some(v => v.isDecreasesSPD())) {
            type.push(def["行動速度DOWN"]);
        }

        if (skills.some(v => v.isIncreasesDamageTaken())) {
            type.push(def["被ダメージUP"]);
        }

        this._checkAbnormalState(type, skills);
    }

    checkActiveOnly(type, actives) {
        if (actives.some(v => v.isIncreasedDamageForNAttacks())) {
            type.push(def["回数付ダメージUP"]);
        }

        if (actives.some(v => v.isIncreasedPhysicalDamageForNAttacks())) {
            type.push(def["回数付物理ダメージUP"]);
        }

        if (actives.some(v => v.isIncreasedMagicDamageForNAttacks())) {
            type.push(def["回数付魔法ダメージUP"]);
        }
        if (actives.some(v => v.isDebuffCure())) {
            type.push(def["デバフ解除"]);
        }

        if (actives.some(v => v.isProvoke())) {
            type.push(def["挑発"]);
        }
    }

    _checkAbnormalState(type, skills) {
        if (skills.some(v => v.isPoison())) {
            type.push(def["毒"]);
        }

        if (skills.some(v => v.isBurn())) {
            type.push(def["火傷"]);
        }

        if (skills.some(v => v.isFreeze())) {
            type.push(def["凍結"]);
        }

        if (skills.some(v => v.isStone())) {
            type.push(def["石化"]);
        }

        if (skills.some(v => v.isSleep())) {
            type.push(def["睡眠"]);
        }

        if (skills.some(v => v.isSilent())) {
            type.push(def["沈黙"]);
        }

        if (skills.some(v => v.isFlash())) {
            type.push(def["眩暈"]);
        }

        if (skills.some(v => v.isPararaize())) {
            type.push(def["麻痺"]);
        }

        if (skills.some(v => v.isConfue())) {
            type.push(def["混乱"]);
        }

        if (skills.some(v => v.isCharm())) {
            type.push(def["魅了"]);
        }

        if (skills.some(v => v.isCurse())) {
            type.push(def["呪い"]);
        }

        if (skills.some(v => v.isDarkness())) {
            type.push(def["盲目"]);
        }

        if (skills.some(v => v.isReset())) {
            type.push(def["解消"]);
        }
        if (skills.some(v => v.isBleed())) {
            type.push(def["出血"]);
        }
        if (skills.some(v => v.isFear())) {
            type.push(def["恐怖"]);
        }
    }

    _checkResistance(type, skills) {
        if (skills.some(v => v.isProvokeResistance())) {
            type.push(def["挑発耐性"]);
        }

        if (skills.some(v => v.isPoisonResistance())) {
            type.push(def["毒耐性"]);
        }

        if (skills.some(v => v.isBurnResistance())) {
            type.push(def["火傷耐性"]);
        }

        if (skills.some(v => v.isFreezeResistance())) {
            type.push(def["凍結耐性"]);
        }

        if (skills.some(v => v.isStoneResistance())) {
            type.push(def["石化耐性"]);
        }

        if (skills.some(v => v.isSleepResistance())) {
            type.push(def["睡眠耐性"]);
        }

        if (skills.some(v => v.isSilentResistance())) {
            type.push(def["沈黙耐性"]);
        }

        if (skills.some(v => v.isFlashResistance())) {
            type.push(def["眩暈耐性"]);
        }

        if (skills.some(v => v.isPararaizeResistance())) {
            type.push(def["麻痺耐性"]);
        }

        if (skills.some(v => v.isConfueResistance())) {
            type.push(def["混乱耐性"]);
        }

        if (skills.some(v => v.isCharmResistance())) {
            type.push(def["魅了耐性"]);
        }

        if (skills.some(v => v.isCurseResistance())) {
            type.push(def["呪い耐性"]);
        }

        if (skills.some(v => v.isDarknessResistance())) {
            type.push(def["盲目耐性"]);
        }

        if (skills.some(v => v.isResetResistance())) {
            type.push(def["解消耐性"]);
        }
        if (skills.some(v => v.isBleedResistance())) {
            type.push(def["出血耐性"]);
        }
        if (skills.some(v => v.isFearResistance())) {
            type.push(def["恐怖耐性"]);
        }
    }
}