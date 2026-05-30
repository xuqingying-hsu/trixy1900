import { LockKeyhole } from "lucide-react";
import { loginAction } from "@/app/admin/actions";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="shell grid min-h-screen place-items-center py-10">
      <form action={loginAction} className="panel grid w-full max-w-md gap-5 p-6 sm:p-8">
        <LockKeyhole size={32} className="text-[var(--jade)]" />
        <div>
          <h1 className="text-2xl font-black">进入占卜后台</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            后台用于生成选题、录入牌面、编辑解析和发布每日内容。
          </p>
        </div>
        {params.error ? (
          <p className="rounded-lg border border-[rgba(165,72,92,0.35)] bg-[rgba(165,72,92,0.08)] p-3 text-sm font-bold text-[var(--rose)]">
            密码不正确。
          </p>
        ) : null}
        <label>
          <span className="label">后台密码</span>
          <input className="field" type="password" name="password" autoComplete="current-password" />
        </label>
        <button className="button" type="submit">
          <LockKeyhole size={18} />
          登录
        </button>
      </form>
    </main>
  );
}
