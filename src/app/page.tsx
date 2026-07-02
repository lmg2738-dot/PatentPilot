import Link from "next/link";
import {
  Sparkles,
  Search,
  Brain,
  FileText,
  Bell,
  TrendingUp,
  Zap,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const features = [
  {
    icon: Search,
    title: "특허 검색",
    description: "KIPRIS API 연동으로 수백 건의 특허를 즉시 검색",
  },
  {
    icon: Brain,
    title: "AI 분석",
    description: "GPT 기반 특허 가능성, 차별화 전략 자동 분석",
  },
  {
    icon: TrendingUp,
    title: "시장성 평가",
    description: "KOSIS 데이터 기반 시장 규모·성장률 분석",
  },
  {
    icon: FileText,
    title: "PDF 리포트",
    description: "전문가 수준의 분석 보고서 자동 생성",
  },
  {
    icon: Bell,
    title: "특허 알림",
    description: "경쟁사 신규 특허 등록 시 실시간 알림",
  },
];

const plans = [
  {
    name: "Starter",
    price: "무료",
    description: "시작하기에 좋은 플랜",
    features: ["월 5회 검색", "기본 AI 분석", "검색 이력 저장"],
    cta: "무료 시작",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "39,000원",
    period: "/월",
    description: "본격적인 특허 분석",
    features: ["무제한 검색", "PDF 리포트 생성", "AI 특허 초안 작성", "즐겨찾기"],
    cta: "Pro 시작하기",
    highlighted: true,
  },
  {
    name: "Business",
    price: "149,000원",
    period: "/월",
    description: "팀과 기업을 위한",
    features: ["Pro 전체 기능", "경쟁사 모니터링", "특허 알림", "API 제공"],
    cta: "Business 시작하기",
    highlighted: false,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">PatentPilot AI</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 whitespace-nowrap">
              로그인
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">무료 시작</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 text-brand-700 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            AI 특허 비즈니스 분석 플랫폼
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 tracking-tight">
            아이디어를 입력하면
            <br />
            <span className="text-brand-600">특허·사업성</span>까지 분석
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            KIPRIS, KOSIS 데이터를 AI가 종합 분석합니다.
            하루 이상 걸리던 특허 조사를 5분 안에 완료하세요.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 px-4">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full">
                <Sparkles className="w-5 h-5" />
                지금 분석 시작
              </Button>
            </Link>
            <Link href="#pricing" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full">요금제 보기</Button>
            </Link>
          </div>

          {/* Demo preview */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl text-left">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-gray-400 text-sm">PatentPilot AI</span>
              </div>
              <div className="space-y-3 text-sm">
                <p className="text-gray-400">검색어: <span className="text-white font-medium">AI CCTV</span></p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-gray-400 text-xs">특허 가능성</p>
                    <p className="text-brand-400 text-xl font-bold">78점</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-gray-400 text-xs">유사 특허</p>
                    <p className="text-orange-400 text-xl font-bold">235건</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-gray-400 text-xs">시장 규모</p>
                    <p className="text-green-400 text-xl font-bold">4조원</p>
                  </div>
                </div>
                <p className="text-gray-300">
                  회피 전략: 영상분석 대신 멀티모달 이벤트 탐지 기술로 접근하면 등록 가능성이 높습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">핵심 기능</h2>
            <p className="mt-4 text-gray-600">특허 분석의 모든 과정을 AI가 자동화합니다</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="w-12 h-12 rounded-lg bg-brand-50 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">요금제</h2>
            <p className="mt-4 text-gray-600">필요에 맞는 플랜을 선택하세요</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border-2 ${
                  plan.highlighted
                    ? "border-brand-600 shadow-lg relative"
                    : "border-gray-200"
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-600 text-white text-xs font-medium rounded-full">
                    인기
                  </span>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-gray-500">{plan.period}</span>}
                </div>
                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className="block mt-8">
                  <Button
                    variant={plan.highlighted ? "primary" : "outline"}
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>&copy; 2026 PatentPilot AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
