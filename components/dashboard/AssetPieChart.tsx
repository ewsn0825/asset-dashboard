"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAssetStore } from "@/store/useAssetStore";
import { useAssets } from "@/hooks/useAssets";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { PieChart as PieChartIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";
import { useChartColors } from "@/hooks/useChartColors"; // 💡 분리한 훅 사용

export function AssetPieChart() {
  const activeTab = useAssetStore((state) => state.activeTab);
  const { data: assets = [], isLoading, isError } = useAssets();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const chartData = useMemo(() => {
    return assets
      .filter((asset) => {
        // 예수금을 제외하고 주식/상품 자산만 필터링
        if (asset.id === "cash-balance") return false;
        if (activeTab === "CMA") return asset.type === "CMA";
        if (activeTab === "ISA") return asset.type === "ISA";
        return asset.type === "DOMESTIC_STOCK";
      })
      .map((asset) => ({
        name: asset.accountName,
        value: asset.balance,
      }))
      .filter((item) => item.value > 0);
  }, [assets, activeTab]);

  // 💡 훅에서 색상 배열 생성
  const COLORS = useChartColors(chartData.length);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[260px] w-full">
        <Skeleton className="w-[140px] h-[140px] rounded-full bg-zinc-200/80 dark:bg-zinc-800" />
      </div>
    );
  }

  if (isError || chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[260px] w-full text-center p-4">
        <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
          <PieChartIcon className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
        </div>
        <p className="text-[15px] font-semibold text-zinc-600 dark:text-zinc-300">
          {isError
            ? "데이터를 불러오지 못했습니다."
            : `${activeTab} 데이터가 없습니다.`}
        </p>
      </div>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent w-full h-full">
      <CardContent className="w-full h-full p-0 flex flex-col justify-center gap-4">
        <div className="w-full h-[220px] md:h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="80%"
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: unknown) => [
                  formatCurrency(Number(value)),
                  "평가 금액",
                ]}
                contentStyle={{
                  backgroundColor: isDark
                    ? "#18181b"
                    : "rgba(255, 255, 255, 0.95)",
                  borderRadius: "12px",
                  border: isDark ? "1px solid #27272a" : "1px solid #E5E8EB",
                  fontSize: "13px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap justify-center gap-x-3 gap-y-2.5 px-2 pb-2">
          {chartData.map((entry, index) => (
            <div
              key={entry.name}
              className="flex items-center text-[13px] font-medium text-zinc-600 dark:text-zinc-400"
            >
              <span
                className="w-2.5 h-2.5 rounded-full mr-1.5"
                style={{ backgroundColor: COLORS[index] }}
              />
              {entry.name}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
