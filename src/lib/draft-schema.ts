import { z } from "zod";

export const readingDraftSchema = z.object({
  title: z.string().min(1),
  coreConclusion: z.string().min(1),
  cardLogic: z.string().min(1),
  love: z.string().min(1),
  career: z.string().min(1),
  advice: z.string().min(1),
  reminder: z.string().min(1),
  finalText: z.string().min(80)
});

export type ReadingDraft = z.infer<typeof readingDraftSchema>;

export const topicSuggestionSchema = z.object({
  topics: z.array(z.string().min(4)).min(5).max(10)
});

export type TopicSuggestionResult = z.infer<typeof topicSuggestionSchema>;

export const readingDraftJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "coreConclusion",
    "cardLogic",
    "love",
    "career",
    "advice",
    "reminder",
    "finalText"
  ],
  properties: {
    title: { type: "string" },
    coreConclusion: { type: "string" },
    cardLogic: { type: "string" },
    love: { type: "string" },
    career: { type: "string" },
    advice: { type: "string" },
    reminder: { type: "string" },
    finalText: { type: "string" }
  }
} as const;

export const topicSuggestionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["topics"],
  properties: {
    topics: {
      type: "array",
      minItems: 5,
      maxItems: 10,
      items: { type: "string" }
    }
  }
} as const;
