"use client";

import { useMemo, useState, useEffect, useRef } from "react";
// 🏎️ [성능 최적화 1] 에러의 주범인 ResponsiveContainer를 걷어내고 정밀 픽셀 주입 체계로 전환
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

  // 🏎️ 부모 컨테이너의 정적 너비를 추적하여 Recharts에 고정 수치로 꽂아줄 ref와 상태
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 240 });

  const {
    data: currentTabAssets = [],
    isLoading,
    isError,
  } = useAssets(activeTab);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // 🏎️ [성능 최적화 2] 브라우저 레이아웃 확정 시점에 단 한 번만 정확한 가로 폭 계측 (하드웨어 가속)
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({
          width: Math.floor(width),
          height: 240, // 대시보드 그리드 가이드라인 높이 고정
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 데이터 파이프라인 정제
  const chartData = useMemo(() => {
    return currentTabAssets
      .filter(
        (asset) => asset.id !== "cash-balance" && (asset.balance || 0) > 0,
      )
      .map((asset) => ({
        name: asset.accountName,
        value: asset.balance,
      }));
  }, [currentTabAssets]);

  // 차트 데이터 길이에 따른 템플릿 색상 배열 추출
  const COLORS = useChartColors(chartData.length);

  // 서버 사이드 및 API 페칭 단계 가드
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
      <CardContent className="w-full h-full p-0 flex flex-col justify-center gap-4">
        {/* 부모 상대 좌표 기준 래퍼 */}
        <div
          ref={containerRef}
          className="w-full h-[240px] relative flex items-center justify-center"
        >
          {/* 🌟 [경고 완전 박멸] 가로 폭 크기가 정수 픽셀로 확정 계산되었을 때만 차트 엔진 렌더링
              ResponsiveContainer 내부 탐색 오류가 물리적으로 일어날 수 없는 안전지대를 구축합니다. */}
          {dimensions.width > 0 && (
            <PieChart width={dimensions.width} height={dimensions.height}>
              <Pie
                // 🌟 [유지보수 고도화] key에 테마 테그를 동적으로 조합합니다.
                // 라이트 ➡️ 다크 테마 전환 순간 차트 노드가 동기적으로 새로 구워지며 색상 지연 버그가 청소됩니다.
                key={`pie-${resolvedTheme}`}
                data={chartData}
                cx="50%"
                cy="50%"
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
                  fontSize: "13px",
                }}
              />
            </PieChart>
          )}
        </div>

        {/* 하단 종목명 범례 영역 */}
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-2.5 px-2 pb-2">
          {chartData.map((entry, index) => (
            <div
              key={entry.name}
              className="flex items-center text-[13px] font-medium text-zinc-600 dark:text-zinc-400"
            >
              <span
                className="w-2.5 h-2.5 rounded-full mr-1.5 flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="truncate max-w-[100px] md:max-w-[120px]">
                {entry.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
