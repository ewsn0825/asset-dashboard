# 📈 Largon's Asset Management Dashboard (모의투자 자산 관리 대시보드)

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=auto:dark&height=180&section=header&text=Asset%20Dashboard&fontSize=50&animation=fadeIn" width="100%" />
</div>

> **실시간 증권사 API 연동 및 고속 Redis 캐시 레이어를 결합하여 사용자 인터랙션을 극대화한 Next.js 기반 모의투자 자산 관리 대시보드입니다.**
>
> 단순한 UI 구현에 그치지 않고, 런타임 병목을 추적하여 **Lighthouse 성능 점수를 70점대에서 86점까지 끌어올린 대대적인 성능 엔지니어링** 과정을 거쳤습니다.

---

## 🚀 Key Results & Performance Matrix

| Metric                                 |     Before Optimization     | After Optimization  |        Improvement         |
| :------------------------------------- | :-------------------------: | :-----------------: | :------------------------: |
| **Lighthouse Performance**             |         **70점대**          |      **86점**       |     **+16점 상승 📈**      |
| **Core API TTFB (Time to First Byte)** |           ~400ms            |       **2ms**       |   **99.5% 부하 절감 ⚡**   |
| **Tab Switching Delay**                | 연쇄 리렌더링 유발 (300ms+) | **0ms (즉시 반영)** | **인터랙션 버벅거림 종결** |

---

## 🛠 Tech Stack

### Frontend

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query v5)
- **Styling:** Tailwind CSS, Shadcn UI
- **Charts:** Recharts

### Backend & Infrastructure

- **Server:** Next.js Route Handlers
- **Database / Cache:** Redis (Upstash)
- **External API:** 한국투자증권(KIS) 오픈 API

---

## 🔥 Core Features (핵심 기능)

1. **실시간 자산 및 계좌 통합 모니터링**
   - 일반, ISA, CMA 계좌 탭 전환 시 TanStack Query 캐시 레이어와 Zustand 전역 상태 관리를 결합하여 딜레이 없는 화면 전환 구현.
2. **증권사 포트폴리오 정렬 메커니즘**
   - 보유 종목 수량에 관계없이 평가금액이 높은 순, 수익률이 높은 순 등 실시간 증권사 규격 가이드라인에 맞춘 TOP 5 종목 우선 노출 및 '더보기' UI 스케줄링.
3. **정밀 평단가 실시간 재계산 & 낙관적 업데이트 (Optimistic Update)**
   - 신규 매수/매도 주문 전송 즉시, 백엔드 응답을 기다리지 않고 프론트엔드 단에서 평단가 공식을 역산하고 잔고를 갱신하여 0ms 체결 사용자 경험 제공.
4. **반응형 고성능 돈차트 구현**
   - 테마(다크/라이트) 스왑 타이밍 및 런타임 하이드레이션 오류를 원천 차단한 `ResizeObserver` 기반 동적 픽셀 비중 차트 구축.

---

## ⚡ Trouble Shooting & Optimization (트러블 슈팅 & 성능 최적화)

### 1. 외부 API 연타로 인한 Rate Limit 및 TTFB 저하 문제

- **문제 상황:** 유저가 대시보드 진입 시 한국투자증권 잔고 조회 API를 직접 호출하도록 구현했으나, 5초 간격 실시간 폴링 및 탭 전환 연타 시 한투 API 제한(Rate Limit)에 걸려 대시보드가 마비되는 현상 발생 (TTFB 약 400ms 지연).
- **해결 방법 (Redis 2중 캐시 레이어 아키텍처 도입):**
  - 장중(09:00~15:30)에는 **2초 초단기 live 캐시**를 적용하여 연타 요청이 한투로 직접 가지 않고 Redis에서 우선 서빙되도록 방어벽 구축.
  - 장 마감 후(야간/주말)에는 데이터 변동이 없으므로 **12시간 장기 고정 캐시 풀**을 활성화하여 한투 API 호출을 차단하고 서버 자원 보존.
  - 결과적으로 서버 응답 시간(TTFB)을 **2ms**로 획기적으로 낮춤.

### 2. useEffect 동기적 상태 변경으로 인한 연쇄 렌더링 병목 (`Cascading Renders`)

- **문제 상황:** 신규 매수 모달 및 주문 모달이 열고 닫힐 때, 모달 내부 상태 초기화를 위해 `useEffect` 내에서 여러 개의 `setState`를 동기적으로 호출하여 화면 애니메이션이 뚝뚝 끊기고 린터 경고가 발생하는 병목 현상 포착.
- **해결 방법:** 부수 효과를 양산하는 `useEffect` 및 `setTimeout` 클린업 타이머를 전면 제거. Radix UI(`Dialog`) 생명주기와 직접 맞물리는 `onOpenChange` 핸들러 및 부모의 제어용 `onClose` 파이프라인의 이벤트 시점으로 상태 리셋 로직을 통합하여 단일 렌더링 주기로 최적화(60fps 애니메이션 복구).

### 3. Recharts `ResponsiveContainer` 하이드레이션 에러 및 렌더링 타이밍 이슈

- **문제 상황:** Next.js App Router 환경에서 Recharts의 `<ResponsiveContainer>`를 사용할 때, 서버 프리렌더링 단계에서 부모 요소의 너비를 측정하지 못해 `width(-1) and height(-1) of chart should be greater than 0` 경고가 콘솔과 개발 터미널을 더럽히는 고질적인 버그 발생.
- **해결 방법:** 경고의 주범인 `ResponsiveContainer`를 과감히 들어내고, 브라우저 표준 Native API인 **`ResizeObserver`**를 커스텀 훅 레이어로 구축. 부모 컨테이너의 가로 폭 픽셀을 React 상태로 직접 유도하고, 치수 측정 전 단계에는 차트 마운트를 엄격히 정지시킴으로써 레이아웃 시프트(CLS) 및 라이브러리 추적 타이밍 경고를 완전 박멸함.

### 4. 장외 시간(야간/주말) 자산 ₩0 노출 데이터 싱크 오류

- **문제 상황:** 장외 시간에 Redis 캐시에서 정제되지 않은 기초 자산 데이터를 꺼내 반환할 때, 실시간 가격 변동성 포매터 함수를 거치지 않아 프론트엔드가 기대하는 `balance(평가금액)` 및 `unrealizedProfit(평가손익)` 필드가 누락되어 대시보드가 ₩0으로 초기화되는 정합성 오류 발견.
- **해결 방법:** 백엔드 라우터(`route.ts`) 캐시 반환 컨트롤러 내부에 `applyLiveFluctuation(cachedData, false)` 연산 가드를 강제로 통과시킴. 장외 시간에는 주가 변동 시뮬레이션(random)은 제한하되, 보유 주수와 기존 종가를 연산하여 프론트엔드로 항시 무결성 데이터를 서빙하도록 규격 일치화 완료.

---

## 🛠️ Architecture & Data Flow

```text
[Client Dashboard] ── Zustand (Tab State)
       │
       ▼ (useAssets Hook - Tab Targeted Cached)
[TanStack Query Cache Layer] ── (Optimistic Update Logic on Buy/Sell Order)
       │
       ▼ (Fetch Request)
[Next.js Route Handler]
       │
       ├─── [isMarketOpen: True]  ──> Check 2s Live Redis Cache ──> (If Miss) ──> KIS API Fetch
       │
       └─── [isMarketOpen: False] ──> Fetch 12h Static Redis Cache ──> Apply Static Evaluation
```
