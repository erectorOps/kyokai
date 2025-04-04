import { XMLParser } from 'fast-xml-parser';
import { srcBase } from './_config.mjs';
import fs from 'fs';
import path from 'path';
const parser = new XMLParser({ignoreAttributes: false, numberParseOptions: { skipLike: /^[0-9]+/}});

export class KFData
{
  constructor() {
    const dirpath = srcBase + '/xml';
    const dir = fs.readdirSync(dirpath);
    for (const file of dir) {
      let fullpath = path.join(dirpath, file);
      this[file] = parser.parse(fs.readFileSync(fullpath, 'utf8'));
    }
  }
}