// store/useAssetStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";
// ✅ 1. 직접 정의하지 않고 types 폴더에서 가져옵니다.
import { Stock, AccountType } from "@/types";

// ❌ 여기에 있던 export type AccountType과 export interface Stock 부분은 전부 지워주세요! ❌

interface AssetStore {
  activeTab: AccountType;
  setActiveTab: (tab: AccountType) => void;

  stocks: Stock[];
  availableCash: Record<AccountType, number>;

  addStock: (stock: Stock) => void;
  deleteStock: (id: string) => void;
  updateCash: (accountType: AccountType, amount: number) => void;
}

export const useAssetStore = create<AssetStore>()(
  persist(
    (set) => ({
      activeTab: "일반",
      setActiveTab: (tab) => set({ activeTab: tab }),

      stocks: [],
      availableCash: {
        일반: 0,
        ISA: 0,
        CMA: 0,
      },

      addStock: (stock) =>
        set((state) => ({
          stocks: [...state.stocks, stock],
        })),

      deleteStock: (id) =>
        set((state) => ({
          stocks: state.stocks.filter((s) => s.id !== id),
        })),

      updateCash: (accountType, amount) =>
        set((state) => ({
          availableCash: {
            ...state.availableCash,
            [accountType]: state.availableCash[accountType] + amount,
          },
        })),
    }),
    {
      name: "asset-storage",
    },
  ),
);
