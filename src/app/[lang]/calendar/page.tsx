import { notFound } from "next/navigation";
import { BirthdayTimeline } from "@/components/BirthdayTimeline";
import { attachDiffDays } from "@/lib/birthday-filters";
import { sortByUpcoming } from "@/lib/birthday";
import { isLang, type Lang } from "@/lib/i18n";
import { fetchIdols } from "@/lib/sheets";
import { t } from "@/lib/i18n";

export default async function Calendar({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;
  if (!isLang(langParam)) notFound();
  const lang: Lang = langParam;
  const copy = t(lang);

  try {
    const idols = await fetchIdols();
    const withDiff = sortByUpcoming(attachDiffDays(idols));
    return (
      <main>
        <BirthdayTimeline lang={lang} idols={withDiff} />
      </main>
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-10">
        <h1 className="text-base font-semibold text-zinc-950">
          {copy.calendar.title}
        </h1>
        <p className="mt-3 text-sm text-red-600">
          {copy.home.error}: {msg}
        </p>
      </main>
    );
  }
}

