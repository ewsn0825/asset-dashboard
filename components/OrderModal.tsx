"use client";

import React, { useState, useMemo } from "react";
import { Stock } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: Stock | null;
  availableCash: number;
  activeTab: string;
}

export function OrderModal({
  isOpen,
  onClose,
  stock,
  availableCash,
  activeTab,
}: OrderModalProps) {
  const queryClient = useQueryClient();
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [orderQuantity, setOrderQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🏎️ 모달 내부 상태 일괄 리셋 유틸 함수
  const resetFormFields = () => {
    setOrderType("buy");
    setOrderQuantity("");
    setIsSubmitting(false);
  };

  // 예상 체결 금액 메모이제이션
  const totalOrderAmount = useMemo(() => {
    return (Number(orderQuantity) || 0) * (stock?.currentPrice || 0);
  }, [orderQuantity, stock?.currentPrice]);

  if (!stock) return null;

  // 숫자 전용 수량 핸들러
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    setOrderQuantity(rawValue === "0" ? "" : rawValue.replace(/^0+/, ""));
  };

  // 퀵 주수 증감 버튼
  const addQuickQuantity = (amount: number) => {
    const currentQty = Number(orderQuantity) || 0;
    setOrderQuantity(String(currentQty + amount));
  };

  // 주문 전송 핸들러
  const handleOrderSubmit = async () => {
    if (isSubmitting) return;

    const qty = Number(orderQuantity);
    if (qty <= 0) return alert("수량을 입력하세요.");

    const currentPrice = stock.currentPrice || 0;

    if (orderType === "sell" && qty > (stock.quantity || 0)) {
      return alert("보유 수량이 부족합니다.");
    }
    if (orderType === "buy" && totalOrderAmount > availableCash) {
      return alert("예수금이 부족합니다.");
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: activeTab,
          stockId: stock.id,
          orderType,
          quantity: qty,
          price: 0, // 백엔드 시장가 규칙
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "주문 실패");
      }

      // 🏎️ 낙관적 업데이트 고유 쿼리 키 명밀 매칭 (["assets", "mock"])
      queryClient.setQueriesData(
        { queryKey: ["assets", "mock"] },
        (oldAssets: Stock[] | undefined) => {
          if (!oldAssets) return oldAssets;

          return oldAssets
            .map((asset) => {
              if (asset.id === stock.id) {
                const isBuy = orderType === "buy";
                const newQty = isBuy
                  ? (asset.quantity || 0) + qty
                  : (asset.quantity || 0) - qty;

                if (newQty <= 0) return { ...asset, quantity: 0 };

                const oldAvgPrice = asset.avgPrice || 0;
                const newAvgPrice = isBuy
                  ? ((asset.quantity || 0) * oldAvgPrice + qty * currentPrice) /
                    newQty
                  : oldAvgPrice;

                const newBalance = newQty * currentPrice;
                const newPrincipal = newQty * newAvgPrice;
                const newUnrealizedProfit = newBalance - newPrincipal;
                const newReturnRate =
                  newPrincipal > 0
                    ? (newUnrealizedProfit / newPrincipal) * 100
                    : 0;

                return {
                  ...asset,
                  quantity: newQty,
                  balance: newBalance,
                  avgPrice: newAvgPrice,
                  unrealizedProfit: newUnrealizedProfit,
                  returnRate: newReturnRate,
                };
              }

              if (asset.id === "cash-balance") {
                return {
                  ...asset,
                  balance:
                    orderType === "buy"
                      ? asset.balance - totalOrderAmount
                      : asset.balance + totalOrderAmount,
                };
              }
              return asset;
            })
            .filter(
              (asset) =>
                asset.id === "cash-balance" ||
                (asset.quantity !== undefined && asset.quantity > 0),
            );
        },
      );

      alert(
        `[체결 완료] ${stock.accountName} ${qty}주 ${orderType === "buy" ? "매수" : "매도"} 완료`,
      );
      onClose();
      resetFormFields();
      queryClient.invalidateQueries({ queryKey: ["assets", "mock"] });
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert(`❌ 주문 실패: ${e.message}`);
      } else {
        alert("❌ 알 수 없는 에러가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  {
    /* 🛠️ [린트 에러 완벽 해결] 
        부수 효과 유발 영역인 useEffect를 과감히 제거하고, 
        Dialog가 유저에 의해 명시적으로 닫히는(nextOpen이 false가 되는) 시점에 
        부모의 onClose 호출과 내부 필드 일괄 리셋을 싱글 스케줄로 묶어 처리합니다. */
  }
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
          resetFormFields();
        }
      }}
    >
      <DialogContent className="w-[92vw] sm:max-w-[400px] rounded-2xl p-5 sm:p-6 dark:bg-zinc-900 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 text-left">
            {stock.accountName} 주문 (시장가)
          </DialogTitle>
          <DialogDescription className="sr-only">
            시장가로 해당 주식을 매수하거나 매도하는 창입니다.
          </DialogDescription>
          <div className="text-left text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            현재가:{" "}
            <span className="font-bold text-blue-500 dark:text-blue-400">
              {formatCurrency(stock.currentPrice || 0)}
            </span>{" "}
            원
          </div>
        </DialogHeader>

        <div className="space-y-5 sm:space-y-6 pt-2">
          {/* 매수/매도 탭 스위치 */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setOrderType("buy")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
                orderType === "buy"
                  ? "bg-white text-red-500 dark:bg-zinc-900 dark:text-red-400 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              매수
            </button>
            <button
              type="button"
              onClick={() => setOrderType("sell")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
                orderType === "sell"
                  ? "bg-white text-blue-500 dark:bg-zinc-900 dark:text-blue-400 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              매도
            </button>
          </div>

          {/* 수량 인풋 필드 */}
          <div className="relative">
            <Input
              type="text"
              inputMode="numeric"
              value={orderQuantity}
              onChange={handleQuantityChange}
              placeholder="주문 수량"
              className="pr-12 h-12 sm:h-14 text-base sm:text-lg font-bold rounded-xl border-zinc-200 dark:border-zinc-700 focus-visible:ring-blue-500 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 font-medium">
              주
            </span>
          </div>

          {/* 수량 가산 퀵 버튼 */}
          <div className="flex gap-1.5 sm:gap-2">
            {[1, 10, 50, 100].map((qty) => (
              <button
                key={qty}
                type="button"
                onClick={() => addQuickQuantity(qty)}
                className="flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 py-2 rounded-lg text-[12px] sm:text-[13px] font-semibold transition-colors whitespace-nowrap"
              >
                +{qty}주
              </button>
            ))}
          </div>

          {/* 최종 정산 영수증 영역 */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl flex justify-between items-center border border-zinc-100 dark:border-zinc-700/60">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              총 예상 금액 (현재가 기준)
            </span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(totalOrderAmount)} 원
            </span>
          </div>

          {/* 최종 액션 버튼 */}
          <Button
            onClick={handleOrderSubmit}
            disabled={
              isSubmitting || !orderQuantity || Number(orderQuantity) <= 0
            }
            className={`w-full h-12 sm:h-14 rounded-xl text-[15px] sm:text-base font-bold text-white transition-colors ${
              orderType === "buy"
                ? "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                : "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            }`}
          >
            {isSubmitting
              ? "주문 전송 중..."
              : `${orderType === "buy" ? "매수" : "매도"}하기`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
