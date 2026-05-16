// src/lib/redis.ts
import { Redis } from "@upstash/redis";

if (!process.env.STORAGE_REST_URL || !process.env.STORAGE_REST_TOKEN) {
  throw new Error(
    "Redis 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해 주세요.",
  );
}

export const redis = new Redis({
  url: process.env.STORAGE_REST_URL,
  token: process.env.STORAGE_REST_TOKEN,
});
