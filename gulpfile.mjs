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
  string: ['env', 'lang'],
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
