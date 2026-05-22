"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useAssetStore } from "@/store/useAssetStore";
import { useAssets } from "@/hooks/useAssets";
import { getProfitColorClass, cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfitCard() {
  const activeTab = useAssetStore((state) => state.activeTab);

  // ✅ 1. isLoading과 isError를 가져옵니다. (5초마다 자동 갱신됨)
  const { data: assets = [], isLoading, isError } = useAssets();

  const { unrealizedProfit, profitRate } = useMemo(() => {
    const filteredAssets = assets.filter((asset) => {
      if (asset.id === "cash-balance") return false;

      if (activeTab === "CMA") return asset.type === "CMA";
      if (activeTab === "ISA") return asset.type === "ISA";
      return asset.type === "DOMESTIC_STOCK";
    });

    let totalProfit = 0;
    let totalBalance = 0;

    filteredAssets.forEach((asset) => {
      totalProfit += asset.unrealizedProfit || 0;
      totalBalance += asset.balance || 0;
    });

    const totalPrincipal = totalBalance - totalProfit;
    const rate = totalPrincipal > 0 ? (totalProfit / totalPrincipal) * 100 : 0;

    return {
      unrealizedProfit: totalProfit,
      profitRate: rate,
    };
  }, [assets, activeTab]);

  // ✅ 2. 에러 상태 UI - 다크모드 대응 (붉은색 톤 다운)
  if (isError) {
    return (
      <Card className="rounded-2xl border-red-200 dark:border-red-900/30 shadow-sm flex flex-col justify-center items-center h-[120px] bg-red-50 dark:bg-red-900/10 transition-colors duration-300">
        <p className="text-sm text-red-500 dark:text-red-400">
          데이터를 불러오지 못했습니다.
        </p>
      </Card>
    );
  }

  // ✅ 3. 로딩 상태 UI (스켈레톤) - 다크모드 배경 및 스켈레톤 색상 추가
  if (isLoading) {
    return (
      <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col justify-between h-[120px] p-6 transition-colors duration-300">
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800" />
          <Skeleton className="h-4 w-4 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="flex items-end gap-2 mt-auto">
          <Skeleton className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800" />
          <Skeleton className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </Card>
    );
  }

  const ProfitIcon =
    unrealizedProfit > 0
      ? TrendingUp
      : unrealizedProfit < 0
        ? TrendingDown
        : Minus;

  const sign = unrealizedProfit > 0 ? "+" : unrealizedProfit < 0 ? "-" : "";
  const absProfit = Math.abs(unrealizedProfit);

  // ✅ 4. 정상 렌더링 UI - 카드 배경, 텍스트 다크모드 대응
  return (
    <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col justify-between h-[120px] transition-colors duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {activeTab} 모의투자 평가 손익
        </CardTitle>
        <ProfitIcon
          className={cn("w-4 h-4", getProfitColorClass(unrealizedProfit))}
        />
      </CardHeader>

      <CardContent>
        <div className="flex items-baseline gap-2 mt-1">
          <div
            className={cn(
              "flex items-baseline gap-0.5 text-3xl font-bold tracking-tight transition-colors duration-300",
              getProfitColorClass(unrealizedProfit),
            )}
          >
            <span className="text-xl font-medium opacity-80">{sign}₩</span>
            <span>{absProfit.toLocaleString()}</span>
          </div>

          <div
            className={cn(
              "text-[15px] font-semibold transition-colors duration-300",
              getProfitColorClass(profitRate),
            )}
          >
            ({profitRate > 0 ? "+" : ""}
            {profitRate.toFixed(2)}%)
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
