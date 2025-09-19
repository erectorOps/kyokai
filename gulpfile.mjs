 // gulpプラグインの読み込み
import gulp from 'gulp';
import { cssSass } from './src/task/sass.mjs';
import { imgFunc } from './src/task/image.mjs';
import { jsFunc } from './src/task/js.mjs';
import { Watch } from './src/task/watch.mjs'
import { HeroList } from './src/task/heroList.mjs';
import { HeroContents } from './src/task/heroContents.mjs';
import { KFData } from './src/task/_kfdata.mjs';
import { PreSkillCategorize } from './src/task/preSkillCategorize.mjs';
//import { clean } from './src/task/clean.mjs'
import log from 'fancy-log';

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

export default gulp.series(
  // clean,
  gulp.parallel(cssSass, heroContents.createFuncs.bind(heroContents), heroList.createFunc() ,imgFunc, jsFunc),
  gulp.parallel(watcher.createFuncs())
)
 
export const build = gulp.series(
  // clean,
  gulp.parallel(cssSass, heroContents.createFuncs.bind(heroContents), heroList.createFunc() ,imgFunc, jsFunc),
);
