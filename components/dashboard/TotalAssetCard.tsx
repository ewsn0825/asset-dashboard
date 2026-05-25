"use client";

import { useMemo } from "react";
import { useAssetStore } from "@/store/useAssetStore";
import { useAssets } from "@/hooks/useAssets";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TotalAssetCard() {
  const activeTab = useAssetStore((state) => state.activeTab);
  const { data: assets = [], isLoading, isError } = useAssets();

  // ✅ 투자 원금 계산을 위해 totalProfit도 함께 계산합니다.
  const { totalAsset, totalPrincipal } = useMemo(() => {
    const filteredAssets = assets.filter((asset) => {
      if (activeTab === "CMA") return asset.type === "CMA";
      if (activeTab === "ISA") return asset.type === "ISA";
      return asset.type === "DOMESTIC_STOCK";
    });

    let assetSum = 0;
    let profitSum = 0;

    filteredAssets.forEach((asset) => {
      assetSum += asset.balance || 0;
      profitSum += asset.unrealizedProfit || 0;
    });

    return {
      totalAsset: assetSum,
      totalPrincipal: assetSum - profitSum, // 투자 원금
    };
  }, [assets, activeTab]);

  if (isError) {
    return (
      <Card className="rounded-2xl border-red-200 dark:border-red-900/30 shadow-sm flex flex-col justify-center items-center h-full min-h-[150px] p-4 bg-red-50 dark:bg-red-900/10 transition-colors duration-300">
        <p className="text-sm text-red-500 dark:text-red-400 text-center break-keep">
          데이터를 불러오지 못했습니다.
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col h-full min-h-[150px] p-5 sm:p-6 transition-colors duration-300">
        <Skeleton className="h-4 w-28 mb-4 bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-8 w-40 bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-10 w-full mt-auto rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col h-full min-h-[150px] transition-colors duration-300 p-5 sm:p-6">
      {/* 💡 1. 상단: 타이틀 + 메인 금액 (위로 바짝 붙임) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
            {activeTab} 모의투자 자산
          </h3>
          {activeTab === "일반" && (
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 ring-4 ring-blue-50 dark:ring-blue-900/20 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-baseline gap-1 overflow-hidden">
          <span className="text-xl sm:text-2xl font-medium text-zinc-400 dark:text-zinc-500 flex-shrink-0">
            ₩
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight transition-all duration-300 truncate">
            {totalAsset.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 💡 2. 하단: 투자 원금 정보 박스 (버튼처럼 무게감을 주어 3번 카드와 균형을 맞춤) */}
      <div className="mt-auto pt-5">
        <div className="w-full bg-zinc-50 dark:bg-zinc-800/40 rounded-xl p-3 flex justify-between items-center transition-colors">
          <span className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
            투자 원금
          </span>
          <span className="text-[14px] font-semibold text-zinc-700 dark:text-zinc-300">
            {totalPrincipal.toLocaleString()}원
          </span>
        </div>
      </div>
    </Card>
  );
}
