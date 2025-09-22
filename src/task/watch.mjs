 // gulpプラグインの読み込み
import gulp from 'gulp';
import browserSync from "browser-sync"; //変更を即座にブラウザへ反映

import { HeroContents } from './heroContents.mjs';
import { HeroList } from './heroList.mjs';
import { jsFunc } from './js.mjs';
import { imgFunc } from './image.mjs';
import { cssSass } from './sass.mjs';

import { srcBase, srcPath, distBase } from './_config.mjs';

/* リロード */
const browserSyncReload = (done) => {
    browserSync.reload();
    done();
}

const browserSyncOption = {
    server: distBase
  }
  

/* ローカルサーバー立ち上げ */
const browserSyncFunc = () => {
    browserSync.init(browserSyncOption);
}

const createWatchFiles = (kf) => {
    return () => {
        const heroContents = new HeroContents(kf);
        const heroList = new HeroList(kf);
        gulp.watch(srcPath.scss, gulp.series(cssSass))
        gulp.watch(srcPath.img, gulp.series(imgFunc, browserSyncReload))
        gulp.watch(srcPath.hero, gulp.series(gulp.parallel(heroContents.createFuncs.bind(heroContents)), browserSyncReload))
        gulp.watch(srcPath.herolist, gulp.series(heroList.createFunc(), browserSyncReload))
        gulp.watch(srcPath.js, gulp.series(jsFunc, browserSyncReload))
    }
}

const createWatchOne = (kf, id) => {
    return () => {
        const heroContents = new HeroContents(kf);
        const heroList = new HeroList(kf);
        gulp.watch(srcPath.scss, gulp.series(cssSass))
        gulp.watch(srcPath.img, gulp.series(imgFunc, browserSyncReload))
        gulp.watch(srcPath.hero, gulp.series(gulp.parallel(heroContents.createOne.bind(heroContents, id)), browserSyncReload));
        gulp.watch(srcPath.js, gulp.series(jsFunc, browserSyncReload))
    }
}

export class Watch {

    constructor(kf) {
        this.kf = kf;
    }

    createOne(id) {
        return [createWatchOne(this.kf, id), browserSyncFunc];
    }

    createFuncs() {
        return [createWatchFiles(this.kf), browserSyncFunc];
    }
}
