import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { listKnowledgeEntries } from "@/lib/db";

const knowledgeDir = join(process.cwd(), "docs", "knowledge");

export type MarkdownDoc = {
  file: string;
  title: string;
  body: string;
  headings: string[];
};

function readMarkdownDoc(dir: string, file: string): MarkdownDoc {
  const body = readFileSync(join(dir, file), "utf8");
  const headings = body
    .split("\n")
    .filter((line) => line.startsWith("#"))
    .map((line) => line.replace(/^#+\s*/, "").trim());
  return {
    file,
    title: headings[0] || file,
    body,
    headings
  };
}

export function readKnowledgeDocs() {
  return readdirSync(knowledgeDir)
    .filter((file) => file.endsWith(".md"))
    .sort()
    .map((file) => readMarkdownDoc(knowledgeDir, file));
}

export function buildKnowledgeContext() {
  const fileDocs = readKnowledgeDocs()
    .map((doc) => `# ${doc.title}\n\n${doc.body}`)
    .join("\n\n---\n\n");

  const dbDocs = listKnowledgeEntries()
    .map((entry) => `# ${entry.type}：${entry.title}\n\n${entry.body}`)
    .join("\n\n---\n\n");

  return [fileDocs, dbDocs].filter(Boolean).join("\n\n---\n\n").slice(0, 45000);
}
