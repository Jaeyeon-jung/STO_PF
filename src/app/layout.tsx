import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "STO Project Forecaster",
  description: "부동산 개발 프로젝트 가치/수익/리스크 분석 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
      >
        <header className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg">STO-PF 부동산 플랫폼</Link>
            <nav className="space-x-4 text-sm">
              <Link className="hover:text-blue-600" href="/investments">부동산 투자</Link>
              <Link className="hover:text-blue-600" href="/ai-search">AI 검색</Link>
              <Link className="hover:text-blue-600" href="/assets">자산 관리</Link>
              <Link className="hover:text-blue-600" href="/revenue">수익 현황</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        <footer className="border-t bg-white mt-10">
          <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-gray-500">
            © {new Date().getFullYear()} STO PF
          </div>
        </footer>
      </body>
    </html>
  );
}
