"use client";

import { t, type Lang } from "@/lib/i18n";
import type { IdolWithDiff } from "@/lib/birthday-filters";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { IdolCard, splitGroupAliases } from "@/components/IdolCard";

function normalizeForToken(input: string): string {
  return input.normalize("NFKC").trim().toLowerCase();
}

export function HomeHeroToday({
  lang,
  allIdols,
  todayIdols,
  yesterdayIdols,
  next30Idols,
  error,
}: {
  lang: Lang;
  allIdols: IdolWithDiff[];
  todayIdols: IdolWithDiff[];
  yesterdayIdols: IdolWithDiff[];
  next30Idols: IdolWithDiff[];
  error?: string | null;
}) {
  const copy = t(lang);
  const [activeGroupToken, setActiveGroupToken] = useState<string | null>(null);
  const clearFilterLabel = lang === "ko" ? "× 해제" : "× 解除";
  const clearFilterAria = lang === "ko" ? "필터 해제" : "絞り込みを解除";

  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      const topLink = target.closest(
        'a[aria-label="トップページへ戻る"],a[aria-label="홈으로 이동"]'
      );
      if (!topLink) return;
      setActiveGroupToken(null);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const groupMembers = useMemo(() => {
    if (!activeGroupToken) return [];
    const key = normalizeForToken(activeGroupToken);
    return allIdols.filter((idol) =>
      splitGroupAliases(idol.group_name)
        .map(normalizeForToken)
        .includes(key)
    );
  }, [allIdols, activeGroupToken]);

  const hasMore = next30Idols.length > 10;
  return (
    <section className="mx-auto w-full max-w-xl px-5 py-10">
      {activeGroupToken ? (
        <div className="rounded-3xl border border-black/5 bg-white/60 p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">
              {lang === "ko" ? "그룹: " : "グループ："}
              <span className="font-semibold">{activeGroupToken}</span>
            </h2>
            <span className="text-xs text-zinc-500">{groupMembers.length}件</span>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-2xl border border-black/5 bg-white/60 px-3 py-2 text-xs text-zinc-700">
            <span className="min-w-0 truncate">
              {lang === "ko" ? "선택중: " : "選択中: "}
              <span className="font-semibold text-zinc-900">
                {activeGroupToken}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setActiveGroupToken(null)}
              className="shrink-0 rounded-full border border-black/10 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-white hover:text-zinc-900"
              aria-label={clearFilterAria}
            >
              {clearFilterLabel}
            </button>
          </div>

          {groupMembers.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-600">{copy.home.empty}</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {groupMembers.map((idol) => (
                <IdolCard
                  key={idol.id}
                  lang={lang}
                  idol={idol}
                  size="top"
                  onSelectGroupToken={setActiveGroupToken}
                  activeGroupToken={activeGroupToken}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {!activeGroupToken ? (
        <>
          <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(236,72,153,0.12),transparent_40%),radial-gradient(900px_circle_at_80%_20%,rgba(59,130,246,0.10),transparent_45%),radial-gradient(900px_circle_at_50%_90%,rgba(34,197,94,0.08),transparent_45%)]" />

            <div className="relative p-7">
              <header className="space-y-1">
                <p className="text-xs font-medium tracking-[0.18em] text-zinc-500">
                  {copy.hero.eyebrow}
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
                  {copy.siteName}
                </h1>
              </header>

              <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-black/20 to-transparent" />

              <div className="mt-7">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-zinc-900">
                    {copy.hero.todayBirthday}
                  </h2>
                  <span className="text-xs text-zinc-500">
                    {error ? "—" : `${todayIdols.length}件`}
                  </span>
                </div>

                {error ? (
                  <p className="mt-3 text-sm text-red-600">
                    {copy.home.error}: {error}
                  </p>
                ) : todayIdols.length === 0 ? (
                  <p className="mt-3 text-sm text-zinc-600">{copy.home.empty}</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {todayIdols.map((idol) => (
                      <IdolCard
                        key={idol.id}
                        lang={lang}
                        idol={idol}
                        size="top"
                        onSelectGroupToken={setActiveGroupToken}
                        activeGroupToken={activeGroupToken}
                      />
                    ))}
                  </ul>
                )}

                {/* 昨日 */}
                {!error ? (
                  <div className="mt-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-900">
                        {copy.home.yesterday}
                      </h3>
                      <span className="text-xs text-zinc-500">
                        {yesterdayIdols.length}件
                      </span>
                    </div>

                    {yesterdayIdols.length === 0 ? (
                      <p className="mt-3 text-sm text-zinc-600">
                        {copy.home.yesterdayEmpty}
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-3">
                        {yesterdayIdols.map((idol) => (
                          <IdolCard
                            key={idol.id}
                            lang={lang}
                            idol={idol}
                            size="top"
                            onSelectGroupToken={setActiveGroupToken}
                            activeGroupToken={activeGroupToken}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* 直近30日 */}
          {!error ? (
            <div className="mt-6 rounded-3xl border border-black/5 bg-white/60 p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900">
                  {copy.home.next30Days}
                </h3>
                <span className="text-xs text-zinc-500">
                  {next30Idols.length}件
                </span>
              </div>

              {next30Idols.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-600">
                  {copy.home.next30DaysEmpty}
                </p>
              ) : (
                <>
                  <ul className="mt-3 space-y-3">
                    {next30Idols.slice(0, 10).map((idol) => (
                      <IdolCard
                        key={idol.id}
                        lang={lang}
                        idol={idol}
                        size="top"
                        onSelectGroupToken={setActiveGroupToken}
                        activeGroupToken={activeGroupToken}
                      />
                    ))}
                  </ul>

                  {hasMore ? (
                    <div className="mt-4 flex justify-end">
                      <Link
                        href={`/${lang}/calendar`}
                        className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-white"
                      >
                        {copy.home.more}
                      </Link>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

