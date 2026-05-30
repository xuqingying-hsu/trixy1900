"use client";

import { useMemo, useState } from "react";

type PublicOption = {
  option_key: "A" | "B" | "C";
  option_title: string;
  cards_json: string;
  final_text: string;
};

export function ReadingSelector({ options }: { options: PublicOption[] }) {
  const [selected, setSelected] = useState(options[0]?.option_key ?? "A");
  const current = useMemo(
    () => options.find((option) => option.option_key === selected) ?? options[0],
    [options, selected]
  );

  if (!current) {
    return null;
  }

  return (
    <section className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const active = option.option_key === selected;
          return (
            <button
              key={option.option_key}
              type="button"
              onClick={() => setSelected(option.option_key)}
              className={`panel option-card grid gap-3 p-4 text-left transition ${
                active ? "is-active ring-4 ring-[rgba(215,200,255,0.18)]" : ""
              }`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-2xl font-black">{option.option_key}</span>
                <span className="card-back h-14 w-10" aria-hidden="true" />
              </span>
              <span className="text-base font-black">{option.option_title}</span>
              <span className="text-sm text-[var(--muted)]">点击查看这组选项</span>
            </button>
          );
        })}
      </div>

      <article className="panel reading-panel p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[rgba(47,118,109,0.12)] px-3 py-1 text-sm font-black text-[var(--jade)]">
            {current.option_key} 组
          </span>
          <h2 className="text-xl font-black">{current.option_title}</h2>
        </div>
        <p className="reading-text text-[15px] sm:text-base">{current.final_text}</p>
      </article>
    </section>
  );
}
