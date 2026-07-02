import OpenAI from "openai";
import { getEnv } from "@/lib/api/env";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MODELS_CACHE_TTL_MS = 60 * 60 * 1000; // 1시간

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
const BLOCK_TTL_MS = 30 * 60 * 1000; // 30분

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

function isRetryableModelError(error: unknown): boolean {
  if (!(error instanceof OpenAI.APIError)) return false;

  const message = (error.message || "").toLowerCase();

  return (
    error.status === 404 ||
    error.status === 429 ||
    error.status === 503 ||
    message.includes("model") ||
    message.includes("not found") ||
    message.includes("unavailable") ||
    message.includes("no endpoints") ||
    message.includes("rate limit")
  );
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
    next: { revalidate: 3600 },
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

      return supportsText && isPricingFree(model.pricing) && !isModelBlocked(model.id);
    })
    .sort((a, b) => (b.context_length ?? 0) - (a.context_length ?? 0))
    .map((model) => model.id);

  // :free 변형 모델 우선
  const freeVariant = freeModels.filter((id) => id.includes(":free"));
  const others = freeModels.filter((id) => !id.includes(":free"));

  return [...new Set([...freeVariant, ...others])];
}

const VERCEL_FAST_MODELS = [
  "google/gemma-2-9b-it:free",
  "mistralai/mistral-7b-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free",
];

const VERCEL_FALLBACK_MODELS = [
  "google/gemma-2-9b-it:free",
  "mistralai/mistral-7b-instruct:free",
];

export async function getFreeModelCandidates(fast = false): Promise<string[]> {
  if (process.env.VERCEL) {
    const models = fast ? VERCEL_FAST_MODELS : VERCEL_FALLBACK_MODELS;
    return models.filter((id) => !isModelBlocked(id));
  }

  const now = Date.now();

  if (modelsCache && now - modelsCache.fetchedAt < MODELS_CACHE_TTL_MS) {
    const available = modelsCache.models.filter((id) => !isModelBlocked(id));
    if (available.length > 0) return available;
  }

  try {
    const models = await fetchFreeModelsFromApi();
    modelsCache = { models, fetchedAt: now };

    const available = models.filter((id) => !isModelBlocked(id));
    if (available.length > 0) return available;
  } catch (error) {
    console.error("Failed to fetch OpenRouter free models:", error);
  }

  // API 조회 실패 시 폴백 (사용 불가 모델은 런타임에서 제외)
  const fallback = [
    "openrouter/free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "qwen/qwen-2.5-72b-instruct:free",
    "google/gemma-2-9b-it:free",
    "mistralai/mistral-7b-instruct:free",
  ];

  return fallback.filter((id) => !isModelBlocked(id));
}

interface ChatCompletionParams {
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  temperature?: number;
  max_tokens?: number;
  fast?: boolean;
}

export async function createFreeChatCompletion(
  params: ChatCompletionParams
): Promise<{ content: string; model: string }> {
  const client = getOpenRouterClient();
  if (!client) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const isVercel = Boolean(process.env.VERCEL);
  const candidates = await getFreeModelCandidates(params.fast ?? isVercel);
  const modelsToTry = isVercel
    ? candidates.slice(0, params.fast === false ? 2 : 1)
    : candidates;

  if (modelsToTry.length === 0) {
    throw new Error("No available free OpenRouter models");
  }

  const requestTimeoutMs = isVercel ? 9000 : 60000;
  const maxTokens = params.max_tokens ?? (isVercel ? 700 : 2000);

  let lastError: unknown;

  for (const model of modelsToTry) {
    try {
      const completion = await client.chat.completions.create(
        {
          model,
          messages: params.messages,
          temperature: params.temperature ?? 0.5,
          max_tokens: maxTokens,
        },
        { timeout: requestTimeoutMs }
      );

      const content = completion.choices[0]?.message?.content || "";
      if (!content.trim()) {
        markModelUnavailable(model);
        continue;
      }

      return { content, model };
    } catch (error) {
      lastError = error;

      if (isRetryableModelError(error)) {
        markModelUnavailable(model);
        console.warn(`OpenRouter model unavailable, trying next: ${model}`);
        continue;
      }

      throw error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All free OpenRouter models failed");
}
