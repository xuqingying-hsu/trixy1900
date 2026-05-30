import { MessageSquareText, Send, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { listTopicRequests } from "@/lib/db";
import { submitTopicRequestAction } from "@/app/topics/actions";

export const dynamic = "force-dynamic";

export default async function TopicsPage({
  searchParams
}: {
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const params = await searchParams;
  const requests = listTopicRequests(18);

  return (
    <>
      <SiteHeader />
      <main className="shell py-8 sm:py-12">
        <section className="mystic-hero mb-8 grid gap-4">
          <p className="text-sm font-bold text-[var(--jade)]">选题采集</p>
          <h1 className="dream-title max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
            你想看什么主题的大众占卜？
          </h1>
          <p className="max-w-2xl text-base leading-8 text-[var(--muted)]">
            可以留下近期最想被回应的问题。它会进入后台选题池，后续可能被整理成每日大众占卜主题。
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <form action={submitTopicRequestAction} className="panel grid h-fit gap-4 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <MessageSquareText className="text-[var(--amber)]" size={26} />
              <h2 className="text-2xl font-black">留下你的选题</h2>
            </div>

            {params.submitted ? (
              <p className="rounded-lg border border-[rgba(112,214,197,0.3)] bg-[rgba(112,214,197,0.08)] p-3 text-sm font-bold text-[var(--jade)]">
                已收到你的选题建议，谢谢你把问题带来。
              </p>
            ) : null}

            {params.error === "length" ? (
              <p className="rounded-lg border border-[rgba(212,111,156,0.35)] bg-[rgba(212,111,156,0.08)] p-3 text-sm font-bold text-[var(--rose)]">
                选题建议需要 4-240 个字。
              </p>
            ) : null}

            {params.error === "rate" ? (
              <p className="rounded-lg border border-[rgba(212,111,156,0.35)] bg-[rgba(212,111,156,0.08)] p-3 text-sm font-bold text-[var(--rose)]">
                提交太频繁了，请稍后再试。
              </p>
            ) : null}

            <label>
              <span className="label">昵称，可不填</span>
              <input className="field" name="nickname" maxLength={24} placeholder="匿名来访者" />
            </label>

            <label>
              <span className="label">选题建议</span>
              <textarea
                className="field min-h-40"
                name="suggestion"
                maxLength={240}
                required
                placeholder="例如：想知道暧昧对象接下来会不会主动联系我？"
              />
            </label>

            <input className="hidden" name="website" tabIndex={-1} autoComplete="off" />

            <button className="button w-fit" type="submit">
              <Send size={18} />
              提交建议
            </button>
          </form>

          <section className="panel grid gap-4 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="text-[var(--amber)]" size={24} />
              <h2 className="text-2xl font-black">最近的愿望清单</h2>
            </div>
            {requests.length === 0 ? (
              <p className="leading-8 text-[var(--muted)]">还没有收到选题建议。你可以成为第一个留言的人。</p>
            ) : (
              <div className="grid gap-3">
                {requests.map((request) => (
                  <article
                    key={request.id}
                    className="rounded-lg border border-[var(--line)] bg-white/5 p-4"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-black text-[var(--amber)]">{request.nickname}</span>
                      <span className="text-[var(--muted)]">{request.created_at}</span>
                    </div>
                    <p className="leading-7 text-[var(--ink)]">{request.suggestion}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    </>
  );
}
