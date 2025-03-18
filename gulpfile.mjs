 
// gulpプラグインの読み込み
import gulp from 'gulp';
import ejs from 'gulp-ejs'; //EJS
import rename from 'gulp-rename'; //ファイル出力時にファイル名を変える

import imagemin from 'gulp-imagemin'; //画像圧縮
import pngquant from 'imagemin-pngquant'; //PNG画像はこのプラグインが軽量化率高い

import changed from 'gulp-changed'; //更新されたファイルのみ処理
 
import sass from 'gulp-dart-sass'; //sass
import postcss from 'gulp-postcss'; //生成されたcssを操作する
import autoprefixer from 'autoprefixer'; //自動でベンダープレフィックスを付与
import htmlbeautify from 'gulp-html-beautify'; //HTML生成後のコードを綺麗にする
 
import plumber from 'gulp-plumber'; //エラーによるタスクの強制停止を防止
import notify from 'gulp-notify'; //デスクトップ通知

import browserSync from "browser-sync"; //変更を即座にブラウザへ反映
 
import fs from 'fs';//JSONファイル操作用
import path from 'path';
import { deleteAsync } from 'del'; //データ削除用

import { XMLParser } from 'fast-xml-parser';
import Big from 'big.js';

const parser = new XMLParser({ignoreAttributes: false, numberParseOptions: { skipLike: /^[0-9]+/}});

const srcBase = './src';
const distBase = './dist';


 
const srcPath = {
  'scss': srcBase + '/scss/**/*.scss',
  'img': srcBase + '/img/**/*',
  'js': srcBase + '/js/**/*.js',
  'json': srcBase + '/**/*.json',
  'xml': srcBase + '/xml/*',
  'ejs': srcBase + '/**/*.ejs',
  '_ejs': '!' + srcBase + '/_inc/**/*.ejs',
 
};
const distPath = {
  'css': distBase + '/css',
  'img': distBase + '/img',
  'js': distBase + '/js',
  'hero': distBase + '/hero',
};

/* clean */
const clean = () => {

  return deleteAsync([distBase + '/**'], { force: true });
}

/* sass */
const cssSass = () => {
  return gulp.src(srcPath.scss, {
    sourcemaps: false
  })
    .pipe(
      //エラーが出ても処理を止めない
      plumber({
        errorHandler: notify.onError('Error:<%= error.message %>')
      }))
    .pipe(postcss([
      autoprefixer({
        browsers: ['last 2 versions', 'iOS >= 12', 'Android >= 8']
      })
    ]))
    .pipe(sass({ outputStyle: 'expanded' }))
    .pipe(gulp.dest(distPath.css)) //コンパイル先
    .pipe(browserSync.stream())
    .pipe(notify({
      message: 'Sassをコンパイルしました！',
      onLast: true
    }))
}

class KFData
{
  constructor() {
    const dirpath = srcBase + '/xml';
    const dir = fs.readdirSync(dirpath);
    for (const file of dir) {
      this[file] = parser.parse(fs.readFileSync(path.join(dirpath, file), 'utf8'));
    }
  }
}

const kf = new KFData();

const getAtkSpeed = (value) => {
  if (value <= 0.39) { return "早い"; }
  else if (value <= 0.79) { return "やや早い"; }
  else if (value <= 1.09) { return "普通"; }
  else if (value <= 1.29) { return "やや遅い"; }
  else { return "遅い"; }
}

const getPosition = (value) => {
  if (value <= 250) { return "前列"; }
  else if (value <= 450) { return "中列"; }
  else { return "後列"; }
}

function mper(val) {
  return (val < 0 ? "-" : "+") + Math.floor(val * 100) + "%";
}

function per(val) {
  return (val < 0 ? "-" : "+") + Math.abs(val.toFixed(2)) + "%";
}

function str(val) {
  return (val < 0 ? "-" : "+") + Math.abs(val);
}

function toText(val) {
  if (val == undefined || val == null) {
    return "-";
  }
  return val+"";
}

const calcPassive = (sid, params, kf) => {
  const s = kf.skill_hero_1.root.skill_hero_1.find(item => item['@_id'] === sid);  
  for (const postFix of [
    ['A', "{5}", "{6}"],  //  バフ属性名の末尾, バフ効果量挿入文字列, バフ効果時間挿入文字列
    ['B', "{7}", "{8}"], 
    ['C', "{12}", "{13}"]]) {
    const buffId = s['@_buff_id'+postFix[0]];
    const buffDur = s['@_buff_dur'+postFix[0]];
    //const buffIf = s['@_buff_if'+postFix[0]];
    //const buffTarget = s['@_buff_target'+postFix[0]]
    if (buffId) {
      const buff = kf.buff_1.root.buff_1.find(item => item['@_id'] === buffId);
      if (buff !== undefined) {
        calcBuff(params, buff);
      }
    }
  }
}

