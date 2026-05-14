"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins } from "lucide-react";
import { useAssetStore } from "@/store/useAssetStore";
import { useAssets } from "@/hooks/useAssets"; // ✅ 실제 API 훅 추가
import { useQueryClient } from "@tanstack/react-query"; // ✅ 데이터 새로고침용
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription, // ✅ 웹 접근성 경고 해결을 위해 추가
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CashCard() {
  const activeTab = useAssetStore((state) => state.activeTab);

  // ✅ 1. API 데이터와 QueryClient 가져오기
  const { data: assets = [] } = useAssets();
  const queryClient = useQueryClient();

  // 💡 [핵심 수정] 일반 탭이 아닐 경우(ISA, CMA 등)에는 0원 처리하여 데이터 꼬임 방지
  const availableCash = useMemo(() => {
    if (activeTab !== "일반") {
      return 0;
    }
    const cashAsset = assets.find((asset) => asset.id === "cash-balance");
    return cashAsset ? cashAsset.balance : 0;
  }, [assets, activeTab]);

  const [open, setOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");

    if (!rawValue) {
      setCustomAmount("");
      return;
    }

    setCustomAmount(Number(rawValue).toLocaleString());
  };

  const addQuickAmount = (amount: number) => {
    const currentRaw = Number(customAmount.replace(/,/g, "")) || 0;
    setCustomAmount((currentRaw + amount).toLocaleString());
  };

  // ✅ 3. 입출금 로직을 '실제 계좌 동기화 안내'로 변경
  const handleCashUpdate = async (type: "deposit" | "withdraw") => {
    const amount = Number(customAmount.replace(/,/g, ""));

    if (amount <= 0) return alert("올바른 금액을 입력해주세요.");

    // 모의 UI 대신 안내 메시지 출력
    alert(
      "현재 실제 증권사 계좌와 연동되어 있습니다.\n실제 입출금은 연계 은행이나 HTS/MTS를 이용해주세요.\n\n확인을 누르시면 최신 잔액으로 동기화합니다.",
    );

    // 강제로 API를 다시 찔러서 최신 예수금을 불러옴
    await queryClient.invalidateQueries({ queryKey: ["assets", "real"] });

    setCustomAmount("");
    setOpen(false);
  };

  return (
    <Card className="rounded-2xl border-zinc-200/80 shadow-sm flex flex-col justify-between h-full min-h-[120px]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-zinc-500">
          주문가능 예수금
        </CardTitle>
        <Coins className="w-4 h-4 text-zinc-400" />
      </CardHeader>

      <CardContent>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xl font-medium text-zinc-400">₩</span>
          <span className="text-3xl font-bold text-zinc-900 tracking-tight">
            {availableCash.toLocaleString()}
          </span>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="w-full mt-6 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2.5 rounded-lg text-[15px] font-semibold transition-colors">
              예수금 관리
            </button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[400px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-zinc-900">
                {activeTab} 계좌 예수금 관리
              </DialogTitle>
              {/* ✅ 화면에는 보이지 않지만, 스크린 리더를 위해 설명을 추가하여 브라우저 경고를 없앱니다. */}
              <DialogDescription className="sr-only">
                예수금 입출금 안내 및 최신 잔액으로 동기화하는 창입니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="p-3 bg-zinc-50 text-zinc-500 text-sm rounded-lg border border-zinc-100">
                💡 <strong>안내:</strong> 실제 계좌의 입출금은 증권사 앱을
                이용해주세요. 여기서는 데이터 동기화만 지원합니다.
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">
                  ₩
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={customAmount}
                  onChange={handleInputChange}
                  placeholder="금액을 입력하세요"
                  className="pl-8 h-14 text-lg font-bold rounded-xl border-zinc-200 focus-visible:ring-blue-500 bg-white"
                />
              </div>

              <div className="flex gap-2">
                {[100000, 500000, 1000000, 5000000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => addQuickAmount(amount)}
                    className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 py-2 rounded-lg text-[13px] font-semibold transition-colors"
                  >
                    +{amount / 10000}만
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleCashUpdate("withdraw")}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl text-[15px] font-bold border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                >
                  출금 확인
                </Button>
                <Button
                  onClick={() => handleCashUpdate("deposit")}
                  className="flex-1 h-12 rounded-xl text-[15px] font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  입금 확인
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
