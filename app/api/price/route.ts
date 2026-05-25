import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

// 기존 Orders 라우트와 동일한 토큰 발급 로직
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
    if (!tokenRes.ok) throw new Error("토큰 발급 실패");
    accessToken = tokenData.access_token;
    await redis.set(tokenCacheKey, accessToken, { ex: 82800 });
  }
  return accessToken;
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

    const API_BASE = process.env.REAL_API_URL;
    const APP_KEY = process.env.APP_KEY || "";
    const APP_SECRET = process.env.APP_SECRET || "";
    const accessToken = await getCachedAccessToken();

    // 💡 한국투자증권 '주식현재가 일자별' 또는 '주식현재가 시세' API 호출
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
          tr_id: "FHKST01010100", // 국내주식현재가시세 tr_id
        },
      },
    );

    const data = await priceRes.json();

    if (!priceRes.ok || data.rt_cd !== "0") {
      throw new Error(data.msg1 || "가격 조회 실패");
    }

    // output.stck_prpr 에 현재가(문자열)가 담겨 옵니다.
    const currentPrice = Number(data.output.stck_prpr);

    return NextResponse.json({ price: currentPrice }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "서버 오류";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
