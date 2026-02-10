import { HomeHeroToday } from "@/components/HomeHeroToday";
import { isLang, type Lang } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { fetchIdols, getIdolDisplayName } from "@/lib/sheets";
import { attachDiffDays, pickThisWeek, pickToday, sortBySoonest } from "@/lib/birthday-filters";
import { t } from "@/lib/i18n";

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
  // 要件: 今週（diffDays<=6）で抽出（今日を含む）
  let weekListAll: ReturnType<typeof pickToday> = [];

  try {
    const idols = await fetchIdols();
    const withDiff = sortBySoonest(attachDiffDays(idols));
    todayList = pickToday(withDiff);
    weekListAll = withDiff.filter((x) => x.diffDays <= 6);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  // 表示上は「今日」と「今週（今日以外）」で重複させない
  const weekUpcoming = weekListAll.filter((x) => x.diffDays >= 1);

  return (
    <main>
      <HomeHeroToday
        lang={lang}
        todayIdols={todayList}
        weekIdols={weekUpcoming}
        error={error}
      />
    </main>
  );
}

