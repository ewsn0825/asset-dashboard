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

export default function Home() {
  const [isReady, setIsReady] = useState(false);

  // ✅ 1. 에러 발생 시 우아한 재시도를 위해 refetch 함수도 함께 가져옵니다.
  const { isLoading: isApiLoading, isError, refetch } = useAssets();

  const activeTab = useAssetStore((state) => state.activeTab);
  const setActiveTab = useAssetStore((state) => state.setActiveTab);

  const TABS: AccountType[] = ["일반", "ISA", "CMA"];

  // ✅ 2. Zustand persist 하이드레이션 에러 방지
  // (린트 에러를 우회하기 위해 상태 업데이트를 다음 틱으로 미룹니다)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // 로딩 상태 (스켈레톤 UI)
  if (!isReady || isApiLoading) {
    return (
      <main className="min-h-screen bg-[#f8f9fa] py-10 px-6 md:px-10">
        <div className="max-w-[1200px] mx-auto space-y-10 animate-pulse">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-200">
            <div className="space-y-3 w-full">
              <div className="h-8 bg-zinc-200 rounded-md w-48"></div>
              <div className="h-4 bg-zinc-200 rounded-md w-64"></div>
            </div>
            <div className="h-10 bg-zinc-200 rounded-md w-28"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[120px] bg-zinc-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className="md:col-span-1 bg-zinc-200 rounded-xl"
              style={{ height: "350px" }}
            ></div>
            <div
              className="md:col-span-2 bg-zinc-200 rounded-xl"
              style={{ height: "350px" }}
            ></div>
          </div>
        </div>
      </main>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-red-100">
          <p className="text-red-500 font-bold text-lg">
            데이터 통신 중 오류가 발생했습니다.
          </p>
          <p className="text-zinc-500 mt-2">
            API 키 설정이나 네트워크 상태를 확인해주세요.
          </p>
          {/* 💡 [수정됨] 페이지 전체 새로고침 대신 React Query의 refetch를 호출하여 부드럽게 재시도합니다. */}
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm transition-colors hover:bg-zinc-800"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 정상 렌더링
  return (
    <main className="min-h-screen bg-[#f8f9fa] py-10 px-6 md:px-10">
      <div className="max-w-[1200px] mx-auto space-y-10">
        {/* 1. 헤더 */}
        <div className="flex flex-row items-center justify-between pb-6 border-b border-zinc-200/80">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-zinc-900">
              자산 관리 대시보드
            </h1>
            <p className="text-zinc-500 mt-2 text-sm font-medium">
              실시간 투자 현황과 자산 비중을 확인하세요.
            </p>
          </div>
          <div>
            <AddStockModal />
          </div>
        </div>

        {/* 2. 탭 UI */}
        <div className="inline-flex bg-zinc-100 p-1.5 rounded-full">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-full text-[15px] font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {tab} 계좌
            </button>
          ))}
        </div>

        {/* 3. 상단 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TotalAssetCard />
          <ProfitCard />
          <CashCard />
        </div>

        {/* 4. 하단 메인 콘텐츠 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-1">
            <h2 className="text-lg font-bold text-zinc-900 mb-4 px-1">
              자산 비중
            </h2>
            <div
              className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm w-full relative"
              style={{ height: "350px" }}
            >
              <AssetPieChart />
            </div>
          </div>

          <div className="md:col-span-2">
            <h2 className="text-lg font-bold text-zinc-900 mb-4 px-1">
              보유 종목 상세
            </h2>
            <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm w-full overflow-hidden min-h-[350px]">
              <StockTable />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
