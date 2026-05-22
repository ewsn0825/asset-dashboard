import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 실제 파일 위치에 맞게 import 경로를 확인해 주세요.
import QueryProvider from "@/components/QueryProvider";
// ✅ 1. 방금 만든 ThemeProvider를 불러옵니다.
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Largon Asset Dashboard",
  description: "개인 자산 및 투자 관리 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // ✅ 2. next-themes 사용 시 필수 속성 추가 (Hydration 경고 방지)
      suppressHydrationWarning
    >
      {/* 💡 기본 배경색과 글자색을 body 레벨에서 한 번 잡아주면 훨씬 안정적입니다. */}
      <body className="min-h-full flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
        {/* ✅ 3. ThemeProvider로 QueryProvider와 자식 컴포넌트들을 감싸줍니다. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
