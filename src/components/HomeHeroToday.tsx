import { t, type Lang } from "@/lib/i18n";
import { getIdolDisplayName, type Idol } from "@/lib/sheets";
import type { IdolWithDiff } from "@/lib/birthday-filters";
import { buildBirthdayXIntentUrl } from "@/lib/x-intent";

type BirthdayCard = {
  name: string;
  nameKo?: string;
  group?: string;
  dateLabel: string;
};

function mmddToLabel(mmdd: string): string {
  // "MM-DD" -> "MM/DD"
  const m = mmdd.match(/^(\d{2})-(\d{2})$/);
  if (!m) return mmdd;
  return `${m[1]}/${m[2]}`;
}

function IdolCard({
  lang,
  idol,
}: {
  lang: Lang;
  idol: IdolWithDiff;
}) {
  const copy = t(lang);
  const name = getIdolDisplayName(idol as Idol, lang);
  const href = buildBirthdayXIntentUrl({
    lang,
    idolName: name,
    xUrl: idol.x_url,
    sourceUrl: idol.source_url,
  });

  return (
    <li className="rounded-2xl border border-black/5 bg-white/70 p-4 shadow-[0_6px_18px_rgba(0,0,0,0.06)] backdrop-blur">
      <div className="flex items-start gap-4">
        <div className="grid size-11 place-items-center rounded-2xl bg-zinc-900/5 text-zinc-700">
          <span className="text-xs font-semibold tabular-nums">
            {mmddToLabel(idol.birthday_mmdd)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-zinc-950">
            {name}
          </p>
          <p className="truncate text-sm text-zinc-600">
            {idol.group_name ?? "—"}
          </p>
        </div>

        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-full bg-zinc-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800"
        >
          {copy.hero.celebrateOnX}
        </a>
      </div>
    </li>
  );
}

export function HomeHeroToday({
  lang,
  todayIdols,
  weekIdols,
  error,
}: {
  lang: Lang;
  todayIdols: IdolWithDiff[];
  weekIdols: IdolWithDiff[];
  error?: string | null;
}) {
  const copy = t(lang);
  return (
    <section className="mx-auto w-full max-w-xl px-5 py-10">
      <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(236,72,153,0.12),transparent_40%),radial-gradient(900px_circle_at_80%_20%,rgba(59,130,246,0.10),transparent_45%),radial-gradient(900px_circle_at_50%_90%,rgba(34,197,94,0.08),transparent_45%)]" />

        <div className="relative p-7">
          <header className="space-y-2">
            <p className="text-xs font-medium tracking-[0.18em] text-zinc-500">
              {copy.hero.eyebrow}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
              {copy.siteName}
            </h1>
            <p className="text-sm leading-6 text-zinc-600">
              {copy.subtitle}
            </p>
          </header>

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
                  <IdolCard key={idol.id} lang={lang} idol={idol} />
                ))}
              </ul>
            )}

            {/* 今週（diffDays<=6） */}
            {!error ? (
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    {copy.home.thisWeek}
                  </h3>
                  <span className="text-xs text-zinc-500">{weekIdols.length}件</span>
                </div>

                {weekIdols.length === 0 ? (
                  <p className="mt-3 text-sm text-zinc-600">{copy.home.empty}</p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm text-zinc-800">
                    {weekIdols.map((idol) => (
                      <li
                        key={idol.id}
                        className="flex items-center justify-between rounded-xl border border-black/5 bg-white/50 px-4 py-3"
                      >
                        <span className="min-w-0 truncate font-medium">
                          {getIdolDisplayName(idol as Idol, lang)}
                          {idol.group_name ? (
                            <span className="ml-2 text-zinc-500">
                              {idol.group_name}
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 tabular-nums text-zinc-500">
                          +{idol.diffDays}d
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