const calcBuff = (params, buff) => {
  if (buff["@_get_counter"]) {
    return;
  }
  const type = buff['@_effect_type'];
  const val1 = buff['@_effect_val1'] ? new Big(buff['@_effect_val1']).round(2, Big.roundHalfEven) :new Big(0);
  const val1_100 = val1.mul(100);
  const val2 = buff['@_effect_val2'] ? new Big(buff['@_effect_val2']).round(2, Big.roundHalfEven) :new Big(0);
  const val3 = buff['@_effect_val3'] ? new Big(buff['@_effect_val3']).round(2, Big.roundHalfEven) :new Big(0);
  const val4 = buff['@_effect_val4'] ? new Big(buff['@_effect_val4']).round(2, Big.roundHalfEven) :new Big(0);
  const val5 = buff['@_effect_val5'] ? new Big(buff['@_effect_val5']).round(2, Big.roundHalfEven) :new Big(0);
  const cval2 = buff['_counter_effect_val2'] ? new Big(buff['_counter_effect_val2']).round(2, Big.roundHalfEven) :new Big(0);

  switch(type)
  {
      case 'HP上限上升或下降':
        params.hp = params.hp.plus(val2).plus(cval2);
          // text += "最大HP";
          // text += parseUpDown();
          break;

      case 'ATK上升或下降':
        params.atk = params.atk.plus(val2).plus(cval2);
        // text += "物理攻撃";
        // text += parseUpDown();
          break;

      case 'MATK上升或下降':
        params.matk = params.matk.plus(val2).plus(cval2);
        // text += "魔法攻撃";
        // text += parseUpDown();      
          break;

      case 'DEF上升或下降':
        params.def = params.def.plus(val2).plus(cval2);
      //   text += "物理防御";
      //   text += parseUpDown();
          break;

      case 'MDEF上升或下降':
        params.mdef = params.mdef.plus(val2).plus(cval2);
        // text += "魔法防御";
        // text += parseUpDown();
          break;

      case '命中上升或下降':
        params.hit = params.hit.plus(val2).plus(cval2);
        // text += "命中";
        // text += parseUpDown();
          break;

      case '迴避上升或下降':
        params.block = params.block.plus(val2).plus(cval2);
        // text += "ブロック";
        // text += parseUpDown();
          break;

      case 'ATK爆擊上升或下降':
        params.atk_crit = params.atk_crit.plus(val2).plus(cval2);
        // text += "物理クリティカル";
        // text +=  parseCrit();
          break;

      case 'MATK爆擊上升或下降':
        params.matk_crit = params.matk_crit.plus(val2).plus(cval2);
        // text += "魔法クリティカル";
        // text += parseCrit();
          break;

      case '速度上升或下降':

        // text += "行動速度";
        // if (val1.gt(0)) {
        //   text += `${val1.toString()}%UP`;
        // } else if (val1.lt(0)) {
        //   text += `${val1.abs().toString()}%DOWN`;
        // }
          break;

      case 'HP回復':
        // text += "毎秒HP";
        // text += parseAddSub();
          break;

      case 'MP回復':
        // text += "毎秒MP";
        // text += parseAddSub();
          break;

      case '中毒':
          // if (buff['@_group_stack'] === 'true') {
          //   text += `猛毒(毎秒HP${parseAddSub()}、加算可能)`;
          // } else {
          //   text += `中毒(毎秒HP${parseAddSub()})`;
          // }
          break;

      case '中毒抗性':
          // text += `中毒耐性${parseUpDown(val1_100)}`;
          break;

      case '燒傷':
        // if (buff['@_group_stack'] === 'true') {
        //   text += `火傷(毎秒HP${parseAddSub()}、加算可能)`;
        // } else {
        //   text += `火傷(毎秒HP${parseAddSub()})`;
        // }
          break;

      case '燒傷抗性':
        // text += `火傷耐性${parseUpDown(val1_100)}`;
          break;

      case '凍結':
          // text += `凍結(行動不可、毎秒HP${parseAddSub()})`;
          break;

      case '凍結抗性':
        // text += `凍結耐性${parseUpDown(val1_100)}`;
          break;

      case '石化':
        // text += "石化(行動不可、ブロック不可)";
          break;

      case '石化抗性':
        // text += `石化耐性${parseUpDown(val1_100)}`;
          break;

      case '沉睡':
    //    text += "睡眠(行動不可、被ダメが必クリ＆起きる)"
          break;

      case '沉睡抗性':
        // text += `睡眠耐性${parseUpDown(val1_100)}`;
          break;

      case '沉默':
        // text += "沈黙(スキル、奥義不可)";
          break;

      case '沉默抗性':
        // text += `沈黙耐性${parseUpDown(val1_100)}`;
          break;

      case '暈眩':
        // text += "眩暈(行動不可)";
          break;

      case '暈眩抗性':
        // text += `眩暈耐性${parseUpDown(val1_100)}`;
          break;

      case '麻痺':
        // text += "麻痺(行動速度＆攻撃力半減)"
          break;

      case '麻痺抗性':
        // text += `麻痺耐性${parseUpDown(val1_100)}`;
          break;

      case '混亂':
        // text += "混乱(奥義不可、敵味方ランダムに攻撃)"
          break;

      case '混亂抗性':
        // text += `混乱耐性${parseUpDown(val1_100)}`;
          break;

      case '魅惑':
        // text += "魅了(奥義不可、敵にバフスキルを使ったり、味方を攻撃)";
          break;

      case '魅惑抗性':
        // text += `魅了耐性${parseUpDown(val1_100)}`;
          break;

      case '詛咒':
        // text += "呪い(HP、MP回復不可、行動速度半減、クリティカル不可)"
          break;

      case '詛咒抗性':
        // text += `呪い耐性${parseUpDown(val1_100)}`;
          break;

      case '目盲':
        // text += "盲目(ブロック不可)"
          break;

      case '目盲抗性':
        // text += `盲目耐性${parseUpDown(val1_100)}`;
          break;

      case '負面狀態抗性':
        // text += `デバフ耐性${parseUpDown(val1_100)}`;
          break;

      case '定值傷害吸收':
        // if (val3.gt(0)) { 
        //   text += `回復バリア(${span}${val1.toString()}%${val3.gt(0) ? "+" + (val2.mul(lv).toString()) : ""}${spanEnd}、削れたバリアの${span}${val3.toString()}%${spanEnd}HP回復)`;
        // } else {
        //   text += `バリア(${val1.toString()}%${val3.gt(0) ? "+" + (val2.mul(lv).toString()) : ""})`;
        // }
          break;

      case '物理定值傷害吸收':
        // if (val3.gt(0)) { 
        //   text += `物理回復バリア(${span}${val1.toString()}%${val3.gt(0) ? "+" + (val2.mul(lv).toString()) : ""}${spanEnd}、削れたバリアの${span}${val3.toString()}%${spanEnd}HP回復)`;
        // } else {
        //   text += `物理バリア(${val1.toString()}%${val3.gt(0) ? "+" + (val2.mul(lv).toString()) : ""})`;
        // }
          break;

      case '魔法定值傷害吸收':
        // if (val3.gt(0)) { 
        //   text += `魔法回復バリア(${span}${val1.toString()}%${val3.gt(0) ? "+" + (val2.mul(lv).toString()) : ""}${spanEnd}、削れたバリアの${span}${val3.toString()}%${spanEnd}HP回復)`;
        // } else {
        //   text += `魔法バリア(${val1.toString()}%${val3.gt(0) ? "+" + (val2.mul(lv).toString()) : ""})`;
        // }
          break;

      case '次數傷害吸收':
        // text += `${val2.lt(999) ? "回数付" : ""}${val3.gt(0) ? "回復" : ""}バリア(${val1.toString()}%`;
        // if (val4.plus(val5.mul(lv)).gt(0)) {
        //   text += `+${val4.plus(val5.mul(lv)).toString()}`;
        // }
        // if (val3.gt(0)) {
        //   text += `、削れたバリアの${val3.toString()}%回復`;
        // }

        // if (val2.lt(999)) {
        //   text += `、${val2.toString()}回`;
        // }
        // text += ")";
        
          break;

      case '物理次數傷害吸收':
        // text += `${val2.lt(999) ? "回数付" : ""}${val3.gt(0) ? "物理回復" : "物理"}バリア(${val1.toString()}%`;
        // if (val4.plus(val5.mul(lv)).gt(0)) {
        //   text += `+${val4.plus(val5.mul(lv)).toString()}`;
        // }
        // if (val3.gt(0)) {
        //   text += `、削れたバリアの${val3.toString()}%回復`;
        // }

        // if (val2.lt(999)) {
        //   text += `、${val2.toString()}回`;
        // }
        // text += ")";
          break;

      case '魔法次數傷害吸收':
        // text += `${val2.lt(999) ? "回数付" : ""}${val3.gt(0) ? "魔法回復" : "魔法"}バリア(${val1.toString()}%`;
        // if (val4.plus(val5.mul(lv)).gt(0)) {
        //   text += `+${val4.plus(val5.mul(lv)).toString()}`;
        // }
        // if (val3.gt(0)) {
        //   text += `、削れたバリアの${val3.toString()}%回復`;
        // }

        // if (val2.lt(999)) {
        //   text += `、${val2.toString()}回`;
        // }
        // text += ")";
          break;

      case '次數傷害反彈':
        // text += `反射バリア(${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}`;
        // if (val2.lt(999)) {
        //   text += `、${val2.toString()}回`;
        // }
        // text += ")";
          break;

      case '物理次數傷害反彈':
        // text += `物理反射バリア(${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}`;
        // if (val2.lt(999)) {
        //   text += `、${val2.toString()}回`;
        // }
        // text += ")";
          break;

      case '魔法次數傷害反彈':
        // text += `魔法反射バリア(${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}`;
        // if (val2.lt(999)) {
        //   text += `、${val2.toString()}回`;
        // }
        // text += ")";
          break;

      case '無敵':
        // text += "無敵(ダメージ無効)";
          break;

      case '物理無敵':
        // text += "物理無敵(物理ダメージ無効)";
          break;

      case '魔法無敵':
        // text += "魔法無敵(魔法ダメージ無効)";
          break;

      case '嘲諷':
        // text += `挑発${val1.lt(100) ? "(弱)" : ""}`;
          break;

      case '嘲諷抗性':
        // text += `挑発耐性${parseUpDown(val1_100)}`;
          break;

      case '次數傷害加成':
        // text += `回数付ダメージUP(${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}`;
        // if (val2.lt(999)) {
        //   text += `、${val2.toString()}回`;
        // }
        // text += ")";
          break;

      case '物理次數傷害加成':
        // text += `回数付物理ダメージUP(${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}`;
        // if (val2.lt(999)) {
        //   text += `、${val2.toString()}回`;
        // }
        // text += ")";
          break;

      case '魔法次數傷害加成':
        // text += `回数付魔法ダメージUP(${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}`;
        // if (val2.lt(999)) {
        //   text += `、${val2.toString()}回`;
        // }
        // text += ")";
          break;

      case '治療量上升或下降':
        params.healing_power = params.healing_power.plus(val2).plus(cval2);
        //text += "治癒量";
        //text += parseUpDown();
          break;

      case '吸血量上升或下降':
        params.dmg_suck_hp = params.dmg_suck_hp.plus(val2).plus(cval2);
        //text += "HP吸収";
        //text += parseUpDown();
          break;

      case '被治療量上升或下降':
        // text += "被治癒量";
        // text += parseUpDown();
          break;

      case '恐懼':
        // text += `恐怖(毎秒MP${parseAddSub()}、ブロック無効)`;
          break;

      case '恐懼抗性':
        // text += `恐怖耐性${parseUpDown(val1_100)}`;
          break;

      case '驅散':
        // text += `解消(バフ消去)`;
          break;

      case '驅散抗性':
        // text += `解消耐性${parseUpDown(val1_100)}`;
          break;

      // case '戰鬥後角色經驗值增加':
      //     break;

      // case '戰鬥後遊戲幣獲得增加':
      //     break;

      case '風屬性攻擊上升或下降':
        // text += `風属性攻撃`;
        // text += parseUpDown();
          break;

      case '水屬性攻擊上升或下降':
        // text += `水属性攻撃`;
        // text += parseUpDown();
          break;

      case '火屬性攻擊上升或下降':
        // text += `火属性攻撃`;
        // text += parseUpDown();
          break;

      case '聖屬性攻擊上升或下降':
        // text += `聖属性攻撃`;
        // text += parseUpDown();
          break;

      case '魔屬性攻擊上升或下降':
        // text += `魔属性攻撃`;
        // text += parseUpDown();
          break;

      case '想屬性攻擊上升或下降':
        // text += `想属性攻撃`;
        // text += parseUpDown();
          break;

      case '風屬性防禦上升或下降':
        // text += "風属性防御";
        // text += parseUpDown();
          break;

      case '水屬性防禦上升或下降':
        // text += "水属性防御";
        // text += parseUpDown();
          break;

      case '火屬性防禦上升或下降':
        // text += "火属性防御";
        // text += parseUpDown();
          break;

      case '聖屬性防禦上升或下降':
        // text += "聖属性防御";
        // text += parseUpDown();
          break;

      case '魔屬性防禦上升或下降':
        // text += "魔属性防御";
        // text += parseUpDown();
          break;

      case '想屬性防禦上升或下降':
      //  text += "想属性防御";
      //  text += parseUpDown();
          break;

      case '技能傷害上升或下降':
      //  text += "スキルダメージ";
      //  text += parseUpDown();
          break;

      case '奧義傷害上升或下降':
    //    text += "奥義ダメージ";
     //   text += parseUpDown();
          break;

      case '受到傷害上限降低':
    //    text += `${val2.toString()}以上のダメージ(1撃)を受けると、超過分のダメージが${100-val1}%軽減される`;
          break;

      case '風屬性角色技能強化消耗金幣減少':
    //    text += `風属性聖騎士のスキルLv強化時の消費レゴル-${val1.toString()}%`;
          break;

      case '水屬性角色技能強化消耗金幣減少':
    //    text += `水属性聖騎士のスキルLv強化時の消費レゴル-${val1.toString()}%`;
          break;

      case '火屬性角色技能強化消耗金幣減少':
    //    text += `火属性聖騎士のスキルLv強化時の消費レゴル-${val1.toString()}%`;
          break;

      case '聖屬性角色技能強化消耗金幣減少':
     //   text += `聖属性聖騎士のスキルLv強化時の消費レゴル-${val1.toString()}%`;
          break;

      case '魔屬性角色技能強化消耗金幣減少':
     //   text += `魔属性聖騎士のスキルLv強化時の消費レゴル-${val1.toString()}%`;
          break;

      case '想屬性角色技能強化消耗金幣減少':
      //  text += `想属性聖騎士のスキルLv強化時の消費レゴル-${val1.toString()}%`;
          break;

      case '受到風屬性傷害上升或下降':
        //  text += `風属性の敵からの被ダメージ${val1.abs().toString()}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '受到水屬性傷害上升或下降':
      //    text += `水属性の敵からの被ダメージ${val1.abs().toString()}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '受到火屬性傷害上升或下降':
         // text += `火属性の敵からの被ダメージ${val1.abs().toString()}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '受到聖屬性傷害上升或下降':
          //text += `聖属性の敵からの被ダメージ${val1.abs().toString()}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '受到魔屬性傷害上升或下降':
          //text += `魔属性の敵からの被ダメージ${val1.abs().toString()}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '受到想屬性傷害上升或下降':
          //text += `想属性の敵からの被ダメージ${val1.abs().toString()}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '技能傷害加成無效':
          //text += "スキルダメージUP効果無効＆バフ消去";
          break;

      case '奧義傷害加成無效':
          //text += "奥義ダメージUP効果無効＆バフ消去";
          break;

      case '受到普攻傷害上升或下降':
          //text += `敵からの通常攻撃の被ダメージ${parseUpDown()}`;
          break;

      case '受到技能傷害上升或下降':
        //text += `敵からのスキルの被ダメージ${parseUpDown()}`;
          break;

      case '受到奧義傷害上升或下降':
        //text += `敵からの奥義の被ダメージ${parseUpDown()}`;
          break;

      case '普攻傷害上升或下降':
        //text += `通常攻撃ダメージ`;
        //text += parseUpDown();
          break;

      case '普攻傷害加成無效':
        //text += "通常攻撃ダメージUP効果無効＆バフ消去";
          break;

      case '流血':
        //text += `出血(行動後にHP${parseAddSub()}、消去不可)`;
          break;

      case '流血抗性':
        //text += `出血耐性${parseUpDown(val1_100)}`;
          break;

      // case '反擊':
      //     break;
      default:
          console.log("Unknown buff effect type = "+type);
          break;
  } 
}

