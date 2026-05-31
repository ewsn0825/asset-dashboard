import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

// 🏎️ [성능 최적화 1] 매 요청 및 호출마다 process.env 스트링을 파싱하고 .trim()하는 낭비 방지
const API_BASE = process.env.REAL_API_URL || "";
const APP_KEY = process.env.APP_KEY || "";
const APP_SECRET = process.env.APP_SECRET || "";
const CANO = (process.env.ACCOUNT_NO || "").trim();
const ACNT_PRDT_CD = (process.env.ACCOUNT_CODE || "").trim();
const IS_MOCK = process.env.IS_MOCK === "true";

const TOKEN_CACHE_KEY = IS_MOCK ? "kis_mock_access_token" : "kis_access_token";
const DATA_CACHE_KEY = IS_MOCK ? "kis_mock_balance_data" : "kis_balance_data";

/**
 * Redis 기반 토큰 발급 및 캐싱 함수
 */
async function getCachedAccessToken(): Promise<string> {
  let accessToken = await redis.get<string>(TOKEN_CACHE_KEY);

  if (!accessToken) {
    console.log(
      "🚀 [Orders API - Redis Cache Miss]: KIS 서버로 새 엑세스 토큰을 요청합니다.",
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
    await redis.set(TOKEN_CACHE_KEY, accessToken, { ex: 82800 }); // 23시간 캐싱
  }

  return accessToken ?? "";
}

/**
 * KIS POST 요청 필수 항목인 Hashkey 발급 함수
 */
async function getHashKey(bodyObj: object): Promise<string> {
  const hashRes = await fetch(`${API_BASE}/uapi/hashkey`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      appkey: APP_KEY,
      appsecret: APP_SECRET,
    },
    body: JSON.stringify(bodyObj),
  });

  const hashData = await hashRes.json();
  return hashData.HASH;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stockId, orderType, quantity, price } = body;

    // 1. 필수 데이터 검증
    if (!stockId || !orderType || !quantity || price === undefined) {
      return NextResponse.json(
        { message: "주문 정보가 올바르지 않습니다." },
        { status: 400 },
      );
    }

    // 2. Redis에서 엑세스 토큰 병렬 준비
    const accessToken = await getCachedAccessToken();

    // 3. 거래 ID(tr_id) 결정
    const trId =
      orderType === "buy"
        ? IS_MOCK
          ? "VTTC0802U"
          : "TTTC0802U" // 매수 분기
        : IS_MOCK
          ? "VTTC0801U"
          : "TTTC0801U"; // 매도 분기

    // 4. 주문 API 바디 설계 (시장가 스펙 고정)
    const orderBody = {
      CANO: CANO,
      ACNT_PRDT_CD: ACNT_PRDT_CD,
      PDNO: stockId,
      ORD_DVSN: "01", // 01: 시장가
      ORD_QTY: Math.floor(Number(quantity)).toString(),
      ORD_UNPR: "0", // 시장가는 무조건 단가 "0"
    };

    // 5. 해시키 발급 통신
    const hashkey = await getHashKey(orderBody);

    // 6. 한국투자증권 실제 주식 현금 주문 전송
    const orderRes = await fetch(
      `${API_BASE}/uapi/domestic-stock/v1/trading/order-cash`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json; charset=utf-8",
          authorization: `Bearer ${accessToken}`,
          appkey: APP_KEY,
          appsecret: APP_SECRET,
          tr_id: trId,
          custtype: "P",
          hashkey: hashkey,
        },
        body: JSON.stringify(orderBody),
      },
    );

    const orderData = await orderRes.json();

    if (!orderRes.ok || orderData.rt_cd !== "0") {
      throw new Error(orderData.msg1 || "주문 전송에 실패했습니다.");
    }

    /**
     * 🏎️ [성능 및 UX 최적화 핵심 2] 잔고 캐시 즉시 파기 (Cache Invalidation)
     * 주문이 체결되어 예수금과 보유 종목 수량이 완벽히 변경되었으므로,
     * 기존에 Redis에 들어있던 장중 단기 캐싱본과 마감 캐싱본을 즉시 삭제합니다.
     * 이를 통해 유저가 대시보드로 복귀했을 때 즉시 한투 백엔드로부터 따끈따끈한 최신 자산 상태를 가져옵니다.
     */
    await Promise.all([
      redis.del(`${DATA_CACHE_KEY}_live`),
      redis.del(DATA_CACHE_KEY),
    ]);

    // 7. 주문 성공 응답 반환
    return NextResponse.json(
      {
        success: true,
        message: "주문이 성공적으로 처리되었습니다.",
        data: orderData.output,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("🚀 [Orders API Error]:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "알 수 없는 에러가 발생했습니다.";

    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
