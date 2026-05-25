"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAssetStore } from "@/store/useAssetStore";
import { useAssets } from "@/hooks/useAssets";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { PieChart as PieChartIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
// ✅ Recharts 내부 스타일링을 위해 현재 테마를 가져옵니다.
import { useTheme } from "next-themes";

const COLORS = [
  "#3182F6", // 블루
  "#10B981", // 에메랄드
  "#F59E0B", // 앰버
  "#EF4444", // 레드
  "#8B5CF6", // 퍼플
  "#64748B", // 슬레이트
];

export function AssetPieChart() {
  const activeTab = useAssetStore((state) => state.activeTab);
  const { data: assets = [], isLoading, isError } = useAssets();

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const chartData = useMemo(() => {
    return assets
      .filter((asset) => {
        if (activeTab === "CMA") {
          return asset.type === "CMA" && asset.id !== "cash-balance";
        }
        if (activeTab === "ISA") {
          return asset.type === "ISA" && asset.id !== "cash-balance";
        }
        return asset.type === "DOMESTIC_STOCK";
      })
      .map((asset) => ({
        name: asset.accountName,
        value: asset.balance,
      }))
      .filter((item) => item.value > 0);
  }, [assets, activeTab]);

  // ✅ 1. 에러 상태 UI
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[260px] md:min-h-[300px] w-full text-center bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 transition-colors duration-300 p-4">
        <p className="text-sm text-red-500 dark:text-red-400 break-keep">
          차트 데이터를 불러오지 못했습니다.
        </p>
      </div>
    );
  }

  // ✅ 2. 로딩 상태 UI (스켈레톤)
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[260px] md:min-h-[300px] w-full">
        <Skeleton className="w-[120px] h-[120px] md:w-[140px] md:h-[140px] rounded-full bg-zinc-200/80 dark:bg-zinc-800" />
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mt-6 md:mt-8 px-4">
          <Skeleton className="w-14 md:w-16 h-4 bg-zinc-200/80 dark:bg-zinc-800" />
          <Skeleton className="w-14 md:w-16 h-4 bg-zinc-200/80 dark:bg-zinc-800" />
          <Skeleton className="w-14 md:w-16 h-4 bg-zinc-200/80 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  // ✅ 3. 자산 데이터가 없을 때의 Empty State
  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[260px] md:min-h-[300px] w-full text-center p-4">
        <div className="w-14 h-14 md:w-16 md:h-16 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-3 md:mb-4 transition-colors">
          <PieChartIcon className="w-7 h-7 md:w-8 md:h-8 text-zinc-300 dark:text-zinc-600" />
        </div>
        <p className="text-sm md:text-[15px] font-semibold text-zinc-600 dark:text-zinc-300 transition-colors break-keep">
          {activeTab} 모의투자 자산 데이터가 없습니다.
        </p>
        <p className="text-xs md:text-sm text-zinc-400 dark:text-zinc-500 mt-1 transition-colors break-keep">
          매수한 종목과 예수금 비중이 이곳에 표시됩니다.
        </p>
      </div>
    );
  }

  // ✅ 4. 정상 렌더링 UI
  return (
    <Card className="border-none shadow-none bg-transparent w-full h-full flex flex-col">
      <CardContent className="w-full h-full p-0 flex flex-col justify-center gap-4">
        {/* 상단: 차트 영역 (SVG) */}
        {/* 💡 컨테이너 높이를 살짝 키워 여백을 확보했습니다. */}
        <div className="w-full h-[220px] md:h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                // 💡 고정 픽셀 대신 %를 사용하여, 화면 밖으로 잘리지 않고 자동으로 맞춰지도록 수정했습니다!
                innerRadius="60%"
                outerRadius="80%"
                paddingAngle={3}
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
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
                  fontWeight: "500",
                  color: isDark ? "#f4f4f5" : "#191F28",
                  fontSize: "13px",
                }}
                itemStyle={{
                  color: isDark ? "#a1a1aa" : "#333D4B",
                  marginTop: "4px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 하단: 커스텀 HTML 범례 영역 */}
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-2.5 px-2 pb-2">
          {chartData.map((entry, index) => (
            <div
              key={entry.name}
              className="flex items-center text-[12px] md:text-[13px] font-medium text-zinc-600 dark:text-zinc-400"
            >
              <span
                className="w-2.5 h-2.5 rounded-full mr-1.5 flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="break-keep">{entry.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
