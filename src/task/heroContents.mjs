 // gulpプラグインの読み込み
import ejs from 'ejs';
import { Big } from 'big.js';
import { promises as fs } from 'fs';
import path from 'path';

import { getAtkSpeed, getPosition, abiNameConvTable, statisticConvArray, statisticConvTable, timeErrorMsg, parseIntOnlyString, calcWaitTime, toBig } from './hero/_util.mjs';
import { calcPassive } from './hero/_calcPassive.mjs';
import { parseSkill } from './hero/_parseSkill.mjs';
import { srcBase, srcPath, distPath } from './_config.mjs';
import log from 'fancy-log';
import { Exception } from 'sass';

const paramNameList = ["hp","atk","matk", "def", "mdef", "atk_crit", "matk_crit", "hit", "block", "end_hp_recovery", "end_mp_recovery", "dmg_suck_hp", "healing_power", "mp_recovery", "mp_cost_down"];
const convNameList = ["HP", "物理攻撃", "魔法攻撃", "物理防御", "魔法防御", "物理クリティカル", "魔法クリティカル","命中", "ブロック", "HP回復", "MP回復", "HP吸収", "治癒", "MPチャージ", "MP消費減少"];

const mpChargedWeapons = [
  { id: "4361", mp_recovery: 29, mp_charge_time: 3, mp_charge_value: 300, chara_id: 2162, equip_type: "專武" }, // ハワイアンバーガーセット
  { id: "4362", mp_recovery: 0, mp_charge_time: 3, mp_charge_value: 200, chara_id: 2168, equip_type: "專武" }, // にじげんファン
//  { id: "4363", mp_recovery: 0, mp_charge_time: 0, mp_charge_value: 0, chara_id: 2169, equip_type: "專武" }, // にじげんサクション
  { id: "4364", mp_recovery: 29, mp_charge_time: 3, mp_charge_value: 250, chara_id: 2170, equip_type: "專武" }, // にじげんチョーク
  { id: "4365", mp_recovery: 29, mp_charge_time: 20, mp_charge_value: 50, chara_id: 2214, equip_type: "專武" }, // 脱力の実
//  { id: "4366", mp_recovery: 0, mp_charge_time: 0, mp_charge_value: 0, chara_id: 2215, equip_type: "專武" }, // イルミナ・ソード
  { id: "4367", mp_recovery: 0, mp_charge_time: 3, mp_charge_value: 200, chara_id: 2216, equip_type: "專武" }, // 首領のカトラス
//  { id: "4368", mp_recovery: 0, mp_charge_time: 0, mp_charge_value: 0, chara_id: 2217, equip_type: "專武" }, // 呪殺のタライ
  { id: "4369", mp_recovery: 29, mp_charge_time: 3, mp_charge_value: 250, chara_id: 2218, equip_type: "專武" }, // 仙蜜草の袋
//  { id: "4370", mp_recovery: 0, mp_charge_time: 0, mp_charge_value: 0, chara_id: 2239, equip_type: "專武" }, // 平天＆渾鉄棍
//  { id: "4371", mp_recovery: 29, mp_charge_time: 0, mp_charge_value: 0, chara_id: 2251, equip_type: "專武" }, // カジノボーイ・バニーズ

  // ここから殲滅シリーズ
  { id: "4311", mp_recovery: 0, mp_charge_time: 3, mp_charge_value: 200, equip_type: "斬", atk_attr: "物理" }, // 殲滅の剣
  { id: "4312", mp_recovery: 0, mp_charge_time: 3, mp_charge_value: 200, equip_type: "斬", atk_attr: "魔法" }, // 殲滅のチャクラム
  { id: "4313", mp_recovery: 0, mp_charge_time: 3, mp_charge_value: 200, equip_type: "突", atk_attr: "物理" }, // 殲滅の槍
  { id: "4314", mp_recovery: 0, mp_charge_time: 3, mp_charge_value: 200, equip_type: "突", atk_attr: "魔法" }, // 殲滅のワンド
  { id: "4315", mp_recovery: 0, mp_charge_time: 3, mp_charge_value: 200, equip_type: "打", atk_attr: "物理" }, // 殲滅の篭手
  { id: "4316", mp_recovery: 29, mp_charge_time: 3, mp_charge_value: 200, equip_type: "打", atk_attr: "魔法" }, // 殲滅のロッド
  { id: "4317", mp_recovery: 0, mp_charge_time: 3, mp_charge_value: 200, equip_type: "射", atk_attr: "物理" }, // 殲滅のクロスボウ
  { id: "4318", mp_recovery: 0, mp_charge_time: 3, mp_charge_value: 200, equip_type: "射", atk_attr: "魔法" }, // 殲滅の弾丸
  { id: "4319", mp_recovery: 0, mp_charge_time: 3, mp_charge_value: 200, equip_type: "投", atk_attr: "物理" }, // 殲滅の斧
  { id: "4320", mp_recovery: 20, mp_charge_time: 3, mp_charge_value: 200, equip_type: "投", atk_attr: "魔法" }, // 殲滅の魔榴弾

]

