import type { AnalysisResult, PatentResult, MarketData } from "@/types";

export interface AnalysisInput {
  query: string;
  patents: PatentResult[];
  marketData: MarketData[];
  patentCount: number;
}

export function createDataDrivenAnalysis(input: AnalysisInput): AnalysisResult {
  const competitors = [...new Set(input.patents.map((p) => p.applicant))].slice(0, 5);
  const count = input.patentCount || input.patents.length;
  const score =
    count < 50 ? 85 : count < 200 ? 75 : count < 1000 ? 65 : count < 5000 ? 55 : 45;

  const topPatent = input.patents[0];
  const differentiationStrategy = topPatent
    ? `유사 특허 "${topPatent.title}" 대비 ${input.query} 고유 알고리즘·적용 분야 차별화 필요`
    : `${input.query} 관련 선행기술 대비 독립 청구항 설계 권장`;

  const market = input.marketData[0];
  const risks =
    count > 1000
      ? ["선행 특허 다수로 등록 난이도 높음", "대기업 경쟁 심화", "청구항 한정 필요"]
      : count > 200
        ? ["유사 특허 존재", "차별화 포인트 명확화 필요", "심사 대응 전략 필요"]
        : ["시장 진입 기회 양호", "선행기술조사 지속 필요", "해외 출원 검토"];

  return {
    patentabilityScore: score,
    similarPatentCount: count,
    similarPatents: input.patents.slice(0, 5),
    competitors: competitors.length > 0 ? competitors : ["데이터 없음"],
    differentiationStrategy,
    marketPotential: {
      marketSize: market?.marketSize || "-",
      growthRate: market?.growthRate || "-",
      summary: market
        ? `${market.marketName} 시장 기준 KOSIS live 데이터 반영`
        : "시장 데이터 기반 분석",
    },
    governmentSupport: ["중소기업 R&D 지원사업", "AI 바우처", "TIPS 프로그램"],
    risks,
    recommendedActions: [
      "유사 특허 상세 분석",
      "차별화 포인트 도출",
      "프로토타입 검증",
      count > 500 ? "청구항 한정 검토" : "출원 전략 수립",
    ],
    technicalDifficulty: count > 2000 ? "상" : count > 500 ? "중상" : "중",
    recommendedBM: "B2B SaaS + 라이선스",
    developmentPeriod: count > 1000 ? "18-24개월" : "12-18개월",
    investmentPotential: score >= 70 ? "높음" : score >= 55 ? "중" : "보통",
    fullReport: `# ${input.query} 데이터 기반 분석\n유사 특허 ${count}건, 시장 ${market?.marketSize || "-"}`,
  };
}
