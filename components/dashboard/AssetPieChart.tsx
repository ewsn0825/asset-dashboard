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
import { useAssets } from "@/hooks/useAssets"; // ✅ 실제 API 훅 추가
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { PieChart as PieChartIcon } from "lucide-react";

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

  // ✅ 1. 실제 API 데이터 가져오기
  const { data: assets = [] } = useAssets();

  // ✅ 2. 차트 데이터 변환 로직 (useMemo 활용)
  const chartData = useMemo(() => {
    return assets
      .filter((asset) => {
        // 💡 [수정됨] CMA, ISA 탭에서는 예수금(cash-balance)이 파이 차트에 섞이지 않도록 완벽 차단
        if (activeTab === "CMA") {
          return asset.type === "CMA" && asset.id !== "cash-balance";
        }
        if (activeTab === "ISA") {
          return asset.type === "ISA" && asset.id !== "cash-balance";
        }

        // 💡 [수정됨] 일반 탭: 주식과 예수금을 모두 '자산 비중' 파이 차트에 포함합니다.
        // (만약 파이 차트에서 예수금을 빼고 순수 '주식 비중'만 그리고 싶다면,
        // 아래 줄을 return asset.type === "DOMESTIC_STOCK" && asset.id !== "cash-balance"; 로 변경하세요!)
        return asset.type === "DOMESTIC_STOCK" || asset.id === "cash-balance";
      })
      .map((asset) => ({
        // Recharts 규격에 맞게 매핑
        name: asset.accountName,
        value: asset.balance,
      }))
      .filter((item) => item.value > 0); // 금액이 0보다 큰 것만 표시
  }, [assets, activeTab]);

  // 자산 데이터가 없을 때의 Empty State
  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] w-full text-center">
        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
          <PieChartIcon className="w-8 h-8 text-zinc-300" />
        </div>
        <p className="text-[15px] font-semibold text-zinc-600">
          {activeTab} 계좌에 자산 데이터가 없습니다.
        </p>
        <p className="text-sm text-zinc-400 mt-1">
          실제 계좌에 보유 중인 자산 비중이 이곳에 표시됩니다.
        </p>
      </div>
    );
  }

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
