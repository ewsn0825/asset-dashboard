"use client";

import dynamic from "next/dynamic";
import {
  TotalAssetCard,
  ProfitCard,
  CashCard,
  StockTable,
} from "@/components/dashboard";
import { useAssetStore } from "@/store/useAssetStore";
import { AccountType } from "@/types";
import { useAssets } from "@/hooks/useAssets";
import { ThemeToggle } from "@/components/ThemeToggle";

// 🏎️ [성능 최적화 1] ssr: false 옵션 유지
const AssetPieChart = dynamic(
  () => import("@/components/dashboard").then((mod) => mod.AssetPieChart),
  { ssr: false },
);

const AddStockModal = dynamic(
  () =>
    import("@/components/dashboard/AddStockModal").then(
      (mod) => mod.AddStockModal,
    ),
  { ssr: false },
);

// 🏎️ [성능 최적화 2] 렌더링 스코프 외부 격리 고정
const TABS: AccountType[] = ["일반", "ISA", "CMA"];

export default function Home() {
  const activeTab = useAssetStore((state) => state.activeTab);
  const setActiveTab = useAssetStore((state) => state.setActiveTab);

  // 탭 상태를 훅에 직접 주입하여 고속 캐싱 레이어 연동
  const { isLoading: isApiLoading, isError, refetch } = useAssets(activeTab);

  // API 첫 진입 시 최초 로딩 레이아웃 (Layout Shift 방지 스켈레톤)
  if (isApiLoading) {
    return (
      <main className="min-h-screen bg-[#f8f9fa] dark:bg-zinc-950 py-6 md:py-10 px-4 sm:px-6 md:px-8 transition-colors duration-300">
        <div className="max-w-[1200px] mx-auto space-y-8 animate-pulse">
          <div className="flex flex-row items-start justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="space-y-3 w-full">
              <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-md w-3/4 md:w-64"></div>
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-full md:w-96"></div>
            </div>
            <div className="h-10 w-10 md:w-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg flex-shrink-0"></div>
          </div>

          <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-full w-60"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[120px] bg-zinc-200 dark:bg-zinc-800 rounded-xl"
              ></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-1 bg-zinc-200 dark:bg-zinc-800 rounded-2xl h-[300px] md:h-[350px]"></div>
            <div className="lg:col-span-2 bg-zinc-200 dark:bg-zinc-800 rounded-2xl h-[300px] md:h-[350px]"></div>
          </div>
        </div>
      </main>
    );
  }

  // 데이터 통신 에러 레이아웃
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-zinc-950 transition-colors duration-300 px-4">
        <div className="text-center p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30 max-w-md w-full">
          <p className="text-red-500 font-bold text-lg">
            데이터 통신 중 오류가 발생했습니다.
          </p>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm md:text-base">
            모의투자 서버 상태나 네트워크를 확인해주세요.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-6 w-full md:w-auto px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium transition-transform active:scale-95 hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f9fa] dark:bg-zinc-950 py-6 md:py-10 px-4 sm:px-6 md:px-8 transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto space-y-6 md:space-y-8">
        {/* 1. 헤더 영역 */}
        <div className="flex flex-row items-start justify-between gap-4 pb-6 border-b border-zinc-200/80 dark:border-zinc-800">
          <div className="flex-1">
            <h1 className="text-2xl md:text-[28px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex flex-wrap items-center gap-2">
              자산 관리 대시보드
              <span className="text-[11px] md:text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md font-semibold mt-1 md:mt-0">
                모의투자
              </span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm font-medium break-keep">
              실시간으로 연동되는 모의투자 환경에서 투자 실력을 테스트해 보세요.
            </p>
          </div>
          <div className="pt-1 flex-shrink-0">
            <ThemeToggle />
          </div>
        </div>

        {/* 2. 탭 UI 영역 */}
        <div className="w-full overflow-x-auto scrollbar-none snap-x touch-pan-x overscroll-x-contain">
          <div className="inline-flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-full transition-colors min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-5 md:px-7 py-2 rounded-full text-sm md:text-[15px] font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {tab} 계좌
              </button>
            ))}
          </div>
        </div>

        {/* 3. 상단 요약 카드 3종 세트 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <TotalAssetCard />
          <ProfitCard />
          <CashCard />
        </div>

        {/* 4. 하단 메인 콘텐츠 (차트 & 테이블) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start pb-10">
          {/* 4-1. 파이 차트 영역 */}
          <div className="lg:col-span-1">
            <h2 className="text-base md:text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 md:mb-4 px-1">
              {activeTab} 자산 비중
            </h2>
            {/* 🛠️ [버그 완벽 박멸] 기존 고정 높이 h-[300px] md:h-[350px]를 과감히 제거했습니다!
                대신 h-auto와 min-h-max를 부여하여 내부의 금융 앱 스타일 레이아웃(좌우 분할 및 데이터 카드들)이 
                짤리는 일 없이 콘텐츠 크기에 맞추어 유연하고 완벽하게 늘어나도록 숨통을 틔워줍니다. */}
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm w-full relative transition-all duration-300 h-auto min-h-max">
              <AssetPieChart />
            </div>
          </div>

          {/* 4-2. 보유 종목 상세 테이블 */}
          <div className="lg:col-span-2 overflow-hidden">
            <div className="flex justify-between items-center mb-3 md:mb-4 px-1">
              <h2 className="text-base md:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                보유 종목 상세
              </h2>
              <AddStockModal />
            </div>

            <div className="md:bg-white md:dark:bg-zinc-900 md:rounded-2xl md:border border-zinc-200/80 dark:border-zinc-800 md:shadow-sm w-full transition-all duration-300">
              <div className="w-full overflow-x-auto scrollbar-none">
                <div className="w-full md:min-w-[700px] md:p-4">
                  <StockTable />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
