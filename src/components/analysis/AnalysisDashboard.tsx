import { cn, getStarRating } from "@/lib/utils";
import type { AnalysisResult } from "@/types";
import { Card } from "@/components/ui/Card";
import {
  Shield,
  TrendingUp,
  Users,
  AlertTriangle,
  Lightbulb,
  Target,
  Clock,
  DollarSign,
} from "lucide-react";

interface AnalysisDashboardProps {
  query: string;
  analysis: AnalysisResult;
}

export function AnalysisDashboard({ query, analysis }: AnalysisDashboardProps) {
  const riskStars = Math.min(5, Math.ceil(analysis.similarPatentCount / 50));

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="text-xl font-bold text-gray-900 mb-1">&quot;{query}&quot; 분석 결과</h2>
        <p className="text-sm text-gray-500">AI 기반 특허·사업성 종합 분석</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <Shield className="w-8 h-8 text-brand-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-1">특허 가능성</p>
          <p className="text-4xl font-bold text-brand-600">{analysis.patentabilityScore}점</p>
          <p className="text-yellow-500 mt-2 text-lg">{getStarRating(analysis.patentabilityScore)}</p>
        </Card>

        <Card className="text-center">
          <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-1">특허 중복 위험</p>
          <p className="text-yellow-500 text-2xl mt-2">{"★".repeat(riskStars)}{"☆".repeat(5 - riskStars)}</p>
          <p className="text-sm text-gray-600 mt-2">유사 특허 {analysis.similarPatentCount}건</p>
        </Card>

        <Card className="text-center">
          <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-1">시장성</p>
          <p className="text-2xl font-bold text-gray-900">{analysis.marketPotential.marketSize}</p>
          <p className="text-sm text-green-600 mt-1">성장률 {analysis.marketPotential.growthRate}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-brand-600" />
            <h3 className="font-semibold text-gray-900">주요 경쟁사</h3>
          </div>
          <div className="space-y-2">
            {analysis.competitors.map((competitor) => (
              <div
                key={competitor}
                className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg"
              >
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold">
                  {competitor.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-700">{competitor}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-gray-900">회피 전략</h3>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {analysis.differentiationStrategy}
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">정부 지원</h3>
          </div>
          <div className="space-y-2">
            {analysis.governmentSupport.map((support) => (
              <div
                key={support}
                className="px-3 py-2 bg-green-50 text-green-800 text-sm rounded-lg"
              >
                {support}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-gray-900">리스크</h3>
          </div>
          <ul className="space-y-2">
            {analysis.risks.map((risk) => (
              <li key={risk} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-red-500 mt-0.5">•</span>
                {risk}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <Clock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500">개발 기간</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{analysis.developmentPeriod}</p>
        </Card>
        <Card className="text-center">
          <DollarSign className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500">투자 유치</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{analysis.investmentPotential}</p>
        </Card>
        <Card className="text-center">
          <Target className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500">기술 난이도</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{analysis.technicalDifficulty}</p>
        </Card>
        <Card className="text-center">
          <TrendingUp className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500">추천 BM</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{analysis.recommendedBM}</p>
        </Card>
      </div>
    </div>
  );
}

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  const color = score >= 70 ? "text-green-600 bg-green-50" :
    score >= 40 ? "text-yellow-600 bg-yellow-50" : "text-red-600 bg-red-50";

  return (
    <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold", color, className)}>
      {score}점
    </span>
  );
}
