 // gulpプラグインの読み込み
import gulp from 'gulp';
import ejs from 'gulp-ejs'; //EJS
import rename from 'gulp-rename'; //ファイル出力時にファイル名を変える
import { Big } from 'big.js';

import { getAtkSpeed, getPosition, abiNameConvTable, statisticConvTable, timeErrorMsg } from './hero/_util.mjs';
import { calcPassive } from './hero/_calcPassive.mjs';
import { parseSkill } from './hero/_parseSkill.mjs';
import { srcBase, srcPath, distPath } from './_config.mjs';
import log from 'fancy-log';



export class HeroContents {
    constructor(kf) {
        this.kf = kf;
    }

    createFuncs() {
        const kf = this.kf;
        const heroList = kf.hero_1.root.hero_1.filter(item => item['@_id'] !== undefined && parseInt(item['@_id']) < 10000);

        let heroFuncs = [];
      
        for(const hero of heroList) {
      
          const id = hero['@_id'];

          heroFuncs.push(() => {
      
          const group = hero['@_group'];
          const name = hero['@_name'].replace(/<\/?ruby.*?>/ig, "");
          const rubyName = hero['@_name'].replace(/<ruby=(.+?)>(.+?)<\/ruby>/ig, "<ruby>$2<rt>$1</rt></ruby>");
      
          const heroGroup = kf.hero_group.root.hero_group.find(item => item['@_id'] === group);
          const gachaTypeEntity = kf.hero_add.root.hero_add.find(item => item['@_id'] === id);
      
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
              obtain: ""
          };

          if (gachaTypeEntity) {
            json.gacha_type = gachaTypeEntity['@_gacha_type'] ?? "";
            json.added_date = gachaTypeEntity['@_added_date'] ?? "";
            json.obtain = gachaTypeEntity['@_obtain'] ?? "";

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
            const feature = kf.hero_feature.root.hero_feature.find(y => y['@_id'] === item);
            const skill = kf.skill_other_1.root.skill_other_1.find(y => y['@_id'] === feature.skill[0]);
            return skill['@_name'].replace(/ ボーナスLv\d$/, "")
          }).reduce((p, c) => p.length > 0 ? p + " / " + c : c, "");
      
          const maxLimitEntity = kf.limit_over.root.limit_over.find(item => item['@_group_id'] === group && item['@_over_times'] === "5");
          json.support = maxLimitEntity.support_buff_id.filter(item => item !== '0').map(item => {
            const buff = kf.buff_1.root.buff_1.find(y => y['@_id'] === item);
            return buff['@_effect_text'].replace(/\{1\}/, buff['@_effect_val2']).replace(/<color=(#[A-F0-9]+?)>/ig, `<span class="value up">`).replace(/<\/color>/ig, "</span>");
          }).reduce((p, c) => p.length > 0 ? p + " / " + c : c, "");
      
          //console.log("id = " + json.id + " name = " + json.name);
      
          // 基礎パラメータの計算
      
          const paramNameList = ["hp","atk","matk", "def", "mdef", "atk_crit", "matk_crit", "hit", "block", "end_hp_recovery", "end_mp_recovery", "dmg_suck_hp", "healing_power", "mp_recovery", "mp_cost_down"];
      
          const awakeEntity = kf.hero_awake_1.root.hero_awake_1.find(item => item['@_id'] === group && item['@_open'] == "true");
      
          for (const paramName of paramNameList) {
            let v = 0;
      
            // キャラ初期値
            if (hero['@_' + paramName + '_base'] !== undefined) {
              v += parseInt(hero['@_' + paramName + '_base']);
            }
      
            // Lv限界突破ボーナス
            v += kf.limit_over.root.limit_over
              .filter(item => item['@_group_id'] === group && item['@_'+paramName] !== undefined)
              .reduce((p, c) => p + parseInt(c['@_'+paramName]), 0);
      
            // アビリティ
            const filteredHeroTalent = kf.hero_talent.root.hero_talent.filter(item => item['@_id'] === group);
            for (const heroTalent of filteredHeroTalent) {
              // アビリティグレードアップボーナス
              if (heroTalent['@_'+paramName] !== undefined) {
                v += parseInt(heroTalent['@_'+paramName]);
              }
              // アビリティ5種
              if (abiNameConvTable[paramName]) {
      
                for (const talent of heroTalent.talent) {
                  let talentEffects = kf.talent_effect.root.talent_effect.filter(item => item['@_id'] === talent);
                  for (const effect of talentEffects) {
                    if (abiNameConvTable[paramName] === effect['@_enhance_ability']) {
                      v += parseInt(effect['@_enhance_ability_num']);
                    }
                  }
                }
              }
            }
      
            // 絆分
            const maxGp = kf.hero_gp.root.hero_gp.find(item => item['@_id'] === group && item['@_gp_lv'] === "10");
            if (maxGp['@_'+paramName] !== undefined) {
              v += parseInt(maxGp['@_'+paramName]);
            }
      
            // 絆MAXボーナス
            if (statisticConvTable[paramName]) {
              const gpTokenId = maxGp["@_gp_token_id"];
              const gpEquip = kf.equip.root.equip.find(item => item['@_id'] === gpTokenId);
              if (gpEquip['@_main_statistic'] === statisticConvTable[paramName]) {
                v += parseInt(gpEquip['@_main_statistic_value']);
              }
      
              for (let i = 0; i < gpEquip.secondary_statistic.length; i++) {
                if (gpEquip.secondary_statistic[i] === statisticConvTable[paramName]) {
                  v += parseInt(gpEquip.secondary_statistic_value[i]);
                } 
              }
            }
      
            // Lv上昇分(最大レベル)
            let grow = kf.hero_grow_hero_1.root.hero_grow_hero_1
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
      
          const atkSkill = kf.skill_hero_1.root.skill_hero_1.find(item => item['@_id'] === hero['@_atk_skill']);
          json.skill1 = parseSkill(hero['@_skill1'], Math.min(parseInt(json.lv), 100), kf);
          json.skill2 = parseSkill(hero['@_skill2'], Math.min(parseInt(json.lv), 100), kf);

          if (atkSkill) {
            json.atk_speed = getAtkSpeed(parseFloat(atkSkill['@_freeze_time']));
            json.range = atkSkill['@_range'];
            json.position = getPosition(parseInt(json.range));

            const freezeTime = atkSkill['@_freeze_time'];
            const waitShowTime = kf.skill_effect.root.skill_effect.find(item => item['@_Id'] === atkSkill['@_effect_id'])?.['@_WaitShowTime'] ?? 0;
            const critWaitShowTime = kf.skill_effect.root.skill_effect.find(item => item['@_Id'] === atkSkill['@_crit_effect_id'])?.['@_WaitShowTime'] ?? waitShowTime;

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
              const time = new Big(freezeTime).plus("0.125").plus(new Big(waitShowTime));
              json.atkskill.time = time.toFixed(3, Big.roundHalfEven);
              json.atkskill.time2 = time.round(2, Big.roundDown).toFixed(1, Big.roundUp);

              const crit_time = new Big(freezeTime).plus("0.125").plus(new Big(critWaitShowTime));
              json.atkskill.crit_time = crit_time.toFixed(3, Big.roundHalfEven);
              json.atkskill.crit_time2 = crit_time.round(2, Big.roundDown).toFixed(1, Big.roundUp);
            }
            let scalechecklist = [];
            const scales = 
            ["0", "0.1", "0.15", "0.2", "0.25", "0.30", "0.35", "0.40", "0.45", "0.50", 
              "0.55", "0.60", "0.65", "0.70", "0.75", "0.80", "0.85", "0.90", "0.95", "1", 
              "1.05", "1.10" ,"1.15", "1.2", "1.25"]
            .reverse();
            for (const scale of scales) {
              const scalecheck = { attack: new Big(0), crit: new Big(0), skill1: new Big(0), skill2: new Big(0) };

                scalecheck.name = new Big(scale).mul(100).toFixed(0) + "%";

                scalecheck.attack = 
                scalecheck.attack.plus((new Big(freezeTime).plus(new Big("0.125")).div(new Big(scale).plus(new Big(1)))).round(2, Big.roundDown).round(1, Big.roundUp))
                .plus(new Big(waitShowTime).div(new Big(scale).plus(1))).round(2, Big.roundDown).round(1, Big.roundUp);

                scalecheck.crit = 
                scalecheck.crit.plus((new Big(freezeTime).plus(new Big("0.125")).div(new Big(scale).plus(new Big(1)))).round(2, Big.roundDown).round(1, Big.roundUp))
                .plus(new Big(critWaitShowTime).div(new Big(scale).plus(1))).round(2, Big.roundDown).round(1, Big.roundUp);

                scalecheck.skill1 = 
                scalecheck.skill1.plus((json.skill1.freezeTime.plus(new Big("0.125")).div(new Big(scale).plus(new Big(1)))).round(2, Big.roundDown).round(1, Big.roundUp))
                .plus(json.skill1.waitShowTime.div(new Big(scale).plus(1))).round(2, Big.roundDown).round(1, Big.roundUp);

                scalecheck.skill2 = 
                scalecheck.skill2.plus((json.skill2.freezeTime.plus(new Big("0.125")).div(new Big(scale).plus(new Big(1)))).round(2, Big.roundDown).round(1, Big.roundUp))
                .plus(json.skill2.waitShowTime.div(new Big(scale).plus(1))).round(2, Big.roundDown).round(1, Big.roundUp);
                scalechecklist.push(scalecheck);
            }
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

          return gulp.src([srcBase + "/hero/*.ejs", srcPath._ejs])
          .pipe(ejs({json: json}))
          .pipe(rename(
              {
                  basename: id,
                  extname: '.html'
              }
          ))
          .pipe(gulp.dest(distPath.hero))
          .on('end', function() { log(`${id}.html created.`)});

        });
        }
        return heroFuncs;
    }
}