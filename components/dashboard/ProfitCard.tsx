"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useAssetStore } from "@/store/useAssetStore";
import { useAssets } from "@/hooks/useAssets";
import { getProfitColorClass, cn, formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfitCard() {
  const activeTab = useAssetStore((state) => state.activeTab);

  // 🏎️ [성능 최적화 1] select가 적용된 훅을 사용하여 현재 탭의 필터링된 데이터만 서브셋으로 수신
  const {
    data: currentTabAssets = [],
    isLoading,
    isError,
  } = useAssets(activeTab);

  // 🏎️ [성능 최적화 2] 데이터 순회 최소화 및 수익률 계산 메모이제이션
  const { unrealizedProfit, profitRate } = useMemo(() => {
    let totalProfit = 0;
    let totalBalance = 0;

    // 이미 주입된 탭 데이터(`currentTabAssets`)에는 cash-balance가 없거나 정돈되어 있으므로
    // 불필요한 filter 연산 없이 바로 순회합니다.
    currentTabAssets.forEach((asset) => {
      if (asset.id !== "cash-balance") {
        totalProfit += asset.unrealizedProfit || 0;
        totalBalance += asset.balance || 0;
      }
    });

    // 지저분한 소수점 절사 처리
    totalProfit = Math.floor(totalProfit);
    totalBalance = Math.floor(totalBalance);

    // 순수 주식 매입 금액 계산 (총 자산 - 평가 손익)
    const totalPrincipal = totalBalance - totalProfit;
    const rate = totalPrincipal > 0 ? (totalProfit / totalPrincipal) * 100 : 0;

    return {
      unrealizedProfit: totalProfit,
      profitRate: rate,
    };
  }, [currentTabAssets]);

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
        <Skeleton className="h-4 w-32 mb-4 bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-10 w-full mt-auto rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </Card>
    );
  }

  // UI 표현 가독성 변수 정의
  const ProfitIcon =
    unrealizedProfit > 0
      ? TrendingUp
      : unrealizedProfit < 0
        ? TrendingDown
        : Minus;

  const colorClass = getProfitColorClass(unrealizedProfit);
  const isPositive = unrealizedProfit > 0;
  const isNegative = unrealizedProfit < 0;

  return (
    <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col h-full min-h-[150px] transition-colors duration-300 p-5 sm:p-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
            {activeTab} 모의투자 평가 손익
          </h3>
          <ProfitIcon className={cn("w-4 h-4 flex-shrink-0", colorClass)} />
        </div>

        {/* ⚙️ UI 개선: 기호 표시 방식 정돈 (+/-가 통화 기호와 자연스럽게 결합) */}
        <div className="flex items-baseline gap-1 overflow-hidden">
          <span
            className={cn(
              "text-2xl sm:text-3xl font-bold tracking-tight truncate",
              colorClass,
            )}
          >
            {isPositive ? "+" : ""}
            {formatCurrency(unrealizedProfit)}
          </span>
        </div>
      </div>

      <div className="mt-auto pt-5 w-full">
        <div
          className={cn(
            "w-full rounded-xl p-3 flex justify-between items-center transition-colors font-semibold",
            isPositive
              ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
              : isNegative
                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                : "bg-zinc-50 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400",
          )}
        >
          <span className="text-[13px] opacity-80">수익률</span>
          <span className="text-[14px]">
            {profitRate > 0 ? "+" : ""}
            {profitRate.toFixed(2)}%
          </span>
        </div>
      </div>
    </Card>
  );
}
