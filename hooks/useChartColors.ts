import { useMemo } from "react";

/**
 * 데이터 개수에 맞춰 자동으로 고유한 색상 배열을 생성하는 훅
 */
export function useChartColors(count: number) {
  return useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      // 색상을 360도 스펙트럼에서 골고루 분배
      return `hsl(${(i * 360) / count}, 70%, 60%)`;
    });
  }, [count]);
}
