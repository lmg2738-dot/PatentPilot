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
    <span
      title={message}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
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
  );
}

export function DataSourcesBanner({ sources, messages, className }: DataSourcesBannerProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {(Object.keys(labels) as Array<keyof DataSourcesMeta>).map((key) => (
        <SourceBadge
          key={key}
          label={labels[key]}
          source={sources[key]}
          message={messages?.[key]}
        />
      ))}
    </div>
  );
}
