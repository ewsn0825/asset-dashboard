"use client";

import { useState, useRef, useEffect } from "react";
import { debounce } from "lodash-es";
import { useAssetStore } from "@/store/useAssetStore";
import { useQueryClient } from "@tanstack/react-query"; // ✅ 데이터 새로고침을 위해 추가
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription, // ✅ 웹 접근성 경고 해결을 위해 추가
} from "@/components/ui/dialog";

export function AddStockModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  const activeTab = useAssetStore((state) => state.activeTab);
  const queryClient = useQueryClient(); // ✅ React Query 인스턴스 가져오기

  const debouncedSearchRef = useRef(
    debounce((query: string) => {
      if (!query.trim()) return;
      console.log(`🚀 [API 호출됨]: "${query}" (lodash-es 디바운스 완벽 작동)`);
      // TODO: 추후 종목 검색 API 연동 시 이곳에 작성
    }, 500),
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearchRef.current(value);
  };

  useEffect(() => {
    return () => {
      debouncedSearchRef.current.cancel();
    };
  }, []);

  // ✅ 수정된 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // 1. 시뮬레이션용 지연
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 💡 [수정됨] activeTab을 활용하여 현재 어떤 계좌를 동기화하는지 명확하게 안내합니다.
      alert(
        `현재 한국투자증권 [${activeTab} 계좌]와 연동되어 있습니다.\n새로운 종목은 HTS/MTS를 통해 매수하시면 대시보드에 자동으로 동기화됩니다.`,
      );

      // 3. 만약 이미 매수했는데 안 보일 경우를 대비해 캐시를 무효화하고 최신 데이터를 다시 불러옵니다.
      await queryClient.invalidateQueries({ queryKey: ["assets", "real"] });

      // 4. 모달 초기화
      setIsOpen(false);
      setSearchTerm("");
      setQuantity("");
      setPrice("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-colors">
          종목 추가 +
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          {/* 💡 [수정됨] 모달 타이틀에도 activeTab을 반영하여 컨텍스트를 명확히 합니다. */}
          <DialogTitle>{activeTab} 계좌 동기화 안내</DialogTitle>
          {/* ✅ 화면에는 보이지 않지만, 스크린 리더를 위해 설명을 추가하여 브라우저 경고를 없앱니다. */}
          <DialogDescription className="sr-only">
            실제 계좌의 최신 주식 자산 내역을 불러와 대시보드를 동기화하는
            창입니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="p-3 mb-4 bg-blue-50 text-blue-600 rounded-lg text-sm">
            💡 <strong>안내:</strong> 실제 계좌 데이터를 불러오고 있습니다. 수동
            등록 대신 데이터 <strong>동기화(새로고침)</strong>가 진행됩니다.
          </div>

          <div className="opacity-60 pointer-events-none">
            {/* 💡 [수정됨] 입력 불가 상태임을 시각적으로 더 명확하게 하기 위해 
                wrapper에 opacity와 pointer-events-none을 주어 전체를 흐리게 처리했습니다. */}
            <div>
              <label className="text-sm font-medium">종목 검색</label>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="자동 동기화 모드입니다"
                className="w-full mt-1 p-2 border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-zinc-100"
                disabled
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-sm font-medium">매수 단가</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="-"
                  className="w-full mt-1 p-2 border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-zinc-100"
                  disabled
                />
              </div>
              <div>
                <label className="text-sm font-medium">수량</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="-"
                  className="w-full mt-1 p-2 border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-zinc-100"
                  disabled
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2.5 rounded-lg text-white font-semibold transition-colors mt-6 
              ${isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {isSubmitting ? "동기화 중..." : "최신 자산 내역 동기화"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
