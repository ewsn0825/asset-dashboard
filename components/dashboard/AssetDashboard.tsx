"use client";

import React, { useMemo } from "react";
// 훅스 경로를 현재 폴더 구조에 맞게 수정했습니다.
import { useAssets } from "../../hooks/useAssets";
import { useAssetStore } from "@/store/useAssetStore";
import { Skeleton } from "@/components/ui/skeleton"; // ✅ 스켈레톤 추가

export function AssetDashboard() {
  const activeTab = useAssetStore((state) => state.activeTab);
  const { data: assets, isLoading, isError, error } = useAssets();

  // ✅ 1. 탭에 맞는 자산만 필터링 (예수금 꼬임 방지 로직 포함)
  const filteredAssets = useMemo(() => {
    if (!assets) return [];

    return assets.filter((asset) => {
      if (activeTab === "CMA") {
        return asset.type === "CMA" && asset.id !== "cash-balance";
      }
      if (activeTab === "ISA") {
        return asset.type === "ISA" && asset.id !== "cash-balance";
      }
      // 일반 탭: 주식과 예수금을 모두 포함
      return asset.type === "DOMESTIC_STOCK" || asset.id === "cash-balance";
    });
  }, [assets, activeTab]);

  // ✅ 2. 필터링된 자산을 바탕으로 총 자산 평가 금액 계산
  const totalBalance = useMemo(() => {
    return filteredAssets.reduce((sum, asset) => sum + asset.balance, 0);
  }, [filteredAssets]);

  // ✅ 3. 로딩 상태 UI (스피너 대신 스켈레톤 적용)
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100 mt-8">
        <Skeleton className="h-8 w-48 mb-6 bg-zinc-200" />
        <Skeleton className="h-[120px] w-full mb-8 rounded-xl bg-zinc-200" />
        <div className="space-y-4">
          <Skeleton className="h-[76px] w-full rounded-xl bg-zinc-200" />
          <Skeleton className="h-[76px] w-full rounded-xl bg-zinc-200" />
          <Skeleton className="h-[76px] w-full rounded-xl bg-zinc-200" />
        </div>
      </div>
    );
  }

  // ✅ 4. 에러 상태 UI
  if (isError) {
    return (
      <div className="max-w-4xl mx-auto p-6 m-4 bg-red-50 border border-red-200 text-red-600 rounded-xl mt-8">
        <h3 className="font-bold">데이터를 불러오지 못했습니다.</h3>
        <p className="text-sm mt-1">{error?.message}</p>
      </div>
    );
  }

  // ✅ 5. 데이터가 없을 때의 Empty State
  if (filteredAssets.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center mt-8 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">
          {activeTab} 모의투자 계좌
        </h2>
        <p className="text-gray-500">
          등록된 자산 내역이 없거나 데이터를 불러올 수 없습니다.
        </p>
      </div>
    );
  }

  // ✅ 6. 정상 렌더링 UI
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100 mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {activeTab} 모의투자 자산 현황
      </h2>

      <div className="mb-8 p-6 bg-blue-50/50 rounded-xl border border-blue-100/50">
        <p className="text-sm text-blue-600 mb-2 font-medium">
          총 자산 평가 금액
        </p>
        <p className="text-4xl font-extrabold text-blue-900 tracking-tight transition-all duration-300">
          {totalBalance.toLocaleString()}{" "}
          <span className="text-2xl font-bold">원</span>
        </p>
      </div>

      <div className="space-y-4">
        {filteredAssets.map((asset) => {
          const isCash = asset.id === "cash-balance";
          const badgeText = isCash
            ? "현금/예수금"
            : asset.type === "DOMESTIC_STOCK"
              ? "국내주식"
              : asset.type;

          return (
            <div
              key={asset.id}
              className="flex justify-between items-center p-5 border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all duration-200 bg-white group"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded-full transition-colors ${
                    isCash
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600"
                  }`}
                >
                  {badgeText}
                </span>
                <span className="font-semibold text-gray-800 text-lg">
                  {asset.accountName}
                </span>
              </div>

              <div className="text-right">
                <p className="font-bold text-gray-900 text-lg transition-colors duration-300">
                  {asset.balance.toLocaleString()}원
                </p>
                {/* 💡 예수금은 수익률을 아예 렌더링하지 않도록 처리 */}
                {!isCash && (
                  <p
                    className={`text-sm font-medium mt-1 transition-colors duration-300 ${
                      asset.returnRate > 0
                        ? "text-red-500"
                        : asset.returnRate < 0
                          ? "text-blue-500"
                          : "text-gray-500"
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
