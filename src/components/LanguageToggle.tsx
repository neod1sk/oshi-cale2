"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Lang } from "@/lib/i18n";

function swapLang(pathname: string, nextLang: Lang): string {
  const replaced = pathname.replace(/^\/(ja|ko)(?=\/|$)/, `/${nextLang}`);
  // If the current route isn't under /ja or /ko yet, fall back to "/{lang}"
  if (replaced === pathname) return `/${nextLang}`;
  return replaced;
}

export function LanguageToggle({ lang }: { lang: Lang }) {
  const pathname = usePathname() ?? "/";
  const search = useSearchParams();

  const toJaBase = swapLang(pathname, "ja");
  const toKoBase = swapLang(pathname, "ko");
  const qs = search?.toString();
  const toJa = qs ? `${toJaBase}?${qs}` : toJaBase;
  const toKo = qs ? `${toKoBase}?${qs}` : toKoBase;

  return (
    <nav aria-label="Language" className="flex items-center gap-1">
      <Link
        href={toJa}
        className={[
          "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
          lang === "ja"
            ? "bg-zinc-900 text-white"
            : "text-zinc-700 hover:bg-zinc-900/5",
        ].join(" ")}
      >
        JA
      </Link>
      <Link
        href={toKo}
        className={[
          "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
          lang === "ko"
            ? "bg-zinc-900 text-white"
            : "text-zinc-700 hover:bg-zinc-900/5",
        ].join(" ")}
      >
        KO
      </Link>
    </nav>
  );
}

