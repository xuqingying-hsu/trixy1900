import Link from "next/link";
import { Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ReadingSelector } from "@/components/reading-selector";
import { formatChineseDate, todayKey } from "@/lib/dates";
import { getPublishedReading } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const today = todayKey();
  const reading = getPublishedReading(today);

  return (
    <>
      <SiteHeader />
      <main className="shell py-8 sm:py-12">
        <section className="mystic-hero mb-8 grid gap-4">
          <p className="text-sm font-bold text-[var(--jade)]">{formatChineseDate(today)}</p>
          <h1 className="dream-title max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
            {reading?.topic || "今日大众占卜准备中"}
          </h1>
          <p className="max-w-2xl text-base leading-8 text-[var(--muted)]">
            静下来选择最有感觉的一组。大众占卜以共鸣为准，请把它当作一面镜子，而不是替你做决定的答案。
          </p>
        </section>

        {reading ? (
          <ReadingSelector options={reading.options} />
        ) : (
          <section className="panel grid gap-4 p-6 sm:p-8">
            <Sparkles className="text-[var(--amber)]" size={28} />
            <h2 className="text-2xl font-black">今日内容还没有发布</h2>
            <p className="max-w-2xl leading-8 text-[var(--muted)]">
              占卜师正在抽牌和整理解析。你可以稍后回来，或者先查看历史内容。
            </p>
            <Link className="button w-fit" href="/archive">
              查看历史占卜
            </Link>
          </section>
        )}
      </main>
    </>
  );
}
