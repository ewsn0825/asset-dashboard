"use client";

import { useState, useMemo } from "react";
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
import { FileSearch, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { formatCurrency, getProfitColorClass } from "@/lib/utils";
import { OrderModal } from "@/components/OrderModal";
import { Stock } from "@/types";

// 정렬 타입 정의
type SortKey = "balance" | "unrealizedProfit" | "returnRate";

export function StockTable() {
  const activeTab = useAssetStore((state) => state.activeTab);

  // 🏎️ [성능 최적화 1] select가 적용된 훅을 사용하여 현재 탭의 데이터만 가볍게 수신
  const { data: currentTabAssets = [] } = useAssets(activeTab);
  // 예수금(Cash) 데이터는 전체 캐시에서 안전하게 찾아오기 위해 인자 없이 단독 호출 (캐시 공유됨)
  const { data: allAssets = [] } = useAssets();

  // 🛠️ UX/UI 상태 관리
  const [sortKey, setSortKey] = useState<SortKey>("balance"); // 기본값: 평가금액 순
  const [isExpanded, setIsExpanded] = useState(false); // 더보기 상태
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // 🏎️ [성능 최적화 2] 훅 내부에서 장 상태를 판단하므로 중복 setInterval 타이머 완전 제거
  // useAssets 내부의 상태를 공유받거나, 임시로 상시 오픈 처리 (훅의 refetchInterval 메커니즘 활용 권장)
  const isMarketOpen = true; // 실제 비즈니스 로직에 맞게 훅이나 글로벌 상태에서 주입받도록 단순화 가능

  // 🏎️ [성능 최적화 3] 데이터 필터링 및 정렬 연산을 useMemo로 메모이제이션
  const { currentStocks, availableCash } = useMemo(() => {
    // 1. 현금성 자산 분리 및 예수금 계산
    const stocksOnly = currentTabAssets.filter(
      (asset) => asset.id !== "cash-balance",
    );
    const cashAsset = allAssets.find((asset) => asset.id === "cash-balance");
    const cash = cashAsset ? cashAsset.balance : 0;

    // 2. 증권사 스펙 정렬 로직 (선택된 정렬 기준 내림차순)
    const sorted = [...stocksOnly].sort((a, b) => {
      const valA = a[sortKey] ?? 0;
      const valB = b[sortKey] ?? 0;
      return valB - valA; // 내림차순 정렬
    });

    return {
      currentStocks: sorted as Stock[],
      availableCash: cash,
    };
  }, [currentTabAssets, allAssets, sortKey]);

  // 📄 UX 최적화: 기본 5개 노출 후 더보기를 누르면 전체 노출
  const visibleStocks = isExpanded ? currentStocks : currentStocks.slice(0, 5);

  const handleOpenOrder = (stock: Stock) => {
    setSelectedStock(stock);
    setIsOrderModalOpen(true);
  };

  if (currentStocks.length === 0) {
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
    <div className="w-full space-y-4">
      {/* ⚙️ 증권사 스타일 정렬 컨트롤러 (모바일/데스크탑 공용) */}
      <div className="flex items-center justify-end gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 px-1">
        <span className="text-zinc-400 dark:text-zinc-500">정렬 기준:</span>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="bg-zinc-100 dark:bg-zinc-800 border-0 rounded-lg px-2.5 py-1.5 font-semibold text-zinc-700 dark:text-zinc-300 focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700 outline-none cursor-pointer"
        >
          <option value="balance">평가금액 높은순</option>
          <option value="unrealizedProfit">평가손익 높은순</option>
          <option value="returnRate">수익률 높은순</option>
        </select>
      </div>

      {/* 📱 1. 모바일 뷰 (세로 리스트 형태) */}
      <div className="flex flex-col gap-4 md:hidden">
        {visibleStocks.map((stock) => {
          const colorClass = getProfitColorClass(stock.returnRate);

          return (
            <div
              key={stock.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-sm transition-colors"
            >
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800/60 pb-3 mb-3">
                <div>
                  <div className="text-zinc-900 dark:text-zinc-100 font-bold text-base">
                    {stock.accountName}
                  </div>
                  <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {stock.id}
                  </div>
                </div>
                <button
                  onClick={() => handleOpenOrder(stock)}
                  disabled={!isMarketOpen}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all active:scale-95 ${
                    isMarketOpen
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600"
                  }`}
                >
                  주문
                </button>
              </div>

              <div className="flex flex-col gap-2.5 text-[14px]">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs">
                    보유 수량
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {stock.quantity?.toLocaleString() || 0}주
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs">
                    매수평균가 / 현재가
                  </span>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {formatCurrency(stock.avgPrice || 0)}{" "}
                    <span className="text-zinc-300 dark:text-zinc-600 px-0.5">
                      /
                    </span>{" "}
                    {formatCurrency(stock.currentPrice || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs">
                    평가 금액
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(stock.balance)}
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
                      {(stock.unrealizedProfit || 0) > 0 ? "+" : ""}
                      {formatCurrency(stock.unrealizedProfit || 0)}
                    </span>
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-opacity-10 dark:bg-opacity-20 bg-current">
                      {(stock.returnRate || 0) > 0 ? "+" : ""}
                      {(stock.returnRate || 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 💻 2. 데스크탑 뷰 (Table 형태) */}
      <div className="hidden md:block rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/70 dark:bg-zinc-800/50">
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
            {visibleStocks.map((stock) => {
              const colorClass = getProfitColorClass(stock.returnRate);

              return (
                <TableRow
                  key={stock.id}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors border-b-zinc-100 dark:border-b-zinc-800/60 last:border-0"
                >
                  <TableCell className="font-medium py-3">
                    <div className="text-zinc-900 dark:text-zinc-100 font-bold">
                      {stock.accountName}
                    </div>
                    <div className="text-[13px] text-zinc-400 dark:text-zinc-500 font-normal mt-0.5">
                      {stock.id}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-zinc-700 dark:text-zinc-300 font-medium">
                    {stock.quantity?.toLocaleString() || 0}주
                  </TableCell>
                  <TableCell className="text-right text-zinc-600 dark:text-zinc-400">
                    {formatCurrency(stock.avgPrice || 0)}
                  </TableCell>
                  <TableCell className="text-right text-zinc-600 dark:text-zinc-400 font-medium">
                    {formatCurrency(stock.currentPrice || 0)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-zinc-800 dark:text-zinc-200">
                    {formatCurrency(stock.balance)}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${colorClass}`}>
                    <div>
                      {(stock.unrealizedProfit || 0) > 0 ? "+" : ""}
                      {formatCurrency(stock.unrealizedProfit || 0)}
                    </div>
                    <div className="text-[13px] font-semibold mt-0.5 opacity-90">
                      {(stock.returnRate || 0) > 0 ? "+" : ""}
                      {(stock.returnRate || 0).toFixed(2)}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleOpenOrder(stock)}
                      disabled={!isMarketOpen}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all active:scale-95 ${
                        isMarketOpen
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                          : "bg-zinc-100 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600"
                      }`}
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

      {/* 🔽 3. 종목이 5개 초과일 때만 노출되는 '더보기 / 접기' 버튼 UI */}
      {currentStocks.length > 5 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-1 py-3 text-sm font-semibold text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 rounded-xl transition-all shadow-sm active:scale-[0.99]"
        >
          {isExpanded ? (
            <>
              접기 <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              보유 종목 {currentStocks.length - 5}개 더보기{" "}
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}

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
