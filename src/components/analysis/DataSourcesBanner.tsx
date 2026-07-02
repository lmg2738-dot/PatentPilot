import { cn } from "@/lib/utils";
import type { DataSource, DataSourcesMeta } from "@/lib/api/types";

interface DataSourcesBannerProps {
  sources: DataSourcesMeta;
  messages?: Partial<Record<keyof DataSourcesMeta, string>>;
  className?: string;
}

const labels: Record<keyof DataSourcesMeta, string> = {
  patents: "KIPRIS",
  market: "KOSIS",
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

function getBannerMessage(
  sources: DataSourcesMeta,
  messages?: Partial<Record<keyof DataSourcesMeta, string>>
): string | null {
  const missingKeyMocks = (["patents", "market", "analysis"] as const).filter(
    (key) => sources[key] === "mock" && messages?.[key]?.includes("미설정")
  );

  if (missingKeyMocks.length > 0) {
    return "필수 API 키가 없어 일부 데이터가 Mock입니다. Vercel 환경변수 등록 후 Redeploy하세요. 키 끝의 = 문자도 포함해야 합니다.";
  }

  if (sources.analysis === "mock") {
    return "AI 무료 모델 응답이 지연되어 Mock으로 표시되었습니다. 잠시 후 재시도하거나 Pro 플랜/Vercel Pro(60초)를 고려해 주세요.";
  }

  return null;
}

export function DataSourcesBanner({ sources, messages, className }: DataSourcesBannerProps) {
  const bannerMessage = getBannerMessage(sources, messages);
  const mockCount = Object.values(sources).filter((s) => s === "mock").length;

  return (
    <div className={cn("space-y-2", className)}>
      {mockCount > 0 && bannerMessage && (
        <p className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
          {bannerMessage}{" "}
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
