import OpenAI from "openai";
import {
  readingDraftJsonSchema,
  readingDraftSchema,
  topicSuggestionJsonSchema,
  topicSuggestionSchema,
  type ReadingDraft
} from "@/lib/draft-schema";
import type { LenormandCard } from "@/lib/lenormand";

function client() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const model = () => process.env.OPENAI_MODEL || "gpt-5.4-mini";

function parseOutputText(response: unknown) {
  const outputText =
    typeof response === "object" && response && "output_text" in response
      ? (response.output_text as string | undefined)
      : undefined;

  if (!outputText) {
    throw new Error("AI 没有返回可解析文本。");
  }
  return outputText;
}

export async function generateTopicSuggestions() {
  const openai = client();
  if (!openai) {
    return [
      "接下来七天，你最需要看清的关系信号是什么？",
      "近期事业或学业里，哪个机会值得你认真抓住？",
      "你和心里那个人之间，正在发生什么隐性的变化？",
      "六月开启前，宇宙想提醒你调整哪一种内在模式？",
      "这段时间你的财务与资源流动，会出现怎样的转机？"
    ];
  }

  const response = await openai.responses.create({
    model: model(),
    input: [
      {
        role: "system",
        content:
          "你是中文大众占卜内容策划。请生成适合雷诺曼大众占卜的每日选题，题目要具体、有吸引力、不过度承诺。"
      },
      {
        role: "user",
        content:
          "生成 5-10 个中文大众占卜选题，覆盖情感、事业、人际、自我成长、财务或近期趋势。只返回结构化 JSON。"
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "topic_suggestions",
        strict: true,
        schema: topicSuggestionJsonSchema
      }
    }
  } as Parameters<typeof openai.responses.create>[0]);

  const parsed = topicSuggestionSchema.parse(JSON.parse(parseOutputText(response)));
  return parsed.topics;
}

export async function generateReadingDraft(params: {
  topic: string;
  optionKey: string;
  optionTitle: string;
  cards: LenormandCard[];
  knowledgeContext: string;
}): Promise<ReadingDraft> {
  const openai = client();
  if (!openai) {
    const cards = params.cards.join("、");
    return {
      title: `${params.optionKey} 组：${params.topic}`,
      coreConclusion: "这是一个本地占位草稿。填入 OPENAI_API_KEY 后，系统会根据你的知识库生成完整解析。",
      cardLogic: `本组选项牌面为：${cards}。请结合你的牌义体系补充牌与牌之间的主线、修饰和转折。`,
      love: "情感层面先保留为人工润色区。",
      career: "事业与资源层面先保留为人工润色区。",
      advice: "建议先把你的牌义、组合规则和风格样例补进 docs/knowledge 或后台知识库。",
      reminder: "发布前请务必改写为你的最终表达。",
      finalText: `【${params.optionTitle || params.optionKey + " 组选项"}】\n\n本组抽到的牌是：${cards}。\n\n当前还没有配置 OPENAI_API_KEY，所以这里先生成一版可编辑占位稿。请把你的雷诺曼牌义、组合判断、真实案例和写作风格逐步补入知识库；配置 API key 后，系统会根据这些资料输出约 600-900 字的正式大众占卜解析。\n\n这组牌的人工解读可以从三个方向展开：第一，先确认主题「${params.topic}」下最核心的状态；第二，判断牌与牌之间谁是主线、谁在修饰、谁带来阻力或转机；第三，把结论落回读者能执行的提醒，而不是停留在关键词拼接。\n\n发布前请在后台把这段文字改成你的最终文案。`
    };
  }

  const response = await openai.responses.create({
    model: model(),
    input: [
      {
        role: "system",
        content:
          "你是协助雷诺曼占卜师写大众占卜文案的中文编辑。必须优先依据用户提供的知识库、牌义体系、风格指南和案例；资料不足时要克制表达，不要编造占卜师没有提供的独家规则。"
      },
      {
        role: "user",
        content: [
          `今日主题：${params.topic}`,
          `选项：${params.optionKey} / ${params.optionTitle || params.optionKey + " 组选项"}`,
          `牌面：${params.cards.join("、")}`,
          "请生成一组 600-900 中文字左右的大众占卜解析。",
          "结构要包含：开场共鸣、牌面逻辑、当前状态、情感/事业或现实层面的提醒、行动建议和一句收束提醒。",
          "不要恐吓，不要绝对化承诺，不要给医疗、法律、投资等高风险建议。",
          "知识库如下：",
          params.knowledgeContext || "暂未提供个人知识库。"
        ].join("\n\n")
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "lenormand_reading_draft",
        strict: true,
        schema: readingDraftJsonSchema
      }
    }
  } as Parameters<typeof openai.responses.create>[0]);

  return readingDraftSchema.parse(JSON.parse(parseOutputText(response)));
}
