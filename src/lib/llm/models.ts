// file that contains the vercel ai sdk model definitions
import { createOpenAI } from '@ai-sdk/openai'

const akashApi = createOpenAI({
  apiKey: process.env.AKASH_CHATAPI_KEY,
  baseURL: 'https://api.akash.chat/v1',
})

export { akashApi }
