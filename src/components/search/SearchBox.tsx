"use client";

import { useState } from "react";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AnalysisDashboard } from "@/components/analysis/AnalysisDashboard";
import { DataSourcesBanner } from "@/components/analysis/DataSourcesBanner";
import { fetchJson } from "@/lib/fetch-json";
import { createDataDrivenAnalysis } from "@/lib/analysis-fallback";
import type { AnalysisResult, MarketData } from "@/types";
import type { DataSourcesMeta } from "@/lib/api/types";

interface SearchBoxProps {
  onAnalyze?: (query: string, result: AnalysisResult) => void;
  placeholder?: string;
  buttonText?: string;
}

interface AnalyzeDataResponse {
  query: string;
  patents: AnalysisResult["similarPatents"];
  patentCount: number;
  marketData: unknown[];
  sources: DataSourcesMeta;
  messages: Partial<Record<keyof DataSourcesMeta, string>>;
  error?: string;
}

interface AnalyzeAiResponse {
  analysis: AnalysisResult;
  source: "live" | "mock";
  message?: string;
  error?: string;
}

function buildFallbackAnalysis(data: AnalyzeDataResponse): AnalysisResult {
  return createDataDrivenAnalysis({
    query: data.query,
    patents: data.patents,
    marketData: data.marketData as MarketData[],
    patentCount: data.patentCount,
  });
}

export function SearchBox({
  onAnalyze,
  placeholder = "분석할 아이디어를 입력하세요 (예: AI CCTV)",
  buttonText = "AI 분석 시작",
}: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [result, setResult] = useState<{
    query: string;
    analysis: AnalysisResult;
    sources?: DataSourcesMeta;
    messages?: Partial<Record<keyof DataSourcesMeta, string>>;
  } | null>(null);

  const handleAnalyze = async () => {
    if (!query.trim()) {
      setError("검색어를 입력해주세요.");
      return;
    }

    setLoading(true);
    setAiLoading(false);
    setError("");
    setWarning("");
    setResult(null);

    let data: AnalyzeDataResponse | null = null;

    try {
      const { ok, data: dataResponse } = await fetchJson<AnalyzeDataResponse>(
        "/api/analyze",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: query.trim() }),
        },
        15000
      );

      if (!ok) {
        throw new Error(dataResponse.error || "데이터 조회 중 오류가 발생했습니다.");
      }

      data = dataResponse;
      setLoading(false);
      setAiLoading(true);

      let aiData: AnalyzeAiResponse;
      try {
        const aiResponse = await fetchJson<AnalyzeAiResponse>(
          "/api/analyze/ai",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: data.query,
            patentCount: data.patentCount,
            patents: data.patents.slice(0, 5),
            marketData: data.marketData.slice(0, 3),
          }),
          },
          12000
        );

        if (!aiResponse.ok) {
          throw new Error(aiResponse.data.error || "AI 분석 실패");
        }
        aiData = aiResponse.data;
      } catch (aiErr) {
        setWarning(
          aiErr instanceof Error
            ? `${aiErr.message} — 특허·시장 데이터만 표시합니다.`
            : "AI 분석 실패 — 특허·시장 데이터만 표시합니다."
        );
        aiData = {
          analysis: buildFallbackAnalysis(data),
          source: "mock",
          message: "AI 응답 지연 — 특허·시장 데이터 기반 분석 표시",
        };
      }

      const sources: DataSourcesMeta = {
        ...data.sources,
        analysis: aiData.source,
      };

      const messages = {
        ...data.messages,
        analysis: aiData.message,
      };

      const analysisResult = {
        query: data.query,
        analysis: aiData.analysis,
        sources,
        messages,
      };

      setResult(analysisResult);
      onAnalyze?.(data.query, aiData.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && !aiLoading && handleAnalyze()}
            placeholder={placeholder}
            className="pl-10"
            error={error}
          />
        </div>
        <Button
          onClick={handleAnalyze}
          loading={loading || aiLoading}
          size="lg"
          className="w-full sm:w-auto shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          {buttonText}
        </Button>
      </div>

      {(loading || aiLoading) && (
        <div className="flex items-center gap-2 text-sm text-brand-600 bg-brand-50 border border-brand-200 rounded-lg px-4 py-3">
          <Loader2 className="w-4 h-4 animate-spin" />
          {loading ? "특허·시장 데이터 조회 중..." : "AI 분석 중..."}
        </div>
      )}

      {warning && (
        <p className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
          {warning}
        </p>
      )}

      {result?.sources && (
        <DataSourcesBanner sources={result.sources} messages={result.messages} />
      )}

      {result && (
        <AnalysisDashboard query={result.query} analysis={result.analysis} />
      )}
    </div>
  );
}
