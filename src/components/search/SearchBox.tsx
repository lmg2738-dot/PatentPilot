"use client";

import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AnalysisDashboard } from "@/components/analysis/AnalysisDashboard";
import type { AnalysisResult } from "@/types";

interface SearchBoxProps {
  onAnalyze?: (query: string, result: AnalysisResult) => void;
  placeholder?: string;
  buttonText?: string;
}

export function SearchBox({
  onAnalyze,
  placeholder = "분석할 아이디어를 입력하세요 (예: AI CCTV)",
  buttonText = "AI 분석 시작",
}: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    query: string;
    analysis: AnalysisResult;
  } | null>(null);

  const handleAnalyze = async () => {
    if (!query.trim()) {
      setError("검색어를 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "분석 중 오류가 발생했습니다.");
      }

      const analysisResult = { query: data.query, analysis: data.analysis };
      setResult(analysisResult);
      onAnalyze?.(data.query, data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            placeholder={placeholder}
            className="pl-10"
            error={error}
          />
        </div>
        <Button onClick={handleAnalyze} loading={loading} size="lg">
          <Sparkles className="w-4 h-4" />
          {buttonText}
        </Button>
      </div>

      {result && (
        <AnalysisDashboard query={result.query} analysis={result.analysis} />
      )}
    </div>
  );
}
