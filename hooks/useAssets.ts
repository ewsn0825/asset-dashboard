import { useQuery } from "@tanstack/react-query";

export interface Asset {
  id: string;
  type: "CMA" | "ISA" | "DOMESTIC_STOCK";
  accountName: string;
  balance: number;
  returnRate: number;
  // 👇 테이블 UI를 위한 4가지 속성 추가
  quantity?: number;
  avgPrice?: number;
  currentPrice?: number;
  unrealizedProfit?: number;
}

export const useAssets = () => {
  return useQuery<Asset[], Error>({
    queryKey: ["assets", "real"],
    queryFn: async () => {
      const response = await fetch("/api/assets");

      if (!response.ok) {
        throw new Error("자산 데이터를 불러오는데 실패했습니다.");
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5,
  });
};
