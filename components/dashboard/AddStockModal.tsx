"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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

// ✅ 1. 외부 JSON 데이터 및 중앙 관리 타입 임포트
import stockList from "@/data/stocks.json";
import { StockItem } from "@/types";

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

export function AddStockModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);

  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [quantity, setQuantity] = useState("");

  const wrapperRef = useRef<HTMLDivElement>(null);
  const activeTab = useAssetStore((state) => state.activeTab);
  const queryClient = useQueryClient();
  const { data: assets = [] } = useAssets();

  const availableCash = useMemo(() => {
    const cashAsset = assets.find((a) => a.id === "cash-balance");
    return cashAsset ? cashAsset.balance : 0;
  }, [assets]);

  const totalAmount = useMemo(() => {
    return (Number(quantity) || 0) * (currentPrice || 0);
  }, [quantity, currentPrice]);

  useEffect(() => {
    const initTimer = setTimeout(() => setIsMarketOpen(checkIsMarketOpen()), 0);
    const interval = setInterval(
      () => setIsMarketOpen(checkIsMarketOpen()),
      60000,
    );
    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSearchTerm("");
        setSelectedStock(null);
        setCurrentPrice(null);
        setQuantity("");
        setIsDropdownOpen(false);
        setIsSubmitting(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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

  // ✅ 2. 시가총액(marketCap) 기준 내림차순 정렬 및 10개 제한
  const filteredStocks = useMemo(() => {
    if (!searchTerm) return [];
    return stockList
      .filter(
        (stock) =>
          stock.name.includes(searchTerm) || stock.id.includes(searchTerm),
      )
      .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0)) // 내림차순 정렬
      .slice(0, 10); // 상위 10개
  }, [searchTerm]);

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
    setQuantity(e.target.value.replace(/[^0-9]/g, ""));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedStock || !currentPrice || !quantity) return;

    if (totalAmount > availableCash) {
      alert(
        `예수금이 부족합니다.\n필요 금액: ${formatCurrency(totalAmount)}원`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: activeTab,
          stockId: selectedStock.id,
          orderType: "buy",
          quantity: Number(quantity),
          price: currentPrice,
        }),
      });
      if (!response.ok) throw new Error("주문 처리 실패");
      alert(`[체결 완료] ${selectedStock.name} 매수 완료!`);
      await queryClient.invalidateQueries({ queryKey: ["assets"] });
      setIsOpen(false);
    } catch (error) {
      alert("주문 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          disabled={!isMarketOpen}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${isMarketOpen ? "bg-zinc-900 text-white hover:bg-zinc-800" : "bg-zinc-200 cursor-not-allowed"}`}
        >
          {isMarketOpen ? "신규 매수 +" : "장 마감"}
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] rounded-2xl dark:bg-zinc-900 p-6">
        <DialogHeader>
          <DialogTitle>신규 매수</DialogTitle>
          <DialogDescription>
            종목을 검색하고 수량을 입력하세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="relative" ref={wrapperRef}>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="종목명 검색 (시총 높은 순)"
              className="w-full p-3.5 bg-zinc-50 rounded-xl border border-zinc-200"
            />
            {isDropdownOpen && filteredStocks.length > 0 && (
              <ul className="absolute z-10 w-full mt-2 bg-white border rounded-xl shadow-xl max-h-56 overflow-y-auto">
                {filteredStocks.map((stock) => (
                  <li
                    key={stock.id}
                    onClick={() => handleSelectStock(stock)}
                    className="px-4 py-3 cursor-pointer hover:bg-zinc-100 flex justify-between"
                  >
                    <span className="font-bold">{stock.name}</span>
                    <span className="text-zinc-400">{stock.id}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="text-xl font-bold">
            예상가: {currentPrice ? formatCurrency(totalAmount) : "-"} 원
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !currentPrice}
            className="w-full py-4 bg-red-500 text-white rounded-xl font-bold"
          >
            {isSubmitting ? "주문 중..." : "매수 주문하기"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
