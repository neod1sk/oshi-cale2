export const JST_TZ = "Asia/Tokyo" as const;

export type Ymd = { year: number; month: number; day: number };

const jstPartsDtf = new Intl.DateTimeFormat("en-CA", {
  timeZone: JST_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getTodayJst(date: Date = new Date()): Ymd {
  const parts = jstPartsDtf.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));
  return { year, month, day };
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function startOfDayJst({ year, month, day }: Ymd): Date {
  // JST has no DST; fixed offset is safe.
  return new Date(`${year}-${pad2(month)}-${pad2(day)}T00:00:00+09:00`);
}

export function isLeapYear(year: number): boolean {
  if (year % 400 === 0) return true;
  if (year % 100 === 0) return false;
  return year % 4 === 0;
}

export function parseMmdd(mmdd: string): { month: number; day: number } | null {
  const m = mmdd.match(/^(\d{2})-(\d{2})$/);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  return { month, day };
}

function dateFromYmdJst(year: number, month: number, day: number): Date | null {
  const d = new Date(`${year}-${pad2(month)}-${pad2(day)}T00:00:00+09:00`);
  // Validate (Date will normalize invalid dates)
  const y = d.getUTCFullYear(); // note: this is UTC year; not safe for check
  // Use ISO string in JST offset we created, but the Date object is UTC-based.
  // Instead validate by comparing expected month/day in the *constructed* string against what Date normalized.
  const check = new Date(`${year}-${pad2(month)}-${pad2(day)}T12:00:00+09:00`);
  const parts = jstPartsDtf.formatToParts(check);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  const cy = Number(get("year"));
  const cm = Number(get("month"));
  const cd = Number(get("day"));
  if (cy !== year || cm !== month || cd !== day) return null;
  void y;
  return d;
}

export function diffDaysToNextBirthday(
  birthdayMmdd: string,
  now: Date = new Date()
): number {
  const md = parseMmdd(birthdayMmdd);
  if (!md) return Number.NaN;

  const today = getTodayJst(now);
  const startToday = startOfDayJst(today);

  let candidate: Date | null = null;

  // Special-case Feb 29: jump to next leap year occurrence
  if (md.month === 2 && md.day === 29) {
    let y = today.year;
    while (true) {
      if (isLeapYear(y)) {
        const d = dateFromYmdJst(y, 2, 29);
        if (d && d.getTime() >= startToday.getTime()) {
          candidate = d;
          break;
        }
      }
      y += 1;
    }
  } else {
    candidate = dateFromYmdJst(today.year, md.month, md.day);
    if (!candidate) return Number.NaN;
    if (candidate.getTime() < startToday.getTime()) {
      candidate = dateFromYmdJst(today.year + 1, md.month, md.day);
    }
  }

  if (!candidate) return Number.NaN;
  const diffMs = candidate.getTime() - startToday.getTime();
  return Math.round(diffMs / 86400000);
}

export function sortByUpcoming<T extends { diffDays: number; birthday_mmdd?: string; slug?: string; id?: string }>(
  list: T[]
): T[] {
  return [...list].sort((a, b) => {
    if (a.diffDays !== b.diffDays) return a.diffDays - b.diffDays;
    const am = a.birthday_mmdd ?? "";
    const bm = b.birthday_mmdd ?? "";
    if (am !== bm) return am.localeCompare(bm);
    const as = a.slug ?? a.id ?? "";
    const bs = b.slug ?? b.id ?? "";
    return as.localeCompare(bs);
  });
}

