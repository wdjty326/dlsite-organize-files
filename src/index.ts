import fs from 'fs'
import path from 'path'
import { globSync } from 'glob'
import dotenv from 'dotenv'
import axios from 'axios'
import cheerio from 'cheerio'
import iconvLite from 'iconv-lite'

dotenv.config()

globSync(`${process.env.TARGET_PATH}/*`)
    .filter(pathStr => !pathStr.match(/\[.+\]\[RJ\d{1,}\](\[노\])?.+/g) && pathStr.match(/RJ\d{1,}/))
    .map(async (pathStr) => {

        const rjCode = pathStr.match(/(RJ\d{1,})/)![1]
        const resp = await axios.get(`https://www.dlsite.com/maniax/work/=/product_id/${rjCode}.html`)
        console.log(resp.data)
        const $ = cheerio.load(resp.data)

        console.log($('template'))

        return {
            sourceCode: pathStr.match(/(RJ\d{1,})/)![1],
            sourceName: path.basename(pathStr),
            sourcePath: pathStr,
            distName: '',
            distPath: '',
        }
    })