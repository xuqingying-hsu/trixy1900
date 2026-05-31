import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReadingSelector } from "@/components/reading-selector";
import { SiteHeader } from "@/components/site-header";
import { getLegacyReading } from "@/lib/legacy-readings";

export default async function LegacyReadingPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const reading = getLegacyReading(slug);

  if (!reading) {
    notFound();
  }

  const options = reading.options.map((option) => ({
    reading_date: `legacy-${reading.slug}`,
    option_key: option.optionKey,
    option_title: option.title,
    cards_json: "[]",
    final_text: option.text,
    image_filename: null,
    image_src: option.imageSrc,
    image_alt: `${reading.title} ${option.title}指示物`
  }));

  return (
    <>
      <SiteHeader />
      <main className="shell py-8 sm:py-12">
        <section className="mb-8 grid gap-4">
          <p className="text-sm font-bold text-[var(--jade)]">往期旧稿存档</p>
          <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
            {reading.title}
          </h1>
          <Link className="button secondary w-fit" href="/archive">
            返回历史列表
          </Link>
        </section>

        <ReadingSelector options={options} />

        <section className="mt-10 grid gap-4">
          <h2 className="text-xl font-black">原始长图备份</h2>
          <article className="panel legacy-reading-panel p-3 sm:p-5">
            <Image
              className="legacy-reading-image"
              src={reading.imageSrc}
              alt={reading.title}
              width={reading.width}
              height={reading.height}
              sizes="(min-width: 768px) 720px, 100vw"
              priority
            />
          </article>
        </section>
      </main>
    </>
  );
}
