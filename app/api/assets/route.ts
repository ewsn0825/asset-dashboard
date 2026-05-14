import { NextResponse } from "next/server";

let cachedToken: string | null = null;
let tokenExpirationTime: number = 0;

interface KisStockItem {
  pdno: string;
  prdt_name: string;
  evlu_amt: string;
  evlu_pfls_rt: string;
  hldg_qty: string;
  pchs_avg_pric: string;
  prpr: string;
  evlu_pfls_amt: string;
}

export async function GET() {
  try {
    const API_BASE = process.env.REAL_API_URL;
    const APP_KEY = process.env.APP_KEY || "";
    const APP_SECRET = process.env.APP_SECRET || "";

    // 환경변수 공백 에러 방지
    const CANO = (process.env.ACCOUNT_NO || "").trim();
    const ACNT_PRDT_CD = (process.env.ACCOUNT_CODE || "").trim();

    const TR_ID = process.env.IS_MOCK === "true" ? "VTTC8434R" : "TTTC8434R";

    // --- STEP 1: 토큰 발급 및 캐싱 ---
    let accessToken = cachedToken;
    const now = Date.now();

    if (!accessToken || now >= tokenExpirationTime) {
      const tokenRes = await fetch(`${API_BASE}/oauth2/tokenP`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "client_credentials",
          appkey: APP_KEY,
          appsecret: APP_SECRET,
        }),
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || tokenData.error_description) {
        throw new Error(
          `토큰 에러: ${tokenData.error_description || "발급 실패"}`,
        );
      }

      accessToken = tokenData.access_token;
      cachedToken = accessToken;
      tokenExpirationTime = now + 23 * 60 * 60 * 1000;
    }

    // --- STEP 2: 잔고 조회 ---
    const queryParams = new URLSearchParams({
      CANO: CANO,
      ACNT_PRDT_CD: ACNT_PRDT_CD,
      AFHR_FLPR_YN: "N",
      OFL_YN: "",
      INQR_DVSN: "02",
      UNPR_DVSN: "01",
      FUND_STTL_ICLD_YN: "N",
      FNCG_AMT_AUTO_RDPT_YN: "N",
      PRCS_DVSN: "01",
      CTX_AREA_FK100: "",
      CTX_AREA_NK100: "",
    });

    const balanceRes = await fetch(
      `${API_BASE}/uapi/domestic-stock/v1/trading/inquire-balance?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
          appkey: APP_KEY,
          appsecret: APP_SECRET,
          tr_id: TR_ID,
        },
      },
    );

    const rawData = await balanceRes.json();

    if (!balanceRes.ok || rawData.rt_cd !== "0") {
      throw new Error(`잔고 조회 에러: ${rawData.msg1 || "조회 실패"}`);
    }

    // --- STEP 3: 데이터 정제 ---
    const formattedAssets = [];

    // 3-1. 주문가능 예수금 (D+2 기준)
    if (rawData.output2 && rawData.output2.length > 0) {
      const summary = rawData.output2[0];
      formattedAssets.push({
        id: "cash-balance",
        type: "DOMESTIC_STOCK", // 일반 계좌 주식들과 그룹화
        accountName: "주문가능 예수금",
        balance: Number(summary.prvs_rcdl_excc_amt), // 실제 출금/주문 가능 금액
        returnRate: 0,
      });
    }

    // 3-2. 보유 주식
    if (rawData.output1 && rawData.output1.length > 0) {
      rawData.output1.forEach((item: KisStockItem) => {
        if (Number(item.hldg_qty) > 0) {
          formattedAssets.push({
            id: item.pdno,
            type: "DOMESTIC_STOCK",
            accountName: item.prdt_name,
            balance: Number(item.evlu_amt),
            returnRate: Number(item.evlu_pfls_rt),
            quantity: Number(item.hldg_qty),
            avgPrice: Number(item.pchs_avg_pric),
            currentPrice: Number(item.prpr),
            unrealizedProfit: Number(item.evlu_pfls_amt),
          });
        }
      });
    }

    return NextResponse.json(formattedAssets);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "알 수 없는 에러가 발생했습니다.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
