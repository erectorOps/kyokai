 // gulpプラグインの読み込み
import gulp from 'gulp';
import { cssSass } from './src/task/sass.mjs';
import { imgFunc } from './src/task/image.mjs';
import { jsFunc } from './src/task/js.mjs';
import { Watch } from './src/task/watch.mjs'
import { HeroList } from './src/task/heroList.mjs';
import { HeroContents } from './src/task/heroContents.mjs';
import { KFData } from './src/task/_kfdata.mjs';
//import { clean } from './src/task/clean.mjs'

const kf = new KFData();
const heroList = new HeroList(kf);
const heroContents = new HeroContents(kf);

export default gulp.series(
  // clean,
  gulp.parallel(cssSass, heroContents.createFuncs(), heroList.createFunc() ,imgFunc, jsFunc),
  gulp.parallel(new Watch(kf).createFuncs())
)
 
export const build = gulp.series(
  // clean,
  gulp.parallel(cssSass, heroContents.createFuncs(), heroList.createFunc() ,imgFunc, jsFunc),
);
