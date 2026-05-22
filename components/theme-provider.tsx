"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// 💡 내부 타입 경로를 임포트하는 대신, React.ComponentProps를 활용해 타입을 추론합니다.
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
