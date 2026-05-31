"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { useAssetStore } from "@/store/useAssetStore";
import { useAssets } from "@/hooks/useAssets";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { PieChart as PieChartIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";
import { useChartColors } from "@/hooks/useChartColors";

export function AssetPieChart() {
  const activeTab = useAssetStore((state) => state.activeTab);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 200 });

  const {
    data: currentTabAssets = [],
    isLoading,
    isError,
  } = useAssets(activeTab);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({
          width: Math.floor(width),
          height: 200,
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 금융앱 데이터 파이프라인: TOP 4 외 나머지는 '기타 종목'으로 합산
  const chartData = useMemo(() => {
    const validAssets = currentTabAssets
      .filter(
        (asset) => asset.id !== "cash-balance" && (asset.balance || 0) > 0,
      )
      .map((asset) => ({
        name: asset.accountName,
        value: asset.balance,
      }))
      .sort((a, b) => b.value - a.value);

    if (validAssets.length <= 5) return validAssets;

    const topAssets = validAssets.slice(0, 4);
    const otherBalance = validAssets
      .slice(4)
      .reduce((sum, item) => sum + item.value, 0);

    return [...topAssets, { name: "기타 종목", value: otherBalance }];
  }, [currentTabAssets]);

  const COLORS = useChartColors(chartData.length);

  // 반응형 크기 최적 제어 수치 계산
  const { innerRadius, outerRadius } = useMemo(() => {
    const mobileMode = dimensions.width > 0 && dimensions.width < 450;
    if (mobileMode) {
      return { innerRadius: 42, outerRadius: 62 };
    }
    // 데스크톱에서도 위아래 구조로 배치되므로 공간이 넉넉해져 반지름을 조금 더 키웁니다.
    return { innerRadius: 60, outerRadius: 85 };
  }, [dimensions.width]);

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
            : `${activeTab} 계좌에 보유 중인 종목이 없습니다.`}
        </p>
      </div>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent w-full h-full">
      {/* 🛠️ [수정] grid 속성을 제거하고 모바일/데스크톱 모두에서 상하 배치가 되도록 flex-col 구조로 변경했습니다. */}
      <CardContent className="w-full h-full p-0 flex flex-col items-center justify-center gap-6">
        {/* 🛠️ 상단: 도넛 차트 영역 */}
        <div
          ref={containerRef}
          style={{ height: `${dimensions.height}px` }}
          className="w-full relative flex items-center justify-center"
        >
          {dimensions.width > 0 && (
            <PieChart
              width={dimensions.width}
              height={dimensions.height}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <Pie
                key={`pie-${resolvedTheme}`}
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={2.5}
                dataKey="value"
                stroke="none"
                isAnimationActive={true}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
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
          )}
        </div>

        {/* 🛠️ 하단: 토스증권 스타일 리스트 범례 영역 */}
        {/* 이제 차트 밑으로 내려왔기 때문에 가로폭 전체를 활용하여 텍스트가 잘리지 않습니다. */}
        <div className="w-full flex flex-col gap-2 px-1">
          {chartData.map((entry, index) => {
            const total = chartData.reduce((sum, item) => sum + item.value, 0);
            const percentage = ((entry.value / total) * 100).toFixed(1);

            return (
              <div
                key={entry.name}
                className="flex items-center justify-between text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-50/50 dark:bg-zinc-800/20 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/40 w-full"
              >
                <div className="flex items-center min-w-0 mr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full mr-2.5 flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  {/* 🛠️ [수정] 텍스트 생략 유발 인자(truncate, max-w)를 제거하여 글자가 온전하게 보이도록 처리했습니다. */}
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {entry.name}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0 text-right">
                  <span className="text-zinc-400 text-xs font-normal">
                    {percentage}%
                  </span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                    {formatCurrency(entry.value)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
