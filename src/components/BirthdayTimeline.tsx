"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { IdolWithDiff } from "@/lib/birthday-filters";
import { getIdolDisplayName } from "@/lib/sheets";
import { buildBirthdayXIntentUrl } from "@/lib/x-intent";
import { parseMmdd } from "@/lib/birthday";

const LS_OSHI_ONLY = "oshi:calendar:oshiOnly";
const LS_OSHI_IDS = "oshicale:favorites";

function monthLabel(lang: Lang, month: number): string {
  if (lang === "ko") return `${month}월`;
  return `${month}月`;
}

function monthCountLabel(lang: Lang, n: number): string {
  if (lang === "ko") return `${n}명`;
  return `${n}人`;
}

function mmddLabel(mmdd: string): string {
  const m = mmdd.match(/^(\d{2})-(\d{2})$/);
  if (!m) return mmdd;
  return `${m[1]}/${m[2]}`;
}

function loadStringArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

function saveStringArray(key: string, value: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function loadBool(key: string, fallback: boolean) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === "1";
  } catch {
    return fallback;
  }
}

function saveBool(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    // ignore
  }
}

type MonthGroup = {
  month: number;
  idols: IdolWithDiff[];
};

function groupByUpcomingMonth(list: IdolWithDiff[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  let current: MonthGroup | null = null;

  for (const idol of list) {
    const md = parseMmdd(idol.birthday_mmdd);
    const month = md?.month;
    if (!month) continue;

    if (!current || current.month !== month) {
      current = { month, idols: [] };
      groups.push(current);
    }
    current.idols.push(idol);
  }

  return groups;
}

export function BirthdayTimeline({
  lang,
  idols,
}: {
  lang: Lang;
  idols: IdolWithDiff[];
}) {
  const copy = t(lang);

  const [oshiOnly, setOshiOnly] = useState(false);
  const [oshiIds, setOshiIds] = useState<Set<string>>(new Set());
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [monthNavHeight, setMonthNavHeight] = useState(0);
  const [useFixedMonthNav, setUseFixedMonthNav] = useState(false);
  const [activeMonth, setActiveMonth] = useState<number | null>(null);
  const monthNavRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOshiOnly(loadBool(LS_OSHI_ONLY, false));
    setOshiIds(new Set(loadStringArray(LS_OSHI_IDS)));
    setFavoritesLoaded(true);
  }, []);

  useEffect(() => {
    // Fallback: if sticky is not supported, use fixed mode.
    if (typeof CSS !== "undefined" && !CSS.supports("position", "sticky")) {
      setUseFixedMonthNav(true);
    }
  }, []);

  useEffect(() => {
    const el = monthNavRef.current;
    if (!el) return;

    const update = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      setMonthNavHeight((prev) => (prev === h ? prev : h));
    };

    update();

    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    saveBool(LS_OSHI_ONLY, oshiOnly);
  }, [oshiOnly]);

  useEffect(() => {
    if (!favoritesLoaded) return;
    saveStringArray(LS_OSHI_IDS, Array.from(oshiIds));
  }, [oshiIds, favoritesLoaded]);

  const filtered = useMemo(() => {
    if (!oshiOnly) return idols;
    return idols.filter((x) => oshiIds.has(x.id));
  }, [idols, oshiOnly, oshiIds]);

  const groups = useMemo(() => groupByUpcomingMonth(filtered), [filtered]);

  const months = useMemo(() => groups.map((g) => g.month), [groups]);

  useEffect(() => {
    if (activeMonth !== null) return;
    if (months.length === 0) return;
    setActiveMonth(months[0]);
  }, [months, activeMonth]);

  const toggleOshi = (id: string) => {
    setOshiIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const jumpToMonth = (month: number) => {
    setActiveMonth(month);
    const el = document.getElementById(`month-${month}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const sectionStyle = {
    ["--month-nav-h" as never]: `${monthNavHeight}px`,
  } as React.CSSProperties;

  return (
    <section
      className="mx-auto w-full max-w-xl px-5 pb-16"
      style={sectionStyle}
    >
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-zinc-950">
            {copy.calendar.title}
          </h1>
          <button
            type="button"
            onClick={() => setOshiOnly((v) => !v)}
            className={[
              "rounded-full border px-3 py-1 text-xs font-semibold transition-[background-color,transform,box-shadow] hover:shadow-sm active:scale-[0.98]",
              oshiOnly
                ? "border-black/10 bg-white/70 text-zinc-900 hover:bg-white"
                : "border-black/10 bg-white/70 text-zinc-700 hover:bg-white",
            ].join(" ")}
          >
            {oshiOnly ? copy.calendar.oshiOnly : copy.calendar.all}
          </button>
        </div>
      </div>

      {/* Month jump nav (sticky-first, fixed fallback) */}
      {useFixedMonthNav ? (
        <div style={{ height: monthNavHeight }} aria-hidden="true" />
      ) : null}

      <div
        ref={monthNavRef}
        className={[
          useFixedMonthNav
            ? "fixed left-0 right-0 z-40 border-b border-zinc-200/80 bg-gradient-to-b from-white/95 to-zinc-50/80 shadow-[0_6px_18px_rgba(0,0,0,0.06)] backdrop-blur-xl"
            : "sticky z-40 border-b border-zinc-200/80 bg-gradient-to-b from-white/95 to-zinc-50/80 shadow-[0_6px_18px_rgba(0,0,0,0.06)] backdrop-blur-xl",
          "top-[var(--site-header-h)]",
        ].join(" ")}
      >
        <div className="mx-auto w-full max-w-xl px-5 py-3">
          <div className="rounded-2xl border border-black/5 bg-white/60 p-3 backdrop-blur">
            <div className="text-[11px] font-medium text-zinc-500">
              {copy.calendar.monthJump}
            </div>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
              {months.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => jumpToMonth(m)}
                  className={[
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                    activeMonth === m
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-black/10 bg-zinc-50 text-zinc-700 hover:bg-white",
                  ].join(" ")}
                >
                  {monthLabel(lang, m)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {oshiOnly && oshiIds.size === 0 ? (
        <div className="mt-10 rounded-3xl border border-black/5 bg-white/60 p-6 text-center backdrop-blur">
          <div className="text-sm font-semibold text-zinc-900">
            {copy.calendar.noOshi}
          </div>
          <div className="mt-1 text-sm text-zinc-600">{copy.calendar.addOshi}</div>
        </div>
      ) : groups.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-600">{copy.home.empty}</p>
      ) : (
        <div className="mt-6 space-y-10">
          {groups.map((g) => (
            <div
              key={g.month}
              id={`month-${g.month}`}
              className="scroll-mt-[calc(var(--site-header-h)+var(--month-nav-h)+12px)]"
            >
              <div className="sticky top-[calc(var(--site-header-h)+var(--month-nav-h)+12px)] z-10 -mx-5 px-5">
                <div className="inline-flex items-center gap-2.5 rounded-full border border-black/10 bg-white/80 px-3.5 py-1.5 shadow-sm backdrop-blur">
                  <span className="text-sm font-extrabold tracking-tight text-zinc-900">
                    {monthLabel(lang, g.month)}
                  </span>
                  <span className="rounded-full border border-black/10 bg-zinc-900/5 px-2 py-0.5 text-xs font-bold tabular-nums text-zinc-700">
                    {monthCountLabel(lang, g.idols.length)}
                  </span>
                </div>
              </div>

              <ol className="mt-3 space-y-3">
                {g.idols.map((idol) => {
                  const name = getIdolDisplayName(idol, lang);
                  const xHref = buildBirthdayXIntentUrl({
                    lang,
                    idolName: name,
                    xUrl: idol.x_url,
                    sourceUrl: idol.source_url,
                  });
                  const xProfileHref = idol.x_url?.trim();
                  const isOshi = oshiIds.has(idol.id);

                  return (
                    <li
                      key={idol.id}
                      className={[
                        "rounded-3xl border border-black/5 bg-white/70 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur",
                        xProfileHref
                          ? "cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/85 hover:shadow-[0_14px_38px_rgba(0,0,0,0.10)] hover:border-pink-200/70 hover:ring-2 hover:ring-pink-300/35 active:translate-y-0 active:scale-[0.99]"
                          : "",
                      ].join(" ")}
                      onClick={() => {
                        if (!xProfileHref) return;
                        window.open(xProfileHref, "_blank", "noopener,noreferrer");
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-zinc-900/5 px-2 py-1 text-[11px] font-semibold tabular-nums text-zinc-700">
                              {mmddLabel(idol.birthday_mmdd)}
                            </span>
                            <span className="text-[11px] font-medium text-zinc-500 tabular-nums">
                              {idol.diffDays === 0 ? "today" : `+${idol.diffDays}d`}
                            </span>
                          </div>
                          <div className="mt-2 truncate text-base font-semibold text-zinc-950">
                            {name}
                          </div>
                          <div className="mt-0.5 truncate text-sm text-zinc-600">
                            {idol.group_name ?? "—"}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleOshi(idol.id);
                            }}
                            className={[
                              "grid size-9 place-items-center rounded-2xl border text-sm font-semibold transition-colors",
                              isOshi
                                ? "border-zinc-900 bg-zinc-900 text-white"
                                : "border-black/10 bg-white/70 text-zinc-700 hover:bg-white",
                            ].join(" ")}
                            aria-label={isOshi ? "unfavorite" : "favorite"}
                          >
                            ☆
                          </button>

                          <a
                            href={xHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-full bg-zinc-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800"
                          >
                            {copy.hero.celebrateOnX}
                          </a>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

