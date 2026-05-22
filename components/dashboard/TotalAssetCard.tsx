"use client";

import { useMemo, useEffect, useState } from "react";
import { useAssetStore } from "@/store/useAssetStore";
import { useAssets } from "@/hooks/useAssets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// ✅ 1. KST(한국 표준시) 기준으로 장 시간 체크
const checkIsMarketOpen = () => {
  const now = new Date();
  const kstDate = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );
  const day = kstDate.getDay();
  const hours = kstDate.getHours();
  const minutes = kstDate.getMinutes();
  const currentTime = hours * 100 + minutes;

  if (day === 0 || day === 6) return false;
  if (currentTime >= 900 && currentTime <= 1530) return true;
  return false;
};

export function TotalAssetCard() {
  const activeTab = useAssetStore((state) => state.activeTab);
  const { data: assets = [], isLoading, isError } = useAssets();

  const [isMarketOpen, setIsMarketOpen] = useState(false);

  useEffect(() => {
    // ✅ 2. 린터 에러(Cascading Render) 해결: setTimeout으로 비동기 처리
    const initTimer = setTimeout(() => {
      setIsMarketOpen(checkIsMarketOpen());
    }, 0);

    const interval = setInterval(() => {
      setIsMarketOpen(checkIsMarketOpen());
    }, 60000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, []);

  const totalAsset = useMemo(() => {
    return assets
      .filter((asset) => {
        if (activeTab === "CMA") return asset.type === "CMA";
        if (activeTab === "ISA") return asset.type === "ISA";
        return asset.type === "DOMESTIC_STOCK";
      })
      .reduce((sum, asset) => sum + asset.balance, 0);
  }, [assets, activeTab]);

  if (isError) {
    return (
      <Card className="rounded-2xl border-red-200 shadow-sm flex flex-col justify-center items-center h-[116px] bg-red-50">
        <p className="text-sm text-red-500">데이터를 불러오지 못했습니다.</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-zinc-200/80 shadow-sm flex flex-col justify-between h-[116px] p-6">
        <Skeleton className="h-4 w-24 mb-2 bg-zinc-200" />
        <Skeleton className="h-8 w-40 bg-zinc-200" />
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-zinc-200/80 shadow-sm flex flex-col justify-between h-[116px]">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-zinc-500">
          {activeTab} 모의투자 자산
        </CardTitle>

        {/* ✅ 3. 타입 에러 해결: "DOMESTIC_STOCK" 대신 "일반" 탭일 때 뱃지 표시 */}
        {activeTab === "일반" && (
          <div
            className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium transition-colors ${
              isMarketOpen
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-zinc-100 text-zinc-500 border border-zinc-200"
            }`}
          >
            {isMarketOpen ? "🟢 장 중 (매수/매도 가능)" : "🔴 장 마감"}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xl font-medium text-zinc-400">₩</span>
          <span className="text-3xl font-bold text-zinc-900 tracking-tight transition-all duration-300">
            {totalAsset.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
