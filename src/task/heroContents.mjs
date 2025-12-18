 // gulpプラグインの読み込み
import ejs from 'ejs';
import { Big } from 'big.js';
import { promises as fs } from 'fs';
import path from 'path';
import { minify } from 'html-minifier';

import * as Util from './hero/_util.mjs';

import { calcPassive } from './hero/_calcPassive.mjs';
import { parseSkill } from './hero/_parseSkill.mjs';
import { srcBase, srcPath, distPath } from './_config.mjs';
import { ScaleCheck } from './hero/_scaleCheck.mjs';
import log from 'fancy-log';
import { MpGantt } from './hero/_mpGantt.mjs';
import { LangUtil, supportedLangs, languages } from './_lang.mjs';


const paramNameList = ["hp","atk","matk", "def", "mdef", "atk_crit", "matk_crit", "hit", "block", "end_hp_recovery", "end_mp_recovery", "dmg_suck_hp", "healing_power", "mp_recovery", "mp_cost_down"];
const convNameList = ["HP", "物理攻撃", "魔法攻撃", "物理防御", "魔法防御", "物理クリティカル", "魔法クリティカル","命中", "ブロック", "HP回復", "MP回復", "HP吸収", "治癒", "MPチャージ", "MP消費減少"];

export class HeroContents {
  constructor(kf) {
      this.kf = kf;
      this.uniqueWeapons = this.kf.EquipSetting.filter(item => item['@_type'] === "專武");
  }

  makeGpText(result, cur) {
    const lv = parseInt(cur["@_gp_lv"]);
    for (let i = 0; i < paramNameList.length; i++) {
      const name = paramNameList[i];
      let cv = Util.parseIntOnlyString(cur["@_" + name]);
      if (!isNaN(cv) && 0 < cv) {
        if (!result[convNameList[i]]) {
          result[convNameList[i]] = new Array(10).fill(0);
        }
        if (name === "atk_crit" || name === "matk_crit") {
          cv = `${Math.floor(cv * 0.05 * 100) / 100}%`;
        }
        result[convNameList[i]][lv-1] = `${cv}`;
      }
    }
  }

