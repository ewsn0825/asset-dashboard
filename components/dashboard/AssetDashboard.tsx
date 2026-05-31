"use client";

import React, { useMemo } from "react";
import { useAssets } from "../../hooks/useAssets";
import { useAssetStore } from "@/store/useAssetStore";
import { Skeleton } from "@/components/ui/skeleton";

export function AssetDashboard() {
  const activeTab = useAssetStore((state) => state.activeTab);

  // 🏎️ [성능 최적화 1] select 메모이제이션 엔진이 탑재된 훅을 활용하여 현재 탭의 데이터만 정밀 수신
  const {
    data: currentTabAssets = [],
    isLoading,
    isError,
    error,
  } = useAssets(activeTab);

  // 🏎️ [성능 최적화 2] 연쇄 useMemo를 단일 파이프라인으로 통합
  // 이미 탭별 종목은 걸러져서 들어오므로, 총 자산 합산 연산과 예수금 정합성만 가볍게 가공합니다.
  const { displayAssets, totalBalance } = useMemo(() => {
    let sum = 0;

    // CMA나 ISA 탭일 때는 API 스펙상 cash-balance를 노출하지 않도록 방어 코드 배치
    const filtered = currentTabAssets.filter((asset) => {
      if (activeTab !== "일반" && asset.id === "cash-balance") return false;
      return true;
    });

    // 최종 노출할 리스트의 평가 금액 총합 산출
    filtered.forEach((asset) => {
      sum += asset.balance || 0;
    });

    return {
      displayAssets: filtered,
      totalBalance: sum,
    };
  }, [currentTabAssets, activeTab]);

  // ✅ 3. 로딩 상태 UI - 반응형 패딩 및 마진 적용
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 mt-4 sm:mt-8 transition-colors duration-300">
        <Skeleton className="h-7 sm:h-8 w-40 sm:w-48 mb-5 sm:mb-6 bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-[100px] sm:h-[120px] w-full mb-6 sm:mb-8 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="space-y-3 sm:space-y-4">
          <Skeleton className="h-[70px] sm:h-[76px] w-full rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <Skeleton className="h-[70px] sm:h-[76px] w-full rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <Skeleton className="h-[70px] sm:h-[76px] w-full rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  // ✅ 4. 에러 상태 UI - 반응형 대응
  if (isError) {
    return (
      <div className="max-w-4xl mx-auto p-5 sm:p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl mt-4 sm:mt-8 transition-colors duration-300">
        <h3 className="font-bold text-sm sm:text-base">
          데이터를 불러오지 못했습니다.
        </h3>
        <p className="text-xs sm:text-sm mt-1">{error?.message}</p>
      </div>
    );
  }

  // ✅ 5. 데이터가 없을 때의 Empty State
  if (displayAssets.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-8 sm:p-12 text-center mt-4 sm:mt-8 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 transition-colors duration-300">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 transition-colors">
          <span className="text-xl sm:text-2xl">📊</span>
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-zinc-100 mb-2 transition-colors">
          {activeTab} 모의투자 계좌
        </h2>
        <p className="text-sm sm:text-base text-gray-500 dark:text-zinc-400 transition-colors break-keep">
          등록된 자산 내역이 없거나 데이터를 불러올 수 없습니다.
        </p>
      </div>
    );
  }

  // ✅ 6. 정상 렌더링 UI
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 mt-4 sm:mt-8 transition-colors duration-300">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-zinc-100 mb-5 sm:mb-6 transition-colors">
        {activeTab} 모의투자 자산 현황
      </h2>

      {/* 총 자산 요약 박스 */}
      <div className="mb-6 sm:mb-8 p-5 sm:p-6 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100/50 dark:border-blue-900/30 transition-colors duration-300">
        <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 mb-1.5 sm:mb-2 font-medium transition-colors">
          총 자산 평가 금액
        </p>
        <div className="flex items-baseline gap-1 break-keep">
          <p className="text-3xl sm:text-4xl font-extrabold text-blue-900 dark:text-blue-100 tracking-tight transition-all duration-300 truncate">
            {totalBalance.toLocaleString()}
          </p>
          <span className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100 flex-shrink-0">
            원
          </span>
        </div>
      </div>

      {/* 개별 자산 리스트 */}
      <div className="space-y-3 sm:space-y-4">
        {displayAssets.map((asset) => {
          const isCash = asset.id === "cash-balance";
          const badgeText = isCash
            ? "현금/예수금"
            : asset.type === "DOMESTIC_STOCK"
              ? "국내주식"
              : asset.type;

          return (
            <div
              key={asset.id}
              className="flex justify-between items-center p-4 sm:p-5 border border-gray-100 dark:border-zinc-800 rounded-xl hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-sm transition-all duration-200 bg-white dark:bg-zinc-900 group"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden mr-3">
                <span
                  className={`flex-shrink-0 inline-flex items-center justify-center px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-bold rounded-full transition-colors ${
                    isCash
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-900/20 dark:group-hover:text-blue-400"
                  }`}
                >
                  {badgeText}
                </span>
                <span className="font-semibold text-gray-800 dark:text-zinc-100 text-[15px] sm:text-lg transition-colors truncate">
                  {asset.accountName}
                </span>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-bold text-gray-900 dark:text-zinc-100 text-[15px] sm:text-lg transition-colors duration-300">
                  {asset.balance.toLocaleString()}원
                </p>
                {!isCash && (
                  <p
                    className={`text-xs sm:text-sm font-medium mt-0.5 sm:mt-1 transition-colors duration-300 ${
                      asset.returnRate > 0
                        ? "text-red-500 dark:text-red-400"
                        : asset.returnRate < 0
                          ? "text-blue-500 dark:text-blue-400"
                          : "text-gray-500 dark:text-zinc-500"
                    }`}
                  >
                    {asset.returnRate > 0
                      ? "▲"
                      : asset.returnRate < 0
                        ? "▼"
                        : "-"}{" "}
                    {Math.abs(asset.returnRate).toFixed(2)}%
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
