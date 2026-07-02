"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Star, Check, CreditCard } from "lucide-react";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "무료",
    features: ["월 5회 검색", "기본 AI 분석"],
    current: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "39,000원/월",
    features: ["무제한 검색", "PDF 생성", "AI 특허 초안"],
    current: false,
  },
  {
    id: "business",
    name: "Business",
    price: "149,000원/월",
    features: ["Pro 전체", "경쟁사 모니터링", "알림", "API"],
    current: false,
  },
];

const favorites = [
  { query: "AI CCTV", notes: "보안 스타트업 아이디어", date: "2026-06-28" },
  { query: "스마트 우산", notes: "IoT 우산 프로젝트", date: "2026-06-25" },
];

export default function SettingsPage() {
  const [fullName, setFullName] = useState("사용자");
  const [email, setEmail] = useState("user@example.com");

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPath="/dashboard/settings" />
      <main className="pl-64">
        <div className="p-8">
          <Header title="설정" description="계정, 플랜, 즐겨찾기 관리" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">프로필</h2>
              <div className="space-y-4">
                <Input
                  label="이름"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <Input
                  label="이메일"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button>저장</Button>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                요금제
              </h2>
              <div className="space-y-3">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-4 rounded-lg border-2 ${
                      plan.current ? "border-brand-600 bg-brand-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{plan.name}</p>
                        <p className="text-sm text-gray-500">{plan.price}</p>
                      </div>
                      {plan.current ? (
                        <span className="text-xs font-medium text-brand-600 bg-brand-100 px-2 py-1 rounded-full">
                          현재 플랜
                        </span>
                      ) : (
                        <Button size="sm" variant="outline">업그레이드</Button>
                      )}
                    </div>
                    <ul className="mt-2 space-y-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-1 text-xs text-gray-600">
                          <Check className="w-3 h-3 text-brand-600" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                관심 기술 즐겨찾기
              </h2>
              <div className="space-y-3">
                {favorites.map((fav) => (
                  <div
                    key={fav.query}
                    className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{fav.query}</p>
                      <p className="text-sm text-gray-500">{fav.notes}</p>
                    </div>
                    <span className="text-xs text-gray-400">{fav.date}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
