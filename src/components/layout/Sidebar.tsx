import Link from "next/link";
import {
  LayoutDashboard,
  Search,
  Brain,
  TrendingUp,
  FileText,
  Bell,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { name: "특허 검색", href: "/dashboard/search", icon: Search },
  { name: "AI 분석", href: "/dashboard/analysis", icon: Brain },
  { name: "시장성", href: "/dashboard/market", icon: TrendingUp },
  { name: "PDF 리포트", href: "/dashboard/reports", icon: FileText },
  { name: "알림", href: "/dashboard/alerts", icon: Bell },
  { name: "설정", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  currentPath: string;
}

export function Sidebar({ currentPath }: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-600">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">PatentPilot</h1>
          <p className="text-xs text-gray-500">AI 특허 분석</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navigation.map((item) => {
          const isActive = currentPath === item.href ||
            (item.href !== "/dashboard" && currentPath.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-brand-600" : "text-gray-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Link
          href="/auth/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="w-5 h-5 text-gray-400" />
          로그아웃
        </Link>
      </div>
    </aside>
  );
}
