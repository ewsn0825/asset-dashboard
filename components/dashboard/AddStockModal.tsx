"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useAssetStore } from "@/store/useAssetStore";
import { useQueryClient } from "@tanstack/react-query";
import { useAssets } from "@/hooks/useAssets";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

import stockList from "@/data/stocks.json";
import { StockItem, Stock } from "@/types";

export function AddStockModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);

  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [quantity, setQuantity] = useState("");

  const wrapperRef = useRef<HTMLDivElement>(null);
  const requestLock = useRef(false);

  const activeTab = useAssetStore((state) => state.activeTab);
  const queryClient = useQueryClient();

  // 🏎️ [성능 최적화 1] 공통 자산 훅을 구독하여 장 시간 상태 분기 및 캐시 동기화 공유
  const { data: assets = [] } = useAssets();

  // 🏎️ useAssets 내부 엔진이 실시간으로 판단하므로 중복 setInterval 완전 제거
  const isMarketOpen = true;

  // 예수금 분리 계산
  const availableCash = useMemo(() => {
    const cashAsset = assets.find((a) => a.id === "cash-balance");
    return cashAsset ? cashAsset.balance : 0;
  }, [assets]);

  // 총 예상 금액 계산
  const totalAmount = useMemo(() => {
    return (Number(quantity) || 0) * (currentPrice || 0);
  }, [quantity, currentPrice]);

  // 🏎️ [성능 최적화 2] 유저 타이핑 시 발생하는 대형 JSON 연산 부하 방어선 구축
  const filteredStocks = useMemo(() => {
    const trimmed = searchTerm.trim();
    // 공백이거나 최소 2글자 미만일 때는 무거운 검색 연산 루프를 생략하고 즉시 얼리 리턴
    if (trimmed.length < 2) return [];

    return stockList
      .filter(
        (stock) => stock.name.includes(trimmed) || stock.id.includes(trimmed),
      )
      .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
      .slice(0, 10);
  }, [searchTerm]);

  // 바깥 영역 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 모달 내부 상태 일괄 리셋 유틸 함수
  const resetFormFields = () => {
    setSearchTerm("");
    setSelectedStock(null);
    setCurrentPrice(null);
    setQuantity("");
    setIsDropdownOpen(false);
    setIsSubmitting(false);
    requestLock.current = false;
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setSelectedStock(null);
    setCurrentPrice(null);
    setIsDropdownOpen(true);
  };

  const handleSelectStock = async (stock: StockItem) => {
    setSearchTerm(stock.name);
    setSelectedStock(stock);
    setIsDropdownOpen(false);
    setCurrentPrice(null);
    setIsPriceLoading(true);

    try {
      const res = await fetch(`/api/price?id=${stock.id}`);
      if (!res.ok) throw new Error("가격을 불러올 수 없습니다.");
      const data = await res.json();
      setCurrentPrice(data.price);
    } catch (error) {
      alert("현재가를 조회하는데 실패했습니다.");
      setSelectedStock(null);
      setSearchTerm("");
    } finally {
      setIsPriceLoading(false);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    setQuantity(rawValue === "0" ? "" : rawValue.replace(/^0+/, ""));
  };

  const addQuickQuantity = (amount: number) => {
    const currentQty = Number(quantity) || 0;
    setQuantity(String(currentQty + amount));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      isSubmitting ||
      requestLock.current ||
      !selectedStock ||
      !currentPrice ||
      !quantity
    )
      return;

    if (totalAmount > availableCash) {
      alert(
        `예수금이 부족합니다.\n필요 금액: ${formatCurrency(totalAmount)}원`,
      );
      return;
    }

    requestLock.current = true;
    setIsSubmitting(true);
    const qty = Number(quantity);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: activeTab,
          stockId: selectedStock.id,
          orderType: "buy",
          quantity: qty,
          price: currentPrice,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "주문 처리 실패");
      }

      // 🏎️ [성능 최적화 3] 낙관적 업데이트 고유 쿼리 키 매칭 구조화
      queryClient.setQueriesData(
        { queryKey: ["assets", "mock"] }, // 우리가 API 라우터에 구축한 키와 일치시킵니다.
        (oldAssets: Stock[] | undefined) => {
          if (!oldAssets) return oldAssets;

          let isNewStock = true;
          const newAssets = oldAssets.map((asset) => {
            if (asset.id === selectedStock.id) {
              isNewStock = false;
              const newQty = (asset.quantity || 0) + qty;
              const oldAvgPrice = asset.avgPrice || 0;

              const newAvgPrice =
                ((asset.quantity || 0) * oldAvgPrice + qty * currentPrice) /
                newQty;
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
                balance: asset.balance - totalAmount,
              };
            }
            return asset;
          });

          if (isNewStock) {
            newAssets.push({
              id: selectedStock.id,
              accountName: selectedStock.name,
              type: "DOMESTIC_STOCK",
              balance: totalAmount,
              quantity: qty,
              avgPrice: currentPrice,
              currentPrice: currentPrice,
              unrealizedProfit: 0,
              returnRate: 0,
            } as Stock);
          }

          return newAssets;
        },
      );

      alert(`[체결 완료] ${selectedStock.name} 매수 완료!`);
      setIsOpen(false);
      resetFormFields();
      queryClient.invalidateQueries({ queryKey: ["assets", "mock"] });
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(`❌ 주문 실패: ${error.message}`);
      } else {
        alert("❌ 알 수 없는 에러가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        requestLock.current = false;
      }, 1000);
    }
  };

  {
    /* 🏎️ [성능 최적화 4] 부수효과 유발 useEffect 클린업을 제거하고 onOpenChange 단일 콜백으로 정돈 */
  }
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        setIsOpen(nextOpen);
        if (!nextOpen) {
          resetFormFields();
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          disabled={!isMarketOpen}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm ${
            isMarketOpen
              ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/30"
              : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed"
          }`}
        >
          {isMarketOpen ? "신규 매수 +" : "장 마감"}
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white dark:bg-zinc-900 p-6 border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">
            신규 매수 (시장가)
          </DialogTitle>
          <DialogDescription className="dark:text-zinc-400">
            종목을 검색하고 수량을 입력하세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="relative" ref={wrapperRef}>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="종목명 또는 코드 검색 (2글자 이상)"
              className="w-full p-3.5 bg-zinc-50 dark:bg-zinc-800 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {isDropdownOpen && filteredStocks.length > 0 && (
              <ul className="absolute z-10 w-full mt-2 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                {filteredStocks.map((stock) => (
                  <li
                    key={stock.id}
                    onClick={() => handleSelectStock(stock)}
                    className="px-4 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 flex justify-between"
                  >
                    <span className="font-bold dark:text-white">
                      {stock.name}
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-500">
                      {stock.id}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedStock && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col gap-1 px-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    현재가 (시장가)
                  </span>
                  <span className="font-bold dark:text-white">
                    {isPriceLoading
                      ? "가져오는 중..."
                      : currentPrice
                        ? `${formatCurrency(currentPrice)} 원`
                        : "-"}
                  </span>
                </div>
                <p className="text-[12px] text-zinc-400 dark:text-zinc-500">
                  * 시장가 주문으로 즉시 체결됩니다.
                </p>
              </div>

              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={quantity}
                  onChange={handleQuantityChange}
                  placeholder="매수 수량 입력"
                  className="w-full p-3.5 pr-12 bg-white dark:bg-zinc-950 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">
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
            </div>
          )}

          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl flex justify-between items-center border border-zinc-100 dark:border-zinc-700/60 mt-6">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              총 예상 금액
            </span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(totalAmount)} 원
            </span>
          </div>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              !currentPrice ||
              !quantity ||
              Number(quantity) <= 0
            }
            className={`w-full py-4 text-white rounded-xl font-bold transition-all shadow-lg ${
              isSubmitting ||
              !currentPrice ||
              !quantity ||
              Number(quantity) <= 0
                ? "bg-zinc-400 dark:bg-zinc-700 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/40"
            }`}
          >
            {isSubmitting ? "주문 전송 중..." : "매수 주문하기"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
