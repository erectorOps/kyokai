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
      const parsed = parser.parse(fs.readFileSync(fullpath, 'utf8'));

      const key = path.basename(file);

      const rootKeys = Object.keys(parsed.root || {});
      if (rootKeys.length === 1) {
        this[key] = parsed.root[rootKeys[0]];
      } else {
        this[key] = parsed.root || parsed;
      }
    }
  }
}