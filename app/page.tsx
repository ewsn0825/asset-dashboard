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
import { useAssetStore, AccountType } from "@/store/useAssetStore";

export default function Home() {
  const [isReady, setIsReady] = useState(false);

  const activeTab = useAssetStore((state) => state.activeTab);
  const setActiveTab = useAssetStore((state) => state.setActiveTab);

  const TABS: AccountType[] = ["일반", "ISA", "CMA"];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <main className="min-h-screen bg-[#f8f9fa] py-10 px-6 md:px-10">
        {/* 스켈레톤 UI 간격 강제 적용 (space-y-10) */}
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

  return (
    <main className="min-h-screen bg-[#f8f9fa] py-10 px-6 md:px-10">
      {/* ✅ 핵심: flex gap 대신 space-y-10을 사용하여 위아래 섹션 간격(약 40px)을 강제로 벌려줍니다. */}
      <div className="max-w-[1200px] mx-auto space-y-10">
        {/* 1. 헤더 (border-b와 padding-bottom으로 아래 요소와 분리) */}
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

        {/* 2. 탭 UI (이미지와 동일한 '알약' 모양의 회색 바탕 + 흰색 선택 버튼 디자인) */}
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

        {/* 3. 상단 요약 카드 3개 (가로 간격은 grid의 gap-6 활용) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TotalAssetCard />
          <ProfitCard />
          <CashCard />
        </div>

        {/* 4. 하단 메인 콘텐츠 (자산비중 / 보유종목 상세) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* 왼쪽: 자산 비중 */}
          <div className="md:col-span-1">
            {/* mb-4로 타이틀과 아래 카드 사이의 간격 확실히 확보 */}
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

          {/* 오른쪽: 보유 종목 상세 */}
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
