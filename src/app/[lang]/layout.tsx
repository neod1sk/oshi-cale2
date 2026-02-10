import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { isLang, languages, t, type Lang } from "@/lib/i18n";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  return (async () => {
    const { lang } = await params;
    if (!isLang(lang)) return {};
    const copy = t(lang);
    return {
      title: copy.siteName,
      description: copy.subtitle,
    };
  })();
}

export const dynamicParams = false;

export function generateStaticParams(): Array<{ lang: Lang }> {
  return languages.map((lang) => ({ lang }));
}

export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;
  if (!isLang(langParam)) notFound();
  const lang: Lang = langParam;

  return (
    <html lang={lang}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-dvh bg-gradient-to-b from-white to-zinc-50">
          <SiteHeader lang={lang} />
          {children}
        </div>
      </body>
    </html>
  );
}

