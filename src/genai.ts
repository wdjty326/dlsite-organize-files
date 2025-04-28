import dotenv from 'dotenv'
import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from '@google/genai'

dotenv.config()

const genai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
})

const translateJapaneseToKorean = async (text: string) => {
    const response = await genai.models.generateContent({
        model: process.env.GEMINI_MODEL as string,
        contents: [{
            role: 'user',
            parts: [{
                text: `Translate Japanese to Korean. Provide only the translated Korean text, without any additional explanation. Do not append a newline character (\\n) at the end of the result.`
            }]
        }, {
            role: 'user',
            parts: [{
                text: `${text}`
            }]
        }],
        config: {
            temperature: 1,
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
            ],
        }
    })
    return response.text || ''
}


export default translateJapaneseToKorean