"use client";

import { useAssetStore } from "@/store/useAssetStore";
import { calculateTotalStockValue } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TotalAssetCard() {
  // ✅ 1. 현재 대시보드에서 활성화된 탭(계좌)을 가져옵니다.
  const activeTab = useAssetStore((state) => state.activeTab);

  // ✅ 2. 전체 예수금 객체가 아닌 "현재 탭의 예수금"만 가져옵니다. (안전장치로 ?? 0 추가)
  const availableCash = useAssetStore(
    (state) => state.availableCash?.[activeTab] ?? 0,
  );
  const stocks = useAssetStore((state) => state.stocks);

  // ✅ 3. 전체 주식이 아닌 "현재 탭에 해당하는 주식"만 필터링합니다.
  const currentStocks = stocks.filter(
    (stock) => stock.accountType === activeTab,
  );

  // 4. 컴포넌트 렌더링 시점에 총 자산을 계산합니다.
  // (해당 탭의 예수금 + 해당 탭의 보유 주식 총 평가 금액)
  const totalAsset = availableCash + calculateTotalStockValue(currentStocks);

  return (
    // ✨ 디자인 개선 1: 다른 카드들과 동일하게 둥근 모서리(rounded-2xl) 적용
    <Card className="rounded-2xl border-zinc-200/80 shadow-sm flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-500">
          총 자산
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* ✨ 디자인 개선 2: 화폐 기호(₩)는 작게, 숫자는 크고 진하게 분리하여 가독성 극대화 */}
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
