"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAssetStore } from "@/store/useAssetStore";
import { useAssets } from "@/hooks/useAssets";
import { FileSearch } from "lucide-react";
import { formatCurrency, getProfitColorClass } from "@/lib/utils";
import { OrderModal } from "@/components/OrderModal";
import { Stock } from "@/types"; // ✅ 1. 정의해둔 Stock 타입을 불러옵니다.

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

export function StockTable() {
  const activeTab = useAssetStore((state) => state.activeTab);
  const { data: assets = [] } = useAssets();

  const [isMarketOpen, setIsMarketOpen] = useState(false);

  // ✅ 2. any 대신 Stock | null 타입 지정 (에러 해결)
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

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

  const currentStocks = assets.filter((asset) => {
    if (asset.id === "cash-balance") return false;
    if (activeTab === "CMA") return asset.type === "CMA";
    if (activeTab === "ISA") return asset.type === "ISA";
    return asset.type === "DOMESTIC_STOCK";
  });

  // 매수 기능 보호를 위한 예수금 계산
  const cashAsset = assets.find((asset) => asset.id === "cash-balance");
  const availableCash = cashAsset ? cashAsset.balance : 0;

  // ✅ 3. 매개변수 stock에 Stock 타입 지정 (에러 해결)
  const handleOpenOrder = (stock: Stock) => {
    setSelectedStock(stock);
    setIsOrderModalOpen(true);
  };

  if (!currentStocks || currentStocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full text-center border border-zinc-200/80 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm transition-colors duration-300 h-[350px]">
        <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
          <FileSearch className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
        </div>
        <p className="text-[15px] font-semibold text-zinc-600 dark:text-zinc-300">
          보유한 자산 내역이 없습니다.
        </p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1 break-keep">
          모의투자 계좌에 보유 중인 종목이 이곳에 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 📱 1. 모바일 뷰 (세로 리스트 형태) */}
      <div className="flex flex-col gap-4 md:hidden">
        {currentStocks.map((stock) => {
          // 💡 타입 단언을 통해 Stock 객체로 안전하게 변환
          const typedStock = stock as Stock;
          const colorClass = getProfitColorClass(typedStock.returnRate);

          return (
            <div
              key={typedStock.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800/60 pb-3 mb-3">
                <div>
                  <div className="text-zinc-900 dark:text-zinc-100 font-bold text-base">
                    {typedStock.accountName}
                  </div>
                  <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {typedStock.id}
                  </div>
                </div>
                <button
                  onClick={() => handleOpenOrder(typedStock)}
                  disabled={!isMarketOpen}
                  className={`px-4 py-2 text-xs font-bold rounded-lg ${isMarketOpen ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-100 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600"}`}
                >
                  주문
                </button>
              </div>

              {/* ✅ 생략되었던 하단 상세 렌더링 코드 복구 */}
              <div className="flex flex-col gap-2.5 text-[14px]">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs">
                    보유 수량
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {typedStock.quantity?.toLocaleString() || 0}주
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs">
                    매수평균가 / 현재가
                  </span>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {formatCurrency(typedStock.avgPrice || 0)}{" "}
                    <span className="text-zinc-300 dark:text-zinc-600 px-0.5">
                      /
                    </span>{" "}
                    {formatCurrency(typedStock.currentPrice || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs">
                    평가 금액
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(typedStock.balance)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 mt-1 border-t border-zinc-50 dark:border-zinc-800/30">
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                    평가 손익
                  </span>
                  <div
                    className={`text-right font-bold flex items-center gap-1.5 ${colorClass}`}
                  >
                    <span>
                      {(typedStock.unrealizedProfit || 0) > 0 ? "+" : ""}
                      {formatCurrency(typedStock.unrealizedProfit || 0)}
                    </span>
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-opacity-10 dark:bg-opacity-20 bg-current">
                      {(typedStock.returnRate || 0) > 0 ? "+" : ""}
                      {(typedStock.returnRate || 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 💻 2. 데스크탑 뷰 (Table 형태) */}
      <div className="hidden md:block rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden h-full">
        <Table>
          <TableHeader className="bg-zinc-50/70 dark:bg-zinc-800/50">
            {/* ✅ 생략되었던 테이블 헤더 복구 */}
            <TableRow className="border-b-zinc-200/80 dark:border-b-zinc-700/50 hover:bg-transparent">
              <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400 whitespace-nowrap h-12">
                종목명
              </TableHead>
              <TableHead className="text-right font-semibold text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                수량
              </TableHead>
              <TableHead className="text-right font-semibold text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                매수평균가
              </TableHead>
              <TableHead className="text-right font-semibold text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                현재가
              </TableHead>
              <TableHead className="text-right font-semibold text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                평가금액
              </TableHead>
              <TableHead className="text-right font-semibold text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                평가손익
              </TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentStocks.map((stock) => {
              const typedStock = stock as Stock;
              const colorClass = getProfitColorClass(typedStock.returnRate);

              return (
                <TableRow
                  key={typedStock.id}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors border-b-zinc-100 dark:border-b-zinc-800/60 last:border-0"
                >
                  {/* ✅ 생략되었던 테이블 셀 데이터 복구 */}
                  <TableCell className="font-medium py-3">
                    <div className="text-zinc-900 dark:text-zinc-100 font-bold transition-colors">
                      {typedStock.accountName}
                    </div>
                    <div className="text-[13px] text-zinc-400 dark:text-zinc-500 font-normal mt-0.5">
                      {typedStock.id}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-zinc-700 dark:text-zinc-300 font-medium transition-colors">
                    {typedStock.quantity?.toLocaleString() || 0}주
                  </TableCell>
                  <TableCell className="text-right text-zinc-600 dark:text-zinc-400 transition-colors">
                    {formatCurrency(typedStock.avgPrice || 0)}
                  </TableCell>
                  <TableCell className="text-right text-zinc-600 dark:text-zinc-400 font-medium transition-colors">
                    {formatCurrency(typedStock.currentPrice || 0)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-zinc-800 dark:text-zinc-200 transition-colors">
                    {formatCurrency(typedStock.balance)}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${colorClass}`}>
                    <div>
                      {(typedStock.unrealizedProfit || 0) > 0 ? "+" : ""}
                      {formatCurrency(typedStock.unrealizedProfit || 0)}
                    </div>
                    <div className="text-[13px] font-semibold mt-0.5 opacity-90">
                      {(typedStock.returnRate || 0) > 0 ? "+" : ""}
                      {(typedStock.returnRate || 0).toFixed(2)}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleOpenOrder(typedStock)}
                      disabled={!isMarketOpen}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md ${isMarketOpen ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-100 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600"}`}
                    >
                      주문
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        stock={selectedStock}
        availableCash={availableCash}
        activeTab={activeTab}
      />
    </div>
  );
}
