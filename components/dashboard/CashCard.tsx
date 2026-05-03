"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins } from "lucide-react";
import { useAssetStore } from "@/store/useAssetStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CashCard() {
  const activeTab = useAssetStore((state) => state.activeTab);
  const availableCash = useAssetStore(
    (state) => state.availableCash?.[state.activeTab] ?? 0,
  );
  const updateCash = useAssetStore((state) => state.updateCash);

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

  const handleCashUpdate = (type: "deposit" | "withdraw") => {
    const amount = Number(customAmount.replace(/,/g, ""));

    if (amount <= 0) return alert("올바른 금액을 입력해주세요.");
    if (type === "withdraw" && amount > availableCash)
      return alert("출금액이 예수금 잔액보다 많습니다.");

    updateCash(activeTab, type === "deposit" ? amount : -amount);
    setCustomAmount("");
    setOpen(false);
  };

  return (
    <Card className="rounded-2xl border-zinc-200/80 shadow-sm flex flex-col justify-between h-full">
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
            </DialogHeader>
            <div className="space-y-6 pt-4">
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
                  className="pl-8 h-14 text-lg font-bold rounded-xl border-zinc-200 focus-visible:ring-blue-500"
                />
              </div>

              {/* ✨ 주식 앱 표준에 맞게 10만, 50만, 100만, 500만 단위로 수정 */}
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
                  출금하기
                </Button>
                <Button
                  onClick={() => handleCashUpdate("deposit")}
                  className="flex-1 h-12 rounded-xl text-[15px] font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  입금하기
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
