 // gulpプラグインの読み込み
import gulp from 'gulp';
import ejs from 'gulp-ejs'; //EJS
import rename from 'gulp-rename'; //ファイル出力時にファイル名を変える

import { getAtkSpeed, getPosition } from './hero/_util.mjs';
import { srcBase, srcPath, distBase } from './_config.mjs';

export class HeroList {
    constructor(kf) {
        this.kf = kf;
    }

    createFunc() {
        const kf = this.kf;
        return () => {
            const heroList = kf.hero_1.root.hero_1.filter(item => item['@_id'] !== undefined && parseInt(item['@_id']) < 10000);
            let jsonRoot = {
                title: "聖騎士一覧",
                description: "聖騎士一覧",
                keywords: "聖騎士一覧",
                heros: []
            };
            
            for(const hero of heroList) {
                const id = hero['@_id'];
                const group = hero['@_group'];
                const name = hero['@_name'].replace(/<\/?ruby.*?>/ig, "");
                const rubyName = hero['@_name'].replace(/<ruby=(.+?)>(.+?)<\/ruby>/ig, "<ruby>$2<rt>$1</rt></ruby>");
            
                const heroGroup = kf.hero_group.root.hero_group.find(item => item['@_id'] === group);
            
                const atkSkill = kf.skill_hero_1.root.skill_hero_1.find(item => item['@_id'] === hero['@_atk_skill']);
                const atkEffect = kf.skill_effect.root.skill_effect.find(item => item['@_Id'] === atkSkill['@_effect_id']);
                const skill1 = kf.skill_hero_1.root.skill_hero_1.find(item => item['@_id'] === hero['@_skill1']);
                const skill1Effect = kf.skill_effect.root.skill_effect.find(item => item['@_Id'] === skill1['@_effect_id']);
                const skill2 = kf.skill_hero_1.root.skill_hero_1.find(item => item['@_id'] === hero['@_skill2']);
                const skill2Effect = kf.skill_effect.root.skill_effect.find(item => item['@_Id'] === skill2['@_effect_id']);
            
                const rareOrder = ["SSR", "SR", "R"];
            
                const gachaTypeEntity = kf.hero_add.root.hero_add.find(item => item['@_id'] === id);
                const json = {
                    id: id,
                    name: rubyName,
                    altname: name,
                    rare: hero['@_rare'],
                    attr: heroGroup['@_attr'],
                    atk_attr: heroGroup['@_atk_attr'],
                    role_set: hero['@_role_set'],
                    skill_set: hero['@_skill_set'],
                    first_skill_order: hero['@_first_skill_order'],
                    loop_skill_order: hero['@_loop_skill_order'],
                    atk_skill_freeze_time: parseFloat(atkSkill['@_freeze_time']).toFixed(3),
                    atk_skill_wait_time: atkEffect ? parseFloat(atkEffect['@_WaitShowTime']).toFixed(3) : "-",
                    skill1_name: skill1['@_name'].replace(/<ruby=(.+?)>(.+?)<\/ruby>/ig, "<ruby>$2<rt>$1</rt></ruby>"),
                    skill1_freeze_time: parseFloat(skill1['@_freeze_time']).toFixed(3),
                    skill1_wait_time: skill1Effect ? parseFloat(skill1Effect['@_WaitShowTime']).toFixed(3) : "-",
                    skill2_name: skill2['@_name'].replace(/<ruby=(.+?)>(.+?)<\/ruby>/ig, "<ruby>$2<rt>$1</rt></ruby>"),
                    skill2_freeze_time: parseFloat(skill2['@_freeze_time']).toFixed(3),
                    skill2_wait_time: skill2Effect ? parseFloat(skill2Effect['@_WaitShowTime']).toFixed(3) : "-",
                    no: parseInt(heroGroup['@_illustration_sequence_num']),
                    rare_order: rareOrder.indexOf(hero['@_rare']),
                    equip_type: hero['@_equip_type'],
                    gacha_type: gachaTypeEntity ? gachaTypeEntity['@_gacha_type'] : "",
                    added_date: gachaTypeEntity ? gachaTypeEntity['@_added_date'] : "",
                    obtain: gachaTypeEntity && gachaTypeEntity['@_obtain'] ? gachaTypeEntity['@_obtain'] : "",
                    ub_type: gachaTypeEntity?.['@_ub_type'] ?? ""
                };

                const maxLimitEntity = kf.limit_over.root.limit_over.find(item => item['@_group_id'] === group && item['@_over_times'] === "5");
                json.support = maxLimitEntity.support_buff_id.filter(item => item !== '0').map(item => {
                  const buff = kf.buff_1.root.buff_1.find(y => y['@_id'] === item);
                  return buff['@_effect_text'].replace(/<.+/, "");
                }).reduce((p, c) => p.length > 0 ? p + "," + c : c, "");
            
                if (atkSkill) {
                json.atk_speed = getAtkSpeed(parseFloat(atkSkill['@_freeze_time']));
                json.range = parseInt(atkSkill['@_range']);
                json.position = getPosition(parseInt(json.range));
                }
            
                jsonRoot.heros.push(json);
            }
            // HTMLファイル作成
            return gulp.src([srcBase + "/index.ejs", srcPath._ejs])
            .pipe(ejs({json: jsonRoot}))
            .pipe(rename(
            {
                basename: 'index',
                extname: '.html'
            }
            ))
            .pipe(gulp.dest(distBase));
        };
    }
}

