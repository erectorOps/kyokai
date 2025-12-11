 // gulpプラグインの読み込み
import gulp from 'gulp';
import ejs from 'gulp-ejs'; //EJS
import rename from 'gulp-rename'; //ファイル出力時にファイル名を変える
import { minify } from 'html-minifier';
import through2 from 'through2';

import { getAtkSpeed, getPositionKey } from './hero/_util.mjs';
import { srcBase, srcPath, distBase, def, sk_buttons, ub_buttons } from './_config.mjs';
import { PreSkillCategorize } from './preSkillCategorize.mjs';
import log from 'fancy-log';

import fs from 'fs';
import path from 'path';

const languages = ['ja', 'en'];

function removeCommaSeparatedItem(str, itemToRemove) {
    const arr = str.split(",");
    const index = arr.indexOf(itemToRemove);
    if (index > -1) {
        arr.splice(index, 1);
    }

    return arr.join(",");
}

function addCommaSeparatedItem(str, targetItem) {
    const items = str.split(",");
    const uniqueItems = new Set(items);
    uniqueItems.add(targetItem);
    return Array.from(uniqueItems);
}

export class HeroList {
    constructor(kf) {
        this.kf = kf;
    }

    createMultiLangTasks() {
        return languages.map(lang => {
            return this.createLangTask(lang);
        });
    }

    createLangTask(lang) {
        const kf = this.kf;

        const localePath = path.resolve(process.cwd(), 'src', 'locales', `${lang}.json`);
        const localeData = JSON.parse(fs.readFileSync(localePath, 'utf-8'));

        const t = (key) => localeData[key] || `[Missing Key: ${key}]`;

        return () => {
            const heroList = kf.HeroSetting.filter(item => item['@_id'] !== undefined && parseInt(item['@_id']) < 10000);
            const categorize = (new PreSkillCategorize(kf)).categorize();



            let jsonRoot = {
                title: t('index._inc._list.page_title'), // ★ 翻訳キーに置き換え
                description: t('index._inc._list.page_desc'), // ★ 翻訳キーに置き換え
                keywords: t('index._inc._list.page_keywords'), // ★ 翻訳キーに置き換え
                heros: [],
                def: def,
                sk_buttons: sk_buttons,
                ub_buttons: ub_buttons,
                lang: lang, // ★ 言語コードをEJSに渡す
                t: t // ★ 翻訳関数をEJSに渡す
            };
            
            for(const hero of heroList) {
                const id = hero['@_id'];
                const group = hero['@_group'];
                const name = hero['@_name'].replace(/<\/?ruby.*?>/ig, "");
                const rubyName = hero['@_name'].replace(/<ruby=(.+?)>(.+?)<\/ruby>/ig, "<ruby>$2<rt>$1</rt></ruby>");
            
                const heroGroup = kf.HeroGroupSetting.find(item => item['@_id'] === group);
            
                const atkSkill = kf.SkillSetting.find(item => item['@_id'] === hero['@_atk_skill']);
                const atkEffect = kf.SkillEffectSetting.find(item => item['@_Id'] === atkSkill['@_effect_id']);
                const skill1 = kf.SkillSetting.find(item => item['@_id'] === hero['@_skill1']);
                const skill1Effect = kf.SkillEffectSetting.find(item => item['@_Id'] === skill1['@_effect_id']);
                const skill2 = kf.SkillSetting.find(item => item['@_id'] === hero['@_skill2']);
                const skill2Effect = kf.SkillEffectSetting.find(item => item['@_Id'] === skill2['@_effect_id']);
            
                const rareOrder = ["SSR", "SR", "R"];
            
                const gachaTypeEntity = kf.hero_add.find(item => item['@_id'] === id);
 
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
                  //  ub_type: gachaTypeEntity?.['@_ub_type'] ?? "",
                    ub_type: categorize[id] ? categorize[id].ub_type : "",
                    sk_type: categorize[id] ? categorize[id].sk_type : "",
                  //  sk_type: gachaTypeEntity?.['@_sk_type'] ?? "",
                    rank: gachaTypeEntity?.review?.['@_rank'] ?? "未"
                };

                if (gachaTypeEntity) {
                    if (gachaTypeEntity['@_sk_type_replace']) {
                        const rep = gachaTypeEntity['@_sk_type_replace'].split(",");
                        for (const r of rep) {
                            if (r[0] === "-") {
                                json.sk_type = removeCommaSeparatedItem(json.sk_type, r.substr(1));
                            }
                            else if (r[0] === "+") {
                                json.sk_type = addCommaSeparatedItem(json.sk_type, r.substr(1));
                            }
                        }
                    }
                    if (gachaTypeEntity['@_ub_type_replace']) {
                        const rep = gachaTypeEntity['@_ub_type_replace'].split(",");
                        for (const r of rep) {
                            if (r[0] === "-") {
                                json.ub_type = removeCommaSeparatedItem(json.ub_type, r.substr(1));
                            }
                            else if (r[0] === "+") {
                                json.ub_type = addCommaSeparatedItem(json.ub_type, r.substr(1));
                            }
                        }
                    }
                }

                const maxLimitEntity = kf.HeroLimitOverSetting.find(item => item['@_group_id'] === group && item['@_over_times'] === "5");
                json.support = maxLimitEntity.support_buff_id.filter(item => item !== '0').map(item => {
                  const buff = kf.BuffSetting.find(y => y['@_id'] === item);
                  return buff['@_effect_text'].replace(/<.+/, "");
                }).reduce((p, c) => p.length > 0 ? p + "," + c : c, "");
            
                if (atkSkill) {
                json.atk_speed = getAtkSpeed(parseFloat(atkSkill['@_freeze_time']));
                json.range = parseInt(atkSkill['@_range']);
                json.position = getPositionKey(parseInt(json.range));
                }
            
                jsonRoot.heros.push(json);
            }
            // HTMLファイル作成
            return gulp.src([srcBase + "/index.ejs", srcPath._ejs])
            .pipe(ejs({json: jsonRoot}))
            .pipe(rename(
            {
                basename: 'index',
                extname: `.${lang}.html`
            }
            ))
            .pipe(through2.obj(function (file, encoding, callback) {
                if (file.isNull()) {
                    return callback(null, file);
                }
                if (file.isStream()) {
                    return callback(new Error('Streaming not supported'));
                }
                const contents = file.contents.toString();
                const minifiedContents  = minify(contents, {
                    collapseWhitespace: true,
                    removeComments: true,
                    removeRedundantAttributes: true,
                    removeStyleLinkTypeAttributes: true,
                    useShortDoctype: true,
                    minifyCSS: true,
                    minifyJS: true
                });
                file.contents = Buffer.from(minifiedContents);
                this.push(file);
                callback();
            }))
            .pipe(gulp.dest(distBase));
        };
    }
}

