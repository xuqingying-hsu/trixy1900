export const LENORMAND_CARDS = [
  "骑士",
  "四叶草",
  "船",
  "房子",
  "树",
  "云",
  "蛇",
  "棺材",
  "花束",
  "镰刀",
  "鞭子",
  "鸟",
  "孩子",
  "狐狸",
  "熊",
  "星星",
  "鹳",
  "狗",
  "塔",
  "花园",
  "山",
  "十字路口",
  "老鼠",
  "心",
  "戒指",
  "书",
  "信",
  "男士",
  "女士",
  "百合",
  "太阳",
  "月亮",
  "钥匙",
  "鱼",
  "锚",
  "十字架"
] as const;

export type LenormandCard = (typeof LENORMAND_CARDS)[number];

const cardLookup = new Map<string, LenormandCard>();

LENORMAND_CARDS.forEach((card, index) => {
  const number = String(index + 1).padStart(2, "0");
  const simpleNumber = String(index + 1);
  [
    card,
    `${number}${card}`,
    `${simpleNumber}${card}`,
    `${number} ${card}`,
    `${simpleNumber} ${card}`,
    `${number}.${card}`,
    `${simpleNumber}.${card}`,
    `${number}、${card}`,
    `${simpleNumber}、${card}`
  ].forEach((alias) => cardLookup.set(normalizeToken(alias), card));
});

export function normalizeToken(value: string) {
  return value.trim().replace(/\s+/g, "").replace(/[.。]/g, ".");
}

export function normalizeCardName(value: string): LenormandCard | null {
  return cardLookup.get(normalizeToken(value)) ?? null;
}

export type CardParseResult =
  | { ok: true; cards: LenormandCard[] }
  | { ok: false; errors: string[] };

export function parseCardsInput(input: string): CardParseResult {
  const tokens = input
    .split(/[\n,，、;；]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length < 1 || tokens.length > 9) {
    return { ok: false, errors: ["每组选项需要录入 1-9 张雷诺曼牌。"] };
  }

  const errors: string[] = [];
  const cards = tokens.flatMap((token) => {
    const card = normalizeCardName(token);
    if (!card) {
      errors.push(`无法识别牌名：${token}`);
      return [];
    }
    return [card];
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, cards };
}

export function isPublishableOption(cardsJson: string, finalText: string) {
  try {
    const cards = JSON.parse(cardsJson) as unknown;
    return Array.isArray(cards) && cards.length >= 1 && cards.length <= 9 && finalText.trim().length > 0;
  } catch {
    return false;
  }
}
