import path from 'path';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';

export const languages = ['ja', 'en'];
export const supportedLangs = [
    { code: 'ja', name: 'JA' },
    { code: 'en', name: 'EN' }
];

export class LangUtil {
    
    constructor(lang, filename) {
        this.lang = lang;
        this.filename = filename; // index.html, hero/2042.html
    }

    static getLocalePath(lang) {
        // process.cwd() はプロジェクトのルートディレクトリを指す
        return path.resolve(process.cwd(), 'src', 'locales', `${lang}.json`);
    }

    static getParserPath(lang) {
        return path.resolve(process.cwd(), 'src', 'locales', 'parser', `${lang}.json`);
    }

    static async loadT(lang) {
        try {
            const localeData = JSON.parse(await fs.readFile(LangUtil.getLocalePath(lang), 'utf8'));
            return (key) => localeData[key] || `[Missing Key: ${key}]`;
        } catch (error) {
            console.error(`Error loading locale data for language: ${lang}`, error);
            return (key) => `[Missing Key: ${key}]`;
        }
    }

    static loadTSync(lang) {
        try {
            const localeData = JSON.parse(fsSync.readFileSync(LangUtil.getLocalePath(lang), 'utf-8'));
            return (key) => localeData[key] || `[Missing Key: ${key}]`;
        } catch (error) {
            console.error(`Error loading locale data for language: ${lang}`, error);
            return (key) => `[Missing Key: ${key}]`;
        }
    }

    getCurrentPath() {
        return this.filename.replace('.html', `.${this.lang}.html`);
    }

    getSwitchLink(targetLang) {
        const currentFile = this.getCurrentPath();
        return currentFile.replace(`.${this.lang}.html`, `.${targetLang}.html`);
    }

}