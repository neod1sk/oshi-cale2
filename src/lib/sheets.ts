import type { Lang } from "@/lib/i18n";

export type Idol = {
  id: string;
  name_ja?: string;
  name_ko?: string;
  slug: string;
  group_name?: string;
  group_slug?: string;
  birthday_mmdd: string; // normalized "MM-DD"
  x_url?: string;
  source_url?: string;
  status: "active" | string;
};

export function getIdolDisplayName(idol: Idol, lang: Lang): string {
  const ja = idol.name_ja?.trim();
  const ko = idol.name_ko?.trim();
  if (lang === "ja") return ja || ko || idol.slug || idol.id;
  return ko || ja || idol.slug || idol.id;
}

export function normalizeMmdd(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  // Accept "M-D", "MM-DD", "M/D", "MM/DD"
  const sep = raw.includes("-") ? "-" : raw.includes("/") ? "/" : null;
  if (!sep) return null;
  const parts = raw.split(sep).map((s) => s.trim());
  if (parts.length !== 2) return null;

  const m = Number(parts[0]);
  const d = Number(parts[1]);
  if (!Number.isInteger(m) || !Number.isInteger(d)) return null;
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;

  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${mm}-${dd}`;
}

function stripBom(s: string) {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

// Minimal RFC4180-ish parser (commas, quotes, CRLF)
export function parseCsv(text: string): string[][] {
  const s = stripBom(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = s[i + 1];
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (ch === "\n") {
      row.push(field.replace(/\r$/, ""));
      field = "";
      // Skip completely empty trailing line
      if (row.length !== 1 || row[0] !== "") rows.push(row);
      row = [];
      continue;
    }
    field += ch;
  }

  // last field
  row.push(field.replace(/\r$/, ""));
  if (row.length !== 1 || row[0] !== "") rows.push(row);

  return rows;
}

function lower(s: string | undefined) {
  return (s ?? "").trim().toLowerCase();
}

export async function fetchIdols(): Promise<Idol[]> {
  const url = process.env.SHEET_CSV_URL;
  if (!url) {
    throw new Error(
      "SHEET_CSV_URL が未設定です。.env.local に CSV公開URL を設定してください。"
    );
  }

  console.log("[sheets] SHEET_CSV_URL:", process.env.SHEET_CSV_URL);

  const res = await fetch(url, { next: { revalidate: 600 } });
  console.log("[sheets] CSV fetch status:", res.status);
  console.log("[sheets] CSV content-type:", res.headers.get("content-type"));
  if (!res.ok) {
    throw new Error(`CSV の取得に失敗しました: ${res.status} ${res.statusText}`);
  }
  const csv = await res.text();
  console.log("[sheets] CSV head:", csv.slice(0, 120));
  const rows = parseCsv(csv);
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.trim());
  const idx = (key: string) => header.indexOf(key);

  const idIdx = idx("id");
  const slugIdx = idx("slug");
  const statusIdx = idx("status");
  const bdayIdx = idx("birthday_mmdd");

  // name columns: prefer name_ja/name_ko, but accept legacy "name"
  const nameJaIdx = idx("name_ja");
  const nameKoIdx = idx("name_ko");
  const legacyNameIdx = idx("name");

  if (idIdx === -1 || slugIdx === -1 || statusIdx === -1 || bdayIdx === -1) {
    throw new Error(
      "CSVヘッダーが想定と異なります。必須: id,slug,birthday_mmdd,status（+ name_ja,name_ko 推奨）"
    );
  }

  const out: Idol[] = [];

  for (const row of rows.slice(1)) {
    const status = row[statusIdx] ?? "";
    if (lower(status) !== "active") continue;

    const birthdayRaw = row[bdayIdx] ?? "";
    const birthday = normalizeMmdd(birthdayRaw);
    if (!birthday) continue;

    const id = (row[idIdx] ?? "").trim();
    const slug = (row[slugIdx] ?? "").trim();
    if (!id || !slug) continue;

    const idol: Idol = {
      id,
      slug,
      status: status.trim(),
      birthday_mmdd: birthday,
      name_ja: (nameJaIdx !== -1 ? row[nameJaIdx] : "")?.trim() || undefined,
      name_ko: (nameKoIdx !== -1 ? row[nameKoIdx] : "")?.trim() || undefined,
      group_name: (idx("group_name") !== -1 ? row[idx("group_name")] : "")?.trim() || undefined,
      group_slug: (idx("group_slug") !== -1 ? row[idx("group_slug")] : "")?.trim() || undefined,
      x_url: (idx("x_url") !== -1 ? row[idx("x_url")] : "")?.trim() || undefined,
      source_url: (idx("source_url") !== -1 ? row[idx("source_url")] : "")?.trim() || undefined,
    };

    // legacy fallback: if name_ja/name_ko absent but "name" exists, store into name_ja
    if (!idol.name_ja && !idol.name_ko && legacyNameIdx !== -1) {
      const legacy = (row[legacyNameIdx] ?? "").trim();
      if (legacy) idol.name_ja = legacy;
    }

    out.push(idol);
  }

  return out;
}

