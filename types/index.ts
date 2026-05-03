// types/index.ts

export type AccountType = "일반" | "ISA" | "CMA";

export interface Stock {
  id: string;
  name: string;
  ticker: string;
  quantity: number;
  avgPrice: number; // 매수 평균가
  currentPrice: number; // 현재가
  accountType: AccountType; // ✅ 필수: 어떤 계좌 소속인지 추가
}

// AssetStore 인터페이스는 지우셔도 됩니다. (보통 스토어 파일 안에서 관리하는 것이 깔끔합니다)
