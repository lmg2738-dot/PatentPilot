import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SearchBox } from "@/components/search/SearchBox";
import { Card } from "@/components/ui/Card";

export default function AnalysisPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPath="/dashboard/analysis" />
      <main className="pl-64">
        <div className="p-8">
          <Header
            title="AI 분석"
            description="GPT 기반 특허 가능성, 경쟁사, 사업성 종합 분석"
          />

          <Card>
            <SearchBox
              placeholder="분석할 기술 아이디어를 입력하세요 (예: AI CCTV, 스마트 우산)"
              buttonText="종합 분석 시작"
            />
          </Card>
        </div>
      </main>
    </div>
  );
}
