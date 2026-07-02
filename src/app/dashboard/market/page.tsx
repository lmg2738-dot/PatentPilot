"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, TrendingUp, FileText } from "lucide-react";
import type { MarketData, PolicyInfo } from "@/types";

export default function MarketPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [policies, setPolicies] = useState<PolicyInfo[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch(`/api/market?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setMarketData(data.marketData || []);
      setPolicies(data.policies || []);
    } catch {
      setMarketData([]);
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPath="/dashboard/market" />
      <main className="pl-64">
        <div className="p-8">
          <Header
            title="시장성 평가"
            description="KOSIS 시장 데이터 및 정부 정책 정보"
          />

          <Card className="mb-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="시장 조사 키워드 (예: AI CCTV, 보안)"
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} loading={loading}>
                조회
              </Button>
            </div>
          </Card>

          {searched && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  시장 데이터
                </h2>
                <div className="space-y-3">
                  {marketData.map((market) => (
                    <Card key={market.marketName}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{market.marketName}</p>
                          <p className="text-sm text-gray-500">{market.year} · {market.source}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">{market.marketSize}</p>
                          <p className="text-sm text-green-600">성장률 {market.growthRate}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-600" />
                  관련 정책
                </h2>
                <div className="space-y-3">
                  {policies.map((policy) => (
                    <Card key={policy.title}>
                      <h3 className="font-medium text-gray-900">{policy.title}</h3>
                      <p className="text-sm text-brand-600 mt-1">{policy.department}</p>
                      <p className="text-sm text-gray-600 mt-2">{policy.summary}</p>
                      <p className="text-xs text-gray-400 mt-2">{policy.publishedDate}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
