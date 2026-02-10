"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";

export function HeaderNavLink({ lang }: { lang: Lang }) {
  const copy = t(lang);
  const pathname = usePathname() ?? `/${lang}`;

  const calendarBase = `/${lang}/calendar`;
  const isCalendarPage = pathname === calendarBase || pathname.startsWith(`${calendarBase}/`);

  const href = isCalendarPage ? `/${lang}` : calendarBase;
  const label = isCalendarPage ? copy.headerNav.top : copy.calendar.title;

  return (
    <Link
      href={href}
      className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-semibold text-zinc-700 transition-[background-color,transform,box-shadow] hover:bg-white hover:shadow-sm active:scale-[0.98]"
    >
      {label}
    </Link>
  );
}