  processHeroData(hero, lang, t) {
    const kf = this.kf;
    const id = hero['@_id'];

    const group = hero['@_group'];
    const name = hero['@_name'].replace(/<\/?ruby.*?>/ig, "");
    const rubyName = hero['@_name'].replace(/<ruby=(.+?)>(.+?)<\/ruby>/ig, "<ruby>$2<rt>$1</rt></ruby>");

    const heroGroup = kf.HeroGroupSetting.find(item => item['@_id'] === group);
    const gachaTypeEntity = kf.hero_add.find(item => item['@_id'] === id);

    const json = {
      title: name,
      description: name,
      keywords: name,
      isDetailPage: true,
      // ----
      id: id,
      name: rubyName,
      altname: name,
      rare: hero['@_rare'],
      first_skill_order: hero['@_first_skill_order'],
      loop_skill_order: hero['@_loop_skill_order'],
      introduction: heroGroup['@_introduction'],
      attr: Util.getAttrKey(heroGroup['@_attr']),
      atk_attr: Util.getAtkAttrKey(heroGroup['@_atk_attr']),
      role_set: Util.getRoleKey(hero['@_role_set']),
      skill_set: Util.getSkillSetKey(hero['@_skill_set']).map(x => t(x)).join(", "),
      drawer: heroGroup['@_drawer'],
      voicer: heroGroup['@_voicer'],
      height: heroGroup['@_height'].replace(/&#x[DA];/ig, ""),
      measurements: heroGroup['@_measurements'].replace(/&#x[DA];/ig, ""),
      equip_type: Util.getEquipType(hero['@_equip_type']),
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
      let effectText = buff['@_effect_text'];
      let effectValue = buff['@_effect_val2'];
      if (buff['@_effect_type'].endsWith("爆擊上升或下降")) {
        const n = parseFloat(effectValue);
        if (!isNaN(n)) {
          effectValue = `${Math.floor(n * 0.05 * 100) / 100}%`;
        }
      }
      effectText = effectText.replace(/\{1\}/, effectValue)
        .replace(/<color=(#[A-F0-9]+?)>/ig, `<span class="value up">`)
      effectText = effectText.replace(/<\/color>/ig, "</span>");
      return effectText;
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
        if (Util.abiNameConvTable[paramName]) {

          for (const talent of heroTalent.talent) {
            let talentEffects = kf.TalentEffectSetting.filter(item => item['@_id'] === talent);
            for (const effect of talentEffects) {
              if (Util.abiNameConvTable[paramName] === effect['@_enhance_ability']) {
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
      if (Util.statisticConvTable[paramName]) {
        const gpTokenId = maxGp["@_gp_token_id"];
        const gpEquip = kf.EquipSetting.find(item => item['@_id'] === gpTokenId);
        if (gpEquip['@_main_statistic'] === Util.statisticConvTable[paramName]) {
          v += parseInt(gpEquip['@_main_statistic_value']);
        }

        for (let i = 0; i < gpEquip.secondary_statistic.length; i++) {
          const index = gpEquip.secondary_statistic[i];
          if (Util.statisticConvArray[index] === Util.statisticConvTable[paramName]) {
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
      json.atk_speed = Util.getAtkSpeed(parseFloat(atkSkill['@_freeze_time']));
      json.range = atkSkill['@_range'];
      json.position = Util.getPositionKey(parseInt(json.range));

      const freezeTime = atkSkill['@_freeze_time'];
      const waitShowTime = kf.SkillEffectSetting.find(item => item['@_Id'] === atkSkill['@_effect_id'])?.['@_WaitShowTime'] ?? 0;
      const critWaitShowTime = kf.SkillEffectSetting.find(item => item['@_Id'] === atkSkill['@_crit_effect_id'])?.['@_WaitShowTime'] ?? waitShowTime;

      json.atkskill = {
        name: "通常攻撃",
        icon: atkSkill['@_icon'] ?? (atkSkill['@_target_hp_effect'] === "魔法傷害" ? "skill001/skill0004" : "skill001/skill0001"),
        time: "",
        time2: "",
        time_error_msg: Util.timeErrorMsg(freezeTime, waitShowTime),
        crit_time: "",
        crit_time2: "",
        crit_error_msg: Util.timeErrorMsg(freezeTime, critWaitShowTime)
      };

      if (freezeTime) {
        json.atkskill.time = Util.calcWaitTime(freezeTime, waitShowTime, 0).toFixed(2, Big.roundUp);
        json.atkskill.time2 = Util.calcWaitTime(freezeTime, waitShowTime, 0).toFixed(2, Big.roundUp);

        json.atkskill.freezeTime = Util.toBig(freezeTime)
        json.atkskill.waitShowTime = Util.toBig(waitShowTime);
        json.atkskill.crit_time = Util.calcWaitTime(freezeTime, critWaitShowTime, 0).toFixed(2, Big.roundUp);
        json.atkskill.crit_time2 = Util.calcWaitTime(freezeTime, critWaitShowTime, 0).toFixed(2, Big.roundUp);
        json.atkskill.crit_waitShowTime = Util.toBig(critWaitShowTime);
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

    json.mp_gantt = MpGantt.generateTimelines(json);

    // unique weapon
    const weaponEntity = kf.EquipSetting.find(item => item['@_type'] === "專武" && item['@_can_equip_hero_ids'].split(',').includes(id));
    if (weaponEntity) {

      // likely lv 90 cap
      const maxLv = parseInt(weaponEntity['@_rank_limit']) * 10 + parseInt(weaponEntity['@_equip_lv_max']);

      const statistics = [];
      const statistics_values = [];

      const main_index = Util.statisticConvArray.indexOf(weaponEntity['@_main_statistic']);
      const stat_name = Util.statisticConvNameArray[main_index]
      statistics.push(stat_name);
      const stat_value = this.formatStatisticValue(stat_name, weaponEntity['@_main_statistic_value'], weaponEntity['@_main_statistic_grow'], maxLv);
      statistics_values.push(stat_value+"");

      const len = weaponEntity.secondary_statistic.length;
      for (let i = 0; i < len; i++) {
        if (weaponEntity.secondary_statistic[i] === "0") {
          continue;
        }
        const sec_name = Util.statisticConvNameArray[weaponEntity.secondary_statistic[i]];
        statistics.push(sec_name);
        const sec_value = this.formatStatisticValue(sec_name, weaponEntity.secondary_statistic_value[i], weaponEntity.secondary_statistic_grow[i], maxLv);
        statistics_values.push(sec_value+"");
      }

      const itemEntity = kf.ItemSetting.find(item => item['@_id'] === weaponEntity['@_id']);

      const weapon = {
        name: itemEntity['@_name'],
        icon: itemEntity['@_icon'],
        description: itemEntity['@_description'],
        level: maxLv,
        statistics: statistics,
        statistics_values: statistics_values,
        skill: parseSkill(weaponEntity.skill_id[4], weaponEntity.skill_lv[4], kf)
      };

      json.weapon = weapon;

    }
    
    return json;
  }

  formatStatisticValue(statistic_name, statistic_value, statistic_grow, maxLv) {
    const value = Util.calcStatisticValue(statistic_value, statistic_grow, maxLv);
    if (statistic_name.includes("ダメージ割合")) {
      return `${parseInt(value)}%`;
    } else if (!statistic_name.includes("クリティカル")) {
      return parseInt(value);
    } else {
      return `${Math.floor(value * 0.05 * 100) / 100}%`;
    }
  }

  async createOne(id, lang) {
    const langUtil = new LangUtil(lang, `./${id}.html`);

    const t = await LangUtil.loadT(lang);

    const kf = this.kf;

    const h = kf.HeroSetting.find(item => item['@_id'] !== undefined && parseInt(item['@_id']) == id);
    if (!h) {
      log.error(`Hero with ID ${id} not found.`);
      return;
    }

    const heroList = kf.HeroSetting.filter(item => item['@_id'] !== undefined && parseInt(item['@_id']) == id);
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
      const json = this.processHeroData(hero, lang, t);
      json.parent_title = t('breadcrumb-list_title');
      json.lang = lang;
      json.t = t;
      json.supportedLangs = supportedLangs;
      json.langUtil = langUtil;
      const html = renderFunc({json: json});

      const minifiedHtml = minify(html, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: true
      });

      await fs.writeFile(path.join(distPath.hero, `${id}.${lang}.html`), minifiedHtml, "utf-8");
      log(`Created ${id}.${lang}.html`);
    }));
  }

  createMultiLangTasks() {
    return languages.map(lang => {
      const task = async () => {
        log(`Starting hero contents build for language: ${lang}`);

        const t = await LangUtil.loadT(lang);

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
          const langUtil = new LangUtil(lang, `./${id}.html`);
          const json = this.processHeroData(hero, lang, t);
          json.parent_title = t('breadcrumb-list_title');
          json.lang = lang;
          json.t = t;
          json.supportedLangs = supportedLangs;
          json.langUtil = langUtil;

          const html = renderFunc({json: json});

          const minifiedHtml = minify(html, {
            collapseWhitespace: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
            minifyCSS: true,
            minifyJS: true
          });

          await fs.writeFile(path.join(distPath.hero, `${id}.${lang}.html`), minifiedHtml, "utf-8");
          log(`Created ${id}.${lang}.html`);
        }));
      };
      return task.bind(this);
    });
  }
}