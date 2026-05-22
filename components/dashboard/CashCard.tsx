"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins } from "lucide-react";
import { useAssetStore } from "@/store/useAssetStore";
import { useAssets } from "@/hooks/useAssets";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; // ✅ 스켈레톤 추가

export function CashCard() {
  const activeTab = useAssetStore((state) => state.activeTab);

  // ✅ 1. API 데이터와 상태(로딩, 에러)를 가져옵니다.
  const { data: assets = [], isLoading, isError } = useAssets();
  const queryClient = useQueryClient();

  // ✅ 2. 이전 컴포넌트들과 통일성을 위해 "일반" 대신 "DOMESTIC_STOCK"으로 조건을 맞춥니다.
  const availableCash = useMemo(() => {
    // ✅ DOMESTIC_STOCK 대신 다시 "일반"으로 복구
    if (activeTab !== "일반") {
      return 0;
    }
    const cashAsset = assets.find((asset) => asset.id === "cash-balance");
    return cashAsset ? cashAsset.balance : 0;
  }, [assets, activeTab]);

  const [open, setOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");

    if (!rawValue) {
      setCustomAmount("");
      return;
    }

    setCustomAmount(Number(rawValue).toLocaleString());
  };

  const addQuickAmount = (amount: number) => {
    const currentRaw = Number(customAmount.replace(/,/g, "")) || 0;
    setCustomAmount((currentRaw + amount).toLocaleString());
  };

  // ✅ 3. 모의투자 입출금 로직 적용
  const handleCashUpdate = async (type: "deposit" | "withdraw") => {
    const amount = Number(customAmount.replace(/,/g, ""));

    if (amount <= 0) return alert("올바른 금액을 입력해주세요.");

    // 출금 시 잔액 부족 방어 로직 추가
    if (type === "withdraw" && amount > availableCash) {
      return alert("출금 가능 금액(예수금)이 부족합니다.");
    }

    setIsSubmitting(true);

    try {
      // API 통신 딜레이 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 500));

      const actionText = type === "deposit" ? "입금" : "출금";
      alert(
        `[모의투자] ${amount.toLocaleString()}원이 ${actionText} 처리되었습니다.`,
      );

      // 💡 [핵심] "real" 대신 "mock" 쿼리를 무효화하여 대시보드 예수금을 즉시 갱신합니다.
      await queryClient.invalidateQueries({ queryKey: ["assets", "mock"] });

      setCustomAmount("");
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ 4. 에러 상태 UI
  if (isError) {
    return (
      <Card className="rounded-2xl border-red-200 shadow-sm flex flex-col justify-center items-center h-full min-h-[120px] bg-red-50">
        <p className="text-sm text-red-500">데이터를 불러오지 못했습니다.</p>
      </Card>
    );
  }

  // ✅ 5. 로딩 상태 UI (스켈레톤)
  if (isLoading) {
    return (
      <Card className="rounded-2xl border-zinc-200/80 shadow-sm flex flex-col justify-between h-full min-h-[120px] p-6">
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="h-4 w-28 bg-zinc-200" />
          <Skeleton className="h-4 w-4 rounded-full bg-zinc-200" />
        </div>
        <Skeleton className="h-8 w-32 mt-auto bg-zinc-200" />
      </Card>
    );
  }

  // ✅ 6. 정상 렌더링 UI
  return (
    <Card className="rounded-2xl border-zinc-200/80 shadow-sm flex flex-col justify-between h-full min-h-[120px]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-zinc-500">
          주문가능 예수금
        </CardTitle>
        <Coins className="w-4 h-4 text-zinc-400" />
      </CardHeader>

      <CardContent>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xl font-medium text-zinc-400">₩</span>
          <span className="text-3xl font-bold text-zinc-900 tracking-tight">
            {availableCash.toLocaleString()}
          </span>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            {/* ✅ 여기도 DOMESTIC_STOCK 대신 "일반"으로 복구 */}
            {activeTab === "일반" && (
              <button className="w-full mt-6 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2.5 rounded-lg text-[15px] font-semibold transition-colors">
                예수금 관리
              </button>
            )}
          </DialogTrigger>

          <DialogContent className="sm:max-w-[400px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-zinc-900">
                모의투자 예수금 관리
              </DialogTitle>
              <DialogDescription className="sr-only">
                모의투자 계좌의 예수금을 입금하거나 출금하는 창입니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="p-3 bg-zinc-50 text-zinc-500 text-sm rounded-lg border border-zinc-100">
                💡 <strong>안내:</strong> 모의투자 전용 예수금 충전 및 출금
                기능입니다. 실제 계좌에는 반영되지 않습니다.
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">
                  ₩
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={customAmount}
                  onChange={handleInputChange}
                  placeholder="금액을 입력하세요"
                  className="pl-8 h-14 text-lg font-bold rounded-xl border-zinc-200 focus-visible:ring-blue-500 bg-white"
                />
              </div>

              <div className="flex gap-2">
                {[100000, 500000, 1000000, 5000000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => addQuickAmount(amount)}
                    className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 py-2 rounded-lg text-[13px] font-semibold transition-colors"
                  >
                    +{amount / 10000}만
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleCashUpdate("withdraw")}
                  variant="outline"
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-xl text-[15px] font-bold border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                >
                  {isSubmitting ? "처리 중..." : "출금"}
                </Button>
                <Button
                  onClick={() => handleCashUpdate("deposit")}
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-xl text-[15px] font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? "처리 중..." : "입금"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
