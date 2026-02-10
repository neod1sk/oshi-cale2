import { HomeHeroToday } from "@/components/HomeHeroToday";
import { isLang, type Lang } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { fetchIdols } from "@/lib/sheets";
import { attachDiffDays, pickToday, sortBySoonest, type IdolWithDiff } from "@/lib/birthday-filters";
import { t } from "@/lib/i18n";
import { getTodayJst, startOfDayJst } from "@/lib/birthday";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;
  if (!isLang(langParam)) notFound();
  const lang: Lang = langParam;

  let error: string | null = null;
  let todayList: ReturnType<typeof pickToday> = [];
  let yesterdayList: IdolWithDiff[] = [];
  let next30ListAll: ReturnType<typeof pickToday> = [];

  try {
    const idols = await fetchIdols();
    // Optional: テスト用に日付を固定（JST基準）
    // 例: DEBUG_TODAY_JST=2026-02-10
    const debug = process.env.DEBUG_TODAY_JST;
    const now = debug ? new Date(`${debug}T00:00:00+09:00`) : new Date();

    const withDiff = sortBySoonest(attachDiffDays(idols, now));
    todayList = pickToday(withDiff);
    next30ListAll = withDiff.filter((x) => x.diffDays <= 30);

    // JST基準で「昨日」が誕生日のアイドル
    const startToday = startOfDayJst(getTodayJst(now));
    const yesterdayDate = new Date(startToday.getTime() - 86400000);
    const y = getTodayJst(yesterdayDate);
    const yesterdayMmdd = `${pad2(y.month)}-${pad2(y.day)}`;

    yesterdayList = idols
      .filter((idol) => idol.birthday_mmdd === yesterdayMmdd)
      .map((idol) => ({ ...idol, diffDays: -1 }))
      .sort((a, b) => {
        const ak = (a.slug ?? a.id ?? "").toString();
        const bk = (b.slug ?? b.id ?? "").toString();
        return ak.localeCompare(bk);
      });
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const next30 = next30ListAll;

  return (
    <main>
      <HomeHeroToday
        lang={lang}
        todayIdols={todayList}
        yesterdayIdols={yesterdayList}
        next30Idols={next30}
        error={error}
      />
    </main>
  );
}

