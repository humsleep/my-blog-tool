import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent";
import ThemeProvider from "./components/ThemeProvider";
import MobileBottomNav from "./components/MobileBottomNav";
import ToastProvider from "./components/ui/Toast";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
    { media: '(prefers-color-scheme: dark)',  color: '#1a1410' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://bohemebloglab.com"),
  title: "Boheme BlogLab - 네이버·티스토리 블로거 올인원 도구",
  description: "블로그 진단, 키워드 분석, AI 글쓰기, 금칙어·맞춤법, 이미지 검색·편집까지 — 한국 블로거를 위한 데이터 기반 글쓰기 워크플로우.",
  keywords: ["블로그", "블로그 진단", "키워드 분석", "AI 글쓰기", "네이버 블로그", "티스토리", "블로그 도구", "포스팅", "금칙어", "이미지 편집"],
  authors: [{ name: "Boheme BlogLab" }],
  creator: "Boheme BlogLab",
  publisher: "Boheme BlogLab",
  icons: {
    icon: [
      // SVG는 modern 브라우저 우선 (벡터 — 어떤 사이즈로도 선명).
      // PNG 192/512 는 PWA / 안드로이드 홈스크린용. favicon.ico 는 구식 브라우저 호환.
      { url: "/icon.svg",     type: "image/svg+xml" },
      { url: "/favicon.ico",  sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/icon-192.png", sizes: "192x192",          type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512",          type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://bohemebloglab.com",
    title: "Boheme BlogLab - 네이버·티스토리 블로거 올인원 도구",
    description: "블로그 진단, 키워드 분석, AI 글쓰기, 금칙어·맞춤법, 이미지 검색·편집까지 — 한국 블로거를 위한 데이터 기반 글쓰기 워크플로우.",
    siteName: "Boheme BlogLab",
    images: [
      {
        url: "https://bohemebloglab.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Boheme BlogLab - 네이버·티스토리 블로거 올인원 도구",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Boheme BlogLab - 네이버·티스토리 블로거 올인원 도구",
    description: "블로그 진단, 키워드 분석, AI 글쓰기, 금칙어·맞춤법, 이미지 검색·편집까지.",
    images: ["https://bohemebloglab.com/og-image.png"],
  },
  verification: {
    google: "ag_t43fLpqdnJHcfun4Is25BPgksKp3Om0Gd7pZAERQ",
    other: {
      "naver-site-verification": "fad34bb27da5fb6118f0b437b4143d7c4e2bb750",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Wanted Sans Variable — 모던 한국어 가변 폰트 (Phase 30).
            Pretendard는 fallback 으로 보존 (Wanted 미로드 시 자연스럽게 대체). */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/wanteddev/wanted-sans@v1.0.4/packages/wanted-sans/fonts/webfonts/variable/complete/WantedSansVariable.css"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased flex flex-col min-h-screen" suppressHydrationWarning>
        <ThemeProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <MobileBottomNav />
            {/* 쿠키 동의 — 동의 시점에만 AdSense / Vercel Analytics 마운트 */}
            <CookieConsent />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