const parseBuff = (buff, lv) => {
  if (buff["@_get_counter"]) {
    console.log("Error: get_counterのあるバフをパースしようとしてる [buff id="+buff["@_id"] + "]");
    return "Error: get_counterのあるバフをパースしようとしてる [buff id="+buff["@_id"] + "]";
  }

  const debuff = buff['@_debuff'] === "true";
  const span = `<span class=\"value ${debuff ? "down" : "up"}\">`;
  const spanHeal = "<span class=\"value heal\">";
  const spanN = "<span class=\"value\">";
  const spanEnd = "</span>";

  const type = buff['@_effect_type'];
  const val1 = buff['@_effect_val1'] ? new Big(buff['@_effect_val1']).round(2, Big.roundHalfEven) : new Big(0);
  const val1_100 = val1.mul(100);
  const val2 = buff['@_effect_val2'] ? new Big(buff['@_effect_val2']).round(2, Big.roundHalfEven) :new Big(0);
  const val3 = buff['@_effect_val3'] ? new Big(buff['@_effect_val3']).round(2, Big.roundHalfEven) :new Big(0);
  const val4 = buff['@_effect_val4'] ? new Big(buff['@_effect_val4']).round(2, Big.roundHalfEven) :new Big(0);
  const val5 = buff['@_effect_val5'] ? new Big(buff['@_effect_val5']).round(2, Big.roundHalfEven) :new Big(0);
  let text = "";

  const parseUpDown = (v1) => {
    let t = "";
    if (v1 === undefined) { v1 = val1; }
    if (v1.gt(0)) {
      t += `<span class=\"value ${debuff ? "down" : "up"}\">`;
      t += `${v1.toString()}%`;
      const v = val2.plus(val3.mul(lv));
      if (v.gt(0)) { t += `+${v.abs().toString()}`; } else if (v.lt(0)) { t += `-${v.abs().toString()}`; }
      t += "</span>";
      t += "UP";
    } else if (v1.lt(0)) {
      t += `<span class=\"value ${debuff ? "down" : "up"}\">`;
      t += `${v1.abs().toString()}%`;
      const v = val2.plus(val3.mul(lv));
      if (v.gt(0)) { t += `+${v.abs().toString()}`; } else if (v.lt(0)) { t += `-${v.abs().toString()}`; }
      t += "</span>";
      t += "DOWN";
    } else {
      t += `<span class=\"value ${debuff ? "down" : "up"}\">`;
      const v = val2.plus(val3.mul(lv));
      t += ((v > 0) ? "+" : "") + `${v.toString()}`;
      t += "</span>";
      //if (v > 0) { t += "UP"; } else if (v < 0) { t += "DOWN"; }
    }
    return t;
  };

  const parseAddSub = (heal) => {
    let t = "";
    if (val1.gt(0)) {
      t += `<span class=\"value ${debuff ? "down" : heal ? "heal" : "up"}\">`;
      t += `${val1.toString()}%`;
      const v = val2.plus(val3.mul(lv));
      if (v.gt(0)) { t += `+${v.abs().toString()}`; } else if (v.lt(0)) { t += `-${v.abs().toString()}`; }

      t += "</span>";
    } else if (val1.lt(0)) {
      t += `<span class=\"value ${debuff ? "down" : heal ? "heal" : "up"}\">`;
      t += `-${val1.abs().toString()}%`;
      const v = val2.plus(val3.mul(lv));
      if (v.gt(0)) { t += `+${v.abs().toString()}`; } else if (v.lt(0)) { t += `-${v.abs().toString()}`; }
      t += "</span>";
    } else {
      t += `<span class=\"value ${debuff ? "down" : heal ? "heal" : "up"}\">`;
      const v = val2.plus(val3.mul(lv));
      t += `${v.toString()}`;
      t += "</span>";
    }
    return t;
  };

  const parseCrit = () => {
    let t = "";
    if (val1.cmp(0) !== 0) {
      if (val1.gt(0)) {
        t += `<span class=\"value ${debuff ? "down" : "up"}\">`;
        t += `${val1.toString()}%`;
        const v = val2.plus(val3.mul(lv));
        if (v.gt(0)) { t += `+${v.abs().toString()}`; } else if (v.lt(0)) { t += `-${v.abs().toString()}`; }
        t += "</span>";
        t += "UP";
      } else {
        t += `<span class=\"value ${debuff ? "down" : "up"}\">`;
        t += `${val1.abs().toString()}%`;
        const v = val2.plus(val3.mul(lv));
        if (v.gt(0)) { t += `+${v.abs().toString()}`; } else if (v.lt(0)) { t += `-${v.abs().toString()}`; }
        t += "</span>";
        t += "DOWN";
      }
    } else {
      t += `<span class=\"value ${debuff ? "down" : "up"}\">`;
      const v = val2.plus(val3.mul(lv));
      t += (v.mul("0.05").gt(0) ? "+" : "") + `${v.mul("0.05").round(2, Big.roundHalfEven).toString()}%`;
      t += "</span>";
    }
    return t;
  }

  switch(type)
  {
      case 'HP上限上升或下降':
          text += "最大HP";
          text += parseUpDown();
          break;

      case 'ATK上升或下降':
        text += "物理攻撃";
        text += parseUpDown();
          break;

      case 'MATK上升或下降':
        text += "魔法攻撃";
        text += parseUpDown();      
          break;

      case 'DEF上升或下降':
        text += "物理防御";
        text += parseUpDown();
          break;

      case 'MDEF上升或下降':
        text += "魔法防御";
        text += parseUpDown();
          break;

      case '命中上升或下降':
        text += "命中";
        text += parseUpDown();
          break;

      case '迴避上升或下降':
        text += "ブロック";
        text += parseUpDown();
          break;

      case 'ATK爆擊上升或下降':
        text += "物理クリティカル";
        text +=  parseCrit();
          break;

      case 'MATK爆擊上升或下降':
        text += "魔法クリティカル";
        text += parseCrit();
          break;

      case '速度上升或下降':
        text += "行動速度";
        if (val1.gt(0)) {
          text += `${span}${val1.toString()}%${spanEnd}UP`;
        } else if (val1.lt(0)) {
          text += `${span}${val1.abs().toString()}%${spanEnd}DOWN`;
        }
          break;

      case 'HP回復':
        text += "毎秒HP";
        text += parseAddSub(true);
          break;

      case 'MP回復':
        text += "毎秒MP";
        text += parseAddSub(true);
          break;

      case '中毒':
          if (buff['@_group_stack'] === 'true') {
            text += `猛毒(毎秒HP${parseAddSub()}、加算可能)`;
          } else {
            text += `中毒(毎秒HP${parseAddSub()})`;
          }
          break;

      case '中毒抗性':
          text += `中毒耐性${parseUpDown(val1_100)}`;
          break;

      case '燒傷':
        if (buff['@_group_stack'] === 'true') {
          text += `火傷(毎秒HP${parseAddSub()}、加算可能)`;
        } else {
          text += `火傷(毎秒HP${parseAddSub()})`;
        }
          break;

      case '燒傷抗性':
        text += `火傷耐性${parseUpDown(val1_100)}`;
          break;

      case '凍結':
          text += `凍結(行動不可、毎秒HP${parseAddSub()})`;
          break;

      case '凍結抗性':
        text += `凍結耐性${parseUpDown(val1_100)}`;
          break;

      case '石化':
        text += "石化(行動不可、ブロック不可)";
          break;

      case '石化抗性':
        text += `石化耐性${parseUpDown(val1_100)}`;
          break;

      case '沉睡':
        text += "睡眠(行動不可、被ダメが必クリ＆起きる)"
          break;

      case '沉睡抗性':
        text += `睡眠耐性${parseUpDown(val1_100)}`;
          break;

      case '沉默':
        text += "沈黙(スキル、奥義不可)";
          break;

      case '沉默抗性':
        text += `沈黙耐性${parseUpDown(val1_100)}`;
          break;

      case '暈眩':
        text += "眩暈(行動不可)";
          break;

      case '暈眩抗性':
        text += `眩暈耐性${parseUpDown(val1_100)}`;
          break;

      case '麻痺':
        text += "麻痺(行動速度＆攻撃力半減)"
          break;

      case '麻痺抗性':
        text += `麻痺耐性${parseUpDown(val1_100)}`;
          break;

      case '混亂':
        text += "混乱(奥義不可、敵味方ランダムに攻撃)"
          break;

      case '混亂抗性':
        text += `混乱耐性${parseUpDown(val1_100)}`;
          break;

      case '魅惑':
        text += "魅了(奥義不可、敵にバフスキルを使ったり、味方を攻撃)";
          break;

      case '魅惑抗性':
        text += `魅了耐性${parseUpDown(val1_100)}`;
          break;

      case '詛咒':
        text += "呪い(HP、MP回復不可、行動速度半減、クリティカル不可)"
          break;

      case '詛咒抗性':
        text += `呪い耐性${parseUpDown(val1_100)}`;
          break;

      case '目盲':
        text += "盲目(ブロック不可)"
          break;

      case '目盲抗性':
        text += `盲目耐性${parseUpDown(val1_100)}`;
          break;

      case '負面狀態抗性':
        text += `デバフ耐性${parseUpDown(val1_100)}`;
          break;

      case '定值傷害吸收':
        if (val3.gt(0)) { 

          text += `回復バリア(${span}${val1.toString()}%${val3.gt(0) ? "+" + (val2.mul(lv).toString()) : ""}${spanEnd}、削れたバリアの${spanHeal}${val3.toString()}%${spanEnd}HP回復)`;
        } else {
          text += `バリア(${span}${val1.toString()}%${val3.gt(0) ? "+" + (val2.mul(lv).toString()) : ""}${spanEnd})`;
        }
          break;

      case '物理定值傷害吸收':
        if (val3.gt(0)) { 
          text += `物理回復バリア(${span}${val1.toString()}%${val3.gt(0) ? "+" + (val2.mul(lv).toString()) : ""}${spanEnd}、削れたバリアの${spanHeal}${val3.toString()}%${spanEnd}HP回復)`;
        } else {
          text += `物理バリア(${span}${val1.toString()}%${val3.gt(0) ? "+" + (val2.mul(lv).toString()) : ""}${spanEnd})`;
        }
          break;

      case '魔法定值傷害吸收':
        if (val3.gt(0)) { 
          text += `魔法回復バリア(${span}${val1.toString()}%${val3.gt(0) ? "+" + (val2.mul(lv).toString()) : ""}${spanEnd}、削れたバリアの${spanHeal}${val3.toString()}%${spanEnd}HP回復)`;
        } else {
          text += `魔法バリア(${span}${val1.toString()}%${val3.gt(0) ? "+" + (val2.mul(lv).toString()) : ""}${spanEnd})`;
        }
          break;

      case '次數傷害吸收':
        text += `${val2.lt(999) ? "回数付" : ""}${val3.gt(0) ? "回復" : ""}バリア(${span}${val1.toString()}%`;
        if (val4.plus(val5.mul(lv)).gt(0)) {
          text += `+${val4.plus(val5.mul(lv)).toString()}$`;
        }
        text += `${spanEnd}`;
        if (val3.gt(0)) {
          text += `、削れたバリアの${spanHeal}${val3.toString()}%${spanEnd}回復`;
        }

        if (val2.lt(999)) {
          text += `、${spanN}${val2.toString()}${spanEnd}回`;
        }
        text += ")";
        
          break;

      case '物理次數傷害吸收':
        text += `${val2.lt(999) ? "回数付" : ""}${val3.gt(0) ? "物理回復" : "物理"}バリア(${span}${val1.toString()}%`;
        if (val4.plus(val5.mul(lv)).gt(0)) {
          text += `+${val4.plus(val5.mul(lv)).toString()}`;
        }
        text += `${spanEnd}`;
        if (val3.gt(0)) {
          text += `、削れたバリアの${span}${val3.toString()}%${spanEnd}回復`;
        }

        if (val2.lt(999)) {
          text += `、${spanN}${val2.toString()}${spanEnd}回`;
        }
        text += ")";
          break;

      case '魔法次數傷害吸收':
        text += `${val2.lt(999) ? "回数付" : ""}${val3.gt(0) ? "魔法回復" : "魔法"}バリア(${span}${val1.toString()}%`;
        if (val4.plus(val5.mul(lv)).gt(0)) {
          text += `+${val4.plus(val5.mul(lv)).toString()}`;
        }
        text += `${spanEnd}`;
        if (val3.gt(0)) {
          text += `、削れたバリアの${span}${val3.toString()}%${spanEnd}回復`;
        }

        if (val2.lt(999)) {
          text += `、${spanN}${val2.toString()}${spanEnd}回`;
        }
        text += ")";
          break;

      case '次數傷害反彈':
        text += `反射バリア(${span}${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}${spanEnd}`;
        if (val2.lt(999)) {
          text += `、${spanN}${val2.toString()}${spanEnd}回`;
        }
        text += ")";
          break;

      case '物理次數傷害反彈':
        text += `物理反射バリア(${span}${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}${spanEnd}`;
        if (val2.lt(999)) {
          text += `、${spanN}${val2.toString()}${spanEnd}回`;
        }
        text += ")";
          break;

      case '魔法次數傷害反彈':
        text += `魔法反射バリア(${span}${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}${spanEnd}`;
        if (val2.lt(999)) {
          text += `、${spanN}${val2.toString()}${spanEnd}回`;
        }
        text += ")";
          break;

      case '無敵':
        text += "無敵(ダメージ無効)";
          break;

      case '物理無敵':
        text += "物理無敵(物理ダメージ無効)";
          break;

      case '魔法無敵':
        text += "魔法無敵(魔法ダメージ無効)";
          break;

      case '嘲諷':
        text += `挑発${val1.lt(100) ? "(弱)" : ""}`;
          break;

      case '嘲諷抗性':
        text += `挑発耐性${parseUpDown(val1_100)}`;
          break;

      case '次數傷害加成':
        text += `回数付ダメージUP(${span}${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}${spanEnd}`;
        if (val2.lt(999)) {
          text += `、${spanN}${val2.toString()}${spanEnd}回`;
        }
        text += ")";
          break;

      case '物理次數傷害加成':
        text += `回数付物理ダメージUP(${span}${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}${spanEnd}`;
        if (val2.lt(999)) {
          text += `、${spanN}${val2.toString()}${spanEnd}回`;
        }
        text += ")";
          break;

      case '魔法次數傷害加成':
        text += `回数付魔法ダメージUP(${span}${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}${spanEnd}`;
        if (val2.lt(999)) {
          text += `、${spanN}${val2.toString()}${spanEnd}回`;
        }
        text += ")";
          break;

      case '治療量上升或下降':
        text += "治癒量";
        text += parseUpDown();
          break;

      case '吸血量上升或下降':
        text += "HP吸収";
        text += parseUpDown();
          break;

      case '被治療量上升或下降':
        text += "被治癒量";
        text += parseUpDown();
          break;

      case '恐懼':
        text += `恐怖(毎秒MP${parseAddSub()}、ブロック無効)`;
          break;

      case '恐懼抗性':
        text += `恐怖耐性${parseUpDown(val1_100)}`;
          break;

      case '驅散':
        text += `解消(バフ消去)`;
          break;

      case '驅散抗性':
        text += `解消耐性${parseUpDown(val1_100)}`;
          break;

      // case '戰鬥後角色經驗值增加':
      //     break;

      // case '戰鬥後遊戲幣獲得增加':
      //     break;

      case '風屬性攻擊上升或下降':
        text += `風属性攻撃`;
        text += parseUpDown();
          break;

      case '水屬性攻擊上升或下降':
        text += `水属性攻撃`;
        text += parseUpDown();
          break;

      case '火屬性攻擊上升或下降':
        text += `火属性攻撃`;
        text += parseUpDown();
          break;

      case '聖屬性攻擊上升或下降':
        text += `聖属性攻撃`;
        text += parseUpDown();
          break;

      case '魔屬性攻擊上升或下降':
        text += `魔属性攻撃`;
        text += parseUpDown();
          break;

      case '想屬性攻擊上升或下降':
        text += `想属性攻撃`;
        text += parseUpDown();
          break;

      case '風屬性防禦上升或下降':
        text += "風属性防御";
        text += parseUpDown();
          break;

      case '水屬性防禦上升或下降':
        text += "水属性防御";
        text += parseUpDown();
          break;

      case '火屬性防禦上升或下降':
        text += "火属性防御";
        text += parseUpDown();
          break;

      case '聖屬性防禦上升或下降':
        text += "聖属性防御";
        text += parseUpDown();
          break;

      case '魔屬性防禦上升或下降':
        text += "魔属性防御";
        text += parseUpDown();
          break;

      case '想屬性防禦上升或下降':
        text += "想属性防御";
        text += parseUpDown();
          break;

      case '技能傷害上升或下降':
        text += "スキルダメージ";
        text += parseUpDown();
          break;

      case '奧義傷害上升或下降':
        text += "奥義ダメージ";
        text += parseUpDown();
          break;

      case '受到傷害上限降低':
        text += `${spanN}${val2.toString()}${spanEnd}以上のダメージ(1撃)を受けると、超過分のダメージが${span}${(new Big("100")).minus(val1).toString()}%${spanEnd}軽減される`;
          break;

      case '風屬性角色技能強化消耗金幣減少':
        text += `風属性聖騎士のスキルLv強化時の消費レゴル${span}-${val1.toString()}%${spanEnd}`;
          break;

      case '水屬性角色技能強化消耗金幣減少':
        text += `水属性聖騎士のスキルLv強化時の消費レゴル${span}-${val1.toString()}%${spanEnd}`;
          break;

      case '火屬性角色技能強化消耗金幣減少':
        text += `火属性聖騎士のスキルLv強化時の消費レゴル${span}-${val1.toString()}%${spanEnd}`;
          break;

      case '聖屬性角色技能強化消耗金幣減少':
        text += `聖属性聖騎士のスキルLv強化時の消費レゴル${span}-${val1.toString()}%${spanEnd}`;
          break;

      case '魔屬性角色技能強化消耗金幣減少':
        text += `魔属性聖騎士のスキルLv強化時の消費レゴル${span}-${val1.toString()}%${spanEnd}`;
          break;

      case '想屬性角色技能強化消耗金幣減少':
        text += `想属性聖騎士のスキルLv強化時の消費レゴル${span}-${val1.toString()}%${spanEnd}`;
          break;

      case '受到風屬性傷害上升或下降':
          text += `風属性の敵からの被ダメージ${span}${val1.abs().toString()}${spanEnd}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '受到水屬性傷害上升或下降':
          text += `水属性の敵からの被ダメージ${span}${val1.abs().toString()}${spanEnd}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '受到火屬性傷害上升或下降':
          text += `火属性の敵からの被ダメージ${span}${val1.abs().toString()}${spanEnd}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '受到聖屬性傷害上升或下降':
          text += `聖属性の敵からの被ダメージ${span}${val1.abs().toString()}${spanEnd}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '受到魔屬性傷害上升或下降':
          text += `魔属性の敵からの被ダメージ${span}${val1.abs().toString()}${spanEnd}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '受到想屬性傷害上升或下降':
          text += `想属性の敵からの被ダメージ${span}${val1.abs().toString()}${spanEnd}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '技能傷害加成無效':
          text += "スキルダメージUP効果無効＆バフ消去";
          break;

      case '奧義傷害加成無效':
          text += "奥義ダメージUP効果無効＆バフ消去";
          break;

      case '受到普攻傷害上升或下降':
          text += `敵からの通常攻撃の被ダメージ${parseUpDown()}`;
          break;

      case '受到技能傷害上升或下降':
        text += `敵からのスキルの被ダメージ${parseUpDown()}`;
          break;

      case '受到奧義傷害上升或下降':
        text += `敵からの奥義の被ダメージ${parseUpDown()}`;
          break;

      case '普攻傷害上升或下降':
        text += `通常攻撃ダメージ`;
        text += parseUpDown();
          break;

      case '普攻傷害加成無效':
        text += "通常攻撃ダメージUP効果無効＆バフ消去";
          break;

      case '流血':
        text += `出血(行動後にHP${parseAddSub()}、消去不可)`;
          break;

      case '流血抗性':
        text += `出血耐性${parseUpDown(val1_100)}`;
          break;

      // case '反擊':
      //     break;
      
      default:
          console.log("Unknown buff effect type = "+type);
          break;
  }
  if (buff['@_cant_remove'] === 'true') {
    text += "(消去不可)";
  }
  return text;
}

