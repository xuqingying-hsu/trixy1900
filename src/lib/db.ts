import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { todayKey } from "@/lib/dates";
import { isPublishableOption, type LenormandCard } from "@/lib/lenormand";

export type ReadingStatus = "draft" | "published";

export type DailyReading = {
  date: string;
  topic: string;
  status: ReadingStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReadingOption = {
  id: number;
  reading_date: string;
  option_key: "A" | "B" | "C";
  option_title: string;
  cards_json: string;
  ai_draft_json: string | null;
  final_text: string;
  created_at: string;
  updated_at: string;
};

export type ReadingWithOptions = DailyReading & {
  options: ReadingOption[];
};

export type TopicSuggestion = {
  id: number;
  suggestion_date: string;
  suggestions_json: string;
  selected_topic: string | null;
  created_at: string;
};

export type KnowledgeEntry = {
  id: number;
  type: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type TopicRequest = {
  id: number;
  nickname: string;
  suggestion: string;
  created_at: string;
};

let db: DatabaseSync | null = null;

function dbPath() {
  const configuredPath = process.env.LENORMAND_DB_PATH;
  if (!configuredPath) {
    return join(/*turbopackIgnore: true*/ process.cwd(), "data", "lenormand.sqlite");
  }
  return isAbsolute(configuredPath)
    ? configuredPath
    : join(/*turbopackIgnore: true*/ process.cwd(), configuredPath);
}

export function getDb() {
  if (!db) {
    const path = dbPath();
    mkdirSync(dirname(path), { recursive: true });
    db = new DatabaseSync(path);
    db.exec("PRAGMA foreign_keys = ON;");
    migrate(db);
  }
  return db;
}

export function resetDbForTests() {
  if (db) {
    db.close();
    db = null;
  }
}

function migrate(database: DatabaseSync) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS daily_readings (
      date TEXT PRIMARY KEY,
      topic TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reading_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reading_date TEXT NOT NULL,
      option_key TEXT NOT NULL CHECK (option_key IN ('A', 'B', 'C')),
      option_title TEXT NOT NULL DEFAULT '',
      cards_json TEXT NOT NULL DEFAULT '[]',
      ai_draft_json TEXT,
      final_text TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(reading_date, option_key),
      FOREIGN KEY(reading_date) REFERENCES daily_readings(date) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS topic_suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      suggestion_date TEXT NOT NULL,
      suggestions_json TEXT NOT NULL,
      selected_topic TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS knowledge_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS topic_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT NOT NULL DEFAULT '匿名来访者',
      suggestion TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function row<T>(value: unknown) {
  return value as T | undefined;
}

function rows<T>(value: unknown[]) {
  return value as T[];
}

export function ensureReading(date = todayKey()): ReadingWithOptions {
  const database = getDb();
  database
    .prepare(
      "INSERT OR IGNORE INTO daily_readings (date, topic, status) VALUES (?, '', 'draft')"
    )
    .run(date);

  (["A", "B", "C"] as const).forEach((key) => {
    database
      .prepare(
        `INSERT OR IGNORE INTO reading_options
          (reading_date, option_key, option_title, cards_json, final_text)
          VALUES (?, ?, ?, '[]', '')`
      )
      .run(date, key, `${key} 组选项`);
  });

  const reading = getReading(date);
  if (!reading) {
    throw new Error("初始化每日占卜失败。");
  }
  return reading;
}

export function getReading(date: string) {
  const database = getDb();
  const reading = row<DailyReading>(
    database.prepare("SELECT * FROM daily_readings WHERE date = ?").get(date)
  );

  if (!reading) {
    return null;
  }

  const options = rows<ReadingOption>(
    database
      .prepare("SELECT * FROM reading_options WHERE reading_date = ? ORDER BY option_key")
      .all(date)
  );

  return { ...reading, options };
}

export function getPublishedReading(date = todayKey()) {
  const reading = getReading(date);
  if (!reading || reading.status !== "published") {
    return null;
  }
  return reading;
}

export function getPublishedArchive() {
  return rows<DailyReading>(
    getDb()
      .prepare(
        "SELECT * FROM daily_readings WHERE status = 'published' ORDER BY date DESC LIMIT 100"
      )
      .all()
  );
}

export function getLatestTopicSuggestion(date = todayKey()) {
  return row<TopicSuggestion>(
    getDb()
      .prepare(
        "SELECT * FROM topic_suggestions WHERE suggestion_date = ? ORDER BY id DESC LIMIT 1"
      )
      .get(date)
  );
}

export function saveTopicSuggestions(date: string, topics: string[]) {
  getDb()
    .prepare(
      "INSERT INTO topic_suggestions (suggestion_date, suggestions_json) VALUES (?, ?)"
    )
    .run(date, JSON.stringify(topics));
}

export function setReadingTopic(date: string, topic: string) {
  ensureReading(date);
  const database = getDb();
  database
    .prepare(
      "UPDATE daily_readings SET topic = ?, status = 'draft', published_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE date = ?"
    )
    .run(topic, date);
  database
    .prepare(
      "UPDATE topic_suggestions SET selected_topic = ? WHERE suggestion_date = ? AND id = (SELECT id FROM topic_suggestions WHERE suggestion_date = ? ORDER BY id DESC LIMIT 1)"
    )
    .run(topic, date, date);
}

export function updateReadingOption(params: {
  date: string;
  optionKey: "A" | "B" | "C";
  optionTitle: string;
  cards: LenormandCard[];
  finalText: string;
}) {
  ensureReading(params.date);
  getDb()
    .prepare(
      `UPDATE reading_options
        SET option_title = ?, cards_json = ?, final_text = ?, updated_at = CURRENT_TIMESTAMP
        WHERE reading_date = ? AND option_key = ?`
    )
    .run(
      params.optionTitle,
      JSON.stringify(params.cards),
      params.finalText,
      params.date,
      params.optionKey
    );
}

export function saveOptionDraft(params: {
  date: string;
  optionKey: "A" | "B" | "C";
  draftJson: string;
  finalText: string;
}) {
  getDb()
    .prepare(
      `UPDATE reading_options
        SET ai_draft_json = ?, final_text = ?, updated_at = CURRENT_TIMESTAMP
        WHERE reading_date = ? AND option_key = ?`
    )
    .run(params.draftJson, params.finalText, params.date, params.optionKey);
}

export function publishReading(date: string) {
  const reading = getReading(date);
  if (!reading) {
    throw new Error("找不到当天占卜。");
  }
  if (!reading.topic.trim()) {
    throw new Error("发布前需要先选择今日主题。");
  }
  const missing = reading.options.filter(
    (option) => !isPublishableOption(option.cards_json, option.final_text)
  );
  if (missing.length > 0) {
    throw new Error(`发布前请补齐 ${missing.map((option) => option.option_key).join("/")} 组牌面和解析。`);
  }

  getDb()
    .prepare(
      "UPDATE daily_readings SET status = 'published', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE date = ?"
    )
    .run(date);
}

export function unpublishReading(date: string) {
  getDb()
    .prepare(
      "UPDATE daily_readings SET status = 'draft', published_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE date = ?"
    )
    .run(date);
}

export function listKnowledgeEntries() {
  return rows<KnowledgeEntry>(
    getDb()
      .prepare("SELECT * FROM knowledge_entries ORDER BY updated_at DESC, id DESC")
      .all()
  );
}

export function createKnowledgeEntry(params: { type: string; title: string; body: string }) {
  getDb()
    .prepare("INSERT INTO knowledge_entries (type, title, body) VALUES (?, ?, ?)")
    .run(params.type, params.title, params.body);
}

export function deleteKnowledgeEntry(id: number) {
  getDb().prepare("DELETE FROM knowledge_entries WHERE id = ?").run(id);
}

export function createTopicRequest(params: { nickname: string; suggestion: string }) {
  const nickname = params.nickname.trim() || "匿名来访者";
  getDb()
    .prepare("INSERT INTO topic_requests (nickname, suggestion) VALUES (?, ?)")
    .run(nickname.slice(0, 24), params.suggestion.trim().slice(0, 240));
}

export function listTopicRequests(limit = 30) {
  return rows<TopicRequest>(
    getDb()
      .prepare("SELECT * FROM topic_requests ORDER BY created_at DESC, id DESC LIMIT ?")
      .all(limit)
  );
}
