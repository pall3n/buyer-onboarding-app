import { generateObject, zodSchema } from 'ai'
import type { ModelMessage } from 'ai'
import { EXTRACTION_SYSTEM_PROMPT, getExtractionModel } from '@/lib/ai/index'
import {
  ExtractedPreferencesSchema,
  upsertPreferences,
} from '@/features/preferences/index'

export async function extractAndPersist(
  modelMessages: ModelMessage[],
  assistantText: string,
  versionId: string
): Promise<void> {
  const extractionMessages: ModelMessage[] = [
    ...modelMessages,
    { role: 'assistant' as const, content: assistantText },
  ]

  const { object } = await generateObject({
    model: getExtractionModel(),
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: extractionMessages,
    schema: zodSchema(ExtractedPreferencesSchema),
  })

  await upsertPreferences(versionId, object)
}
