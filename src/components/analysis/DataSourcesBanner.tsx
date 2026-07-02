import { cn } from "@/lib/utils";
import type { DataSource, DataSourcesMeta } from "@/lib/api/types";

interface DataSourcesBannerProps {
  sources: DataSourcesMeta;
  messages?: Partial<Record<keyof DataSourcesMeta, string>>;
  className?: string;
}

const labels: Record<keyof DataSourcesMeta, string> = {
  patents: "KIPRIS",
  ntis: "NTIS",
  market: "KOSIS",
  policies: "정책",
  analysis: "AI",
};

function SourceBadge({
  label,
  source,
  message,
}: {
  label: string;
  source: DataSource;
  message?: string;
}) {
  const isLive = source === "live";

  return (
    <div className="flex flex-col gap-1">
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit",
          isLive
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-orange-50 text-orange-700 border border-orange-200"
        )}
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            isLive ? "bg-green-500" : "bg-orange-400"
          )}
        />
        {label}: {isLive ? "실제 API" : "Mock"}
      </span>
      {!isLive && message && (
        <span className="text-xs text-orange-600 pl-1">{message}</span>
      )}
    </div>
  );
}

export function DataSourcesBanner({ sources, messages, className }: DataSourcesBannerProps) {
  const mockCount = Object.values(sources).filter((s) => s === "mock").length;

  return (
    <div className={cn("space-y-2", className)}>
      {mockCount > 0 && (
        <p className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
          일부 데이터가 Mock입니다. Vercel 사용 시 환경변수 등록 후 <strong>Redeploy</strong>가
          필요합니다. 키 끝의 <code className="text-xs">=</code> 문자도 포함해야 합니다.
          {" "}
          <a href="/api/debug/env-check" target="_blank" className="underline font-medium">
            API 진단
          </a>
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {(Object.keys(labels) as Array<keyof DataSourcesMeta>).map((key) => (
          <SourceBadge
            key={key}
            label={labels[key]}
            source={sources[key]}
            message={messages?.[key]}
          />
        ))}
      </div>
    </div>
  );
}
