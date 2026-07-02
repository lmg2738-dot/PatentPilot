import OpenAI from "openai";
import { getEnv } from "@/lib/api/env";
import { withTimeout } from "@/lib/api/timeout";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MODELS_CACHE_TTL_MS = 60 * 60 * 1000;

interface OpenRouterModel {
  id: string;
  name?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
    request?: string;
  };
  architecture?: {
    output_modalities?: string[];
  };
}

interface ModelsCache {
  models: string[];
  fetchedAt: number;
}

let modelsCache: ModelsCache | null = null;
const blockedModels = new Map<string, number>();
const BLOCK_TTL_MS = 30 * 60 * 1000;

/** Vercel: 작고 빠른 모델 우선 (병렬 경쟁용) */
const VERCEL_FAST_MODELS = [
  "meta-llama/llama-3.2-3b-instruct:free",
  "google/gemma-2-9b-it:free",
  "mistralai/mistral-7b-instruct:free",
  "qwen/qwen-2.5-7b-instruct:free",
  "openrouter/free",
];

const STATIC_FALLBACK_MODELS = [
  "openrouter/free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "google/gemma-2-9b-it:free",
  "mistralai/mistral-7b-instruct:free",
  "qwen/qwen-2.5-7b-instruct:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

function isPricingFree(pricing?: OpenRouterModel["pricing"]): boolean {
  if (!pricing) return false;

  const prompt = parseFloat(pricing.prompt ?? "1");
  const completion = parseFloat(pricing.completion ?? "1");
  const request = parseFloat(pricing.request ?? "0");

  return prompt === 0 && completion === 0 && request === 0;
}

function isModelBlocked(modelId: string): boolean {
  const blockedUntil = blockedModels.get(modelId);
  if (!blockedUntil) return false;

  if (Date.now() > blockedUntil) {
    blockedModels.delete(modelId);
    return false;
  }

  return true;
}

export function markModelUnavailable(modelId: string): void {
  blockedModels.set(modelId, Date.now() + BLOCK_TTL_MS);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof OpenAI.APIError) {
    return error.message || "";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function isQuotaOrLimitError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("limit exceeded") ||
    lower.includes("insufficient") ||
    lower.includes("credit") ||
    lower.includes("exhausted") ||
    lower.includes("capacity") ||
    lower.includes("free model") ||
    lower.includes("free tier") ||
    lower.includes("usage limit") ||
    lower.includes("daily limit") ||
    lower.includes("too many requests")
  );
}

function isRetryableModelError(error: unknown): boolean {
  const message = getErrorMessage(error);
  const lower = message.toLowerCase();

  if (error instanceof OpenAI.APIError) {
    const status = error.status ?? 0;
    if ([402, 404, 408, 429, 500, 502, 503, 529].includes(status)) {
      return true;
    }
  }

  if (isQuotaOrLimitError(message)) {
    return true;
  }

  return (
    lower.includes("model") ||
    lower.includes("not found") ||
    lower.includes("unavailable") ||
    lower.includes("no endpoints") ||
    lower.includes("timeout") ||
    lower.includes("overloaded") ||
    lower.includes("empty:")
  );
}

function dedupeModels(models: string[]): string[] {
  return [...new Set(models.filter(Boolean))];
}

function filterAvailable(models: string[]): string[] {
  return models.filter((id) => !isModelBlocked(id));
}

export function getOpenRouterClient(): OpenAI | null {
  const apiKey = getEnv("OPENROUTER_API_KEY");
  if (!apiKey) return null;

  return new OpenAI({
    baseURL: OPENROUTER_BASE_URL,
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:60004",
      "X-Title": "PatentPilot AI",
    },
  });
}

async function fetchFreeModelsFromApi(): Promise<string[]> {
  const apiKey = getEnv("OPENROUTER_API_KEY");
  if (!apiKey) return [];

  const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`OpenRouter models API failed: ${response.status}`);
  }

  const data = (await response.json()) as { data?: OpenRouterModel[] };
  const models = data.data ?? [];

  const freeModels = models
    .filter((model) => {
      const supportsText =
        !model.architecture?.output_modalities ||
        model.architecture.output_modalities.includes("text");

      return supportsText && isPricingFree(model.pricing);
    })
    .sort((a, b) => (a.context_length ?? 999999) - (b.context_length ?? 999999))
    .map((model) => model.id);

  const freeVariant = freeModels.filter((id) => id.includes(":free"));
  const others = freeModels.filter((id) => !id.includes(":free"));

  return dedupeModels([...freeVariant, ...others]);
}

async function discoverFreeModelsFromApi(): Promise<string[]> {
  try {
    const fetchModels = fetchFreeModelsFromApi();
    const timeoutMs = process.env.VERCEL ? 2000 : 8000;
    const models = await withTimeout(fetchModels, timeoutMs, () => [] as string[]);
    if (models.length > 0) {
      modelsCache = { models, fetchedAt: Date.now() };
    }
    return models;
  } catch (error) {
    console.error("Failed to fetch OpenRouter free models:", error);
    return [];
  }
}

