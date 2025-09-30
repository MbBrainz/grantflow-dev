import { generateObject } from 'ai'
import { akashApi } from './models'
import type z from 'zod'

 
const generateObjectWithAkash = async <T>(prompt: string, schema: z.ZodSchema<T>): Promise<T> => {
  const result = await generateObject({
    model: akashApi('Meta-Llama-4-Maverick-17B-128E-Instruct-FP8'),
    prompt,
    schema,
    output: 'object',
  })
  return result.object
}

export { generateObjectWithAkash }
