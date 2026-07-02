import OpenAI from "openai";
import { getEnv } from "@/lib/api/env";
import { withTimeout } from "@/lib/api/timeout";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MODELS_CACHE_TTL_MS = 5 * 60 * 1000;

interface OpenRouterModel {
  id: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
    request?: string;
  };
  architecture?: {
    output_modalities?: string[];
    input_modalities?: string[];
  };
}

interface ModelsCache {
  models: string[];
  fetchedAt: number;
}

let modelsCache: ModelsCache | null = null;
const blockedModels = new Map<string, number>();
const BLOCK_TTL_MS = 20 * 60 * 1000;

/** API 장애 시 폴백 — 2026-06 OpenRouter max_price=0 기준 */
const KNOWN_FREE_MODELS = [
  "openrouter/free",
  "liquid/lfm-2.5-1.2b-instruct:free",
  "liquid/lfm-2.5-1.2b-thinking:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "google/gemma-2-9b-it:free",
  "mistralai/mistral-7b-instruct:free",
  "qwen/qwen-2.5-7b-instruct:free",
  "cohere/north-mini-code:free",
  "openai/gpt-oss-20b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-coder:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "openai/gpt-oss-120b:free",
  "deepseek/deepseek-r1-distill-llama-70b:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "poolside/laguna-xs.2:free",
  "google/gemma-4-26b-a4b-it:free",
];

function isPricingFree(pricing?: OpenRouterModel["pricing"]): boolean {
  if (!pricing) return false;
  const prompt = parseFloat(pricing.prompt ?? "1");
  const completion = parseFloat(pricing.completion ?? "1");
  const request = parseFloat(pricing.request ?? "0");
  return prompt === 0 && completion === 0 && request === 0;
}

function supportsTextOutput(model: OpenRouterModel): boolean {
  const outputs = model.architecture?.output_modalities;
  if (!outputs) return true;
  return outputs.includes("text");
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
  if (error instanceof OpenAI.APIError) return error.message || "";
  if (error instanceof Error) return error.message;
  return String(error);
}

function isRetryableModelError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();

  if (error instanceof OpenAI.APIError) {
    const status = error.status ?? 0;
    if ([402, 404, 408, 429, 500, 502, 503, 529].includes(status)) return true;
  }

  return (
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("limit") ||
    message.includes("credit") ||
    message.includes("exhausted") ||
    message.includes("capacity") ||
    message.includes("free") ||
    message.includes("model") ||
    message.includes("not found") ||
    message.includes("unavailable") ||
    message.includes("no endpoints") ||
    message.includes("timeout") ||
    message.includes("overloaded") ||
    message.includes("empty:")
  );
}

function dedupeModels(models: string[]): string[] {
  return [...new Set(models.filter(Boolean))];
}

function filterAvailable(models: string[]): string[] {
  return models.filter((id) => !isModelBlocked(id));
}

function prioritizeFreeModels(models: string[]): string[] {
  const score = (id: string): number => {
    if (id === "openrouter/free") return 0;
    if (id.includes("1.2b") || id.includes("1b")) return 1;
    if (id.includes("3b")) return 2;
    if (id.includes("7b") || id.includes("9b") || id.includes("nano")) return 3;
    if (id.includes("20b")) return 4;
    if (id.includes("70b") || id.includes("72b") || id.includes("80b")) return 8;
    if (id.includes("120b") || id.includes("405b") || id.includes("550b")) return 9;
    return 5;
  };

  return [...models].sort((a, b) => score(a) - score(b));
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

  const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`OpenRouter models API failed: ${response.status}`);
  }

  const data = (await response.json()) as { data?: OpenRouterModel[] };
  const models = data.data ?? [];

  const freeModels = models
    .filter((model) => isPricingFree(model.pricing) && supportsTextOutput(model))
    .sort((a, b) => (a.context_length ?? 999999) - (b.context_length ?? 999999))
    .map((model) => model.id);

  const freeVariant = freeModels.filter((id) => id.includes(":free"));
  const router = freeModels.filter((id) => id === "openrouter/free");
  const others = freeModels.filter((id) => !id.includes(":free") && id !== "openrouter/free");

  return dedupeModels([...router, ...freeVariant, ...others]);
}

