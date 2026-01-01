 // gulpプラグインの読み込み
import gulp from 'gulp';
import minimist from 'minimist';
import { cssSass } from './src/task/sass.mjs';
import { imgFunc } from './src/task/image.mjs';
import { jsFunc } from './src/task/js.mjs';
import { Watch } from './src/task/watch.mjs'
import { HeroList } from './src/task/heroList.mjs';
import { HeroContents } from './src/task/heroContents.mjs';
import { KFData } from './src/task/_kfdata.mjs';
import { PreSkillCategorize } from './src/task/preSkillCategorize.mjs';
//import { clean } from './src/task/clean.mjs'
import path from 'path';
import { srcBase, distBase } from './src/task/_config.mjs';
import log from 'fancy-log';
import rename from 'gulp-rename'; //ファイル出力時にファイル名を変える
import { LangUtil } from './src/task/_lang.mjs';
import { SkillParser as SkillParserNew } from './src/task/hero/_genSkill.mjs';
import { parseSkill as parseSkillOld} from './src/task/hero/_parseSkill.mjs';
import * as fsSync from 'fs';


const kf = new KFData();
const heroList = new HeroList(kf);
const heroContents = new HeroContents(kf);


function testCategory(cb) {
      const chk = new PreSkillCategorize(kf);
      const data = chk.categorize();

      for (const entry in data) {
        const name = data[entry].name;
        const sk_type = data[entry].sk_type.join(",");
        const ub_type = data[entry].ub_type.join(",");
        log(`${name}(${entry}) : ${sk_type} : ${ub_type}`);
      }

      cb();
}

export const test = gulp.series(testCategory);

const watcher = new Watch(kf);

const knownOptions = {
  string: ['env', 'lang', 'id'],
  default: { env: 'development', lang: 'ja'}
};

const options = minimist(process.argv.slice(2), knownOptions);


const checkId = (cb) => {
  const id = options.id;
  const lang = options.lang;
  if (!id) {
    log.error('`gulp page` タスクには `--id` オプションが必要です。');
    process.exit(1);
  }
  if (!lang) {
    log.error('`gulp page` タスクには `--lang` オプションが必要です。');
    process.exit(1);
  }
  cb();
}

export const compareSkill = (done) => {
  const sid = options.id;
  const level = 100;
  const lang = 'ja';
  console.log(`\n=== Comparing Skill ID: ${sid} (Lv: ${level}) | Lang: ${lang} ===\n`);

  const langPath = LangUtil.getParserPath(lang);
  let textMap = {};
  let enMap = {};
  try {
        textMap = JSON.parse(fsSync.readFileSync(langPath, 'utf-8'));
        enMap = JSON.parse(fsSync.readFileSync(LangUtil.getParserPath('en'), 'utf-8'));
    } catch (e) {
        console.error(`❌ ロケールファイルの読み込みに失敗しました: ${langPath}`);
        return done();
  }

    // --- 1. 従来版の解析 ---
    const resultOld = parseSkillOld(sid, level, kf);

    // --- 2. 多言語対応版の解析 ---
    SkillParserNew.setKFData(kf);
    SkillParserNew.setTextMap(textMap);
    const resultNew = SkillParserNew.parseSkill(sid, level);

    // --- 3. 結果の表示 ---
    console.log("------------------------------------------");
    console.log("【従来版 (_parseSkill.mjs)】");
    console.log(resultOld.text.replaceAll(/[、。]/g, "\n"));
    console.log("------------------------------------------");
    console.log("【多言語対応版 (_genSkill.mjs)】");
    console.log(resultNew.text.replaceAll('<br>', '\n'));
    console.log("------------------------------------------\n");
     SkillParserNew.setTextMap(enMap);
     const enNew = SkillParserNew.parseSkill(sid, level);
     console.log(enNew.text.replaceAll('<br>', '\n'));
     console.log("------------------------------------------\n");
    console.log(SkillParserNew.getUsedTextMaps().join('\n'));
    done();
}


const copyIndexHtml = () => {
  return gulp.src(path.join(srcBase, 'index-redirect.html'))
    .pipe(rename('index.html'))
    .pipe(gulp.dest(distBase));
}

export const page = gulp.series(
  checkId,
  gulp.parallel(cssSass, heroContents.createOne.bind(heroContents, options.id, options.lang), imgFunc),
  gulp.parallel(watcher.createOne(options.id, options.lang))
)

export default gulp.series(
  // clean,
  gulp.parallel(
    cssSass, 
    ...heroContents.createMultiLangTasks(), 
    ...heroList.createMultiLangTasks() ,
    imgFunc
  ),
  copyIndexHtml,
  gulp.parallel(watcher.createFuncs())
)
 
export const build = gulp.series(
  // clean,
  gulp.parallel(
    cssSass, 
    ...heroContents.createMultiLangTasks(), 
    ...heroList.createMultiLangTasks() ,
    imgFunc
  ),
  copyIndexHtml
);
