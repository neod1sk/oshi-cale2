import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

function stripForHashtag(name: string): string {
  // Hashtags: remove spaces/symbols, keep letters/numbers (including JP/KR), allow underscore.
  // Note: X allows non-ASCII hashtags; this preserves them while removing punctuation.
  return name
    .normalize("NFKC")
    .replace(/[#＃]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^\p{L}\p{N}_]+/gu, "")
    .trim();
}

export function buildXIntentUrl(opts: {
  text: string;
  hashtags?: string[];
  url?: string;
}): string {
  const url = new URL("https://x.com/intent/tweet");
  url.searchParams.set("text", opts.text);
  if (opts.hashtags?.length) url.searchParams.set("hashtags", opts.hashtags.join(","));
  if (opts.url) url.searchParams.set("url", opts.url);
  return url.toString();
}

export function buildBirthdayXIntentUrl(opts: {
  lang: Lang;
  idolName: string;
  xUrl?: string;
  sourceUrl?: string;
}): string {
  const tagName = stripForHashtag(opts.idolName);
  const hashtags = ["UndergroundIdolBD", `HBD_${tagName}`];
  const copy = t(opts.lang);
  const text = copy.hero.tweetTemplate.replace("{NAME}", opts.idolName);

  // Optional: add a link for context (prefer source_url, else x_url)
  const link = opts.sourceUrl?.trim() || opts.xUrl?.trim();
  return buildXIntentUrl({ text, hashtags, url: link });
}

export function buildDetailHbdXIntentUrl(opts: {
  lang: Lang;
  idolName: string;
  xUrl?: string;
  sourceUrl?: string;
}): string {
  const tagName = stripForHashtag(opts.idolName);
  const hashtags = ["UndergroundIdolBD", `HBD_${tagName}`];
  const text =
    opts.lang === "ko"
      ? `오늘은 ${opts.idolName} 생일 🎂`
      : `${opts.idolName} 誕生日おめでとう🎂`;

  const link = opts.sourceUrl?.trim() || opts.xUrl?.trim();
  return buildXIntentUrl({ text, hashtags, url: link });
}

