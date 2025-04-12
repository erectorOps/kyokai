export const srcBase = './src'
export const distBase = './dist'
export const srcPath = {
    'scss': srcBase + '/scss/**/*.scss',
    'img': srcBase + '/img/**/*',
    'js': srcBase + '/js/**/*.js',
    'json': srcBase + '/**/*.json',
    'xml': srcBase + '/xml/*',
    'ejs': srcBase + '/**/*.ejs',
    'herolist': [
        srcBase + '/_inc/_order_by_range.ejs', 
        srcBase + '/_inc/_list.ejs', 
        srcBase + '/_inc/_head.ejs', 
        srcBase + '/index.ejs'
    ],
    'hero': [
        srcBase + '/hero/hero.ejs', 
        srcBase + '/_inc/_contents.ejs', 
        srcBase + '/_inc/_head.ejs'
    ],
    '_ejs': '!' + srcBase + '/_inc/**/*.ejs',
};

export const distPath = {
    'css': distBase + '/css',
    'img': distBase + '/img',
    'js': distBase + '/js',
    'hero': distBase + '/hero',
};