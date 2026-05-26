"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setOrderType("buy");
        setOrderQuantity("");
        setIsSubmitting(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!stock) return null;

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    setOrderQuantity(rawValue);
  };

  const addQuickQuantity = (amount: number) => {
    const currentQty = Number(orderQuantity) || 0;
    setOrderQuantity(String(currentQty + amount));
  };

  const handleOrderSubmit = async () => {
    if (isSubmitting) return;

    const qty = Number(orderQuantity);
    if (qty <= 0) return alert("수량을 입력하세요.");

    const currentPrice = stock.currentPrice || 0;
    const totalOrderAmount = qty * currentPrice;

    if (orderType === "sell" && qty > (stock.quantity || 0))
      return alert("보유 수량 부족");
    if (orderType === "buy" && totalOrderAmount > availableCash)
      return alert("예수금 부족");

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
          price: 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "주문 실패");
      }

      // 💡 [핵심] 완벽한 낙관적 업데이트 로직 (평단가 재계산 및 0주 삭제)
      queryClient.setQueriesData(
        { queryKey: ["assets"] },
        (oldAssets: Stock[] | undefined) => {
          if (!oldAssets) return oldAssets;

          return (
            oldAssets
              .map((asset) => {
                if (asset.id === stock.id) {
                  const isBuy = orderType === "buy";
                  const newQty = isBuy
                    ? (asset.quantity || 0) + qty
                    : (asset.quantity || 0) - qty;

                  // 매도로 인해 수량이 0이 되면 대충 넘김 (어차피 아래 filter에서 삭제됨)
                  if (newQty <= 0) return { ...asset, quantity: 0 };

                  // 평단가 계산 (매수 시에만 평단가가 섞이고, 매도 시에는 기존 평단가 유지)
                  const oldAvgPrice = asset.avgPrice || 0;
                  const newAvgPrice = isBuy
                    ? ((asset.quantity || 0) * oldAvgPrice +
                        qty * currentPrice) /
                      newQty
                    : oldAvgPrice;

                  // 새로운 평가금액, 손익, 수익률 계산
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
              // 💡 UX 버그 해결: 수량이 0이 된 종목은 배열에서 즉시 제거!
              .filter(
                (asset) =>
                  asset.id === "cash-balance" ||
                  (asset.quantity !== undefined && asset.quantity > 0),
              )
          );
        },
      );

      alert(
        `[체결 완료] ${stock.accountName} ${qty}주 ${orderType === "buy" ? "매수" : "매도"} 완료`,
      );

      onClose();
      queryClient.invalidateQueries({ queryKey: ["assets"] });
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[92vw] sm:max-w-[400px] rounded-2xl p-5 sm:p-6 dark:bg-zinc-900 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 text-left">
            {stock.accountName} 주문 (시장가)
          </DialogTitle>
          <DialogDescription className="text-left text-sm text-zinc-500 dark:text-zinc-400">
            현재가:{" "}
            <span className="font-bold text-blue-500 dark:text-blue-400">
              {formatCurrency(stock.currentPrice || 0)}
            </span>
            원
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 sm:space-y-6 pt-2">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
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

          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl flex justify-between items-center border border-zinc-100 dark:border-zinc-700/60">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              총 예상 금액 (현재가 기준)
            </span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(
                (Number(orderQuantity) || 0) * (stock.currentPrice || 0),
              )}
            </span>
          </div>

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
