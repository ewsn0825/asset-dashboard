"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useAssetStore } from "@/store/useAssetStore";
import { useAssets } from "@/hooks/useAssets"; // ✅ 실제 API 훅 추가
import { getProfitColorClass, cn } from "@/lib/utils";

export function ProfitCard() {
  const activeTab = useAssetStore((state) => state.activeTab);

  // ✅ 1. Zustand 대신 React Query 훅으로 실제 데이터를 가져옵니다.
  const { data: assets = [] } = useAssets();

  // ✅ 2. 현재 탭에 맞는 자산만 필터링한 후 총 평가손익과 총 수익률을 계산합니다.
  const { unrealizedProfit, profitRate } = useMemo(() => {
    const filteredAssets = assets.filter((asset) => {
      // 💡 [핵심 수정] 평가 손익과 수익률은 순수 '투자 종목' 기준이어야 하므로 예수금은 제외합니다.
      if (asset.id === "cash-balance") return false;

      if (activeTab === "CMA") return asset.type === "CMA";
      if (activeTab === "ISA") return asset.type === "ISA";
      return asset.type === "DOMESTIC_STOCK";
    });

    let totalProfit = 0;
    let totalBalance = 0;

    filteredAssets.forEach((asset) => {
      // API에서 받아온 각 종목의 평가손익과 평가금액을 합산합니다. (없을 경우 0 처리)
      totalProfit += asset.unrealizedProfit || 0;
      totalBalance += asset.balance || 0;
    });

    // 전체 수익률 = (총 평가손익 / 총 투자원금) * 100
    // 총 투자원금 = 총 평가금액 - 총 평가손익
    const totalPrincipal = totalBalance - totalProfit;
    const rate = totalPrincipal > 0 ? (totalProfit / totalPrincipal) * 100 : 0;

    return {
      unrealizedProfit: totalProfit,
      profitRate: rate,
    };
  }, [assets, activeTab]);

  const ProfitIcon =
    unrealizedProfit > 0
      ? TrendingUp
      : unrealizedProfit < 0
        ? TrendingDown
        : Minus;

  const sign = unrealizedProfit > 0 ? "+" : unrealizedProfit < 0 ? "-" : "";
  const absProfit = Math.abs(unrealizedProfit);

  return (
    <Card className="rounded-2xl border-zinc-200/80 shadow-sm flex flex-col justify-between h-[120px]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-zinc-500">
          {activeTab} 계좌 평가 손익
        </CardTitle>
        <ProfitIcon
          className={cn("w-4 h-4", getProfitColorClass(unrealizedProfit))}
        />
      </CardHeader>

      <CardContent>
        <div className="flex items-baseline gap-2 mt-1">
          <div
            className={cn(
              "flex items-baseline gap-0.5 text-3xl font-bold tracking-tight",
              getProfitColorClass(unrealizedProfit),
            )}
          >
            <span className="text-xl font-medium opacity-80">{sign}₩</span>
            <span>{absProfit.toLocaleString()}</span>
          </div>

          <div
            className={cn(
              "text-[15px] font-semibold",
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
