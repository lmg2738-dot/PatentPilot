export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T }> {
  const response = await fetch(input, init);
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();
    const preview = text.slice(0, 120).replace(/\s+/g, " ").trim();
    throw new Error(
      preview.startsWith("An error")
        ? "서버 응답 시간 초과 또는 배포 오류입니다. 잠시 후 다시 시도해 주세요."
        : preview || `서버 오류 (HTTP ${response.status})`
    );
  }

  const data = (await response.json()) as T;
  return { ok: response.ok, status: response.status, data };
}
