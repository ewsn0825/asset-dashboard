// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Stock } from "@/types";

/**
 * 1. Tailwind 클래스 병합 유틸리티 (shadcn/ui 필수 함수)
 * 반드시 'export'가 붙어 있어야 다른 파일에서 호출할 수 있어!
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 2. 금액 포맷팅 (₩1,000,000)
 */
export const formatCurrency = (value: number | undefined) => {
  if (value === undefined || isNaN(value)) return "₩0";
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * 3. 총 평가 금액 계산
 */
export const calculateTotalStockValue = (stocks: Stock[]) =>
  stocks.reduce(
    (acc, stock) => acc + (stock.currentPrice || 0) * (stock.quantity || 0),
    0,
  );

/**
 * 4. 총 평가 손익 계산
 */
export const calculateTotalProfit = (stocks: Stock[]) =>
  stocks.reduce(
    (acc, stock) =>
      acc +
      ((stock.currentPrice || 0) - (stock.avgPrice || 0)) *
        (stock.quantity || 0),
    0,
  );

/**
 * 5. 총 수익률 계산 (%)
 */
export const calculateProfitRate = (stocks: Stock[]) => {
  const totalInvested = stocks.reduce(
    (acc, stock) => acc + (stock.avgPrice || 0) * (stock.quantity || 0),
    0,
  );

  if (totalInvested === 0) return 0; // 0으로 나누는 것 방지

  const totalProfit = calculateTotalProfit(stocks); // 위에 있는 4번 함수를 사용함
  return (totalProfit / totalInvested) * 100;
};

/**
 * 6. 개별 종목의 수익률 계산 (%)
 */
export const calculateStockProfitRate = (
  currentPrice: number,
  avgPrice: number,
) => {
  if (!avgPrice || avgPrice === 0) return 0; // 0으로 나누는 것 방지
  return ((currentPrice - avgPrice) / avgPrice) * 100;
};

/**
 * 7. 수익률에 따른 텍스트 색상 클래스 반환
 */
export const getProfitColorClass = (profitRate: number) => {
  if (profitRate > 0) return "text-rose-500";
  if (profitRate < 0) return "text-blue-500";
  return "text-zinc-500"; // 0% 일 때 중립 색상
};