const parseSkill = (sid, lv, kf) => {
  const s = kf.skill_hero_1.root.skill_hero_1.find(item => item['@_id'] === sid);
  const is_heal = s['@_target_hp_effect'] && s['@_target_hp_effect'] === "回復";

  let text = s['@_effect_text'];
  text = text.replace(/<color=(#[A-F0-9]+?)>\{9\}/i, `<span class="value${is_heal ? " heal" : ""}">{9}`)
    .replace(/<color=(#[A-F0-9]+?)>/ig, `<span class="value">`).replace(/<\/color>/ig, "</span>");
  const freezeTime = s['@_freeze_time'] ? parseFloat(s['@_freeze_time']) : undefined;

  let waitShowTime = undefined;
  if (s['@_effect_id'] && kf.skill_effect.root.skill_effect.find(item => item['@_Id'] === s['@_effect_id'])) {
    waitShowTime = parseFloat(kf.skill_effect.root.skill_effect.find(item => item['@_Id'] === s['@_effect_id'])['@_WaitShowTime']);
  }


  const hpScale = s['@_target_hp_scale'] ? new Big(s['@_target_hp_scale']) :new Big(0);
  const hpAdd = s['@_target_hp_add'] ? new Big(s['@_target_hp_add']) :new Big(0);
  const hpGrow = s['@_target_hp_add_grow'] ? new Big(s['@_target_hp_add_grow']) :new Big(0);

  if (text.indexOf('{3:P0}') !== -1) {
    const suck = s['@_dmg_suck_hp_scale'] ? new Big(s['@_dmg_suck_hp_scale']) :new Big(0);
    if (suck.cmp(0) !== 0) {
      text = text.replace('{3:P0}', suck.mul(100).round(0, Big.roundDown).toString() + "%");
    }
  }

  const targetHpEffect = s['@_target_hp_effect'] ? s['@_target_hp_effect'].replace("魔法傷害", "魔法ダメージ").replace("物理傷害", "物理ダメージ") : "";

  if (text.indexOf('{9}') !== -1) {
    const damage = `${hpScale.mul(100).round(0, Big.roundDown).toString()}%+${hpGrow.mul(lv).plus(hpAdd).toString()}`;
    text = text.replace('{9}', damage)
  }

  let speed_value = 0;

  for (const postFix of [
    ['A', "{5}", "{6}"],  //  バフ属性名の末尾, バフ効果量挿入文字列, バフ効果時間挿入文字列
    ['B', "{7}", "{8}"], 
    ['C', "{12}", "{13}"]]) {
    const buffId = s['@_buff_id'+postFix[0]];
    const buffDur = s['@_buff_dur'+postFix[0]];
    //const buffIf = s['@_buff_if'+postFix[0]];
    //const buffTarget = s['@_buff_target'+postFix[0]]
    if (buffId) {
      text = text.replace(postFix[2], buffDur);
      const buff = kf.buff_1.root.buff_1.find(item => item['@_id'] === buffId);
      if (buff !== undefined) {
        text = text.replace(postFix[1], parseBuff(buff, lv));
        if (buff['@_effect_type'] === '速度上升或下降') {
          speed_value += (buff["@_effect_val1"] !== undefined ? parseFloat(buff["@_effect_val1"]) : 0) 
            + (buff["@_counter_effect_val1"] !== undefined ? parseFloat(buff["@_counter_effect_val1"]) : 0);
        }
      }
    }
  }

  // ◯◯か◯◯のスキル
  if (s['@_group']) {
    const groups = kf.skill_hero_1.root.skill_hero_1.filter(item => item['@_group'] === s['@_group']); 
    if (groups[0]['@_id'] === s['@_id']) {
      for (let i = 1; i < groups.length; i++) {
        if (groups[i]['@_effect_text']) {
          text = text.replace("{"+(20+i)+"}", parseSkill(groups[i]['@_id'], lv, kf).text);
        }
      }
    }
  }

  return {
    speed_buff: speed_value,
    time: freezeTime ? (freezeTime + 0.125 + waitShowTime).toFixed(3) : 0,  // 実測値に合わせた根拠のない補正
    text: text,
    name: s[`@_name`].replace(/<ruby=(.+?)>(.+?)<\/ruby>/ig, "<ruby>$2<rt>$1</rt></ruby>")
  };
}

const listFunc = () => {
  const heroList = kf.hero_1.root.hero_1.filter(item => item['@_id'] !== undefined);
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
        obtain: gachaTypeEntity && gachaTypeEntity['@_obtain'] ? gachaTypeEntity['@_obtain'] : ""
    };

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
}

/* EJS */
const createHeroFuncs = () => {

  const abiNameConvTable = {
    hp: "HP",
    atk: "物理攻擊",
    def: "物理防禦",
    atk_crit: "物理爆擊",
    hit: "命中",
    block: "格擋",
    matk: "魔法攻擊",
    mdef: "魔法防禦",
    matk_crit: "魔法爆擊",
    mp_recovery: "MP回復"
  };
  const statisticConvTable = {
		// 無,
		hp: "HP",
		atk: "物理傷害",
		matk: "魔法傷害",
		def: "物理防禦",
		mdef: "魔法防禦",
		hit: "命中",
		block: "格檔",
		atk_crit: "物理爆擊",
		matk_crit: "魔法爆擊",
		end_hp_recovery: "結束回復HP",
		end_mp_recovery: "結束回復MP",
		dmg_suck_hp: "傷害吸取HP",
		healing_power: "治癒力",
		mp_recovery: "MP回復",
		mp_cost_down: "MP消耗降低",

		// 胸圍,
		// 技能傷害百分比,
		// 技能傷害加成值,
		// 奧義傷害百分比,
		// 奧義傷害加成值,
		// 普攻傷害百分比,
		// 普攻傷害加成值
  };

  const heroList = kf.hero_1.root.hero_1.filter(item => item['@_id'] !== undefined);

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
        gacha_type: gachaTypeEntity ? gachaTypeEntity['@_gacha_type'] : "",
        added_date: gachaTypeEntity ? gachaTypeEntity['@_added_date'] : "",
        obtain: gachaTypeEntity && gachaTypeEntity['@_obtain'] ? gachaTypeEntity['@_obtain'] : ""
    };


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

    console.log("id = " + json.id + " name = " + json.name);

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
    if (atkSkill) {
      json.atk_speed = getAtkSpeed(parseFloat(atkSkill['@_freeze_time']));
      json.range = atkSkill['@_range'];
      json.position = getPosition(parseInt(json.range));

      const freezeTime = parseFloat(atkSkill['@_freeze_time']);
      const waitShowTime = parseFloat(kf.skill_effect.root.skill_effect.find(item => item['@_Id'] === atkSkill['@_effect_id'])['@_WaitShowTime']);

      json.atkskill = {name: "通常攻撃", time: (freezeTime + 0.125 + waitShowTime).toFixed(3)}
    }

    json.skill1 = parseSkill(hero['@_skill1'], Math.min(parseInt(json.lv), 100), kf);
    json.skill2 = parseSkill(hero['@_skill2'], Math.min(parseInt(json.lv), 100), kf);

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

    if (hero['@_passive_skill3']) {
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
    .pipe(gulp.dest(distPath.hero));

  });
  }
  return heroFuncs;
}
 
