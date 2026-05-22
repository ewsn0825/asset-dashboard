import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

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

// 💡 팁: 이전 카드 컴포넌트에서도 쓰였으니, 이 함수는 나중에
// `src/utils/market.ts` 같은 곳으로 빼서 공통으로 쓰시는 걸 추천합니다!
const checkIsMarketOpen = () => {
  const now = new Date();
  const day = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 100 + minutes;

  if (day === 0 || day === 6) return false;
  if (currentTime >= 900 && currentTime <= 1530) return true;
  return false;
};

export const useAssets = () => {
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  // 클라이언트 사이드에서 장 시간 상태 초기화 및 갱신
  useEffect(() => {
    // ✅ setTimeout을 사용하여 동기적 상태 업데이트로 인한 린터 에러를 방지합니다.
    const initTimer = setTimeout(() => {
      setIsMarketOpen(checkIsMarketOpen());
    }, 0);

    const interval = setInterval(() => {
      setIsMarketOpen(checkIsMarketOpen());
    }, 60000); // 1분마다 장 상태 체크

    // ✅ 컴포넌트 언마운트 시 메모리 누수 방지를 위해 타이머 정리
    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, []);

  return useQuery<Asset[], Error>({
    queryKey: ["assets", "mock"],
    queryFn: async () => {
      const response = await fetch("/api/assets");

      if (!response.ok) {
        throw new Error("자산 데이터를 불러오는데 실패했습니다.");
      }

      return response.json();
    },
    // ✅ 장 중일 때는 5초마다 실시간 데이터 갱신 (Polling), 장 마감 시에는 멈춤
    refetchInterval: isMarketOpen ? 5000 : false,

    // ✅ 장 중에는 데이터를 즉시 즉시 갱신해야 하므로 staleTime을 짧게, 마감 시에는 길게
    staleTime: isMarketOpen ? 1000 * 5 : 1000 * 60 * 5,
  });
};