export class HeroContents {
  constructor(kf) {
      this.kf = kf;
      this.uniqueWeapons = this.kf.EquipSetting.filter(item => item['@_type'] === "專武");
  }

  makeGpText(result, cur) {
    const lv = parseInt(cur["@_gp_lv"]);
    for (let i = 0; i < paramNameList.length; i++) {
      const name = paramNameList[i];
      let cv = parseIntOnlyString(cur["@_" + name]);
      if (!isNaN(cv) && 0 < cv) {
        if (!result[convNameList[i]]) {
          result[convNameList[i]] = new Array(10).fill(0);
        }
        if (name === "atk_crit" || name === "matk_crit") {
          cv = `${cv * 0.05}%`;
        }
        result[convNameList[i]][lv-1] = `${cv}`;
      }
    }
  }

  getWeaponMPRecovery(json) {
    const null_value = { mp_recovery: 0, mp_charge_time: 0, mp_charge_value: 0 };

    for (const w of mpChargedWeapons) {
      if (w.chara_id === json.id) {
        return { mp_recovery: w.mp_recovery, mp_charge_time: w.mp_charge_time, mp_charge_value: w.mp_charge_value };
      }
      else if (w.equip_type === json.equip_type && w.atk_attr === json.atk_attr) {
        return { mp_recovery: w.mp_recovery, mp_charge_time: w.mp_charge_time, mp_charge_value: w.mp_charge_value };
      }
    }

    return null_value;
  }

