"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { IdolWithDiff } from "@/lib/birthday-filters";
import { getIdolDisplayName } from "@/lib/sheets";
import { parseMmdd } from "@/lib/birthday";
import { IdolCard } from "@/components/IdolCard";

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

type SearchType = "idol" | "group";

type SearchIndexItem = {
  id: string;
  type: SearchType;
  label: string;
  subtitle?: string;
  searchTexts: string[];
  idolId?: string;
  groupToken?: string;
};

type SelectedFilter =
  | { type: "idol"; idolId: string; label: string }
  | { type: "group"; groupToken: string; label: string };

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

function normalizeForSearch(input: string): string {
  const normalized = input
    .normalize("NFKC")
    .trim()
    .toLowerCase();
  return normalized.replace(/[\u30a1-\u30f6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

function splitGroupAliases(groupName?: string): string[] {
  const raw = (groupName ?? "").trim();
  if (!raw) return [];
  const parts = raw
    .split(/[\/／]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
}

function buildSearchIndex(list: IdolWithDiff[], lang: Lang): SearchIndexItem[] {
  const items: SearchIndexItem[] = [];
  const groupMap = new Map<
    string,
    { label: string; originals: Set<string>; idolCount: number }
  >();

  for (const idol of list) {
    const displayName = getIdolDisplayName(idol, lang);
    const names = [
      displayName,
      idol.name_ja ?? "",
      idol.name_ko ?? "",
      idol.slug ?? "",
    ].filter(Boolean);

    const groupFull = idol.group_name?.trim() ?? "";
    const groupTokens = splitGroupAliases(groupFull);
    const comboTexts = names.flatMap((n) =>
      [groupFull, ...groupTokens].filter(Boolean).map((g) => `${n} ${g}`)
    );

    items.push({
      id: `idol:${idol.id}`,
      type: "idol",
      label: displayName,
      subtitle: groupFull || "—",
      idolId: idol.id,
      searchTexts: [...names, groupFull, ...groupTokens, ...comboTexts]
        .filter(Boolean)
        .map(normalizeForSearch),
    });

    for (const token of groupTokens) {
      const key = normalizeForSearch(token);
      const existing = groupMap.get(key);
      if (existing) {
        existing.idolCount += 1;
        if (groupFull) existing.originals.add(groupFull);
      } else {
        groupMap.set(key, {
          label: token,
          originals: new Set(groupFull ? [groupFull] : []),
          idolCount: 1,
        });
      }
    }
  }

  for (const [tokenKey, group] of groupMap.entries()) {
    const originals = Array.from(group.originals);
    items.push({
      id: `group:${tokenKey}`,
      type: "group",
      label: group.label,
      subtitle: `${group.idolCount}`,
      groupToken: tokenKey,
      searchTexts: [group.label, ...originals].map(normalizeForSearch),
    });
  }

  return items;
}

function renderHighlighted(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  const end = idx + q.length;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-zinc-900/10 px-0.5 text-zinc-900">
        {text.slice(idx, end)}
      </mark>
      {text.slice(end)}
    </>
  );
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
  const [activeMonthAnchor, setActiveMonthAnchor] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1);
  const [selectedFilter, setSelectedFilter] = useState<SelectedFilter | null>(
    null
  );
  const monthNavRef = useRef<HTMLDivElement | null>(null);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

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

  const baseFiltered = useMemo(() => {
    if (!oshiOnly) return idols;
    return idols.filter((x) => oshiIds.has(x.id));
  }, [idols, oshiOnly, oshiIds]);

  const searchIndex = useMemo(
    () => buildSearchIndex(baseFiltered, lang),
    [baseFiltered, lang]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  const suggestions = useMemo(() => {
    if (!debouncedQuery) return [];
    const q = normalizeForSearch(debouncedQuery);
    const scored = searchIndex
      .map((item) => {
        let score = Number.POSITIVE_INFINITY;
        for (const text of item.searchTexts) {
          const at = text.indexOf(q);
          if (at === -1) continue;
          const s = at === 0 ? 0 : 1;
          if (s < score) score = s;
        }
        return { item, score };
      })
      .filter((x) => Number.isFinite(x.score))
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return a.item.label.localeCompare(b.item.label);
      })
      .slice(0, 10)
      .map((x) => x.item);
    return scored;
  }, [debouncedQuery, searchIndex]);

  useEffect(() => {
    if (!debouncedQuery) {
      setIsSuggestOpen(false);
      setActiveSuggestionIdx(-1);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    const onDown = (ev: MouseEvent) => {
      if (!searchWrapRef.current) return;
      if (searchWrapRef.current.contains(ev.target as Node)) return;
      setIsSuggestOpen(false);
      setActiveSuggestionIdx(-1);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const filtered = useMemo(() => {
    if (!selectedFilter) {
      const raw = query.trim();
      if (!raw) return baseFiltered;
      const q = normalizeForSearch(raw);
      return baseFiltered.filter((idol) => {
        const displayName = getIdolDisplayName(idol, lang);
        const names = [
          displayName,
          idol.name_ja ?? "",
          idol.name_ko ?? "",
          idol.slug ?? "",
        ];
        const groupFull = idol.group_name ?? "";
        const groupTokens = splitGroupAliases(groupFull);
        const joined = names.flatMap((n) =>
          [groupFull, ...groupTokens].filter(Boolean).map((g) => `${n} ${g}`)
        );
        const searchables = [...names, groupFull, ...groupTokens, ...joined]
          .filter(Boolean)
          .map(normalizeForSearch);
        return searchables.some((s) => s.includes(q));
      });
    }
    if (selectedFilter.type === "idol") {
      return baseFiltered.filter((x) => x.id === selectedFilter.idolId);
    }
    return baseFiltered.filter((x) =>
      splitGroupAliases(x.group_name)
        .map(normalizeForSearch)
        .includes(selectedFilter.groupToken)
    );
  }, [baseFiltered, selectedFilter]);

  const groups = useMemo(() => groupByUpcomingMonth(filtered), [filtered]);

  const monthAnchors = useMemo(
    () =>
      groups.map((g, idx) => ({
        month: g.month,
        anchorId: `month-${g.month}-${idx}`,
      })),
    [groups]
  );

  useEffect(() => {
    if (monthAnchors.length === 0) {
      setActiveMonthAnchor(null);
      return;
    }
    if (!activeMonthAnchor) {
      setActiveMonthAnchor(monthAnchors[0].anchorId);
      return;
    }
    if (!monthAnchors.some((x) => x.anchorId === activeMonthAnchor)) {
      setActiveMonthAnchor(monthAnchors[0].anchorId);
    }
  }, [monthAnchors, activeMonthAnchor]);

  const toggleOshi = (id: string) => {
    setOshiIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const jumpToMonth = (anchorId: string) => {
    setActiveMonthAnchor(anchorId);
    const el = document.getElementById(anchorId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const selectSuggestion = (item: SearchIndexItem) => {
    if (item.type === "idol" && item.idolId) {
      setSelectedFilter({ type: "idol", idolId: item.idolId, label: item.label });
      setQuery(item.label);
    } else if (item.type === "group" && item.groupToken) {
      setSelectedFilter({
        type: "group",
        groupToken: item.groupToken,
        label: item.label,
      });
      setQuery(item.label);
    }
    setIsSuggestOpen(false);
    setActiveSuggestionIdx(-1);
  };

  const selectGroupToken = (token: string) => {
    const normalized = normalizeForSearch(token);
    setSelectedFilter({ type: "group", groupToken: normalized, label: token });
    setQuery(token);
    setDebouncedQuery(token);
    setIsSuggestOpen(false);
    setActiveSuggestionIdx(-1);
  };

  const sectionStyle = {
    ["--month-nav-h" as never]: `${monthNavHeight}px`,
  } as React.CSSProperties;

  const searchPlaceholder =
    lang === "ko" ? "이름/그룹으로 검색" : "アイドル名・グループ名で検索";
  const searchNoResult =
    lang === "ko" ? "검색 결과가 없습니다" : "一致する候補がありません";
  const idolTypeLabel = lang === "ko" ? "아이돌" : "アイドル";
  const groupTypeLabel = lang === "ko" ? "그룹" : "グループ";
  const clearFilterLabel = lang === "ko" ? "× 해제" : "× 解除";
  const clearFilterAria = lang === "ko" ? "필터 해제" : "絞り込みを解除";

  return (
    <section
      className="mx-auto w-full max-w-xl px-5 pb-16"
      style={sectionStyle}
    >
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-zinc-950">
            {copy.calendar.title}
          </h1>
          <div ref={searchWrapRef} className="relative min-w-0 flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (selectedFilter) setSelectedFilter(null);
                setIsSuggestOpen(Boolean(e.target.value.trim()));
                setActiveSuggestionIdx(-1);
              }}
              onFocus={() => {
                if (query.trim()) setIsSuggestOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsSuggestOpen(false);
                  setActiveSuggestionIdx(-1);
                  return;
                }
                if (e.key === "ArrowDown") {
                  if (suggestions.length === 0) return;
                  e.preventDefault();
                  setIsSuggestOpen(true);
                  setActiveSuggestionIdx((prev) =>
                    prev < suggestions.length - 1 ? prev + 1 : 0
                  );
                  return;
                }
                if (e.key === "ArrowUp") {
                  if (suggestions.length === 0) return;
                  e.preventDefault();
                  setIsSuggestOpen(true);
                  setActiveSuggestionIdx((prev) =>
                    prev > 0 ? prev - 1 : suggestions.length - 1
                  );
                  return;
                }
                if (e.key === "Enter") {
                  if (!isSuggestOpen || suggestions.length === 0) return;
                  e.preventDefault();
                  const picked =
                    activeSuggestionIdx >= 0
                      ? suggestions[activeSuggestionIdx]
                      : suggestions[0];
                  if (picked) selectSuggestion(picked);
                }
              }}
              placeholder={searchPlaceholder}
              className="w-full rounded-full border border-black/10 bg-white/80 px-3 py-1.5 pr-16 text-xs text-zinc-800 shadow-sm outline-none transition-[background-color,box-shadow] placeholder:text-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-900/10"
            />
            {(query || selectedFilter) && selectedFilter?.type !== "group" && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setDebouncedQuery("");
                  setSelectedFilter(null);
                  setIsSuggestOpen(false);
                  setActiveSuggestionIdx(-1);
                }}
                aria-label={clearFilterAria}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[11px] font-medium text-zinc-500 transition-colors hover:text-zinc-900"
              >
                {clearFilterLabel}
              </button>
            )}

            {selectedFilter?.type === "group" ? (
              <div className="mt-2 flex items-center justify-between rounded-2xl border border-black/5 bg-white/60 px-3 py-2 text-xs text-zinc-700">
                <span className="min-w-0 truncate">
                  {lang === "ko" ? "선택중: " : "選択中: "}
                  <span className="font-semibold text-zinc-900">
                    {selectedFilter.label}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setDebouncedQuery("");
                    setSelectedFilter(null);
                    setIsSuggestOpen(false);
                    setActiveSuggestionIdx(-1);
                  }}
                  className="shrink-0 rounded-full border border-black/10 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-white hover:text-zinc-900"
                  aria-label={clearFilterAria}
                >
                  {clearFilterLabel}
                </button>
              </div>
            ) : null}

            {isSuggestOpen && (
              <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-black/10 bg-white/95 shadow-[0_12px_28px_rgba(0,0,0,0.10)] backdrop-blur-xl">
                {suggestions.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-zinc-500">
                    {searchNoResult}
                  </div>
                ) : (
                  <ul className="max-h-80 overflow-auto py-1">
                    {suggestions.map((item, idx) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onMouseDown={(ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            selectSuggestion(item);
                          }}
                          className={[
                            "flex w-full items-start justify-between gap-3 px-3 py-2 text-left transition-colors",
                            idx === activeSuggestionIdx
                              ? "bg-zinc-900/5"
                              : "hover:bg-zinc-900/5",
                          ].join(" ")}
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-zinc-900">
                              {renderHighlighted(item.label, debouncedQuery)}
                            </div>
                            <div className="truncate text-xs text-zinc-500">
                              {item.type === "idol"
                                ? `${idolTypeLabel} · ${item.subtitle ?? "—"}`
                                : `${groupTypeLabel} · ${item.subtitle ?? "0"}`}
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full border border-black/10 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                            {item.type === "idol" ? idolTypeLabel : groupTypeLabel}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
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
              {monthAnchors.map((item) => (
                <button
                  key={item.anchorId}
                  type="button"
                  onClick={() => jumpToMonth(item.anchorId)}
                  className={[
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                    activeMonthAnchor === item.anchorId
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-black/10 bg-zinc-50 text-zinc-700 hover:bg-white",
                  ].join(" ")}
                >
                  {monthLabel(lang, item.month)}
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
          {groups.map((g, idx) => {
            const anchorId = `month-${g.month}-${idx}`;
            return (
            <div
              key={anchorId}
              id={anchorId}
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
                  const xProfileHref = idol.x_url?.trim();
                  const isOshi = oshiIds.has(idol.id);

                  return (
                    <IdolCard
                      key={idol.id}
                      lang={lang}
                      idol={idol}
                      size="calendar"
                      onSelectGroupToken={selectGroupToken}
                      activeGroupToken={
                        selectedFilter?.type === "group" ? selectedFilter.label : null
                      }
                      favorite={{
                        isFavorite: isOshi,
                        onToggle: () => toggleOshi(idol.id),
                      }}
                      onCardClick={
                        xProfileHref
                          ? () =>
                              window.open(xProfileHref, "_blank", "noopener,noreferrer")
                          : undefined
                      }
                    />
                  );
                })}
              </ol>
            </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

