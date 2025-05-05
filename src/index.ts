import fs from 'fs'
import path from 'path'
import { globSync } from 'glob'
import dotenv from 'dotenv'
import axios from 'axios'
import { load } from 'cheerio'
import translateJapaneseToKorean from './genai'
import { rename, rm, mkdir } from 'fs/promises'
import unzipFile from './unzip'
dotenv.config()

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const filesToProcess = globSync(`${process.env.TARGET_PATH}/*`)
    .filter(pathStr => pathStr.match(/\[.+\]\[RJ\d{1,}\].+/) || pathStr.match(/RJ\d{1,}/));

const destPath = path.join(process.env.TARGET_PATH as string, 'dist');
if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath, { recursive: true });
}


(async () => {
    for (const pathStr of filesToProcess) {
        try {
            const baseName = path.basename(pathStr)
            if (baseName.match(/\[.+\]\[RJ\d{1,}\].+/)) {
                const newPath = path.join(destPath,  path.basename(pathStr))
                await rename(pathStr, newPath);
                console.log(`Renamed ${pathStr} to ${newPath}`);

                const extname = path.extname(newPath)
                if (extname === '.zip') {
                    const newBaseName = baseName.substring(0, baseName.length - extname.length)
                    await mkdir(path.join(destPath, newBaseName), { recursive: true })
                    await unzipFile(newPath, path.join(destPath, newBaseName), 'smpeople')
                    console.log(`Unzipped ${newPath}`);
                }
                continue
            }
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
            const newPath = path.join(destPath, newBaseName);

            console.log(`Renaming ${path.basename(pathStr)} to ${newBaseName}`);

            // Retry logic for rename operation
            let retries = 3;
            while (retries > 0) {
                try {
                    await rename(pathStr, newPath);
                    console.log(`Successfully renamed to ${newBaseName}`);
                    if (extName === '.zip') {
                        const zipName = newBaseName.substring(0, newBaseName.length - extName.length)
                        await mkdir(path.join(destPath, zipName), { recursive: true })
                        await unzipFile(newPath, path.join(destPath, zipName), 'smpeople')
                        console.log(`Unzipped ${newPath}`);
                        // await rm(newPath, { recursive: true, force: true })
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