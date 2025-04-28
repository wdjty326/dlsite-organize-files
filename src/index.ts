import path from 'path'
import { globSync } from 'glob'
import dotenv from 'dotenv'
import axios from 'axios'
import { load } from 'cheerio'
import translateJapaneseToKorean from './genai'

dotenv.config()

globSync(`${process.env.TARGET_PATH}/*`)
    .filter(pathStr => !pathStr.match(/\[.+\]\[RJ\d{1,}\](\[노\])?.+/g) && pathStr.match(/RJ\d{1,}/))
    .forEach(async (pathStr) => {

        const rjCode = pathStr.match(/(RJ\d{1,})/)![1]
        const resp = await axios.get(`https://www.dlsite.com/maniax/work/=/product_id/${rjCode}.html`)
        const $ = load(resp.data)
        const $template = $(`template[data-product-id=${rjCode}]`)

        const productName = $template.attr('data-product-name')
        const makerName = $template.attr('data-maker-name')

        if (!productName || !makerName) return

        // const translatedProductName = await translateJapaneseToKorean(productName)

        console.log(`[${makerName}][${rjCode}]${productName}`)


        // return {
        //     sourceCode: pathStr.match(/(RJ\d{1,})/)![1],
        //     sourceName: path.basename(pathStr),
        //     sourcePath: pathStr,
        //     distName: '',
        //     distPath: '',
        // }
    })