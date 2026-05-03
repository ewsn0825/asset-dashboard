"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useAssetStore } from "@/store/useAssetStore";
import {
  calculateTotalProfit,
  calculateProfitRate,
  getProfitColorClass,
  cn,
} from "@/lib/utils";

export function ProfitCard() {
  // ✅ 1. 현재 보고 있는 탭(계좌)을 가져옵니다.
  const activeTab = useAssetStore((state) => state.activeTab);
  const stocks = useAssetStore((state) => state.stocks);

  // ✅ 2. 전체 주식이 아닌, "현재 활성화된 계좌"의 주식만 필터링합니다.
  const currentStocks = stocks.filter(
    (stock) => stock.accountType === activeTab,
  );

  // 3. 필터링된 주식으로만 평가 손익과 수익률을 계산합니다. (값이 없을 때 NaN 방지를 위해 || 0 처리)
  const unrealizedProfit = calculateTotalProfit(currentStocks) || 0;
  const profitRate = calculateProfitRate(currentStocks) || 0;

  // 4. 수익 상태에 따라 아이콘 동적 결정
  const ProfitIcon =
    unrealizedProfit > 0
      ? TrendingUp
      : unrealizedProfit < 0
        ? TrendingDown
        : Minus;

  // 부호(+, -) 분리 로직
  const sign = unrealizedProfit > 0 ? "+" : unrealizedProfit < 0 ? "-" : "";
  const absProfit = Math.abs(unrealizedProfit);

  {
    /* ✨ 디자인 개선 1: 다른 카드들과 동일하게 둥근 모서리(rounded-2xl) 적용 */
  }
  return (
    <Card className="rounded-2xl border-zinc-200/80 shadow-sm flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-zinc-500">
          평가 손익
        </CardTitle>
        <ProfitIcon
          className={cn("w-4 h-4", getProfitColorClass(unrealizedProfit))}
        />
      </CardHeader>

      <CardContent>
        <div className="flex items-baseline gap-2 mt-1">
          {/* ✨ 디자인 개선 2: 부호/화폐 기호(₩)는 작게, 숫자는 크고 진하게 분리 */}
          <div
            className={cn(
              "flex items-baseline gap-0.5 text-3xl font-bold tracking-tight",
              getProfitColorClass(unrealizedProfit),
            )}
          >
            <span className="text-xl font-medium opacity-80">{sign}₩</span>
            <span>{absProfit.toLocaleString()}</span>
          </div>

          {/* 수익률(%) 표시 */}
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
