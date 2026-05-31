import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
// 🏎️ [타입 최적화] 전역 공통 타입 파일에서 명확한 인터페이스 정의를 가져옵니다.
import { KisStockItem, FormattedAsset } from "@/types";

// 요청마다 process.env를 파싱하고 .trim()하는 부하를 방지하기 위해 상위 스코프에 고정
const API_BASE = process.env.REAL_API_URL;
const APP_KEY = process.env.APP_KEY || "";
const APP_SECRET = process.env.APP_SECRET || "";
const CANO = (process.env.ACCOUNT_NO || "").trim();
const ACNT_PRDT_CD = (process.env.ACCOUNT_CODE || "").trim();
const IS_MOCK = process.env.IS_MOCK === "true";
const TR_ID = IS_MOCK ? "VTTC8434R" : "TTTC8434R";

const TOKEN_CACHE_KEY = IS_MOCK ? "kis_mock_access_token" : "kis_access_token";
const DATA_CACHE_KEY = IS_MOCK ? "kis_mock_balance_data" : "kis_balance_data";

/**
 * 🏎️ [성능 최적화] 문자열 파싱 연산을 제거한 경량화 KST 장 시간 체크 함수
 */
const checkIsMarketOpen = (): boolean => {
  const now = new Date();
  // 현재 UTC 밀리초에 9시간 오프셋을 더해 한국 표준시(KST) 계측
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  const day = kst.getUTCDay(); // 0: 일요일, 6: 토요일
  if (day === 0 || day === 6) return false;

  const hours = kst.getUTCHours();
  const minutes = kst.getUTCMinutes();
  const currentTime = hours * 100 + minutes;

  // 한국 정규 주식 시장 거래 시간 (09:00 ~ 15:30)
  return currentTime >= 900 && currentTime <= 1530;
};

export async function GET() {
  try {
    const isMarketOpen = checkIsMarketOpen();

    // 🏎️ [버그 완벽 해결] 장 마감(주말/야간) 상태일 때 Redis 캐시 반환 시 연산 레이어 추가
    if (!isMarketOpen) {
      const cachedData = await redis.get<FormattedAsset[]>(DATA_CACHE_KEY);
      if (cachedData) {
        // 🌟 캐시본을 그냥 내보내지 않고, applyLiveFluctuation(..., false)를 강제로 거치게 함으로써
        // 장외 시간에도 balance, unrealizedProfit, returnRate가 정밀 계산되어 프론트엔드로 전달됩니다.
        const calculatedCache = applyLiveFluctuation(cachedData, false);

        // 만약 Fallback 데이터 자체도 주말 간에 클라이언트단 캐시 효율을 높이기 위해 리턴
        return NextResponse.json(calculatedCache);
      }
    }

    // --- STEP 1: 토큰 발급 및 Redis 캐싱 ---
    let accessToken = await redis.get<string>(TOKEN_CACHE_KEY);

    if (!accessToken) {
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
      await redis.set(TOKEN_CACHE_KEY, accessToken, { ex: 82800 }); // 23시간 캐시 유지
    }

    // --- STEP 2: 장중 2초 단기 캐싱을 통한 KIS 트래픽 방어 ---
    if (isMarketOpen) {
      const shortTermCache = await redis.get<FormattedAsset[]>(
        `${DATA_CACHE_KEY}_live`,
      );
      if (shortTermCache) {
        return NextResponse.json(applyLiveFluctuation(shortTermCache, true));
      }
    }

    // --- STEP 3: KIS 정규 잔고 조회 API 호출 ---
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
      // 외부 KIS 서버 장애 시 기존 캐시 데이터를 가공해서 긴급 수리 서빙 (안정성 확보)
      const fallbackData = await redis.get<FormattedAsset[]>(DATA_CACHE_KEY);
      if (fallbackData) {
        return NextResponse.json(applyLiveFluctuation(fallbackData, false));
      }

      throw new Error(`잔고 조회 에러: ${rawData.msg1 || "조회 실패"}`);
    }

    // --- STEP 4: 데이터 정제 및 타입 매핑 ---
    const baseAssets: FormattedAsset[] = [];

    // 1. 주문가능 예수금 가공
    if (rawData.output2 && rawData.output2.length > 0) {
      const summary = rawData.output2[0];
      baseAssets.push({
        id: "cash-balance",
        type: "DOMESTIC_STOCK",
        accountName: "주문가능 예수금",
        balance: Number(summary.prvs_rcdl_excc_amt),
        returnRate: 0,
      });
    }

    // 2. 보유 종목 리스트 가공
    if (rawData.output1 && rawData.output1.length > 0) {
      rawData.output1.forEach((item: KisStockItem) => {
        const hldgQty = Number(item.hldg_qty);
        if (hldgQty > 0) {
          baseAssets.push({
            id: item.pdno,
            type: "DOMESTIC_STOCK",
            accountName: item.prdt_name,
            quantity: hldgQty,
            avgPrice: Number(item.pchs_avg_pric),
            currentPrice: Number(item.prpr),
          });
        }
      });
    }

    // --- STEP 5: 상태별 캐시 타임아웃 지정 및 반환 ---
    // ⚙️ 오타 수정: else 문 분기가 제대로 인식되도록 키워드 복구
    if (isMarketOpen) {
      // 장중에는 단기 스위칭용 캐시 풀 활성화 (2초 고정)
      await redis.set(`${DATA_CACHE_KEY}_live`, baseAssets, { ex: 2 });
    } else {
      // 장 마감 후에는 불필요한 트래픽 억제를 위해 긴 수명의 캐시 풀 활성화 (12시간)
      await redis.set(DATA_CACHE_KEY, baseAssets, { ex: 43200 });
    }

    return NextResponse.json(applyLiveFluctuation(baseAssets, isMarketOpen));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "알 수 없는 에러가 발생했습니다.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * 🏎️ [성능 최적화] 변동성 연산 및 포맷 구조 가공 유틸 함수
 * @param baseAssets 원본 주가 기준의 기초 자산 배열
 * @param isMarketOpen 실시간 변동 폭 반영 여부 스위치
 */
function applyLiveFluctuation(
  baseAssets: FormattedAsset[],
  isMarketOpen: boolean,
): FormattedAsset[] {
  return baseAssets.map((asset) => {
    if (asset.id === "cash-balance") return asset;

    let currentPrice = asset.currentPrice ?? 0;
    const quantity = asset.quantity ?? 0;
    const avgPrice = asset.avgPrice ?? 0;

    // 장중일 때만 가상 모의투자 가격 변동 시뮬레이션 적용
    if (isMarketOpen) {
      const randomFluctuation = 1 + (Math.random() * 0.02 - 0.01);
      currentPrice = Math.round(currentPrice * randomFluctuation);
    }

    const balance = currentPrice * quantity;
    const unrealizedProfit = balance - avgPrice * quantity;
    const returnRate =
      avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;

    return {
      ...asset,
      balance,
      currentPrice,
      unrealizedProfit,
      returnRate: Number(returnRate.toFixed(2)),
    };
  });
}
