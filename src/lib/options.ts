export const OPTION_KEYS = ["A", "B", "C", "D"] as const;

export type OptionKey = (typeof OPTION_KEYS)[number];

export const DEFAULT_OPTION_COUNT = 3;
export const MIN_OPTION_COUNT = 2;
export const MAX_OPTION_COUNT = 4;

export function isOptionKey(value: string): value is OptionKey {
  return OPTION_KEYS.includes(value as OptionKey);
}

export function normalizeOptionCount(value: unknown) {
  const count = Number(value);
  if (Number.isInteger(count) && count >= MIN_OPTION_COUNT && count <= MAX_OPTION_COUNT) {
    return count;
  }
  return DEFAULT_OPTION_COUNT;
}

export function optionKeysForCount(count: unknown) {
  return OPTION_KEYS.slice(0, normalizeOptionCount(count));
}
