import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
            <a href="/" className="font-semibold text-lg">STO Project Forecaster</a>
            <nav className="space-x-4 text-sm">
              <a className="hover:text-blue-600" href="/investment">Investment</a>
              <a className="hover:text-blue-600" href="/assets">Assets</a>
              <a className="hover:text-blue-600" href="/revenue">Revenue</a>
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
