"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAssetStore } from "@/store/useAssetStore";
import { Stock } from "@/types";

export function AddStockModal() {
  const addStock = useAssetStore((state) => state.addStock);
  // ✅ 현재 활성화된 탭(계좌) 정보를 스토어에서 가져옵니다.
  const activeTab = useAssetStore((state) => state.activeTab);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    ticker: "",
    quantity: "",
    avgPrice: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.ticker.trim() ||
      Number(form.quantity) <= 0 ||
      Number(form.avgPrice) <= 0
    ) {
      alert(
        "모든 필드를 올바르게 입력해주세요 (수량과 가격은 0보다 커야 합니다).",
      );
      return;
    }

    // ✅ 통일된 Stock 타입에 맞게 데이터 구성 (accountType 추가)
    const newStock: Stock = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      ticker: form.ticker.trim().toUpperCase(),
      quantity: Number(form.quantity),
      avgPrice: Number(form.avgPrice),
      currentPrice: Number(form.avgPrice),
      accountType: activeTab, // 현재 보고 있는 탭의 계좌로 종목이 추가됩니다.
    };

    addStock(newStock);
    setOpen(false);
    setForm({ name: "", ticker: "", quantity: "", avgPrice: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* ✨ 세련된 '핀테크 블루' 버튼 및 플러스 아이콘 */}
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-[8px] shadow-sm transition-colors duration-200 flex items-center gap-1.5 text-[15px] h-10 border-none">
          <svg
            width="18"
            height="18"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          종목 추가
        </Button>
      </DialogTrigger>

      {/* ✨ 모달 창 둥근 모서리 적용 */}
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-zinc-900">
            보유 종목 추가
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid gap-2.5">
            <Label htmlFor="name" className="text-zinc-600 font-medium">
              종목명
            </Label>
            {/* ✨ 둥근 입력창과 포커스 시 파란색 링 */}
            <Input
              id="name"
              placeholder="예: 삼성전자"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-xl h-11 border-zinc-200 focus-visible:ring-blue-500"
            />
          </div>

          <div className="grid gap-2.5">
            <Label htmlFor="ticker" className="text-zinc-600 font-medium">
              티커 (심볼)
            </Label>
            <Input
              id="ticker"
              placeholder="예: 005930 또는 AAPL"
              value={form.ticker}
              onChange={(e) => setForm({ ...form, ticker: e.target.value })}
              className="rounded-xl h-11 border-zinc-200 focus-visible:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2.5">
              <Label htmlFor="quantity" className="text-zinc-600 font-medium">
                보유 수량
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="rounded-xl h-11 border-zinc-200 focus-visible:ring-blue-500"
              />
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="avgPrice" className="text-zinc-600 font-medium">
                매수 평균가
              </Label>
              <Input
                id="avgPrice"
                type="number"
                min="0"
                placeholder="0"
                value={form.avgPrice}
                onChange={(e) => setForm({ ...form, avgPrice: e.target.value })}
                className="rounded-xl h-11 border-zinc-200 focus-visible:ring-blue-500"
              />
            </div>
          </div>

          {/* ✨ 제출 버튼을 시원한 블루 컬러로 통일 */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl py-6 text-[16px] font-bold text-white shadow-sm transition-colors mt-2 border-none"
          >
            포트폴리오에 추가하기
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
