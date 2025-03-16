const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');

const test = require("browser-sync");

console.log(test);

const parser = new XMLParser({ignoreAttributes: false, numberParseOptions: { skipLike: /^[0-9]+/}});


let srcBase = './src';
let group = "2003";
let paramName = "hp";

let file = srcBase + '/xml/hero_gp';
const heroGpList = parser.parse(fs.readFileSync(file, 'utf8'), 'text/xml');
let arr = [];
arr.find

let a = heroGpList.root.hero_gp.filter(item => item['@_id'] === group && item['@_'+paramName]).reduce((p,c) => p + parseInt(c['@_'+paramName]), 0);

    // let a = select(`/root/hero_gp[@id="${group}" and @${paramName}]`, heroGpList).map(item => select(`number(@${paramName})`, item))
    //   .reduce((p, c) => p + c);

console.log(a);
