"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAssetStore } from "@/store/useAssetStore";
import { Trash2, FileSearch } from "lucide-react"; // ✨ 빈 화면용 아이콘(FileSearch) 추가

import {
  formatCurrency,
  getProfitColorClass,
  calculateStockProfitRate,
} from "@/lib/utils";

export function StockTable() {
  // ✅ 1. 현재 대시보드에서 활성화된 탭(계좌)을 가져옵니다.
  const activeTab = useAssetStore((state) => state.activeTab);
  const stocks = useAssetStore((state) => state.stocks);
  const deleteStock = useAssetStore((state) => state.deleteStock);

  // ✅ 2. 전체 종목이 아닌 "현재 선택된 탭(계좌)"의 종목만 걸러냅니다.
  const currentStocks = stocks.filter(
    (stock) => stock.accountType === activeTab,
  );

  // 3. 필터링된 데이터가 없을 때 보여줄 빈 화면 (도넛 차트와 디자인 통일)
  if (!currentStocks || currentStocks.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center w-full text-center border border-zinc-200/80 rounded-2xl bg-white shadow-sm"
        style={{ height: "350px" }}
      >
        {/* ✨ 차트와 어울리는 부드러운 회색 원형 배경 + 아이콘 */}
        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
          <FileSearch className="w-8 h-8 text-zinc-300" />
        </div>
        <p className="text-[15px] font-semibold text-zinc-600">
          등록된 보유 종목이 없습니다.
        </p>
        <p className="text-sm text-zinc-400 mt-1">
          {"우측 상단의 '종목 추가 +' 버튼을 눌러 자산을 등록해보세요."}
        </p>
      </div>
    );
  }

  return (
    // ✨ 다른 카드들과 동일하게 모서리를 더 둥글게(rounded-2xl) 변경
    <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden h-full">
      <Table>
        <TableHeader className="bg-zinc-50/70">
          <TableRow className="border-b-zinc-200/80">
            <TableHead className="font-semibold text-zinc-600 whitespace-nowrap h-12">
              종목명
            </TableHead>
            <TableHead className="text-right font-semibold text-zinc-600 whitespace-nowrap">
              수량
            </TableHead>
            <TableHead className="text-right font-semibold text-zinc-600 whitespace-nowrap">
              매수평균가
            </TableHead>
            <TableHead className="text-right font-semibold text-zinc-600 whitespace-nowrap">
              현재가
            </TableHead>
            <TableHead className="text-right font-semibold text-zinc-600 whitespace-nowrap">
              평가금액
            </TableHead>
            <TableHead className="text-right font-semibold text-zinc-600 whitespace-nowrap">
              평가손익
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* ✅ 4. 전체 stocks가 아닌 필터링된 currentStocks를 렌더링합니다 */}
          {currentStocks.map((stock) => {
            const profitRate = calculateStockProfitRate(
              stock.currentPrice,
              stock.avgPrice,
            );
            const unrealizedProfit =
              (stock.currentPrice - stock.avgPrice) * stock.quantity;
            const totalValue = stock.currentPrice * stock.quantity;

            const colorClass = getProfitColorClass(profitRate);

            return (
              <TableRow
                key={stock.id}
                className="hover:bg-zinc-50/50 transition-colors border-b-zinc-100 last:border-0"
              >
                {/* 종목명 & 티커 */}
                <TableCell className="font-medium py-3">
                  <div className="text-zinc-900 font-bold">{stock.name}</div>
                  <div className="text-[13px] text-zinc-400 font-normal mt-0.5">
                    {stock.ticker}
                  </div>
                </TableCell>

                {/* 수량 */}
                <TableCell className="text-right text-zinc-700 font-medium">
                  {stock.quantity.toLocaleString()}주
                </TableCell>

                {/* 매수평균가 */}
                <TableCell className="text-right text-zinc-600">
                  {formatCurrency(stock.avgPrice)}
                </TableCell>

                {/* 현재가 */}
                <TableCell className="text-right text-zinc-600 font-medium">
                  {formatCurrency(stock.currentPrice)}
                </TableCell>

                {/* 총 평가금액 */}
                <TableCell className="text-right font-bold text-zinc-800">
                  {formatCurrency(totalValue)}
                </TableCell>

                {/* 평가손익 & 수익률 (%) */}
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

                {/* 삭제 버튼 */}
                <TableCell>
                  <button
                    onClick={() => deleteStock(stock.id)}
                    className="p-2 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="종목 삭제"
                  >
                    <Trash2 className="w-[18px] h-[18px]" />
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
