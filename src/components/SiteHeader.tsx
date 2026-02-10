import Link from "next/link";
import { LanguageToggle } from "@/components/LanguageToggle";
import { t, type Lang } from "@/lib/i18n";

export function SiteHeader({ lang }: { lang: Lang }) {
  const copy = t(lang);

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-xl items-center justify-between px-5 py-3">
        <Link href={`/${lang}`} className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight text-zinc-950">
            {copy.siteName}
          </div>
          <div className="truncate text-[11px] text-zinc-500">{copy.subtitle}</div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/${lang}/calendar`}
            className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-semibold text-zinc-700 transition-colors hover:bg-white"
          >
            {copy.calendar.title}
          </Link>
          <LanguageToggle lang={lang} />
        </div>
      </div>
    </header>
  );
}

