import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from '@google/genai'

const genai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY
})

const translateJapaneseToKorean = async (text: string) => {
    const response = await genai.models.generateContent({
        model: process.env.GEMINI_MODEL as string,
        contents: [{
            role: 'user',
            parts: [{
                text: `
                
                
                `
            }]
        }, {
            role: 'user',
            parts: [{
                text: `${text}`
            }]
        }],
        config: {
            // thinkingConfig: {
            //     thinkingBudget: 0, // 추론을 사용하지 않음
            // },
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