async function discoverFreeModels(): Promise<string[]> {
  const now = Date.now();
  if (modelsCache && now - modelsCache.fetchedAt < MODELS_CACHE_TTL_MS) {
    return filterAvailable(modelsCache.models);
  }

  try {
    const discovered = await withTimeout(
      fetchFreeModelsFromApi(),
      process.env.VERCEL ? 3000 : 8000,
      () => [] as string[]
    );

    const merged = prioritizeFreeModels(
      filterAvailable(dedupeModels([...discovered, ...KNOWN_FREE_MODELS]))
    );

    if (merged.length > 0) {
      modelsCache = { models: merged, fetchedAt: now };
      return merged;
    }
  } catch (error) {
    console.error("Failed to fetch OpenRouter free models:", error);
  }

  return filterAvailable(prioritizeFreeModels(KNOWN_FREE_MODELS));
}

export async function getFreeModelCandidates(): Promise<string[]> {
  return discoverFreeModels();
}

interface ChatCompletionParams {
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  temperature?: number;
  max_tokens?: number;
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
      temperature: params.temperature ?? 0.2,
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

async function raceModels(
  client: OpenAI,
  params: ChatCompletionParams,
  models: string[],
  maxTokens: number,
  timeoutMs: number,
  limit: number
): Promise<{ content: string; model: string }> {
  const batch = models.filter((id) => !isModelBlocked(id)).slice(0, limit);

  if (batch.length === 0) {
    throw new Error("No available free OpenRouter models");
  }

  const attempts = batch.map((model) =>
    trySingleModel(client, model, params, maxTokens, timeoutMs).catch((error) => {
      if (isRetryableModelError(error)) {
        markModelUnavailable(model);
      }
      throw error;
    })
  );

  return Promise.any(attempts);
}

async function trySequential(
  client: OpenAI,
  params: ChatCompletionParams,
  models: string[],
  maxTokens: number,
  perModelMs: number
): Promise<{ content: string; model: string }> {
  let lastError: unknown;

  for (const model of models) {
    if (isModelBlocked(model)) continue;

    try {
      return await trySingleModel(client, model, params, maxTokens, perModelMs);
    } catch (error) {
      lastError = error;
      if (isRetryableModelError(error)) {
        markModelUnavailable(model);
        continue;
      }
      throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("All free models failed");
}

export async function createFreeChatCompletion(
  params: ChatCompletionParams
): Promise<{ content: string; model: string }> {
  const client = getOpenRouterClient();
  if (!client) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const isVercel = Boolean(process.env.VERCEL);
  const maxTokens = params.max_tokens ?? (isVercel ? 400 : 2000);
  const models = await discoverFreeModels();

  if (isVercel) {
    const run = async () => {
      try {
        return await trySingleModel(client, "openrouter/free", params, maxTokens, 5000);
      } catch (error) {
        console.warn("openrouter/free failed:", getErrorMessage(error));
      }

      try {
        return await raceModels(client, params, models, maxTokens, 7000, 6);
      } catch (error) {
        console.warn("Parallel free models failed:", getErrorMessage(error));
      }

      const remaining = models.filter(
        (id) => id !== "openrouter/free" && !isModelBlocked(id)
      );
      return trySequential(client, params, remaining.slice(0, 8), maxTokens, 2000);
    };

    return withTimeout(run(), 8800, () => {
      throw new Error("AI_TIMEOUT");
    });
  }

  try {
    return await trySingleModel(client, "openrouter/free", params, maxTokens, 15000);
  } catch {
    // continue
  }

  try {
    return await raceModels(client, params, models, maxTokens, 30000, 4);
  } catch {
    // continue
  }

  return trySequential(client, params, models, maxTokens, 45000);
}
