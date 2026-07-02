import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { AnalysisResult } from "@/types";

export function generatePDFReport(query: string, analysis: AnalysisResult): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // 헤더
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("PatentPilot AI", 20, 20);
  doc.setFontSize(12);
  doc.text("특허·사업성 분석 보고서", 20, 32);

  // 기본 정보
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.text(`분석 대상: ${query}`, 20, 55);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`생성일: ${new Date().toLocaleDateString("ko-KR")}`, 20, 63);

  // 특허 가능성 점수
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text("특허 가능성 점수", 20, 80);
  doc.setFontSize(36);
  doc.setTextColor(37, 99, 235);
  doc.text(`${analysis.patentabilityScore}점`, 20, 95);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`유사 특허: ${analysis.similarPatentCount}건`, 20, 105);

  // 시장성
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text("시장성 평가", 20, 120);
  autoTable(doc, {
    startY: 125,
    head: [["항목", "내용"]],
    body: [
      ["시장 규모", analysis.marketPotential.marketSize],
      ["성장률", analysis.marketPotential.growthRate],
      ["기술 난이도", analysis.technicalDifficulty],
      ["개발 기간", analysis.developmentPeriod],
      ["투자 유치 가능성", analysis.investmentPotential],
      ["추천 BM", analysis.recommendedBM],
    ],
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: 20, right: 20 },
  });

  // 경쟁사
  const currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text("주요 경쟁사", 20, currentY);
  autoTable(doc, {
    startY: currentY + 5,
    head: [["경쟁사"]],
    body: analysis.competitors.map((c) => [c]),
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: 20, right: 20 },
  });

  // 차별화 전략
  const y2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text("차별화 전략", 20, y2);
  doc.setFontSize(10);
  const strategyLines = doc.splitTextToSize(analysis.differentiationStrategy, pageWidth - 40);
  doc.text(strategyLines, 20, y2 + 8);

  // 새 페이지 - 리스크 & 권장사항
  doc.addPage();
  doc.setFontSize(14);
  doc.text("리스크", 20, 20);
  autoTable(doc, {
    startY: 25,
    head: [["#", "리스크"]],
    body: analysis.risks.map((r, i) => [String(i + 1), r]),
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: 20, right: 20 },
  });

  const y3 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text("권장 다음 단계", 20, y3);
  autoTable(doc, {
    startY: y3 + 5,
    head: [["#", "권장 사항"]],
    body: analysis.recommendedActions.map((a, i) => [String(i + 1), a]),
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: 20, right: 20 },
  });

  // 정부 지원
  const y4 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  if (y4 < 250) {
    doc.setFontSize(14);
    doc.text("정부 지원 프로그램", 20, y4);
    autoTable(doc, {
      startY: y4 + 5,
      head: [["프로그램"]],
      body: analysis.governmentSupport.map((g) => [g]),
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: 20, right: 20 },
    });
  }

  // 푸터
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `PatentPilot AI | Page ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  return Buffer.from(doc.output("arraybuffer"));
}
