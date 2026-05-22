"use client";

import { useEffect, useState } from "react";
import {
  TotalAssetCard,
  ProfitCard,
  CashCard,
  StockTable,
  AddStockModal,
  AssetPieChart,
} from "@/components/dashboard";
import { useAssetStore } from "@/store/useAssetStore";
import { AccountType } from "@/types";
import { useAssets } from "@/hooks/useAssets";
// 💡 1. 테마 토글 버튼 임포트
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  const [isReady, setIsReady] = useState(false);

  const { isLoading: isApiLoading, isError, refetch } = useAssets();

  const activeTab = useAssetStore((state) => state.activeTab);
  const setActiveTab = useAssetStore((state) => state.setActiveTab);

  const TABS: AccountType[] = ["일반", "ISA", "CMA"];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // ✅ 로딩 상태 (스켈레톤 UI) - 다크모드 색상 추가
  if (!isReady || isApiLoading) {
    return (
      <main className="min-h-screen bg-[#f8f9fa] dark:bg-zinc-950 py-10 px-6 md:px-10 transition-colors duration-300">
        <div className="max-w-[1200px] mx-auto space-y-10 animate-pulse">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="space-y-3 w-full">
              <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-md w-48"></div>
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-64"></div>
            </div>
            <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-md w-28"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[120px] bg-zinc-200 dark:bg-zinc-800 rounded-xl"
              ></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className="md:col-span-1 bg-zinc-200 dark:bg-zinc-800 rounded-xl"
              style={{ height: "350px" }}
            ></div>
            <div
              className="md:col-span-2 bg-zinc-200 dark:bg-zinc-800 rounded-xl"
              style={{ height: "350px" }}
            ></div>
          </div>
        </div>
      </main>
    );
  }

  // ✅ 에러 상태 UI - 다크모드 색상 추가
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-zinc-950 transition-colors duration-300">
        <div className="text-center p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30">
          <p className="text-red-500 font-bold text-lg">
            데이터 통신 중 오류가 발생했습니다.
          </p>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            모의투자 서버 상태나 네트워크를 확인해주세요.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // ✅ 정상 렌더링 UI - 전체적인 다크모드 클래스(dark:) 적용
  return (
    <main className="min-h-screen bg-[#f8f9fa] dark:bg-zinc-950 py-10 px-6 md:px-10 transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto space-y-10">
        {/* 1. 헤더 영역 */}
        <div className="flex flex-row items-center justify-between pb-6 border-b border-zinc-200/80 dark:border-zinc-800">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              자산 관리 대시보드
              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md font-semibold align-middle">
                모의투자
              </span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm font-medium">
              실시간으로 연동되는 모의투자 환경에서 투자 실력을 테스트해 보세요.
            </p>
          </div>

          {/* 💡 2. 여기에 테마 토글 버튼을 모달 버튼 옆에 나란히 배치했습니다! */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <AddStockModal />
          </div>
        </div>

        {/* 2. 탭 UI 영역 */}
        <div className="inline-flex bg-zinc-100 dark:bg-zinc-800/50 p-1.5 rounded-full transition-colors">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-full text-[15px] font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {tab} 계좌
            </button>
          ))}
        </div>

        {/* 3. 상단 요약 카드 3종 세트 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TotalAssetCard />
          <ProfitCard />
          <CashCard />
        </div>

        {/* 4. 하단 메인 콘텐츠 (차트 & 테이블) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* 4-1. 파이 차트 (좌측 1/3) */}
          <div className="md:col-span-1">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 px-1">
              {activeTab} 자산 비중
            </h2>
            <div
              className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm w-full relative transition-all duration-300"
              style={{ height: "350px" }}
            >
              <AssetPieChart />
            </div>
          </div>

          {/* 4-2. 보유 종목 상세 테이블 (우측 2/3) */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 px-1">
              보유 종목 상세
            </h2>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm w-full overflow-hidden min-h-[350px] transition-all duration-300">
              <StockTable />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
