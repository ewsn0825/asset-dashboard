import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

// 🏎️ [성능 최적화 1] 환경 변수 파싱 부하를 없애기 위해 상위 스코프에 고정
const API_BASE = process.env.REAL_API_URL || "";
const APP_KEY = process.env.APP_KEY || "";
const APP_SECRET = process.env.APP_SECRET || "";
const IS_MOCK = process.env.IS_MOCK === "true";

const TOKEN_CACHE_KEY = IS_MOCK ? "kis_mock_access_token" : "kis_access_token";
const PRICE_CACHE_PREFIX = "kis_stock_price:";

/**
 * 🏎️ [성능 최적화 2] KST 장 시간 체크 유틸리티 함수
 */
const checkIsMarketOpen = (): boolean => {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC to KST 오프셋 가산

  const day = kst.getUTCDay(); // 0: 일요일, 6: 토요일
  if (day === 0 || day === 6) return false;

  const hours = kst.getUTCHours();
  const minutes = kst.getUTCMinutes();
  const currentTime = hours * 100 + minutes;

  return currentTime >= 900 && currentTime <= 1530;
};

/**
 * ⚙️ [린트/타입 에러 완전 해결] 널 검사를 통과하는 선언형 토큰 관리 훅
 */
async function getCachedAccessToken(): Promise<string> {
  const cachedToken = await redis.get<string>(TOKEN_CACHE_KEY);
  if (cachedToken) return cachedToken;

  console.log(
    "🚀 [Price API - Redis Cache Miss]: KIS 서버로 새 엑세스 Token을 요청합니다.",
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

  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(`토큰 에러: ${tokenData.error_description || "발급 실패"}`);
  }

  const newToken = tokenData.access_token;
  await redis.set(TOKEN_CACHE_KEY, newToken, { ex: 82800 });
  return newToken;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stockId = searchParams.get("id");

    if (!stockId) {
      return NextResponse.json(
        { message: "종목 코드가 필요합니다." },
        { status: 400 },
      );
    }

    const priceCacheKey = `${PRICE_CACHE_PREFIX}${stockId}`;
    const isMarketOpen = checkIsMarketOpen();

    // 🏎️ [성능 최적화 3] Redis 캐시 레이어 도입 (장중 / 장외 유연한 가속 스위칭)
    const cachedPrice = await redis.get<number>(priceCacheKey);
    if (cachedPrice !== null) {
      return NextResponse.json({ price: cachedPrice }, { status: 200 });
    }

    // 캐시가 비어있을 때만 실제 KIS 서버 래핑 호출 돌입
    const accessToken = await getCachedAccessToken();
    const queryParams = new URLSearchParams({
      FID_COND_MRKT_DIV_CODE: "J", // 주식, ETF
      FID_INPUT_ISCD: stockId, // 종목코드
    });

    const priceRes = await fetch(
      `${API_BASE}/uapi/domestic-stock/v1/quotations/inquire-price?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "content-type": "application/json; charset=utf-8",
          authorization: `Bearer ${accessToken}`,
          appkey: APP_KEY,
          appsecret: APP_SECRET,
          tr_id: "FHKST01010100",
        },
      },
    );

    const data = await priceRes.json();

    if (!priceRes.ok || data.rt_cd !== "0" || !data.output) {
      console.error("🚀 [Price API Error]:", data.msg1 || data);
      throw new Error(data.msg1 || "가격 조회 실패");
    }

    const currentPrice = Number(data.output.stck_prpr);

    // 🏎️ [성능 최적화 4] 생명주기 스케줄링 전략 캐싱 저장
    if (isMarketOpen) {
      // 💡 장중에는 실시간 시세 연동 부하를 최소화하기 위해 딱 1초~2초만 단기 스위칭 저장
      await redis.set(priceCacheKey, currentPrice, { ex: 1 });
    } else {
      // 💡 장 마감 후에는 주가가 변하지 않으므로 한시간(3600초) 이상 프리패스 캐싱 처리
      await redis.set(priceCacheKey, currentPrice, { ex: 3600 });
    }

    return NextResponse.json({ price: currentPrice }, { status: 200 });
  } catch (error: unknown) {
    console.error("🚀 [Price Route Error]:", error);
    const msg = error instanceof Error ? error.message : "서버 오류";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
