import { generateObject, generateText } from 'ai'
import { akashApi } from './models'
import z from 'zod'

const generateObjectWithAkash = async (prompt: string, schema: z.ZodSchema) => {
  const result = await generateObject({
    model: akashApi('Meta-Llama-4-Maverick-17B-128E-Instruct-FP8'),
    prompt: prompt,
    schema: schema,
    output: 'object',
  })
  return result.object
}

export { generateObjectWithAkash }
