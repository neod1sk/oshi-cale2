import type { Idol } from "@/lib/sheets";
import { diffDaysToNextBirthday, sortByUpcoming } from "@/lib/birthday";

export type IdolWithDiff = Idol & { diffDays: number };

export function attachDiffDays(idols: Idol[], now: Date = new Date()): IdolWithDiff[] {
  return idols
    .map((idol) => ({
      ...idol,
      diffDays: diffDaysToNextBirthday(idol.birthday_mmdd, now),
    }))
    .filter((x) => Number.isFinite(x.diffDays) && x.diffDays >= 0);
}

export function sortBySoonest(list: IdolWithDiff[]): IdolWithDiff[] {
  return sortByUpcoming(list);
}

export function pickToday(list: IdolWithDiff[]): IdolWithDiff[] {
  return list.filter((x) => x.diffDays === 0);
}

export function pickThisWeek(list: IdolWithDiff[]): IdolWithDiff[] {
  // "今週": 今日を除いて、6日先まで
  return list.filter((x) => x.diffDays >= 1 && x.diffDays <= 6);
}

