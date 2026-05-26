import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

// 1. Redis 기반 토큰 발급 및 캐싱 함수
async function getCachedAccessToken() {
  const API_BASE = process.env.REAL_API_URL;
  const APP_KEY = process.env.APP_KEY || "";
  const APP_SECRET = process.env.APP_SECRET || "";

  const tokenCacheKey =
    process.env.IS_MOCK === "true"
      ? "kis_mock_access_token"
      : "kis_access_token";

  let accessToken = await redis.get<string>(tokenCacheKey);

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
    // 23시간(82800초) 캐싱 저장
    await redis.set(tokenCacheKey, accessToken, { ex: 82800 });
  }

  return accessToken;
}

// 2. KIS POST 요청 필수 항목인 Hashkey 발급 함수
async function getHashKey(
  bodyObj: object,
  apiBase: string,
  appKey: string,
  appSecret: string,
) {
  const hashRes = await fetch(`${apiBase}/uapi/hashkey`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      appkey: appKey,
      appsecret: appSecret,
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
    // 💡 price가 0으로 넘어올 수 있으므로 undefined만 체크하도록 안전하게 수정
    if (!stockId || !orderType || !quantity || price === undefined) {
      return NextResponse.json(
        { message: "주문 정보가 올바르지 않습니다." },
        { status: 400 },
      );
    }

    const API_BASE = process.env.REAL_API_URL || "";
    const APP_KEY = process.env.APP_KEY || "";
    const APP_SECRET = process.env.APP_SECRET || "";
    const CANO = (process.env.ACCOUNT_NO || "").trim();
    const ACNT_PRDT_CD = (process.env.ACCOUNT_CODE || "").trim();
    const isMock = process.env.IS_MOCK === "true";

    // 2. Redis에서 엑세스 토큰 가져오기
    const accessToken = await getCachedAccessToken();

    // 3. 실전투자 vs 모의투자에 따른 거래 ID(tr_id) 분기 처리
    let trId = "";
    if (orderType === "buy") {
      trId = isMock ? "VTTC0802U" : "TTTC0802U"; // 모의 매수 vs 실전 매수
    } else {
      trId = isMock ? "VTTC0801U" : "TTTC0801U"; // 모의 매도 vs 실전 매도
    }

    // 4. 주문 데이터를 '시장가' 기준으로 구성합니다.
    const orderBody = {
      CANO: CANO,
      ACNT_PRDT_CD: ACNT_PRDT_CD,
      PDNO: stockId, // 종목코드
      ORD_DVSN: "01", // 💡 주문구분 (01: 시장가)
      ORD_QTY: Math.floor(Number(quantity)).toString(), // 수량 (정수 변환)
      ORD_UNPR: "0", // 💡 시장가 주문 시 단가는 반드시 "0"으로 세팅
    };

    const hashkey = await getHashKey(orderBody, API_BASE, APP_KEY, APP_SECRET);

    // 5. 한국투자증권 주식 현금 주문 API 호출
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

    // 6. 증권사 응답 코드(rt_cd) 확인 (성공 시 "0" 반환)
    if (!orderRes.ok || orderData.rt_cd !== "0") {
      throw new Error(orderData.msg1 || "주문 전송에 실패했습니다.");
    }

    // 7. 주문 성공 응답 반환
    return NextResponse.json(
      {
        success: true,
        message: "주문이 성공적으로 처리되었습니다.",
        data: orderData.output, // KIS에서 반환한 주문 번호 등
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
