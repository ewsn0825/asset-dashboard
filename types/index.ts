// types/index.ts

export type AccountType = "일반" | "ISA" | "CMA";

export interface KisStockItem {
  pdno: string;
  prdt_name: string;
  evlu_amt: string;
  evlu_pfls_rt: string;
  hldg_qty: string;
  pchs_avg_pric: string;
  prpr: string;
  evlu_pfls_amt: string;
}

/**
 * 💡 [수정됨] API 라우터가 임시 가공 및 가상 변동성을 먹이기 전 단계에서도
 * 유연하게 재사용할 수 있도록 필수 속성 규격을 완화합니다.
 */
export interface FormattedAsset {
  id: string;
  type: "DOMESTIC_STOCK" | "CMA" | "ISA";
  accountName: string;
  balance?: number; // 👈 ? 를 추가하여 선택적으로 변경
  returnRate?: number; // 👈 ? 를 추가하여 선택적으로 변경
  quantity?: number;
  avgPrice?: number;
  currentPrice?: number;
  unrealizedProfit?: number;
}

/**
 * 💡 내 자산 목록 및 컴포넌트에서 사용하는 상세 주식 타입
 * 컴포넌트에서는 데이터가 무조건 존재해야 하므로 필수 속성으로 강력하게 규정합니다.
 */
export interface Stock extends Omit<FormattedAsset, "balance" | "returnRate"> {
  balance: number; // 👈 프론트엔드에서는 무조건 필수!
  returnRate: number; // 👈 프론트엔드에서는 무조건 필수!
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  unrealizedProfit: number;
  accountType: AccountType;
}

export interface StockItem {
  id: string;
  name: string;
  marketCap?: number;
}
