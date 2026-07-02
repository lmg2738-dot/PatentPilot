import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SearchBox } from "@/components/search/SearchBox";
import { StatCard } from "@/components/ui/Card";
import { Card } from "@/components/ui/Card";
import { Search, Star, Bell, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPath="/dashboard" />
      <main className="pl-64">
        <div className="p-8">
          <Header
            title="대시보드"
            description="아이디어를 입력하고 AI 특허 분석을 시작하세요"
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="이번 달 검색"
              value="3 / 5"
              subtitle="Starter 플랜"
              icon={<Search className="w-6 h-6 text-brand-600" />}
            />
            <StatCard
              title="즐겨찾기"
              value="2"
              icon={<Star className="w-6 h-6 text-yellow-500" />}
            />
            <StatCard
              title="활성 알림"
              value="1"
              icon={<Bell className="w-6 h-6 text-orange-500" />}
            />
            <StatCard
              title="평균 특허 점수"
              value="78점"
              trend={{ value: "12%", positive: true }}
              icon={<TrendingUp className="w-6 h-6 text-green-600" />}
            />
          </div>

          <Card className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 분석</h2>
            <SearchBox />
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 검색</h2>
            <div className="space-y-3">
              {[
                { query: "AI CCTV", score: 78, date: "2026-06-28" },
                { query: "스마트 우산", score: 85, date: "2026-06-25" },
                { query: "배터리 냉각", score: 62, date: "2026-06-20" },
              ].map((item) => (
                <div
                  key={item.query}
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.query}</p>
                    <p className="text-sm text-gray-500">{item.date}</p>
                  </div>
                  <span className="px-3 py-1 bg-brand-50 text-brand-700 text-sm font-semibold rounded-full">
                    {item.score}점
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
