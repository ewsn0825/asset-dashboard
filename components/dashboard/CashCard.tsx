"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";

export function CashCard() {
  const activeTab = useAssetStore((state) => state.activeTab);
  const { data: assets = [], isLoading, isError } = useAssets();
  const queryClient = useQueryClient();

  const availableCash = useMemo(() => {
    if (activeTab !== "일반") return 0;
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

  const handleCashUpdate = async (type: "deposit" | "withdraw") => {
    const amount = Number(customAmount.replace(/,/g, ""));
    if (amount <= 0) return alert("올바른 금액을 입력해주세요.");
    if (type === "withdraw" && amount > availableCash) {
      return alert("출금 가능 금액(예수금)이 부족합니다.");
    }
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const actionText = type === "deposit" ? "입금" : "출금";
      alert(
        `[모의투자] ${amount.toLocaleString()}원이 ${actionText} 처리되었습니다.`,
      );
      await queryClient.invalidateQueries({ queryKey: ["assets", "mock"] });
      setCustomAmount("");
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isError) {
    return (
      <Card className="rounded-2xl border-red-200 dark:border-red-900/30 shadow-sm flex flex-col justify-center items-center h-full min-h-[150px] p-4 bg-red-50 dark:bg-red-900/10 transition-colors duration-300">
        <p className="text-sm text-red-500 dark:text-red-400 text-center break-keep">
          데이터를 불러오지 못했습니다.
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col h-full min-h-[150px] p-5 sm:p-6 transition-colors duration-300">
        <Skeleton className="h-4 w-28 mb-4 bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-8 w-40 bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-10 w-full mt-auto rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col h-full min-h-[150px] transition-colors duration-300 p-5 sm:p-6">
      {/* 💡 1. 상단: 타이틀 + 예수금 금액 (위로 바짝 붙임) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
            주문가능 예수금
          </h3>
          <Coins className="w-4 h-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
        </div>
        <div className="flex items-baseline gap-1 overflow-hidden">
          <span className="text-xl sm:text-2xl font-medium text-zinc-400 dark:text-zinc-500 flex-shrink-0">
            ₩
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors truncate">
            {availableCash.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 💡 2. 하단: 예수금 관리 버튼 (1,2번 카드 박스와 동일한 높이 선상 유지) */}
      <div className="mt-auto pt-5 w-full">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            {activeTab === "일반" && (
              <button className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 py-2.5 rounded-xl text-[14px] sm:text-[15px] font-bold transition-colors">
                예수금 관리
              </button>
            )}
          </DialogTrigger>

          <DialogContent className="w-[92vw] sm:w-full sm:max-w-[400px] rounded-2xl dark:border-zinc-800 dark:bg-zinc-900 p-5 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 text-left break-keep">
                모의투자 예수금 관리
              </DialogTitle>
              <DialogDescription className="sr-only">
                모의투자 계좌의 예수금을 입금하거나 출금하는 창입니다.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 sm:space-y-6 pt-2 sm:pt-4">
              <div className="p-3 bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400 text-xs sm:text-sm rounded-lg border border-zinc-100 dark:border-zinc-700/60 transition-colors break-keep">
                💡 <strong>안내:</strong> 모의투자 전용 예수금 충전 및 출금
                기능입니다. 실제 계좌에는 반영되지 않습니다.
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 font-medium">
                  ₩
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={customAmount}
                  onChange={handleInputChange}
                  placeholder="금액을 입력하세요"
                  className="pl-8 h-12 sm:h-14 text-base sm:text-lg font-bold rounded-xl border-zinc-200 dark:border-zinc-700 focus-visible:ring-blue-500 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors"
                />
              </div>

              <div className="flex gap-1.5 sm:gap-2">
                {[100000, 500000, 1000000, 5000000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => addQuickAmount(amount)}
                    className="flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 py-2 rounded-lg text-[11px] sm:text-[13px] font-semibold transition-colors whitespace-nowrap"
                  >
                    +{amount / 10000}만
                  </button>
                ))}
              </div>

              <div className="flex gap-2.5 sm:gap-3">
                <Button
                  onClick={() => handleCashUpdate("withdraw")}
                  variant="outline"
                  disabled={isSubmitting}
                  className="flex-1 h-11 sm:h-12 rounded-xl text-sm sm:text-[15px] font-bold border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  {isSubmitting ? "처리 중..." : "출금"}
                </Button>
                <Button
                  onClick={() => handleCashUpdate("deposit")}
                  disabled={isSubmitting}
                  className="flex-1 h-11 sm:h-12 rounded-xl text-sm sm:text-[15px] font-bold bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white transition-colors"
                >
                  {isSubmitting ? "처리 중..." : "입금"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
