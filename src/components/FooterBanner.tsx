import { footerBannerConfig } from "@/lib/banner";
import { t, type Lang } from "@/lib/i18n";

export function FooterBanner({ lang }: { lang: Lang }) {
  // Guard: in case `lang` becomes undefined at runtime (e.g. during hot reload),
  // fall back to JA instead of throwing.
  const copy = t((lang ?? "ja") as Lang);
  return (
    <footer className="mt-10 pb-10">
      <div className="mx-auto w-full max-w-xl px-5">
        <div className="mb-3 text-center">
          <p className="text-sm font-semibold leading-6 text-zinc-800">
            {copy.footer.bannerLead}
          </p>
          <p className="mt-1 text-base font-black tracking-tight text-zinc-900">
            {copy.footer.bannerTitle}
          </p>
        </div>
        <a
          href={footerBannerConfig.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-2xl border border-black/5 bg-white/70 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur transition-[transform,box-shadow,opacity] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)] hover:opacity-95 active:translate-y-0 active:scale-[0.99]"
          aria-label={copy.footer.bannerLinkAria}
        >
          <img
            src={footerBannerConfig.imageUrl}
            alt={footerBannerConfig.alt}
            className="h-auto w-full object-contain"
            loading="lazy"
          />
        </a>
      </div>
    </footer>
  );
}

