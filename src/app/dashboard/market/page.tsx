"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, TrendingUp } from "lucide-react";
import type { MarketData } from "@/types";

export default function MarketPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch(`/api/market?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setMarketData(data.marketData || []);
    } catch {
      setMarketData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell currentPath="/dashboard/market">
      <Header title="시장성 평가" description="KOSIS 시장 데이터 조회" />

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="시장 조사 키워드 (예: AI CCTV, 보안)"
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} loading={loading} className="w-full sm:w-auto shrink-0">
            조회
          </Button>
        </div>
      </Card>

      {searched && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            시장 데이터
          </h2>
          <div className="space-y-3">
            {marketData.map((market) => (
              <Card key={market.marketName}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 break-words">{market.marketName}</p>
                    <p className="text-sm text-gray-500">{market.year} · {market.source}</p>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <p className="text-xl font-bold text-gray-900">{market.marketSize}</p>
                    <p className="text-sm text-green-600">성장률 {market.growthRate}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
