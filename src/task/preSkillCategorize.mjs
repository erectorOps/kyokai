 // gulpプラグインの読み込み
import gulp from 'gulp';
import ejs from 'gulp-ejs'; //EJS
import rename from 'gulp-rename'; //ファイル出力時にファイル名を変える

import { getAtkSpeed, getPosition } from './hero/_util.mjs';
import { srcBase, srcPath, distBase } from './_config.mjs';
import log from 'fancy-log';

class SkillCheck {
    constructor(kf, sid) {
        this.kf = kf;
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
                if (s['@_buff_id'+postFix[0]]) {
                    const info = {
                        id: s['@_buff_id'+postFix[0]],
                        duration: s['@_buff_dur'+postFix[0]],
                        if: s['@_buff_if'+postFix[0]],
                        target: s['@_buff_target'+postFix[0]],
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

    // Buff ----------------------------------------------------------

    isMpHeal() {
        return this.is_buff((info) => info.target.indexOf("我方") != -1 && info.debuff == false && info.type == "MP回復");
    }

    isIncreasesATK() {
        return this.is_buff((info) => info.target.indexOf("我方") != -1 && info.debuff == false && info.type == "ATK上升或下降");
    }

    isIncreasesMATK() {
        return this.is_buff((info) => info.target.indexOf("我方") != -1 && info.debuff == false && info.type == "MATK上升或下降");
    }

    isIncreasesCRT() {
        return this.is_buff((info) => info.target.indexOf("我方") != -1 && info.debuff == false && info.type == "ATK爆擊上升或下降");
    }

    isIncreasesMCRT() {
        return this.is_buff((info) => info.target.indexOf("我方") != -1 && info.debuff == false && info.type == "MATK爆擊上升或下降");
    }

    isIncreasesSPD() {
        return this.is_buff((info) => info.target.indexOf("我方") != -1 && info.debuff == false && info.type == "速度上升或下降");
    }

    isIncreasesSkillDamage() {
        return this.is_buff((info) => info.target.indexOf("我方") != -1 && info.debuff == false && info.type == "技能傷害上升或下降");
    }

    isIncreasesUltimateDamage() {
        return this.is_buff((info) => info.target.indexOf("我方") != -1 && info.debuff == false && info.type == "奧義傷害上升或下降");
    }

    isIncreasesElementAttack() {
        return this.is_buff((info) => info.target.indexOf("我方") != -1 && info.debuff == false && info.type.endsWith("屬性攻擊上升或下降"));
    }

    
    isIncreasedDamage() {
        return this.is_buff((info) => {
            const val2 = parseInt(info.buff['@_effect_val2']);
            return info.target.indexOf("我方") != -1 && info.debuff == false && info.type.endsWith("次數傷害加成") && !isNaN(val2) && val2 > 100;
        });
    }

    isIncreasedDamageForNAttacks() {
        return this.is_buff((info) => {
            const val2 = parseInt(info.buff['@_effect_val2']);
            return info.target.indexOf("我方") != -1 && info.debuff == false && info.type == "次數傷害加成" && !isNaN(val2) && val2 < 100;
        });
    }

    isIncreasedPhysicalDamageForNAttacks() {
        return this.is_buff((info) => {
            const val2 = parseInt(info.buff['@_effect_val2']);
            return info.target.indexOf("我方") != -1 && info.debuff == false && info.type == "物理次數傷害加成" && !isNaN(val2) && val2 < 100;
        });
    }

    isIncreasedMagicDamageForNAttacks() {
        return this.is_buff((info) => {
            const val2 = parseInt(info.buff['@_effect_val2']);
            return info.target.indexOf("我方") != -1 && info.debuff == false && info.type == "魔法次數傷害加成" && !isNaN(val2) && val2 < 100;
        });
    }

    isProvoke() {
        return this.is_buff((info) => info.target == "自身" && info.type == "嘲諷");
    }

    isDebuffResistance() {
        return this.is_buff((info) => info.target.indexOf("我方") != -1 && info.debuff == false && info.type == "負面狀態抗性" && info.buff['@_effect_val1'] !== "1");
    }

    isDebuffCure() {
        return this.is_buff((info) => info.target.indexOf("我方") != -1 && info.debuff == false && info.type == "負面狀態抗性" && info.buff['@_effect_val1'] === "1");
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


    isDamageSkill() {
        return this.list.some(x => x["@_target_hp_effect"].endsWith("傷害"));
    }

    // Debuff -----------------------------------------------------------------------

    isDecreasesDEF() {
        return this.is_buff((info) =>  info.target.indexOf("敵方") != -1 && info.debuff == true && info.type == "DEF上升或下降");
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
}


export class PreSkillCategorize {
    constructor(kf) {
        this.kf = kf;
    }

    categorize() {

        const heroList = this.kf.hero_1.root.hero_1.filter(item => item['@_id'] !== undefined && parseInt(item['@_id']) < 10000);

        const jsonList = {

        }

        for(const hero of heroList) {
            const id = hero['@_id'];

            const actives = []

            const passives = []


            const json = {
                name: hero['@_name'],
                sk_type: []
            };

            if (hero['@_passive_skill3'] && hero['@_passive_skill3'] != "0") {
                actives.push(new SkillCheck(this.kf, hero['@_skill1'] + "2"));
                actives.push(new SkillCheck(this.kf, hero['@_skill2'] + "2"));
            } else {
                actives.push(new SkillCheck(this.kf, hero['@_skill1']));
                actives.push(new SkillCheck(this.kf, hero['@_skill2']));
            }

            passives.push(new SkillCheck(this.kf, hero['@_passive_skill1']));
            passives.push(new SkillCheck(this.kf, hero['@_passive_skill2']));
            if (hero['@_passive_skill3'] && hero['@_passive_skill3'] != "0") {
                passives.push(new SkillCheck(this.kf, hero['@_passive_skill3']));
            }

            const skills = actives.concat(passives);

            if (actives.every(v => v.isDamageSkill())) {
                json.sk_type.push("W攻撃");
            }

            if (actives.every(v => !v.isDamageSkill())) {
                json.sk_type.push("バフのみ");
            }

            if (skills.some(v => v.isMpHeal())) {
                json.sk_type.push("MP回復");
            }

            if (skills.some(v => v.isIncreasesATK())) {
                json.sk_type.push("物理攻撃UP");
            }

            if (skills.some(v => v.isIncreasesMATK())) {
                json.sk_type.push("魔法攻撃UP");
            }

            if (skills.some(v => v.isIncreasesCRT())) {
                json.sk_type.push("物理クリティカルUP");
            }

            if (skills.some(v => v.isIncreasesMCRT())) {
                json.sk_type.push("魔法クリティカルUP");
            }            

            if (skills.some(v => v.isIncreasesSPD())) {
                json.sk_type.push("行動速度UP");
            }

            if (skills.some(v => v.isIncreasesSkillDamage())) {
                json.sk_type.push("スキルダメージUP");
            }

            if (skills.some(v => v.isIncreasesUltimateDamage())) {
                json.sk_type.push("奥義ダメージUP");
            }

            if (skills.some(v => v.isIncreasesElementAttack())) {
                json.sk_type.push("属性攻撃UP");
            }

            if (actives.some(v => v.isIncreasedDamageForNAttacks())) {
                json.sk_type.push("回数付ダメージUP");
            }

            if (actives.some(v => v.isIncreasedPhysicalDamageForNAttacks())) {
                json.sk_type.push("回数付物理ダメージUP");
            }

            if (actives.some(v => v.isIncreasedMagicDamageForNAttacks())) {
                json.sk_type.push("回数付魔法ダメージUP");
            }

            if (skills.some(v => v.isIncreasedDamage())) {
                json.sk_type.push("ダメージUP");
            }

            if (actives.some(v => v.isProvoke())) {
                json.sk_type.push("挑発");
            }

            if (skills.some(v => v.isDebuffResistance())) {
                json.sk_type.push("デバフ耐性");
            }

            if (actives.some(v => v.isDebuffCure())) {
                json.sk_type.push("デバフ解除");
            }

            if (skills.some(v => v.isDecreasesDEF())) {
                json.sk_type.push("物理防御DOWN");
            }

            if (skills.some(v => v.isDecreasesMDEF())) {
                json.sk_type.push("魔法防御DOWN");
            }

            if (skills.some(v => v.isDecreasesSPD())) {
                json.sk_type.push("行動速度DOWN");
            }

            if (skills.some(v => v.isIncreasesDamageTaken())) {
                json.sk_type.push("被ダメージUP");
            }

            if (skills.some(v => v.isProvokeResistance())) {
                json.sk_type.push("挑発耐性");
            }

            if (skills.some(v => v.isPoisonResistance())) {
                json.sk_type.push("毒耐性");
            }

            if (skills.some(v => v.isBurnResistance())) {
                json.sk_type.push("火傷耐性");
            }

            if (skills.some(v => v.isFreezeResistance())) {
                json.sk_type.push("凍結耐性");
            }

            if (skills.some(v => v.isStoneResistance())) {
                json.sk_type.push("石化耐性");
            }

            if (skills.some(v => v.isSleepResistance())) {
                json.sk_type.push("睡眠耐性");
            }

            if (skills.some(v => v.isSilentResistance())) {
                json.sk_type.push("沈黙耐性");
            }

            if (skills.some(v => v.isFlashResistance())) {
                json.sk_type.push("眩暈耐性");
            }

            if (skills.some(v => v.isPararaizeResistance())) {
                json.sk_type.push("麻痺耐性");
            }

            if (skills.some(v => v.isFlashResistance())) {
                json.sk_type.push("眩暈耐性");
            }

            if (skills.some(v => v.isConfueResistance())) {
                json.sk_type.push("混乱耐性");
            }

            if (skills.some(v => v.isCharmResistance())) {
                json.sk_type.push("誘惑耐性");
            }

            if (skills.some(v => v.isCurseResistance())) {
                json.sk_type.push("呪い耐性");
            }

            if (skills.some(v => v.isDarknessResistance())) {
                json.sk_type.push("盲目耐性");
            }

            if (skills.some(v => v.isResetResistance())) {
                json.sk_type.push("解消耐性");
            }

            

            if (skills.some(v => v.isPoison())) {
                json.sk_type.push("毒");
            }

            if (skills.some(v => v.isBurn())) {
                json.sk_type.push("火傷");
            }

            if (skills.some(v => v.isFreeze())) {
                json.sk_type.push("凍結");
            }

            if (skills.some(v => v.isStone())) {
                json.sk_type.push("石化");
            }

            if (skills.some(v => v.isSleep())) {
                json.sk_type.push("睡眠");
            }

            if (skills.some(v => v.isSilent())) {
                json.sk_type.push("沈黙");
            }

            if (skills.some(v => v.isFlash())) {
                json.sk_type.push("眩暈");
            }

            if (skills.some(v => v.isPararaize())) {
                json.sk_type.push("麻痺");
            }

            if (skills.some(v => v.isFlash())) {
                json.sk_type.push("眩暈");
            }

            if (skills.some(v => v.isConfue())) {
                json.sk_type.push("混乱");
            }

            if (skills.some(v => v.isCharm())) {
                json.sk_type.push("誘惑");
            }

            if (skills.some(v => v.isCurse())) {
                json.sk_type.push("呪い");
            }

            if (skills.some(v => v.isDarkness())) {
                json.sk_type.push("盲目");
            }

            if (skills.some(v => v.isReset())) {
                json.sk_type.push("解消");
            }


            if (json.sk_type.length > 0) {
                jsonList[id] = json;
            }
        }

        return jsonList;
    }
}