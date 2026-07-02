export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = 25000
): Promise<{ ok: boolean; status: number; data: T }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
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
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
