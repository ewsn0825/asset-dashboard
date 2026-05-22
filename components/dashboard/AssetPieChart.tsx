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
import { Skeleton } from "@/components/ui/skeleton"; // ✅ 스켈레톤 추가

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

  // ✅ 1. 로딩(isLoading)과 에러(isError) 상태 가져오기
  const { data: assets = [], isLoading, isError } = useAssets();

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

  // ✅ 2. 에러 상태 UI
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] w-full text-center bg-red-50 rounded-2xl border border-red-100">
        <p className="text-sm text-red-500">
          차트 데이터를 불러오지 못했습니다.
        </p>
      </div>
    );
  }

  // ✅ 3. 로딩 상태 UI (스켈레톤) - 파이 차트 모양으로 구현
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] w-full">
        {/* 원형 차트 뼈대 */}
        <Skeleton className="w-[150px] h-[150px] rounded-full bg-zinc-200/80" />
        {/* 범례(Legend) 뼈대 */}
        <div className="flex gap-4 mt-8">
          <Skeleton className="w-16 h-4 bg-zinc-200/80" />
          <Skeleton className="w-16 h-4 bg-zinc-200/80" />
          <Skeleton className="w-16 h-4 bg-zinc-200/80" />
        </div>
      </div>
    );
  }

  // ✅ 4. 자산 데이터가 없을 때의 Empty State (모의투자 문구로 변경)
  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] w-full text-center">
        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
          <PieChartIcon className="w-8 h-8 text-zinc-300" />
        </div>
        <p className="text-[15px] font-semibold text-zinc-600">
          {activeTab} 모의투자 자산 데이터가 없습니다.
        </p>
        <p className="text-sm text-zinc-400 mt-1">
          매수한 종목과 예수금 비중이 이곳에 표시됩니다.
        </p>
      </div>
    );
  }

  // ✅ 5. 정상 렌더링 UI
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
              isAnimationActive={true} // 애니메이션 활성화로 값이 바뀔 때 부드럽게 움직임
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
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: "12px",
                border: "1px solid #E5E8EB",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
                fontWeight: "500",
                color: "#191F28",
              }}
              itemStyle={{ color: "#333D4B", marginTop: "4px" }}
            />

            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{
                fontSize: "13px",
                fontWeight: "500",
                color: "#4E5968",
                paddingTop: "10px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
