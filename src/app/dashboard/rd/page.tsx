"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, Building2, Wallet } from "lucide-react";
import type { NtisProject } from "@/types";

export default function RDPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<NtisProject[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch(`/api/ntis?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setProjects(data.projects || []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPath="/dashboard/rd" />
      <main className="pl-64">
        <div className="p-8">
          <Header
            title="R&D 과제 검색"
            description="NTIS 국가 R&D 과제 및 정부 지원 프로그램 검색"
          />

          <Card className="mb-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="R&D 과제 검색 (예: AI CCTV)"
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} loading={loading}>
                검색
              </Button>
            </div>
          </Card>

          {searched && (
            <div className="space-y-4">
              {projects.map((project) => (
                <Card key={project.projectId}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {project.title}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span>연구기관: {project.organization}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Wallet className="w-4 h-4 text-gray-400" />
                      <span>예산: {project.budget}원</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-gray-500">
                      참여기업: {project.participants.join(", ")}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      기간: {project.startDate} ~ {project.endDate}
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      성과: {project.outcomes}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
