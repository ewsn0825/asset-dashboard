import { create } from "zustand";
import { persist } from "zustand/middleware";
// ✅ 주식 데이터(Stock)는 이제 API에서 가져오므로 AccountType만 임포트합니다.
import { AccountType } from "@/types";

// 스토어 타입이 아주 단순해졌습니다!
interface AssetStore {
  activeTab: AccountType;
  setActiveTab: (tab: AccountType) => void;
}

export const useAssetStore = create<AssetStore>()(
  persist(
    (set) => ({
      // 초기 상태는 '일반' 계좌 탭으로 설정
      activeTab: "일반",
      // 탭 변경 액션
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      // persist 미들웨어를 유지하면, 사용자가 'ISA' 탭을 보다가 새로고침해도 'ISA' 탭이 유지됩니다!
      name: "asset-ui-storage",
    },
  ),
);