export async function getFreeModelCandidates(fast = false): Promise<string[]> {
  if (process.env.VERCEL) {
    return filterAvailable(VERCEL_FAST_MODELS);
  }

  const staticList = fast ? VERCEL_FAST_MODELS : STATIC_FALLBACK_MODELS;
  let candidates = filterAvailable(dedupeModels(staticList));

  const now = Date.now();
  if (
    modelsCache &&
    now - modelsCache.fetchedAt < MODELS_CACHE_TTL_MS &&
    candidates.length < 2
  ) {
    candidates = filterAvailable(
      dedupeModels([...candidates, ...modelsCache.models])
    );
  }

  if (candidates.length < 2) {
    const discovered = filterAvailable(await discoverFreeModelsFromApi());
    candidates = filterAvailable(dedupeModels([...candidates, ...discovered]));
  }

  if (candidates.length === 0) {
    candidates = filterAvailable(STATIC_FALLBACK_MODELS);
  }

  return candidates;
}

interface ChatCompletionParams {
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  temperature?: number;
  max_tokens?: number;
  fast?: boolean;
}

async function trySingleModel(
  client: OpenAI,
  model: string,
  params: ChatCompletionParams,
  maxTokens: number,
  timeoutMs: number
): Promise<{ content: string; model: string }> {
  const completion = await client.chat.completions.create(
    {
      model,
      messages: params.messages,
      temperature: params.temperature ?? 0.3,
      max_tokens: maxTokens,
    },
    { timeout: timeoutMs }
  );

  const content = completion.choices[0]?.message?.content?.trim() || "";
  if (!content) {
    markModelUnavailable(model);
    throw new Error(`empty:${model}`);
  }

  return { content, model };
}

/** Vercel: 여러 무료 모델을 동시에 호출해 가장 먼저 응답한 결과 사용 */
async function createParallelCompletion(
  client: OpenAI,
  params: ChatCompletionParams,
  models: string[],
  maxTokens: number,
  timeoutMs: number
): Promise<{ content: string; model: string }> {
  const available = models.filter((id) => !isModelBlocked(id)).slice(0, 3);

  if (available.length === 0) {
    throw new Error("No available free OpenRouter models");
  }

  const attempts = available.map((model) =>
    trySingleModel(client, model, params, maxTokens, timeoutMs).catch((error) => {
      if (isRetryableModelError(error)) {
        markModelUnavailable(model);
        console.warn(
          `OpenRouter parallel model failed (${getErrorMessage(error)}): ${model}`
        );
      }
      throw error;
    })
  );

  try {
    return await Promise.any(attempts);
  } catch (error) {
    if (error instanceof AggregateError) {
      const retryable = error.errors.some((err) => isRetryableModelError(err));
      if (retryable) {
        throw new Error("All parallel free models failed");
      }
    }
    throw error;
  }
}

async function createSequentialCompletion(
  client: OpenAI,
  params: ChatCompletionParams,
  candidates: string[],
  maxTokens: number,
  totalBudgetMs: number
): Promise<{ content: string; model: string }> {
  const startTime = Date.now();
  let lastError: unknown;

  for (const model of candidates) {
    if (isModelBlocked(model)) continue;

    const elapsed = Date.now() - startTime;
    const remainingMs = totalBudgetMs - elapsed;
    if (remainingMs < 1500) break;

    const modelTimeoutMs = Math.min(60000, remainingMs - 200);

    try {
      return await trySingleModel(client, model, params, maxTokens, modelTimeoutMs);
    } catch (error) {
      lastError = error;
      if (isRetryableModelError(error)) {
        markModelUnavailable(model);
        console.warn(
          `OpenRouter model failed (${getErrorMessage(error)}), trying next: ${model}`
        );
        continue;
      }
      throw error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All free OpenRouter models failed");
}

export async function createFreeChatCompletion(
  params: ChatCompletionParams
): Promise<{ content: string; model: string }> {
  const client = getOpenRouterClient();
  if (!client) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const isVercel = Boolean(process.env.VERCEL);
  const maxTokens = params.max_tokens ?? (isVercel ? 450 : 2000);
  let candidates = await getFreeModelCandidates(params.fast ?? isVercel);

  if (isVercel) {
    try {
      return await createParallelCompletion(client, params, candidates, maxTokens, 8000);
    } catch (parallelError) {
      console.warn("Parallel free models failed, quick fallback:", parallelError);

      const fallbackModels = filterAvailable(
        dedupeModels(["openrouter/free", ...candidates])
      ).slice(0, 2);

      return createSequentialCompletion(client, params, fallbackModels, maxTokens, 2500);
    }
  }

  if (candidates.length < 3) {
    const discovered = filterAvailable(await discoverFreeModelsFromApi());
    candidates = filterAvailable(dedupeModels([...candidates, ...discovered]));
  }

  return createSequentialCompletion(client, params, candidates, maxTokens, 120000);
}