  makeMpGantt(json) {

    const skill_order = json.first_skill_order.split("/");

    const scheduledEvents = [];

    const kf = this.kf;
    const weapon = this.getWeaponMPRecovery(json);

    // 攻撃orスキルを実行した際のMPチャージ量を計算
    // (キャラクターのMPチャージ) + (使用武器のMPチャージ)


    const finalMpRecovery = parseInt(json.mp_recovery) + weapon.mp_recovery;

    // MP継続回復(殲滅など武器の効果)
    for (let i = 0; i <= weapon.mp_charge_time; i++) {
      scheduledEvents.push({time: i, mpChange: weapon.mp_charge_value, comment: `${(weapon.equip_type == "専武" ? "専用" : "殲滅")}武器のMP継続回復`});
    }

    // バニティアのMP回復(1秒後)
    if (json.id !== "2119") {
      scheduledEvents.push({ time: 1, mpChange: 210, comment: 'バニティアの味方全体MP回復' });
    }

    const attackEvent = [];
    const skillEvent = [];

    // パッシブのMP回復の計算
    const executePassiveSkill = (passiveSkill, name) => {
      // パッシブスキルのMPチャージ効果をループ処理で登録
      passiveSkill.mp_charge_array.forEach(chargeEvent => {
        const chargeTime = chargeEvent.mp_charge_time;
        const chargeValue = chargeEvent.mp_charge_value;
        const chargeIf = chargeEvent.mp_charge_if;

        // バトル開始時発動だけ 0秒から mp_charge_time 秒後まで、毎秒効果を登録
        // 多分ないけど「最初から」も登録
        // ループの開始を i = 0 とすることで、0秒からの発動を保証
        if (chargeIf === "戰鬥開場" || chargeIf === "第一擊觸發") {
          for (let i = 0; i <= chargeTime; i++) {
            scheduledEvents.push({
              time: i,
              mpChange: chargeValue,
              comment: `${name}によるMP回復（${i}秒目）`,
            });
          }
        }
        // 自身のスキル発動後
        else if (chargeIf.indexOf("自身施放技能") !== -1) {
          for (let i = 0; i < chargeTime + 1; i++) {
            skillEvent.push((t) => ({
              time: t + i, 
              mpChange: chargeValue, 
              comment: `${name}による自身のスキル使用後MP回復`
            }));
          }
        }
        // 味方のスキル発動後
        else if (chargeIf.indexOf("我方施放技能") !== -1) {
          for (let i = 0; i < chargeTime + 1; i++) {
            skillEvent.push((t) => ({
              time: t + i,
              mpChange: chargeValue * 6,
              comment: `${name}による味方のスキル使用時MP回復(6人使用想定)`
            }));
          }
        }
        // 自身の通常攻撃後
        else if (chargeIf.indexOf("自身施放普通攻擊") !== -1) {
          for (let i = 0; i < chargeTime + 1; i++) {
            attackEvent.push((t) => ({
              time: t + i,
              mpChange: chargeValue,
              comment: `${name}による自身の通常攻撃時MP回復`
            }));
          }
        }
      });
    };

    executePassiveSkill(json.passive1, "パッシブ1");
    executePassiveSkill(json.passive2, "パッシブ2");

    if (json.passive3) {
      executePassiveSkill(json.passive3, "パッシブ3");
    }

    // アクティブスキルのMP回復計算
    
    let currentTime = 0;

    const executeSkill = (skill, name) => {
      skill.mp_charge_array.forEach(chargeEvent => {
        const chargeTime = chargeEvent.mp_charge_time;
        const chargeValue = chargeEvent.mp_charge_value;
        if (chargeTime === 0 | chargeTime === 1) {
          scheduledEvents.push({
            time: currentTime + 1,
            mpChange: chargeValue,
            comment: `${name}のMP回復`,
          });
        } else {
          for (let i = 1; i <= chargeTime; i++) {
            scheduledEvents.push({
              time: currentTime + i,
              mpChange: chargeValue,
              comment: `${name}のMP継続回復`,
            });
          }
        }
      });
      currentTime += parseFloat(skill.time);
    };

    skill_order.forEach((actIndex, i) => {
      
      if (actIndex === "0") {
        scheduledEvents.push({time: currentTime, mpChange: finalMpRecovery, comment: `攻撃によるMPチャージ`});
        attackEvent.forEach(func => scheduledEvents.push(func(currentTime)))
        currentTime += parseFloat(json.atkskill.time);
      }
      else if (actIndex === "1") {
        scheduledEvents.push({time: currentTime, mpChange: finalMpRecovery, comment: `スキル1によるMPチャージ`});
        skillEvent.forEach(func => scheduledEvents.push(func(currentTime)));
        executeSkill(json.awake_skill1 ?? json.skill1, "スキル1");
      }
      else if (actIndex === "2") {
        scheduledEvents.push({time: currentTime, mpChange: finalMpRecovery, comment: `スキル2によるMPチャージ`});
        skillEvent.forEach(func => scheduledEvents.push(func(currentTime)));
        executeSkill(json.awake_skill2 ?? json.skill2, "スキル2");
      }
    });



    // 時間順にソート
    scheduledEvents.sort((a, b) => a.time - b.time);


    // シミュレート
    let currentMp = 0;
    const finalTimeline = [];
    const maxMp = 1000;

    for (const event of scheduledEvents) {
      if (currentMp >= maxMp) {
        break;
      }

      const startMp = currentMp;
      currentMp += event.mpChange;
      finalTimeline.push({
        time: parseFloat(event.time.toFixed(1)),
        comment: event.comment,
        start: startMp,
        duration: event.mpChange,
        label: `MP+${event.mpChange}`
      });
    }

    return finalTimeline;
  }

