"use client";

import { useState, useRef, useEffect } from "react";
import { debounce } from "lodash-es";
import { useAssetStore } from "@/store/useAssetStore";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

// ✅ 서버 시간 차이(UTC)를 무시하고 KST(한국 표준시) 기준으로 장 시간 체크
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

  // ✅ 매수(BUY) / 매도(SELL) 상태 추가
  const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY");

  const [searchTerm, setSearchTerm] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  const activeTab = useAssetStore((state) => state.activeTab);
  const queryClient = useQueryClient();

  // 클라이언트 사이드 장 시간 갱신 (Hydration 방지)
  useEffect(() => {
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

  const debouncedSearchRef = useRef(
    debounce((query: string) => {
      if (!query.trim()) return;
      console.log(`🚀 [종목 검색 API 호출]: "${query}"`);
    }, 500),
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearchRef.current(value);
  };

  useEffect(() => {
    return () => {
      debouncedSearchRef.current.cancel();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !isMarketOpen) return;

    if (!searchTerm || !price || !quantity) {
      alert("종목명, 단가, 수량을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. 주문 체결 시뮬레이션 지연 (추후 진짜 POST /api/orders API로 교체)
      await new Promise((resolve) => setTimeout(resolve, 600));

      const orderTypeName = orderType === "BUY" ? "매수" : "매도";
      alert(
        `[모의투자] ${searchTerm} ${quantity}주가 ${Number(price).toLocaleString()}원에 ${orderTypeName} 체결되었습니다.`,
      );

      // 2. 💡 [핵심] "real" 대신 "mock" 쿼리키를 무효화하여 폴링 없이 즉각 대시보드를 갱신합니다.
      await queryClient.invalidateQueries({ queryKey: ["assets", "mock"] });

      // 3. 모달 및 폼 초기화
      setIsOpen(false);
      setSearchTerm("");
      setQuantity("");
      setPrice("");
      setOrderType("BUY");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {/* ✅ 장이 닫혀있으면 버튼 비활성화 처리 */}
        <button
          disabled={!isMarketOpen}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            isMarketOpen
              ? "bg-zinc-900 text-white hover:bg-zinc-800"
              : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
          }`}
        >
          {isMarketOpen ? "주문하기 +" : "장 마감 (주문 불가)"}
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{activeTab} 모의투자 주문</DialogTitle>
          <DialogDescription className="sr-only">
            모의투자 매수 및 매도 주문을 입력하는 폼입니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* ✅ 매수 / 매도 선택 탭 */}
          <div className="flex p-1 bg-zinc-100 rounded-lg">
            <button
              type="button"
              onClick={() => setOrderType("BUY")}
              className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${
                orderType === "BUY"
                  ? "bg-white text-red-500 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              매수
            </button>
            <button
              type="button"
              onClick={() => setOrderType("SELL")}
              className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${
                orderType === "SELL"
                  ? "bg-white text-blue-500 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              매도
            </button>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-zinc-700">
                종목 검색
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="종목명 또는 종목코드 입력"
                className="w-full mt-1.5 p-2.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-shadow"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-700">
                  주문 단가
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  className="w-full mt-1.5 p-2.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-shadow"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700">
                  주문 수량
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className="w-full mt-1.5 p-2.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-shadow"
                  required
                />
              </div>
            </div>
          </div>

          {/* 제출 버튼: 매수/매도 상태에 따라 색상 변경 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-lg text-white font-bold transition-colors mt-6 
              ${
                isSubmitting
                  ? "bg-zinc-300 cursor-not-allowed"
                  : orderType === "BUY"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
              }`}
          >
            {isSubmitting
              ? "주문 전송 중..."
              : `${orderType === "BUY" ? "매수" : "매도"} 주문하기`}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
