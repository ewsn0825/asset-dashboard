"use client";

import { useMemo } from "react";
import { useAssetStore } from "@/store/useAssetStore";
import { useAssets } from "@/hooks/useAssets"; // ✅ 실제 API 훅 추가
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TotalAssetCard() {
  // ✅ 1. 현재 대시보드에서 활성화된 탭(계좌)을 가져옵니다.
  const activeTab = useAssetStore((state) => state.activeTab);

  // ✅ 2. React Query를 통해 실제 자산 데이터를 가져옵니다.
  const { data: assets = [] } = useAssets();

  // ✅ 3. 현재 탭에 맞는 자산만 필터링하여 총합을 계산합니다.
  const totalAsset = useMemo(() => {
    return assets
      .filter((asset) => {
        // 💡 [수정됨] CMA 탭: 일반 계좌의 예수금(cash-balance)이 섞여 들어오지 않도록 제외합니다.
        if (activeTab === "CMA") {
          return asset.type === "CMA" && asset.id !== "cash-balance";
        }

        // ISA 탭
        if (activeTab === "ISA") {
          return asset.type === "ISA";
        }

        // 💡 [수정됨] 일반 탭 (기본값): 보유 주식(DOMESTIC_STOCK)과 주문가능 예수금(cash-balance)을 모두 합산합니다.
        return asset.type === "DOMESTIC_STOCK" || asset.id === "cash-balance";
      })
      .reduce((sum, asset) => sum + asset.balance, 0);
  }, [assets, activeTab]);

  return (
    <Card className="rounded-2xl border-zinc-200/80 shadow-sm flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-500">
          {activeTab} 계좌 총 자산
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xl font-medium text-zinc-400">₩</span>
          <span className="text-3xl font-bold text-zinc-900 tracking-tight">
            {totalAsset.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
