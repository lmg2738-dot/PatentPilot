"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Bell, Plus, Trash2, Mail, MessageSquare } from "lucide-react";

interface AlertItem {
  id: string;
  competitorName: string;
  keywords: string;
  notifyEmail: boolean;
  notifySlack: boolean;
  isActive: boolean;
}

const initialAlerts: AlertItem[] = [
  {
    id: "1",
    competitorName: "삼성전자",
    keywords: "AI, 영상분석",
    notifyEmail: true,
    notifySlack: false,
    isActive: true,
  },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [showForm, setShowForm] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState("");
  const [newKeywords, setNewKeywords] = useState("");

  const handleAddAlert = () => {
    if (!newCompetitor.trim()) return;

    setAlerts([
      ...alerts,
      {
        id: Date.now().toString(),
        competitorName: newCompetitor,
        keywords: newKeywords,
        notifyEmail: true,
        notifySlack: false,
        isActive: true,
      },
    ]);
    setNewCompetitor("");
    setNewKeywords("");
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setAlerts(alerts.filter((a) => a.id !== id));
  };

  const toggleActive = (id: string) => {
    setAlerts(
      alerts.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  return (
    <DashboardShell currentPath="/dashboard/alerts">
      <Header
        title="특허 알림"
        description="경쟁사 신규 특허 등록 시 이메일, Slack, 카카오톡 알림"
      >
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          알림 추가
        </Button>
      </Header>

          {showForm && (
            <Card className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">새 알림 설정</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  label="경쟁사 / 출원인"
                  value={newCompetitor}
                  onChange={(e) => setNewCompetitor(e.target.value)}
                  placeholder="예: 삼성전자"
                />
                <Input
                  label="키워드 (쉼표 구분)"
                  value={newKeywords}
                  onChange={(e) => setNewKeywords(e.target.value)}
                  placeholder="예: AI, CCTV"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleAddAlert}>저장</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  취소
                </Button>
              </div>
            </Card>
          )}

          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      alert.isActive ? "bg-brand-50" : "bg-gray-100"
                    }`}>
                      <Bell className={`w-5 h-5 ${alert.isActive ? "text-brand-600" : "text-gray-400"}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{alert.competitorName}</h3>
                      <p className="text-sm text-gray-500">키워드: {alert.keywords || "전체"}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {alert.notifyEmail && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="w-3 h-3" /> 이메일
                          </span>
                        )}
                        {alert.notifySlack && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <MessageSquare className="w-3 h-3" /> Slack
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleActive(alert.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        alert.isActive ? "bg-brand-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          alert.isActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}

            {alerts.length === 0 && (
              <Card className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">설정된 알림이 없습니다.</p>
                <Button onClick={() => setShowForm(true)} className="mt-4">
                  <Plus className="w-4 h-4" />
                  첫 알림 추가하기
                </Button>
              </Card>
            )}
          </div>

          <Card className="mt-8">
            <h3 className="font-semibold text-gray-900 mb-2">Business 플랜 전용</h3>
            <p className="text-sm text-gray-600">
              경쟁사 모니터링, Slack/카카오톡 연동 알림은 Business 플랜(149,000원/월)에서 이용 가능합니다.
            </p>
          </Card>
    </DashboardShell>
  );
}
