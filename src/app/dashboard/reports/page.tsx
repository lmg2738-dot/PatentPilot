"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { FileText, Download, PenTool } from "lucide-react";
import type { AnalysisResult } from "@/types";

const sampleAnalysis: AnalysisResult = {
  patentabilityScore: 78,
  similarPatentCount: 235,
  similarPatents: [],
  competitors: ["Hanwha Vision", "LG CNS", "SK쉴더스", "ETRI"],
  differentiationStrategy: "영상분석 대신 멀티모달 이벤트 탐지 기술로 접근",
  marketPotential: {
    marketSize: "4조원",
    growthRate: "18%",
    summary: "시장 성장세 양호",
  },
  governmentSupport: ["AI 바우처", "디지털 혁신", "중기부 R&D"],
  risks: ["선행 특허 다수", "대기업 경쟁"],
  recommendedActions: ["차별화 전략 수립", "프로토타입 개발"],
  technicalDifficulty: "중상",
  recommendedBM: "B2B SaaS",
  developmentPeriod: "12-18개월",
  investmentPotential: "높음",
  fullReport: "",
};

export default function ReportsPage() {
  const [query, setQuery] = useState("AI CCTV");
  const [draftIdea, setDraftIdea] = useState("");
  const [draftResult, setDraftResult] = useState("");
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);

  const handleDownloadPDF = async () => {
    setLoadingPdf(true);
    try {
      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, analysis: sampleAnalysis }),
      });

      if (!response.ok) throw new Error("PDF 생성 실패");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `patentpilot-${query}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("PDF 생성 중 오류가 발생했습니다.");
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleGenerateDraft = async () => {
    if (!draftIdea.trim()) return;
    setLoadingDraft(true);

    try {
      const response = await fetch("/api/patent-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: draftIdea }),
      });
      const data = await response.json();
      setDraftResult(data.draft || "");
    } catch {
      alert("특허 초안 생성 중 오류가 발생했습니다.");
    } finally {
      setLoadingDraft(false);
    }
  };

  return (
    <DashboardShell currentPath="/dashboard/reports">
      <Header
        title="PDF 리포트"
        description="분석 보고서 PDF 생성 및 AI 특허 명세서 초안 작성"
      />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-brand-600" />
                <h2 className="text-lg font-semibold text-gray-900">분석 보고서 PDF</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                특허 가능성, 경쟁사, 시장성, 정부 지원 등을 포함한 종합 분석 보고서를 PDF로 다운로드합니다.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-500">최근 분석</p>
                <p className="font-medium text-gray-900 mt-1">{query}</p>
                <p className="text-sm text-brand-600 mt-1">특허 가능성: 78점</p>
              </div>
              <Button onClick={handleDownloadPDF} loading={loadingPdf} className="w-full">
                <Download className="w-4 h-4" />
                PDF 다운로드
              </Button>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-4">
                <PenTool className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">AI 특허 작성 보조</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                발명 아이디어를 입력하면 배경기술, 발명의 내용, 청구항 초안, 도면 설명을 생성합니다.
              </p>
              <Textarea
                value={draftIdea}
                onChange={(e) => setDraftIdea(e.target.value)}
                placeholder="발명 아이디어 입력 (예: 스마트 우산)"
                rows={3}
                className="mb-4"
              />
              <Button onClick={handleGenerateDraft} loading={loadingDraft} className="w-full">
                <PenTool className="w-4 h-4" />
                특허 초안 생성
              </Button>
            </Card>
          </div>

          {draftResult && (
            <Card className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">생성된 특허 초안</h2>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap break-words">
                {draftResult}
              </div>
            </Card>
          )}
    </DashboardShell>
  );
}
