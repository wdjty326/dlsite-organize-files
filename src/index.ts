import fs from 'fs'
import path from 'path'
import { globSync } from 'glob'
import dotenv from 'dotenv'
import axios from 'axios'
import { load } from 'cheerio'
import translateJapaneseToKorean from './genai'
import { rename } from 'fs/promises'
import unzipFile from './unzip'
dotenv.config()

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const filesToProcess = globSync(`${process.env.TARGET_PATH}/*`)
    .filter(pathStr => !pathStr.match(/\[.+\]\[RJ\d{1,}\](\[노\])?.+/g) && pathStr.match(/RJ\d{1,}/));

(async () => {
    for (const pathStr of filesToProcess) {
        try {
            const extName = path.extname(pathStr)
            const rjCode = pathStr.match(/(RJ\d{1,})/)![1]
            const resp = await axios.get(`https://www.dlsite.com/maniax/work/=/product_id/${rjCode}.html`)
            const $ = load(resp.data)
            const $template = $(`template[data-product-id=${rjCode}]`)

            const productName = $template.attr('data-product-name')
            const makerName = $template.attr('data-maker-name')

            if (!productName || !makerName) {
                console.warn(`Skipping ${pathStr}: Could not extract product or maker name.`);
                continue;
            }

            // Check if productName contains Japanese characters (Hiragana, Katakana, Kanji)
            const japaneseRegex = /[぀-ゟ゠-ヿ一-龯]/;
            let finalProductName: string;
            if (japaneseRegex.test(productName)) {
                finalProductName = await translateJapaneseToKorean(productName);
            } else {
                finalProductName = productName;
            }

            // Sanitize the final product name for use in the file path
            const safeProductName = finalProductName
                .replace(/[\/\\:\*\?"<>\|]/g, '-') // Replace basic invalid characters
                .replace(/[：～]/g, '-'); // Replace additional problematic characters

            const newBaseName = `[${makerName}][${rjCode}]${safeProductName.replace(/\n|\r/g, '')}${extName !== '' ? extName : ''}`;
            const newPath = path.join(process.env.TARGET_PATH as string, newBaseName);

            console.log(`Renaming ${path.basename(pathStr)} to ${newBaseName}`);

            // Retry logic for rename operation
            let retries = 3;
            while (retries > 0) {
                try {
                    await rename(pathStr, newPath);
                    console.log(`Successfully renamed to ${newBaseName}`);

                    if (extName === '.zip') {
                        await unzipFile(newPath, path.dirname(newPath), 'smpeople')
                        fs.rmSync(newPath, { recursive: true, force: true })
                    }
                    
                    break;
                } catch (renameError: any) {
                    if (renameError.code === 'EBUSY' && retries > 1) {
                        console.warn(`Rename failed for ${pathStr} (EBUSY), retrying in 1 second... (${retries - 1} retries left)`);
                        await delay(1000);
                        retries--;
                    } else {
                        console.error(`Failed to rename ${pathStr} to ${newPath}:`, renameError);
                        throw renameError;
                    }
                }
            }
            if (retries === 0) {
                 console.error(`Failed to rename ${pathStr} after multiple retries due to EBUSY.`);
            }

        } catch (error) {
            console.error(`Error processing file ${pathStr}:`, error);
        }
    }
    console.log("Finished processing all files.");
})();