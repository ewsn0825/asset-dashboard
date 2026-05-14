"use client";

import React, { useMemo } from "react";
// 훅스 경로를 현재 폴더 구조에 맞게 수정했습니다.
import { useAssets } from "../../hooks/useAssets";
import { useAssetStore } from "@/store/useAssetStore"; // ✅ 탭 상태 관리를 위해 추가

export function AssetDashboard() {
  const activeTab = useAssetStore((state) => state.activeTab); // ✅ 현재 탭 가져오기
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 m-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
        <h3 className="font-bold">데이터를 불러오지 못했습니다.</h3>
        <p className="text-sm mt-1">{error?.message}</p>
      </div>
    );
  }

  if (filteredAssets.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 mt-8 bg-white rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-700 mb-2">
          {activeTab} 계좌
        </h2>
        등록된 자산 내역이 없거나 데이터를 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100 mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {activeTab} 계좌 자산 현황
      </h2>

      <div className="mb-8 p-6 bg-blue-50 rounded-xl shadow-inner">
        <p className="text-sm text-blue-600 mb-2 font-medium">
          총 자산 평가 금액
        </p>
        <p className="text-4xl font-extrabold text-blue-900 tracking-tight">
          {totalBalance.toLocaleString()}{" "}
          <span className="text-2xl font-bold">원</span>
        </p>
      </div>

      <div className="space-y-4">
        {filteredAssets.map((asset) => {
          // ✅ 3. UI 렌더링을 위한 예외 처리 (예수금 vs 일반 주식)
          const isCash = asset.id === "cash-balance";
          const badgeText = isCash
            ? "현금/예수금"
            : asset.type === "DOMESTIC_STOCK"
              ? "국내주식"
              : asset.type;

          return (
            <div
              key={asset.id}
              className="flex justify-between items-center p-5 border border-gray-100 rounded-xl hover:shadow-md transition-shadow bg-white"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded-full ${isCash ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
                >
                  {badgeText}
                </span>
                <span className="font-semibold text-gray-800 text-lg">
                  {asset.accountName}
                </span>
              </div>

              <div className="text-right">
                <p className="font-bold text-gray-900 text-lg">
                  {asset.balance.toLocaleString()}원
                </p>
                {/* 💡 예수금은 수익률을 아예 렌더링하지 않도록 처리 */}
                {!isCash && (
                  <p
                    className={`text-sm font-medium mt-1 ${
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
