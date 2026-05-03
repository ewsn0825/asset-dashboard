"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useAssetStore } from "@/store/useAssetStore";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
// ✅ 빈 화면을 장식할 아이콘을 가져옵니다 (Recharts의 PieChart와 이름이 겹치지 않게 이름을 바꿉니다)
import { PieChart as PieChartIcon } from "lucide-react";

const COLORS = [
  "#3182F6", // 예수금 (토스 느낌의 핀테크 블루)
  "#10B981", // 에메랄드 그린
  "#F59E0B", // 앰버 오렌지
  "#EF4444", // 레드
  "#8B5CF6", // 퍼플
  "#64748B", // 슬레이트 그레이
];

export function AssetPieChart() {
  const activeTab = useAssetStore((state) => state.activeTab);
  const stocks = useAssetStore((state) => state.stocks);
  const availableCashMap = useAssetStore((state) => state.availableCash);

  const currentCash = availableCashMap[activeTab] || 0;
  const currentStocks = stocks.filter(
    (stock) => stock.accountType === activeTab,
  );

  const chartData = [
    { name: "예수금", value: currentCash },
    ...currentStocks.map((s) => ({
      name: s.name,
      value: (s.quantity || 0) * (s.currentPrice || 0),
    })),
  ].filter((item) => item.value > 0);

  // ✨ 디자인 개선 1: 텅 비었을 때 보여주는 'Empty State' 화면 고급화
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
          예수금을 입금하거나 종목을 추가해보세요.
        </p>
      </div>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent w-full h-full">
      <CardContent className="w-full h-full p-0 flex flex-col justify-center">
        {/* 높이를 300px로 넉넉하게 잡아 차트가 잘리지 않게 합니다 */}
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={75} // ✨ 디자인 개선 2: 도넛의 두께를 더 모던하게 조정
              outerRadius={100}
              paddingAngle={4} // 파이 조각 사이의 간격을 살짝 넓혀 깔끔하게
              dataKey="value"
              stroke="none" // 테두리 선을 없애서 플랫한 느낌 강조
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            {/* ✨ 디자인 개선 3: 툴팁을 더 부드럽고 세련되게 */}
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [
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

            {/* 하단 범례(Legend) 스타일 조정 */}
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{
                fontSize: "14px",
                fontWeight: "500",
                color: "#4E5968",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
