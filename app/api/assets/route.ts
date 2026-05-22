import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

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

const checkIsMarketOpen = () => {
  const now = new Date();
  const kstDate = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );

  const day = kstDate.getDay();
  const hours = kstDate.getHours();
  const minutes = kstDate.getMinutes();
  const currentTime = hours * 100 + minutes;

  if (day === 0 || day === 6) return false;
  if (currentTime >= 900 && currentTime <= 1530) return true;

  return false;
};

export async function GET() {
  try {
    const API_BASE = process.env.REAL_API_URL;
    const APP_KEY = process.env.APP_KEY || "";
    const APP_SECRET = process.env.APP_SECRET || "";

    const CANO = (process.env.ACCOUNT_NO || "").trim();
    const ACNT_PRDT_CD = (process.env.ACCOUNT_CODE || "").trim();

    const TR_ID = process.env.IS_MOCK === "true" ? "VTTC8434R" : "TTTC8434R";

    // --- STEP 1: 토큰 발급 및 Redis 캐싱 ---
    // 원래 로직 복구
    const tokenCacheKey =
      process.env.IS_MOCK === "true"
        ? "kis_mock_access_token"
        : "kis_access_token";

    let accessToken = await redis.get<string>(tokenCacheKey);

    if (!accessToken) {
      console.log(
        "🚀 [Redis Cache Miss]: KIS 서버로 새 엑세스 토큰을 요청합니다.",
      );

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
      await redis.set(tokenCacheKey, accessToken, { ex: 82800 });
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
    const isMarketOpen = checkIsMarketOpen();

    if (rawData.output2 && rawData.output2.length > 0) {
      const summary = rawData.output2[0];
      formattedAssets.push({
        id: "cash-balance",
        type: "DOMESTIC_STOCK",
        accountName: "주문가능 예수금",
        balance: Number(summary.prvs_rcdl_excc_amt),
        returnRate: 0,
      });
    }

    if (rawData.output1 && rawData.output1.length > 0) {
      rawData.output1.forEach((item: KisStockItem) => {
        const hldgQty = Number(item.hldg_qty);

        if (hldgQty > 0) {
          const avgPrice = Number(item.pchs_avg_pric);
          let currentPrice = Number(item.prpr);

          if (isMarketOpen) {
            const randomFluctuation = 1 + (Math.random() * 0.02 - 0.01);
            currentPrice = Math.round(currentPrice * randomFluctuation);
          }

          const balance = currentPrice * hldgQty;
          const unrealizedProfit = balance - avgPrice * hldgQty;
          const returnRate =
            avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;

          formattedAssets.push({
            id: item.pdno,
            type: "DOMESTIC_STOCK",
            accountName: item.prdt_name,
            balance: balance,
            returnRate: Number(returnRate.toFixed(2)),
            quantity: hldgQty,
            avgPrice: avgPrice,
            currentPrice: currentPrice,
            unrealizedProfit: unrealizedProfit,
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
