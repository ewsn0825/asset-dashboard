import { useQuery } from "@tanstack/react-query";

// 1. 자산 데이터 타입 정의
export interface Asset {
  id: string;
  type: "CMA" | "ISA" | "DOMESTIC_STOCK";
  accountName: string;
  balance: number;
  returnRate: number;
  quantity?: number;
  avgPrice?: number;
  currentPrice?: number;
  unrealizedProfit?: number;
}

// 2. UI에서 사용하는 계좌 탭 타입 정의
export type AccountTabType = "일반" | "ISA" | "CMA";

/**
 * 🏎️ [성능 최적화] 한국 주식 시장 정규 장 시간 판별 유틸 함수
 * 컴포넌트의 렌더링 사이클과 분리되어 호출 시점의 정밀한 상태만 반환합니다.
 */
const checkIsMarketOpen = (): boolean => {
  const now = new Date();
  const day = now.getDay(); // 0: 일요일, 6: 토요일
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 100 + minutes;

  // 주말이면 장 닫힘
  if (day === 0 || day === 6) return false;
  // 정규 매매 시간: 09:00 ~ 15:30
  return currentTime >= 900 && currentTime <= 1530;
};

/**
 * 대시보드 맞춤형 자산 데이터 페칭 훅
 * @param activeTab 현재 선택된 대시보드 탭 ("일반" | "ISA" | "CMA"). 미입력 시 전체 데이터를 반환합니다.
 */
export const useAssets = (activeTab?: AccountTabType) => {
  return useQuery<Asset[], Error, Asset[]>({
    // activeTab을 queryKey에 넣지 않는 것이 중요합니다!
    // 동일한 캐시 데이터를 공유하면서 클라이언트 사이드에서 select로만 걸러내야 효율적입니다.
    queryKey: ["assets", "mock"],

    queryFn: async () => {
      const response = await fetch("/api/assets");

      if (!response.ok) {
        throw new Error("자산 데이터를 불러오는데 실패했습니다.");
      }

      return response.json();
    },

    /**
     * 🏎️ [성능 최적화] 동적 실시간 폴링 스위칭 (함수형 옵션)
     * 5초마다 쿼리가 실행될 때 실시간으로 장 상태를 체크합니다.
     * 장 중(true)일 때만 5000ms(5초) 주기로 백그라운드 페칭을 수행하고, 장 마감 시 페칭을 중단합니다.
     */
    refetchInterval: (query) => {
      if (query.state.status === "error") return false; // 에러 발생 시 폴링 일시 정지
      return checkIsMarketOpen() ? 5000 : false;
    },

    /**
     * 🏎️ [성능 최적화] 동적 데이터 신선도 설정 (함수형 옵션)
     * 장 중에는 5초마다 데이터가 무조건 상하도록(stale) 설정하여 실시간성을 보장하고,
     * 장 마감 후에는 5분(300,000ms) 동안 캐시를 신선한 상태로 유지해 불필요한 API 요청을 차단합니다.
     */
    staleTime: () => (checkIsMarketOpen() ? 1000 * 5 : 1000 * 60 * 5),

    // 포커스 이동 시마다 발생하는 과도한 재요청 방지
    refetchOnWindowFocus: false,

    /**
     * 🎯 [초강력 최적화] TanStack Query 데이터 메모이제이션 (Select)
     * 백그라운드에서 5초마다 캐시 데이터가 업데이트되더라도,
     * '내가 현재 보고 있는 탭의 데이터'에 변화가 없다면 하위 컴포넌트들을 리렌더링하지 않습니다.
     */
    select: (assets) => {
      // 탭 파라미터가 없으면 전체 데이터 반환
      if (!activeTab) return assets;

      // UI용 탭 이름과 실제 API 서버 스펙(Asset['type']) 매핑
      const typeMap: Record<AccountTabType, Asset["type"]> = {
        일반: "DOMESTIC_STOCK",
        ISA: "ISA",
        CMA: "CMA",
      };

      const targetType = typeMap[activeTab];
      return assets.filter((asset) => asset.type === targetType);
    },
  });
};
