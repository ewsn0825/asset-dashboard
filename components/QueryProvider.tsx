"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// 🏎️ [성능 최적화 1] QueryClient 인스턴스를 생성하는 공통 유틸 함수
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 우리가 앞서 각 커스텀 훅과 API 라우터에 장 시간에 맞춰 동적 staleTime을 심어두었으므로,
        // 기본 전역 staleTime은 1분(60초) 정도로 안정적인 기본값을 유지합니다.
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1, // 서버 통신 실패 시 기본 재시도 횟수를 1회로 제한하여 과도한 요청 방지
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  // SSR 환경(서버 사이드)일 때는 요청마다 새로운 QueryClient를 생성하여 유저 간 데이터 오염 방지
  if (typeof window === "undefined") {
    return makeQueryClient();
  } else {
    // CSR 환경(브라우저)일 때는 싱글톤 인스턴스를 유지하여 캐시가 날아가는 현상 방지
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // 컴포넌트 내부가 리렌더링되더라도 getQueryClient 내부에서 싱글톤을 보장하므로 안전합니다.
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}

      {/* 🏎️ [성능 최적화 2] 데브툴 번들 최적화
          실제 배포(production) 빌드 시 개발 도구 스크립트가 클라이언트 번들에 
          포함되거나 실행되는 부하를 원천 차단하기 위해 노드 환경 분기를 추가합니다. */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