/* image */
const imgFunc = () => {
  return gulp.src(srcPath.img, {encoding: false})
    .pipe(changed(distPath.img))
    .pipe(imagemin([pngquant({ quality: [0.8, 0.95], speed: 1})], {verbose: true}))
    .pipe(gulp.dest(distPath.img))
}
 
/* js */
const jsFunc = () => {
  return gulp.src(srcPath.js)
    .pipe(gulp.dest(distPath.js))
}
 
/* ローカルサーバー立ち上げ */
const browserSyncFunc = () => {
  browserSync.init(browserSyncOption);
}
 
const browserSyncOption = {
  server: distBase
}
 
/* リロード */
const browserSyncReload = (done) => {
  browserSync.reload();
  done();
}

const deployGhPages = () => {
  return gulp.src("./dist/**/*")
  .pipe(deploy());
}

/* ファイルの変更時にbrowserSyncReloadする */
const watchFiles = () => {
  gulp.watch(srcPath.scss, gulp.series(cssSass))
  gulp.watch(srcPath.img, gulp.series(imgFunc, browserSyncReload))
  gulp.watch(srcPath.ejs, gulp.series(gulp.parallel(createHeroFuncs()), browserSyncReload))
  gulp.watch(srcBase + "/index.ejs", gulp.series(listFunc, browserSyncReload))
  gulp.watch(srcPath.js, gulp.series(jsFunc, browserSyncReload))
}

export default gulp.series(
  gulp.parallel(cssSass, createHeroFuncs(), listFunc ,imgFunc, jsFunc),
  gulp.parallel(watchFiles, browserSyncFunc)
)
 
export const build = gulp.series(
  gulp.parallel(cssSass, createHeroFuncs(), listFunc ,imgFunc, jsFunc),
);
