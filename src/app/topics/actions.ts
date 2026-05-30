"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createTopicRequest } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

export async function submitTopicRequestAction(formData: FormData) {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headerStore.get("x-real-ip")?.trim();
  const clientKey = forwardedFor || realIp || "unknown-client";
  const nickname = String(formData.get("nickname") || "").trim();
  const suggestion = String(formData.get("suggestion") || "").trim();
  const website = String(formData.get("website") || "").trim();

  if (website) {
    redirect("/topics?submitted=1");
  }

  if (!checkRateLimit(`topic:${clientKey}`, 5, 60 * 60 * 1000)) {
    redirect("/topics?error=rate");
  }

  if (suggestion.length < 4 || suggestion.length > 240) {
    redirect("/topics?error=length");
  }

  createTopicRequest({ nickname, suggestion });
  revalidatePath("/topics");
  revalidatePath("/admin");
  redirect("/topics?submitted=1");
}
