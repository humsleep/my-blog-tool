import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FontLoader from "./components/FontLoader";

export const metadata: Metadata = {
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
    <html lang="ko">
      <body className="antialiased flex flex-col min-h-screen">
        <FontLoader />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
