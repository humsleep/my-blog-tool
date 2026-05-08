import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdSense from "./components/AdSense";
import ThemeProvider from "./components/ThemeProvider";
import MobileBottomNav from "./components/MobileBottomNav";
import ToastProvider from "./components/ui/Toast";
import { Analytics } from "@vercel/analytics/next";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)',  color: '#0a0a0a' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://bohemebloglab.com"),
  title: "Boheme PostLab - 블로그 포스팅 도우미",
  description: "네이버/티스토리 블로거를 위한 글자 수 세기, 금칙어 검사, 이미지 편집 도구",
  keywords: ["블로그", "포스팅", "글자수", "금칙어", "이미지 편집", "네이버 블로그", "티스토리", "블로그 도구"],
  authors: [{ name: "Boheme PostLab" }],
  creator: "Boheme PostLab",
  publisher: "Boheme PostLab",
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
    title: "Boheme PostLab - 블로그 포스팅 도우미",
    description: "네이버/티스토리 블로거를 위한 글자 수 세기, 금칙어 검사, 이미지 편집 도구",
    siteName: "Boheme PostLab",
    images: [
      {
        url: "https://bohemebloglab.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Boheme PostLab - 블로그 포스팅 도우미",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Boheme PostLab - 블로그 포스팅 도우미",
    description: "네이버/티스토리 블로거를 위한 글자 수 세기, 금칙어 검사, 이미지 편집 도구",
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
            <AdSense />
            <Analytics />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
