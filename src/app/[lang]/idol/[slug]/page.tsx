import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { isLang, t, type Lang } from "@/lib/i18n";
import { fetchIdols, getIdolDisplayName } from "@/lib/sheets";
import { buildDetailHbdXIntentUrl } from "@/lib/x-intent";

function mmddToLabel(mmdd: string): string {
  const m = mmdd.match(/^(\d{2})-(\d{2})$/);
  if (!m) return mmdd;
  return `${m[1]}/${m[2]}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang: langParam, slug } = await params;
  if (!isLang(langParam)) return {};
  const lang: Lang = langParam;
  const copy = t(lang);

  try {
    const idols = await fetchIdols();
    const idol = idols.find((x) => x.slug === slug);
    if (!idol) return { title: `${copy.siteName}` };
    const name = getIdolDisplayName(idol, lang);
    return { title: `${name} | ${copy.siteName}` };
  } catch {
    return { title: `${copy.siteName}` };
  }
}

export default async function IdolDetail({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: langParam, slug } = await params;
  if (!isLang(langParam)) notFound();
  const lang: Lang = langParam;
  const copy = t(lang);

  const idols = await fetchIdols();
  const idol = idols.find((x) => x.slug === slug);
  if (!idol) notFound();

  const displayName = getIdolDisplayName(idol, lang);
  const birthdayLabel = mmddToLabel(idol.birthday_mmdd);

  const xIntentHref = buildDetailHbdXIntentUrl({
    lang,
    idolName: displayName,
    xUrl: idol.x_url,
    sourceUrl: idol.source_url,
  });

  const xProfileHref = idol.x_url?.trim() || null;
  const sourceHref = idol.source_url?.trim() || null;

  return (
    <main className="min-h-dvh bg-gradient-to-b from-white to-zinc-50 px-5 py-8">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-4">
          <Link
            href={`/${lang}`}
            className="text-sm font-semibold text-zinc-700 hover:text-zinc-950"
          >
            ← {copy.siteName}
          </Link>
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-black/5 bg-white/60 shadow-[0_10px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_circle_at_15%_10%,rgba(236,72,153,0.10),transparent_40%),radial-gradient(900px_circle_at_80%_15%,rgba(59,130,246,0.08),transparent_45%),radial-gradient(900px_circle_at_50%_95%,rgba(34,197,94,0.06),transparent_45%)]" />

          <div className="relative p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-[0.18em] text-zinc-500">
                  {copy.hero.eyebrow}
                </p>
                <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight text-zinc-950">
                  {displayName}
                </h1>
                {idol.group_name ? (
                  <p className="mt-1 truncate text-sm text-zinc-600">
                    {idol.group_name}
                  </p>
                ) : null}
              </div>

              <div className="shrink-0 rounded-2xl border border-black/5 bg-white/70 px-4 py-3 text-center backdrop-blur">
                <div className="text-[11px] font-medium text-zinc-500">
                  {lang === "ko" ? "생일" : "誕生日"}
                </div>
                <div className="mt-1 text-sm font-semibold tabular-nums text-zinc-900">
                  {birthdayLabel}
                </div>
              </div>
            </div>

            <div className="mt-7 grid gap-3">
              <a
                href={xIntentHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800"
              >
                {copy.hero.celebrateOnX}
              </a>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href={xProfileHref ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-disabled={!xProfileHref}
                  className={[
                    "flex items-center justify-center rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-semibold text-zinc-800 backdrop-blur transition-colors hover:bg-white",
                    !xProfileHref ? "pointer-events-none opacity-50" : "",
                  ].join(" ")}
                >
                  {lang === "ko" ? "공식 X" : "公式X"}
                </a>

                <a
                  href={sourceHref ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-disabled={!sourceHref}
                  className={[
                    "flex items-center justify-center rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-semibold text-zinc-800 backdrop-blur transition-colors hover:bg-white",
                    !sourceHref ? "pointer-events-none opacity-50" : "",
                  ].join(" ")}
                >
                  {lang === "ko" ? "출처" : "出典"}
                </a>
              </div>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                {lang === "ko"
                  ? "표기/본문은 시트의 값을 그대로 사용합니다."
                  : "表記/本文はシートの値をそのまま使用します。"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

