const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp');

let src = "./src/img/r";
let test = "./test/r/";
let files = fs.readdirSync(src);
files.forEach(function(file) {
    let fullPath = path.join(src, file);
    Jimp.read(fullPath)
    .then(image => {
        let w = image.bitmap.width;
        let h = image.bitmap.height;
        let span = 0;
        if (h < 216) {
            span = 216 - h;
        }
        if (span > 0) {
            let color = 0x00000000;
            new Jimp({width: w, height: h+span, color: color})
            .composite(image, 0, span)
            .write(path.join(test, file));
        }
    })
    .catch(err => { console.error(err); });
    Jimp.read(fullPath, function(err, image) {




    });
});