  processHeroData(hero) {
    const kf = this.kf;
    const id = hero['@_id'];

    const group = hero['@_group'];
    const name = hero['@_name'].replace(/<\/?ruby.*?>/ig, "");
    const rubyName = hero['@_name'].replace(/<ruby=(.+?)>(.+?)<\/ruby>/ig, "<ruby>$2<rt>$1</rt></ruby>");

    const heroGroup = kf.HeroGroupSetting.find(item => item['@_id'] === group);
    const gachaTypeEntity = kf.hero_add.find(item => item['@_id'] === id);

    const json = {
      parent_title: "聖騎士一覧",
      title: name,
      description: name,
      keywords: name,
      // ----
      id: id,
      name: rubyName,
      altname: name,
      rare: hero['@_rare'],
      first_skill_order: hero['@_first_skill_order'],
      loop_skill_order: hero['@_loop_skill_order'],
      introduction: heroGroup['@_introduction'],
      attr: heroGroup['@_attr'],
      atk_attr: heroGroup['@_atk_attr'],
      role_set: hero['@_role_set'],
      skill_set: hero['@_skill_set'],
      drawer: heroGroup['@_drawer'],
      voicer: heroGroup['@_voicer'],
      height: heroGroup['@_height'].replace(/&#x[DA];/ig, ""),
      measurements: heroGroup['@_measurements'].replace(/&#x[DA];/ig, ""),
      equip_type: hero['@_equip_type'],
      gacha_type: "",
      added_date: "",
      obtain: "",
      bug_report: "",
      gp_text: {},
      need_items: [],
      mp_gantt: [],
      mp_recovery: new Big(0)
    };

    if (gachaTypeEntity) {
      json.gacha_type = gachaTypeEntity['@_gacha_type'] ?? "";
      json.added_date = gachaTypeEntity['@_added_date'] ?? "";
      json.obtain = gachaTypeEntity['@_obtain'] ?? "";
      json.bug_report = gachaTypeEntity['@_bug_report'] ?? "";

      // if (gachaTypeEntity.review) {
      //   json.rank_text = gachaTypeEntity.review['@_rank'];
      //   json.rank_class = "rank-" + json.rank_text[0].toLowerCase();
      //   json.merit = gachaTypeEntity.review.merit ?? [];
      //   if (!Array.isArray(json.merit)) { json.merit = [json.merit]; }
      //   json.demerit = gachaTypeEntity.review.demerit ?? [];
      //   if (!Array.isArray(json.demerit)) { json.demerit = [json.demerit]; }
      // }
    }

    json.feature = heroGroup.feature_id.filter(item => item !== '0').map(item => {
      const feature = kf.HeroFeatureSetting.find(y => y['@_id'] === item);
      const skill = kf.skill_other_1.find(y => y['@_id'] === feature.skill[0]);
      return skill['@_name'].replace(/ ボーナスLv\d$/, "")
    }).reduce((p, c) => p.length > 0 ? p + " / " + c : c, "");

    const maxLimitEntity = kf.HeroLimitOverSetting.find(item => item['@_group_id'] === group && item['@_over_times'] === "5");
    json.support = maxLimitEntity.support_buff_id.filter(item => item !== '0').map(item => {
      const buff = kf.BuffSetting.find(y => y['@_id'] === item);
      return buff['@_effect_text'].replace(/\{1\}/, buff['@_effect_val2']).replace(/<color=(#[A-F0-9]+?)>/ig, `<span class="value up">`).replace(/<\/color>/ig, "</span>");
    }).reduce((p, c) => p.length > 0 ? p + " / " + c : c, "");

    //console.log("id = " + json.id + " name = " + json.name);

    // 基礎パラメータの計算

    const awakeEntity = kf.HeroAwakeSetting.find(item => item['@_id'] === group && item['@_open'] == "true");

    for (const paramName of paramNameList) {
      let v = 0;

      // キャラ初期値
      if (hero['@_' + paramName + '_base'] !== undefined) {
        v += parseInt(hero['@_' + paramName + '_base']);
      }

      // Lv限界突破ボーナス
      v += kf.HeroLimitOverSetting
        .filter(item => item['@_group_id'] === group && item['@_'+paramName] !== undefined)
        .reduce((p, c) => p + parseInt(c['@_'+paramName]), 0);

      // アビリティ
      const filteredHeroTalent = kf.HeroTalentSetting.filter(item => item['@_id'] === group);
      for (const heroTalent of filteredHeroTalent) {
        // アビリティグレードアップボーナス
        if (heroTalent['@_'+paramName] !== undefined) {
          v += parseInt(heroTalent['@_'+paramName]);
        }
        // アビリティ5種
        if (abiNameConvTable[paramName]) {

          for (const talent of heroTalent.talent) {
            let talentEffects = kf.TalentEffectSetting.filter(item => item['@_id'] === talent);
            for (const effect of talentEffects) {
              if (abiNameConvTable[paramName] === effect['@_enhance_ability']) {
                v += parseInt(effect['@_enhance_ability_num']);
              }
            }
          }
        }
      }

      // 絆分
      const maxGp = kf.HeroGpSetting.find(item => item['@_id'] === group && item['@_gp_lv'] === "10");
      if (maxGp['@_'+paramName] !== undefined) {
        v += parseInt(maxGp['@_'+paramName]);
      }

      // 絆MAXボーナス
      if (statisticConvTable[paramName]) {
        const gpTokenId = maxGp["@_gp_token_id"];
        const gpEquip = kf.EquipSetting.find(item => item['@_id'] === gpTokenId);
        if (gpEquip['@_main_statistic'] === statisticConvTable[paramName]) {
          v += parseInt(gpEquip['@_main_statistic_value']);
        }

        for (let i = 0; i < gpEquip.secondary_statistic.length; i++) {
          const index = gpEquip.secondary_statistic[i];
          if (statisticConvArray[index] === statisticConvTable[paramName]) {
            v += parseInt(gpEquip.secondary_statistic_value[i]);
          } 
        }
      }

      // Lv上昇分(最大レベル)
      let grow = kf.HeroGrowSetting
        .filter(item => item['@_id'] === group)
        .reduce((p, c) => parseInt(p['@_lv']) <= parseInt(c['@_lv']) ? c : p);

      if (grow['@_'+paramName] !== undefined) {
        v += parseInt(grow['@_'+paramName]);
      }

      //覚醒ボーナス
      if (awakeEntity && awakeEntity['@_awake_'+paramName] !== undefined) {
        v += parseInt(awakeEntity['@_awake_'+paramName]);
      }


      json.lv = parseInt(grow['@_lv']);
      json[paramName] = new Big(v);
    }

    //const awakePassiveSkill = awakeEntity ? awakeEntity['@_awake_passive_skill'] : null;

    const atkSkill = kf.SkillSetting.find(item => item['@_id'] === hero['@_atk_skill']);
    json.skill1 = parseSkill(hero['@_skill1'], Math.min(parseInt(json.lv), 100), kf);
    json.skill2 = parseSkill(hero['@_skill2'], Math.min(parseInt(json.lv), 100), kf);

    if (atkSkill) {
      json.atk_speed = getAtkSpeed(parseFloat(atkSkill['@_freeze_time']));
      json.range = atkSkill['@_range'];
      json.position = getPosition(parseInt(json.range));

      const freezeTime = atkSkill['@_freeze_time'];
      const waitShowTime = kf.SkillEffectSetting.find(item => item['@_Id'] === atkSkill['@_effect_id'])?.['@_WaitShowTime'] ?? 0;
      const critWaitShowTime = kf.SkillEffectSetting.find(item => item['@_Id'] === atkSkill['@_crit_effect_id'])?.['@_WaitShowTime'] ?? waitShowTime;

      json.atkskill = {
        name: "通常攻撃",
        icon: atkSkill['@_icon'] ?? (atkSkill['@_target_hp_effect'] === "魔法傷害" ? "skill001/skill0004" : "skill001/skill0001"),
        time: "",
        time2: "",
        time_error_msg: timeErrorMsg(freezeTime, waitShowTime),
        crit_time: "",
        crit_time2: "",
        crit_error_msg: timeErrorMsg(freezeTime, critWaitShowTime)
      };

      if (freezeTime) {
        json.atkskill.time = calcWaitTime(freezeTime, waitShowTime, 0).toFixed(2, Big.roundUp);
        json.atkskill.time2 = calcWaitTime(freezeTime, waitShowTime, 0).toFixed(2, Big.roundUp);

        json.atkskill.freezeTime = toBig(freezeTime)
        json.atkskill.waitShowTime = toBig(waitShowTime);
        json.atkskill.crit_time = calcWaitTime(freezeTime, critWaitShowTime, 0).toFixed(2, Big.roundUp);
        json.atkskill.crit_time2 = calcWaitTime(freezeTime, critWaitShowTime, 0).toFixed(2, Big.roundUp);
        json.atkskill.crit_waitShowTime = toBig(critWaitShowTime);
      }

      const scales = ["0", "0.1", "0.15", "0.2", "0.25", "0.30", "0.35", "0.40", "0.45", "0.50", 
        "0.55", "0.60", "0.65", "0.70", "0.75", "0.80", "0.85", "0.90", "0.95", "1", 
        "1.05", "1.10" ,"1.15", "1.2", "1.25"];

      const scalechecklist = scales.map(scale => {
        const newScale = new ScaleCheck();
        newScale.build(scale, json);
        return newScale;
      });
      json.scalecheck = scalechecklist;
    }

    json.passive1 = parseSkill(hero['@_passive_skill1'], 0, kf);
    json.passive2 = parseSkill(hero['@_passive_skill2'], 0, kf);

    calcPassive(hero['@_passive_skill1'], json, kf);
    calcPassive(hero['@_passive_skill2'], json, kf);

    const ubskills = [];
    const awakeUbSkills = [];
    const ub1 = parseInt(hero['@_ub_skill']);

    for (let i = 0; i < 5; i++) {
      ubskills.push(parseSkill((ub1+i)+"", 0, kf));
    }

    if (hero['@_passive_skill3'] && hero['@_passive_skill3'] != "0") {
      json.passive3 = parseSkill(hero['@_passive_skill3'], 0, kf);
      calcPassive(hero['@_passive_skill3'], json, kf);

      for (let i = 0; i < 6; i++) {
        awakeUbSkills.push(parseSkill((ub1+i)+"2", 0, kf));
      }
      json.awake_skill1 = parseSkill(hero['@_skill1'] + "2", parseInt(json.lv), kf);
      json.awake_skill2 = parseSkill(hero['@_skill2'] + "2", parseInt(json.lv), kf);
    }
    

    json.ubskills = ubskills;
    json.awake_ubskills = awakeUbSkills;

    for (const paramName of paramNameList) {
      if (paramName.indexOf('atk_crit') !== -1) {
        json[paramName] = json[paramName].mul("0.05").round(2, Big.roundHalfEven).toString();
      } else {
        json[paramName] = json[paramName].toString();
      }
    }

    const gplist = kf.HeroGpSetting.filter(item => item['@_id'] === group);
    const gptext = {};
    for (let i = 1; i < 11; i++) {
      this.makeGpText(gptext, gplist[i]);
    }
    json.gp_text = gptext;

    const limit3Entity = kf.HeroLimitOverSetting.find(item => item['@_group_id'] === group && item['@_over_times'] === "3");
    json.need_items = limit3Entity.key_item_id.filter(x => x !== "0");

    json.mp_gantt = this.makeMpGantt(json);
    
    return json;
  }

  async createFuncs() {
    const kf = this.kf;
    const heroList = kf.HeroSetting.filter(item => item['@_id'] !== undefined && parseInt(item['@_id']) < 10000);
    const templatePath = path.join(srcBase, "hero", "hero.ejs");
    const template = await fs.readFile(path.join(srcBase, "hero", "hero.ejs"), "utf-8");
    const includeRoot = path.join(srcBase, "_inc");

    const renderFunc = ejs.compile(template, {
      filename: templatePath,
      async: false,
      root: includeRoot
    });

    await fs.mkdir(distPath.hero, { recursive: true });

    return Promise.all(heroList.map(async hero => {
      const id = hero['@_id'];

      const json = this.processHeroData(hero);

      const html = renderFunc({json: json});

      await fs.writeFile(path.join(distPath.hero, `${id}.html`), html, "utf-8");
      log(`Created ${id}.html`);
    }));
  }
}



class ScaleCheck  {
  constructor() {
    this.name = "";
    this.attack = new Big(0);
    this.crit = new Big(0);
    this.skill1 = new Big(0);
    this.skill2 = new Big(0);
    this.mergedTimeline = [];
  }

  build(scale, json) {
    this.name = new Big(scale).mul(100).toFixed(0) + "%";
    this.attack = calcWaitTime(json.atkskill.freezeTime, json.atkskill.waitShowTime, scale);
    this.crit = calcWaitTime(json.atkskill.freezeTime, json.atkskill.crit_waitShowTime, scale);
    this.skill1 = calcWaitTime(json.skill1.freezeTime, json.skill1.waitShowTime, scale);
    this.skill2 = calcWaitTime(json.skill2.freezeTime, json.skill2.waitShowTime, scale);

    const first_result = this.makeTimeline(json.first_skill_order);
    const first_timeline = first_result.timeline;
    const loop_result = this.makeTimeline(json.loop_skill_order, first_result.totalTime);
    const loop_timeline = loop_result.timeline;

    const firstLastTime = new Big(first_timeline[first_timeline.length - 1]);
    const loopFirstTime = new Big(loop_timeline[0]);
    const connectionDiff = loopFirstTime.minus(firstLastTime).toFixed(1, Big.roundHalfEven);
    this.mergedTimeline = [
      ...first_timeline.map(item => {
        if (!item.endsWith('s')) { return item + 's'; }
        return item;
      }), 
      `+${connectionDiff}s`, 
      ...loop_timeline.map(item => {
        if (!item.endsWith('s')) { return item + 's'; }
        return item;
      })
    ];

    this.attack = this.getAttackText();
    this.crit = this.getCritText();
    this.skill1 = this.getSkill1Text();
    this.skill2 = this.getSkill2Text();
  }

  getAttackText() {
    return this.attack.toFixed(2, Big.roundUp);
  }

  getCritText() {
    return this.crit.toFixed(2, Big.roundUp);
  }

  getSkill1Text() {
    return this.skill1.toFixed(2, Big.roundUp);
  }

  getSkill2Text() {
    return this.skill2.toFixed(2, Big.roundUp);
  }

  makeTimeline(order, totalTime) {
    const timeline = [];
    if (totalTime === undefined) {
      totalTime = new Big(0);
    }
    order.split("").forEach((v, i) => {
      if (v.trim() === "1") {
        timeline.push(totalTime.toFixed(1, Big.roundHalfEven));
        totalTime = totalTime.plus(this.skill1);
      } else if (v.trim() === "2") {
        timeline.push(totalTime.toFixed(1, Big.roundHalfEven));
        totalTime = totalTime.plus(this.skill2);
      } else if (v.trim() === "0") {
        timeline.push(totalTime.toFixed(1, Big.roundHalfEven));
        totalTime = totalTime.plus(this.attack);
      } else {
        if (i > 0) {
          const diff = totalTime.minus(new Big(timeline[timeline.length - 1])).toFixed(1, Big.roundHalfEven);
          timeline.push(`+${diff}s`);
        } else {
          timeline.push("----");
        }
      }
    });
    return {timeline: timeline, totalTime: totalTime};
  }
}