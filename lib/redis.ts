// src/lib/redis.ts
import { Redis } from "@upstash/redis";

// 스크린샷에 있는 정확한 변수명으로 변경 완료!
const redisUrl = process.env.KV_REST_API_URL;
const redisToken = process.env.KV_REST_API_TOKEN;

if (!redisUrl || !redisToken) {
  throw new Error("Redis 환경 변수가 설정되지 않았습니다.");
}

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});
