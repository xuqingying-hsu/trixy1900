import Link from "next/link";
import { CalendarDays, LockKeyhole, MessageSquareText } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="mystic-header">
      <div className="shell flex min-h-16 items-center justify-between gap-4 py-3">
        <Link href="/" className="flex items-center gap-3 font-black">
          <span className="card-back grid h-10 w-8 place-items-center text-sm text-[var(--night)]">L</span>
          <span>阿彩的宇宙传讯站</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2 text-sm font-bold text-[var(--muted)]">
          <Link className="button secondary !min-h-9 !px-3 !py-2" href="/archive">
            <CalendarDays size={16} />
            历史
          </Link>
          <Link className="button secondary !min-h-9 !px-3 !py-2" href="/topics">
            <MessageSquareText size={16} />
            选题
          </Link>
          <Link className="button secondary !min-h-9 !px-3 !py-2" href="/admin">
            <LockKeyhole size={16} />
            后台
          </Link>
        </nav>
      </div>
    </header>
  );
}
