"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
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

  // ✅ 다크 모드 판별 (Home에서 마운트 지연 처리가 되어 있으므로 Hydration 에러 안전)
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
        // 일반 탭일 경우: 주식과 예수금 모두 "DOMESTIC_STOCK" 타입으로 묶여있으므로 그대로 반환
        return asset.type === "DOMESTIC_STOCK";
      })
      .map((asset) => ({
        name: asset.accountName,
        value: asset.balance,
      }))
      .filter((item) => item.value > 0);
  }, [assets, activeTab]);

  // ✅ 에러 상태 UI - 다크모드 대응
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] w-full text-center bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 transition-colors duration-300">
        <p className="text-sm text-red-500 dark:text-red-400">
          차트 데이터를 불러오지 못했습니다.
        </p>
      </div>
    );
  }

  // ✅ 로딩 상태 UI (스켈레톤) - 다크모드 대응
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] w-full">
        {/* 원형 차트 뼈대 */}
        <Skeleton className="w-[150px] h-[150px] rounded-full bg-zinc-200/80 dark:bg-zinc-800" />
        {/* 범례(Legend) 뼈대 */}
        <div className="flex gap-4 mt-8">
          <Skeleton className="w-16 h-4 bg-zinc-200/80 dark:bg-zinc-800" />
          <Skeleton className="w-16 h-4 bg-zinc-200/80 dark:bg-zinc-800" />
          <Skeleton className="w-16 h-4 bg-zinc-200/80 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  // ✅ 자산 데이터가 없을 때의 Empty State - 다크모드 대응
  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] w-full text-center">
        <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-4 transition-colors">
          <PieChartIcon className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
        </div>
        <p className="text-[15px] font-semibold text-zinc-600 dark:text-zinc-300 transition-colors">
          {activeTab} 모의투자 자산 데이터가 없습니다.
        </p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1 transition-colors">
          매수한 종목과 예수금 비중이 이곳에 표시됩니다.
        </p>
      </div>
    );
  }

  // ✅ 정상 렌더링 UI
  return (
    <Card className="border-none shadow-none bg-transparent w-full h-full">
      <CardContent className="w-full h-full p-0 flex flex-col justify-center">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={100}
              paddingAngle={4}
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

            {/* 💡 툴팁 다크모드 동적 스타일링 */}
            <Tooltip
              formatter={(value: unknown) => [
                formatCurrency(Number(value)),
                "평가 금액",
              ]}
              contentStyle={{
                backgroundColor: isDark
                  ? "#18181b"
                  : "rgba(255, 255, 255, 0.95)", // zinc-900 vs white
                borderRadius: "12px",
                border: isDark ? "1px solid #27272a" : "1px solid #E5E8EB", // zinc-800 vs light gray
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
                fontWeight: "500",
                color: isDark ? "#f4f4f5" : "#191F28", // zinc-50 vs dark gray
              }}
              itemStyle={{
                color: isDark ? "#a1a1aa" : "#333D4B", // zinc-400 vs gray
                marginTop: "4px",
              }}
            />

            {/* 💡 범례(Legend) 다크모드 동적 스타일링 */}
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{
                fontSize: "13px",
                fontWeight: "500",
                color: isDark ? "#a1a1aa" : "#4E5968", // zinc-400 vs gray
                paddingTop: "10px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
