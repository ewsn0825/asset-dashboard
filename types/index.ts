// types/index.ts

export type AccountType = "일반" | "ISA" | "CMA";

// 💡 내 자산 목록에서 사용하는 상세 주식 타입
export interface Stock {
  id: string; // 종목 코드
  accountName: string; // 종목명
  type: string; // "DOMESTIC_STOCK" 등
  balance: number; // 평가 금액
  quantity: number; // 보유 수량
  avgPrice: number; // 매수 평균가
  currentPrice: number; // 현재가
  unrealizedProfit: number; // 평가 손익
  returnRate: number; // 수익률 (%)
  accountType: AccountType; // 계좌 소속
}

// 💡 [추가됨] 검색 및 자동완성에 사용하는 기초 주식 타입
export interface StockItem {
  id: string;
  name: string;
  marketCap?: number; // 💡 추가: ?를 붙여 필드가 없는 종목도 대응 가능하게 함
}
