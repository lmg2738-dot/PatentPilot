"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search } from "lucide-react";
import type { PatentResult } from "@/types";

export default function PatentSearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [patents, setPatents] = useState<PatentResult[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch(`/api/patents?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setPatents(data.patents || []);
    } catch {
      setPatents([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPath="/dashboard/search" />
      <main className="pl-64">
        <div className="p-8">
          <Header
            title="특허 검색"
            description="KIPRIS API를 통한 국내 특허 검색"
          />

          <Card className="mb-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="특허 검색어 입력 (예: AI CCTV)"
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} loading={loading}>
                검색
              </Button>
            </div>
          </Card>

          {searched && (
            <Card padding={false}>
              <div className="px-6 py-4 border-b border-gray-200">
                <p className="text-sm text-gray-500">
                  &quot;{query}&quot; 검색 결과: <span className="font-semibold text-gray-900">{patents.length}건</span>
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                      <th className="px-6 py-3">출원번호</th>
                      <th className="px-6 py-3">발명명칭</th>
                      <th className="px-6 py-3">출원인</th>
                      <th className="px-6 py-3">출원일</th>
                      <th className="px-6 py-3">등록여부</th>
                      <th className="px-6 py-3">IPC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {patents.map((patent) => (
                      <tr key={patent.applicationNumber} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-600">{patent.applicationNumber}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">
                          {patent.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{patent.applicant}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{patent.applicationDate}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            patent.registrationStatus === "등록"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {patent.registrationStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{patent.ipc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
