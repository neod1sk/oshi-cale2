import Link from "next/link";
import { HeaderNavLink } from "@/components/HeaderNavLink";
import { LanguageToggle } from "@/components/LanguageToggle";
import { t, type Lang } from "@/lib/i18n";

export function SiteHeader({ lang }: { lang: Lang }) {
  const copy = t(lang);

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-black/5 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-xl items-center justify-between px-5">
        <Link href={`/${lang}`} className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight text-zinc-950">
            {copy.siteName}
          </div>
          <div className="truncate text-[11px] text-zinc-500">{copy.subtitle}</div>
        </Link>

        <div className="flex items-center gap-2">
          <HeaderNavLink lang={lang} />
          <LanguageToggle lang={lang} />
        </div>
      </div>
    </header>
  );
}

