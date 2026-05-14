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
import { useAssets } from "@/hooks/useAssets";
import { Trash2, FileSearch } from "lucide-react";
import { formatCurrency, getProfitColorClass } from "@/lib/utils";

export function StockTable() {
  const activeTab = useAssetStore((state) => state.activeTab);
  const { data: assets = [] } = useAssets();

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
        className="flex flex-col items-center justify-center w-full text-center border border-zinc-200/80 rounded-2xl bg-white shadow-sm"
        style={{ height: "350px" }}
      >
        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
          <FileSearch className="w-8 h-8 text-zinc-300" />
        </div>
        <p className="text-[15px] font-semibold text-zinc-600">
          보유한 자산 내역이 없습니다.
        </p>
        <p className="text-sm text-zinc-400 mt-1">
          실제 계좌에 보유 중인 종목이 이곳에 표시됩니다.
        </p>
      </div>
    );
  }

  return (
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
          {currentStocks.map((stock) => {
            const profitRate = stock.returnRate;
            const unrealizedProfit = stock.unrealizedProfit || 0;
            const colorClass = getProfitColorClass(profitRate);

            return (
              <TableRow
                key={stock.id}
                className="hover:bg-zinc-50/50 transition-colors border-b-zinc-100 last:border-0"
              >
                <TableCell className="font-medium py-3">
                  <div className="text-zinc-900 font-bold">
                    {stock.accountName}
                  </div>
                  <div className="text-[13px] text-zinc-400 font-normal mt-0.5">
                    {stock.id}
                  </div>
                </TableCell>
                <TableCell className="text-right text-zinc-700 font-medium">
                  {stock.quantity?.toLocaleString() || 0}주
                </TableCell>
                <TableCell className="text-right text-zinc-600">
                  {formatCurrency(stock.avgPrice || 0)}
                </TableCell>
                <TableCell className="text-right text-zinc-600 font-medium">
                  {formatCurrency(stock.currentPrice || 0)}
                </TableCell>
                <TableCell className="text-right font-bold text-zinc-800">
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
                  <button
                    onClick={() =>
                      alert(
                        "실제 증권 계좌의 종목은 HTS/MTS에서 매도해야 삭제됩니다.",
                      )
                    }
                    className="p-2 text-zinc-300 hover:text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors"
                    title="종목 삭제 불가"
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
