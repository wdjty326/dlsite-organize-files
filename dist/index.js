"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const glob_1 = require("glob");
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
dotenv_1.default.config();
(0, glob_1.globSync)(`${process.env.TARGET_PATH}/*`)
    .filter(pathStr => !pathStr.match(/\[.+\]\[RJ\d{1,}\](\[노\])?.+/g) && pathStr.match(/RJ\d{1,}/))
    .map((pathStr) => __awaiter(void 0, void 0, void 0, function* () {
    const rjCode = pathStr.match(/(RJ\d{1,})/)[1];
    const resp = yield axios_1.default.get(`https://www.dlsite.com/maniax/work/=/product_id/${rjCode}.html`);
    console.log(resp.data);
    const $ = cheerio_1.default.load(resp.data);
    console.log($('template'));
    return {
        sourceCode: pathStr.match(/(RJ\d{1,})/)[1],
        sourceName: path_1.default.basename(pathStr),
        sourcePath: pathStr,
        distName: '',
        distPath: '',
    };
}));
