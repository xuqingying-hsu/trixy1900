import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { formatChineseDate } from "@/lib/dates";
import { getPublishedArchive } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function ArchivePage() {
  const readings = getPublishedArchive();

  return (
    <>
      <SiteHeader />
      <main className="shell py-8 sm:py-12">
        <h1 className="mb-6 text-3xl font-black sm:text-4xl">历史大众占卜</h1>
        {readings.length === 0 ? (
          <div className="panel p-6 text-[var(--muted)]">还没有已发布的历史内容。</div>
        ) : (
          <div className="grid gap-3">
            {readings.map((reading) => (
              <Link
                href={`/archive/${reading.date}`}
                key={reading.date}
                className="panel flex items-center justify-between gap-4 p-5 transition hover:border-[var(--jade)]"
              >
                <span>
                  <span className="mb-1 block text-sm font-bold text-[var(--muted)]">
                    {formatChineseDate(reading.date)}
                  </span>
                  <span className="text-lg font-black">{reading.topic}</span>
                </span>
                <ChevronRight size={20} />
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
