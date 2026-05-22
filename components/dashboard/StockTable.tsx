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

// ✅ 장 시간 체크 함수 (한국 표준시 기준)
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

  // ✅ 1. 장 상태 관리 추가 (Hydration 에러 방지)
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      setIsMarketOpen(checkIsMarketOpen());
    }, 0);

    const interval = setInterval(() => {
      setIsMarketOpen(checkIsMarketOpen());
    }, 60000); // 1분마다 장 상태 체크

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, []);

  const currentStocks = assets.filter((asset) => {
    // 예수금은 주식 목록 테이블에서 무조건 제외
    if (asset.id === "cash-balance") return false;

    if (activeTab === "CMA") return asset.type === "CMA";
    if (activeTab === "ISA") return asset.type === "ISA";
    return asset.type === "DOMESTIC_STOCK"; // 일반 계좌
  });

  if (!currentStocks || currentStocks.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center w-full text-center border border-zinc-200/80 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm transition-colors duration-300"
        style={{ height: "350px" }}
      >
        <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-4 transition-colors">
          <FileSearch className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
        </div>
        <p className="text-[15px] font-semibold text-zinc-600 dark:text-zinc-300">
          보유한 자산 내역이 없습니다.
        </p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
          {/* ✅ 2. 문구를 모의투자에 맞게 수정 */}
          모의투자 계좌에 보유 중인 종목이 이곳에 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden h-full transition-colors duration-300">
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
            {/* 버튼이 들어갈 자리 너비 조정 */}
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentStocks.map((stock) => {
            const profitRate = stock.returnRate;
            const unrealizedProfit = stock.unrealizedProfit || 0;
            const colorClass = getProfitColorClass(profitRate);

            return (
              <TableRow
                key={stock.id}
                className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors border-b-zinc-100 dark:border-b-zinc-800/60 last:border-0"
              >
                <TableCell className="font-medium py-3">
                  <div className="text-zinc-900 dark:text-zinc-100 font-bold transition-colors">
                    {stock.accountName}
                  </div>
                  <div className="text-[13px] text-zinc-400 dark:text-zinc-500 font-normal mt-0.5">
                    {stock.id}
                  </div>
                </TableCell>
                <TableCell className="text-right text-zinc-700 dark:text-zinc-300 font-medium transition-colors">
                  {stock.quantity?.toLocaleString() || 0}주
                </TableCell>
                <TableCell className="text-right text-zinc-600 dark:text-zinc-400 transition-colors">
                  {formatCurrency(stock.avgPrice || 0)}
                </TableCell>
                <TableCell className="text-right text-zinc-600 dark:text-zinc-400 font-medium transition-colors">
                  {formatCurrency(stock.currentPrice || 0)}
                </TableCell>
                <TableCell className="text-right font-bold text-zinc-800 dark:text-zinc-200 transition-colors">
                  {formatCurrency(stock.balance)}
                </TableCell>
                <TableCell className={`text-right font-bold ${colorClass}`}>
                  <div>
                    {unrealizedProfit > 0 ? "+" : ""}
                    {formatCurrency(unrealizedProfit)}
                  </div>
                  <div className="text-[13px] font-semibold mt-0.5 opacity-90">
                    ({profitRate > 0 ? "+" : ""}
                    {profitRate.toFixed(2)}%)
                  </div>
                </TableCell>
                <TableCell>
                  {/* ✅ 3. 삭제 버튼 대신 주문(매매) 버튼으로 교체 및 활성화 로직 적용 */}
                  <button
                    onClick={() =>
                      alert(`${stock.accountName} 매수/매도 폼을 띄웁니다!`)
                    }
                    disabled={!isMarketOpen}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      isMarketOpen
                        ? "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200" // 장 중: 활성화
                        : "bg-zinc-100 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600" // 장 마감: 비활성화
                    }`}
                    title={isMarketOpen ? "주문하기" : "장 마감으로 주문 불가"}
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
  );
}
