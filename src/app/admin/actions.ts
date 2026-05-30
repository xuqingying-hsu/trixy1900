"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminSession, destroyAdminSession, requireAdmin, verifyPassword } from "@/lib/auth";
import { buildKnowledgeContext } from "@/lib/content";
import { todayKey } from "@/lib/dates";
import {
  createKnowledgeEntry,
  deleteKnowledgeEntry,
  ensureReading,
  publishReading,
  saveOptionDraft,
  saveTopicSuggestions,
  setReadingTopic,
  unpublishReading,
  updateReadingOption
} from "@/lib/db";
import { generateReadingDraft, generateTopicSuggestions } from "@/lib/ai";
import { parseCardsInput } from "@/lib/lenormand";

function adminRedirect(path = "/admin", message?: string): never {
  if (!message) {
    redirect(path);
  }
  redirect(`${path}?message=${encodeURIComponent(message)}`);
}

function optionKeyFromForm(formData: FormData) {
  const value = String(formData.get("optionKey") || "");
  if (value !== "A" && value !== "B" && value !== "C") {
    throw new Error("无效的选项。");
  }
  return value;
}

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") || "");
  if (!(await verifyPassword(password))) {
    redirect("/admin/login?error=1");
  }
  await createAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}

export async function generateTopicsAction() {
  await requireAdmin();
  const date = todayKey();
  ensureReading(date);
  try {
    const topics = await generateTopicSuggestions();
    saveTopicSuggestions(date, topics);
    revalidatePath("/admin");
    adminRedirect("/admin", "已生成今日候选选题。");
  } catch (error) {
    adminRedirect("/admin", error instanceof Error ? error.message : "生成选题失败。");
  }
}

export async function selectTopicAction(formData: FormData) {
  await requireAdmin();
  const topic = String(formData.get("topic") || "").trim();
  if (!topic) {
    adminRedirect("/admin", "请选择一个主题。");
  }
  setReadingTopic(todayKey(), topic);
  revalidatePath("/admin");
  revalidatePath("/");
  adminRedirect("/admin", "今日主题已更新。");
}

export async function optionFormAction(formData: FormData) {
  await requireAdmin();
  const date = todayKey();
  const optionKey = optionKeyFromForm(formData);
  const intent = String(formData.get("intent") || "save");
  const optionTitle = String(formData.get("optionTitle") || `${optionKey} 组选项`).trim();
  const cardsInput = String(formData.get("cards") || "");
  const finalText = String(formData.get("finalText") || "");
  const parsed = parseCardsInput(cardsInput);

  if (!parsed.ok) {
    adminRedirect("/admin", parsed.errors.join("；"));
  }

  updateReadingOption({
    date,
    optionKey,
    optionTitle,
    cards: parsed.cards,
    finalText
  });

  if (intent === "generate") {
    const reading = ensureReading(date);
    if (!reading?.topic.trim()) {
      adminRedirect("/admin", "生成解析前需要先选择今日主题。");
    }
    try {
      const draft = await generateReadingDraft({
        topic: reading.topic,
        optionKey,
        optionTitle,
        cards: parsed.cards,
        knowledgeContext: buildKnowledgeContext()
      });
      saveOptionDraft({
        date,
        optionKey,
        draftJson: JSON.stringify(draft),
        finalText: draft.finalText
      });
      revalidatePath("/admin");
      adminRedirect("/admin", `${optionKey} 组解析草稿已生成。`);
    } catch (error) {
      adminRedirect("/admin", error instanceof Error ? error.message : "生成解析失败。");
    }
  }

  revalidatePath("/admin");
  revalidatePath("/");
  adminRedirect("/admin", `${optionKey} 组已保存。`);
}

export async function publishAction() {
  await requireAdmin();
  try {
    publishReading(todayKey());
    revalidatePath("/");
    revalidatePath("/archive");
    revalidatePath("/admin");
    adminRedirect("/admin", "今日大众占卜已发布。");
  } catch (error) {
    adminRedirect("/admin", error instanceof Error ? error.message : "发布失败。");
  }
}

export async function unpublishAction() {
  await requireAdmin();
  unpublishReading(todayKey());
  revalidatePath("/");
  revalidatePath("/archive");
  revalidatePath("/admin");
  adminRedirect("/admin", "已撤回今日内容。");
}

export async function createKnowledgeAction(formData: FormData) {
  await requireAdmin();
  const type = String(formData.get("type") || "牌义").trim();
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();

  if (!title || !body) {
    adminRedirect("/admin/knowledge", "标题和正文不能为空。");
  }

  createKnowledgeEntry({ type, title, body });
  revalidatePath("/admin/knowledge");
  adminRedirect("/admin/knowledge", "知识条目已保存。");
}

export async function deleteKnowledgeAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (Number.isFinite(id)) {
    deleteKnowledgeEntry(id);
  }
  revalidatePath("/admin/knowledge");
  adminRedirect("/admin/knowledge", "知识条目已删除。");
}
