"use client";

import { useMemo } from "react";
import { useAssetStore } from "@/store/useAssetStore";
import { useAssets } from "@/hooks/useAssets";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TotalAssetCard() {
  const activeTab = useAssetStore((state) => state.activeTab);

  // 🏎️ [성능 최적화 1] 현재 활성화된 탭의 필터링된 데이터만 select 레이어를 통해 가볍게 수신합니다.
  const {
    data: currentTabAssets = [],
    isLoading,
    isError,
  } = useAssets(activeTab);

  // 예수금(Cash) 데이터를 안전하게 분리 추출하기 위해 전체 자산 데이터도 함께 구독합니다. (동일 캐시 공유)
  const { data: allAssets = [] } = useAssets();

  // 🏎️ [성능 최적화 2] 탭 데이터 계산 로직 최적화 및 정합성 버그 수정
  const { totalAsset, totalPrincipal } = useMemo(() => {
    let assetSum = 0;
    let profitSum = 0;

    // 1. 현재 탭에 해당하는 자산(종목)들의 총합 및 손익 계산
    // cash-balance는 탭 분류에서 제외되므로 순수 투자 종목만 계산됩니다.
    currentTabAssets.forEach((asset) => {
      if (asset.id !== "cash-balance") {
        assetSum += asset.balance || 0;
        profitSum += asset.unrealizedProfit || 0;
      }
    });

    // 2. 예수금(cash-balance) 처리 가이드라인:
    // 일반 주식 탭일 때만 통합 예수금을 더해주거나,
    // 혹은 모든 계좌의 총자산에 균등하게 예수금이 반영되도록 정합성을 맞춰줍니다.
    const cashAsset = allAssets.find((asset) => asset.id === "cash-balance");
    const availableCash = cashAsset ? cashAsset.balance : 0;

    // 대시보드 기획 스펙에 맞게 조정: 여기서는 '일반' 주식 계좌 탭에서만 예수금을 포함하도록 처리
    // (CMA나 ISA는 보통 계좌 자산 내에 예수금이 녹아있으므로 통합 예수금이 섞이면 안 됩니다)
    if (activeTab === "일반") {
      assetSum += availableCash;
    }

    // 소수점 버림 처리로 UX 깔끔하게 유지
    const finalAsset = Math.floor(assetSum);
    const finalProfit = Math.floor(profitSum);

    return {
      totalAsset: finalAsset,
      totalPrincipal: finalAsset - finalProfit, // 투자 원금 = 총 자산 - 평가 손익
    };
  }, [currentTabAssets, allAssets, activeTab]);

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
      {/* 상단: 타이틀 + 메인 금액 */}
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

      {/* 하단: 투자 원금 정보 박스 */}
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
