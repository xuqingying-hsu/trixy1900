import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ensureReading,
  getReading,
  getPublishedReading,
  publishReading,
  resetDbForTests,
  setReadingOptionCount,
  setReadingTopic,
  unpublishReading,
  updateReadingOption,
  createTopicRequest,
  listTopicRequests
} from "@/lib/db";

let dir = "";

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "lenormand-test-"));
  process.env.LENORMAND_DB_PATH = join(dir, "test.sqlite");
  resetDbForTests();
});

afterEach(() => {
  resetDbForTests();
  rmSync(dir, { recursive: true, force: true });
});

describe("reading publication flow", () => {
  it("keeps drafts hidden until all options are complete and published", () => {
    const date = "2026-05-30";
    ensureReading(date);
    setReadingTopic(date, "这段关系接下来会如何发展？");

    expect(getPublishedReading(date)).toBeNull();
    expect(() => publishReading(date)).toThrow(/补齐/);

    (["A", "B", "C"] as const).forEach((optionKey) => {
      updateReadingOption({
        date,
        optionKey,
        optionTitle: `${optionKey} 组选项`,
        cards: ["骑士", "心", "戒指"],
        finalText: `${optionKey} 组完整解析。这里模拟一段已经编辑好的最终发布文案。`
      });
    });

    publishReading(date);
    expect(getPublishedReading(date)?.status).toBe("published");

    unpublishReading(date);
    expect(getPublishedReading(date)).toBeNull();
  });

  it("supports two to four public options per reading", () => {
    const date = "2026-05-31";
    ensureReading(date);

    expect(getReading(date)?.options.map((option) => option.option_key)).toEqual(["A", "B", "C"]);

    setReadingOptionCount(date, 2);
    expect(getReading(date)?.options.map((option) => option.option_key)).toEqual(["A", "B"]);

    setReadingOptionCount(date, 4);
    expect(getReading(date)?.options.map((option) => option.option_key)).toEqual([
      "A",
      "B",
      "C",
      "D"
    ]);
  });
});

describe("topic requests", () => {
  it("stores public topic suggestions for the admin board", () => {
    createTopicRequest({
      nickname: "小月",
      suggestion: "想看近期暧昧对象会不会主动联系。"
    });

    const requests = listTopicRequests();

    expect(requests).toHaveLength(1);
    expect(requests[0].nickname).toBe("小月");
    expect(requests[0].suggestion).toContain("暧昧对象");
  });
});
