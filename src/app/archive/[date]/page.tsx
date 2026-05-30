import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ReadingSelector } from "@/components/reading-selector";
import { formatChineseDate } from "@/lib/dates";
import { getPublishedReading } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ArchiveDetailPage({
  params
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const reading = getPublishedReading(date);

  if (!reading) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="shell py-8 sm:py-12">
        <section className="mb-8 grid gap-4">
          <p className="text-sm font-bold text-[var(--jade)]">{formatChineseDate(reading.date)}</p>
          <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
            {reading.topic}
          </h1>
        </section>
        <ReadingSelector options={reading.options} />
      </main>
    </>
  );
}
