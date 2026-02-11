"use client";

import type { ReactNode } from "react";
import { t, type Lang } from "@/lib/i18n";
import { getIdolDisplayName, type Idol } from "@/lib/sheets";
import type { IdolWithDiff } from "@/lib/birthday-filters";
import { buildBirthdayXIntentUrl } from "@/lib/x-intent";
import { canPostBirthdayX } from "@/lib/birthday";

function mmddToLabel(mmdd: string): string {
  // "MM-DD" -> "MM/DD"
  const m = mmdd.match(/^(\d{2})-(\d{2})$/);
  if (!m) return mmdd;
  return `${m[1]}/${m[2]}`;
}

function normalizeForToken(input: string): string {
  return input.normalize("NFKC").trim().toLowerCase();
}

export function splitGroupAliases(groupName?: string): string[] {
  const raw = (groupName ?? "").trim();
  if (!raw) return [];
  const parts = raw
    .split(/[\/／]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
}

function formatRemainingDays(lang: Lang, diffDays: number): string {
  if (!Number.isFinite(diffDays)) return "";
  if (diffDays === 0) return lang === "ko" ? "오늘" : "今日";
  if (diffDays > 0) return lang === "ko" ? `+${diffDays}일` : `+${diffDays}日`;
  const ago = Math.abs(diffDays);
  if (ago === 1) return lang === "ko" ? "어제" : "昨日";
  return lang === "ko" ? `${ago}일 전` : `${ago}日前`;
}

export type IdolCardProps = {
  lang: Lang;
  idol: IdolWithDiff;
  size?: "top" | "calendar";

  // group filter
  onSelectGroupToken?: (token: string) => void;
  activeGroupToken?: string | null;

  // favorite
  favorite?: {
    isFavorite: boolean;
    onToggle: () => void;
  };

  // Card click (calendar: open profile)
  onCardClick?: () => void;

  // Extra actions at right (optional)
  extraRightActions?: ReactNode;
};

export function IdolCard({
  lang,
  idol,
  size = "top",
  onSelectGroupToken,
  activeGroupToken,
  favorite,
  onCardClick,
  extraRightActions,
}: IdolCardProps) {
  const copy = t(lang);
  const name = getIdolDisplayName(idol as Idol, lang);

  const profileXUrl = idol.x_url?.trim();
  const groupFull = idol.group_name?.trim() ?? "";
  const groupTokens = splitGroupAliases(groupFull);

  const xIntentHref = buildBirthdayXIntentUrl({
    lang,
    idolName: name,
    xUrl: idol.x_url,
    sourceUrl: idol.source_url,
  });

  const canPost = canPostBirthdayX(idol.birthday_mmdd);
  const diffLabel = formatRemainingDays(lang, idol.diffDays);

  const badgeClass =
    size === "calendar"
      ? "grid h-20 w-20 place-items-center rounded-2xl border border-black/10 bg-zinc-900/5 px-3 py-2 text-zinc-700 self-start"
      : "grid min-h-14 min-w-16 place-items-center rounded-2xl border border-black/10 bg-zinc-900/5 px-2.5 py-1.5 text-zinc-700";

  const containerClass =
    size === "calendar"
      ? "rounded-3xl border border-black/5 bg-white/70 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur"
      : "rounded-2xl border border-black/5 bg-white/70 p-4 shadow-[0_6px_18px_rgba(0,0,0,0.06)] backdrop-blur";

  return (
    <li className={containerClass}>
      <div className="flex items-start gap-4">
        <div className={badgeClass}>
          <div className="grid place-items-center gap-0.5">
            <span
              className={[
                "font-bold tabular-nums",
                size === "calendar" ? "text-base" : "text-sm",
              ].join(" ")}
            >
              {mmddToLabel(idol.birthday_mmdd)}
            </span>
            <span
              className={[
                "font-semibold text-zinc-600",
                size === "calendar" ? "text-sm" : "text-xs",
              ].join(" ")}
            >
              {diffLabel}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-[17px] font-semibold text-zinc-950">
              {name}
            </p>
          </div>

          {groupTokens.length === 0 ? (
            <p className="mt-0.5 truncate text-sm text-zinc-600">
              {groupFull || "—"}
            </p>
          ) : (
            <div className="mt-0.5 flex flex-wrap items-center gap-1 text-sm text-zinc-600">
              {groupTokens.map((token, idx) => {
                const isActive =
                  activeGroupToken &&
                  normalizeForToken(token) === normalizeForToken(activeGroupToken);
                return (
                  <span key={`${token}-${idx}`} className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectGroupToken?.(token);
                      }}
                      aria-label={`${token}で絞り込み`}
                      className={[
                        "truncate rounded-md px-1 py-0.5 text-sm transition-colors",
                        "hover:bg-zinc-900/5 hover:text-zinc-900",
                        isActive ? "bg-zinc-900/5 text-zinc-900" : "",
                      ].join(" ")}
                    >
                      {token}
                    </button>
                    {idx < groupTokens.length - 1 ? (
                      <span className="text-zinc-400">／</span>
                    ) : null}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {extraRightActions}

          {favorite ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                favorite.onToggle();
              }}
              className={[
                "grid size-9 place-items-center rounded-2xl border text-sm font-semibold transition-[background-color,transform,box-shadow,color] hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:scale-[0.98]",
                favorite.isFavorite
                  ? "border-zinc-900 bg-zinc-900 text-amber-400"
                  : "border-black/10 bg-white/70 text-zinc-700 hover:bg-white",
              ].join(" ")}
              aria-label={favorite.isFavorite ? "unfavorite" : "favorite"}
            >
              {favorite.isFavorite ? "★" : "☆"}
            </button>
          ) : null}

          <div className="flex items-center gap-2">
            {profileXUrl ? (
              <a
                href={profileXUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${name}のXアカウントを開く`}
                onClick={(e) => e.stopPropagation()}
                className="grid size-7 shrink-0 place-items-center rounded-full border border-black/10 bg-white text-[13px] font-black text-zinc-900 shadow-sm transition-[transform,box-shadow,background-color] hover:bg-zinc-50 hover:shadow-md hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 drop-shadow-sm"
              >
                X
              </a>
            ) : null}

            {canPost ? (
              <a
                href={xIntentHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={copy.hero.celebrateOnXAria}
                onClick={(e) => e.stopPropagation()}
                className="whitespace-nowrap rounded-full bg-zinc-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800"
              >
                {copy.hero.celebrateOnX}
              </a>
            ) : (
              <span
                aria-disabled="true"
                aria-label={copy.hero.celebrateOnXAria}
                className="cursor-not-allowed whitespace-nowrap rounded-full bg-zinc-900/35 px-3 py-2 text-xs font-semibold text-white/80 shadow-sm"
              >
                {copy.hero.celebrateOnX}
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

