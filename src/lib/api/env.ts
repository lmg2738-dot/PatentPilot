export function getEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getEnvStatus(name: string): {
  configured: boolean;
  length: number;
} {
  const value = getEnv(name);
  return {
    configured: Boolean(value),
    length: value?.length ?? 0,
  };
}
