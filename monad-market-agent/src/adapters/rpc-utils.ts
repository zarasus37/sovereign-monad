function extractErrorParts(error: unknown): { code?: number | string; message: string } {
  if (!error || typeof error !== 'object') {
    return { message: String(error ?? '') };
  }

  const candidate = error as {
    code?: number | string;
    message?: string;
    error?: { code?: number | string; message?: string };
  };

  return {
    code: candidate.error?.code ?? candidate.code,
    message: candidate.error?.message ?? candidate.message ?? '',
  };
}

export function normalizeRpcUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function buildEndpointList(primaryUrl: string, fallbackUrls: string[]): string[] {
  const endpoints = [primaryUrl, ...fallbackUrls]
    .map(normalizeRpcUrl)
    .filter((value) => value.length > 0);

  return Array.from(new Set(endpoints));
}

export function isRateLimitError(error: unknown): boolean {
  const { code, message } = extractErrorParts(error);
  const normalizedMessage = message.toLowerCase();

  if (code === 429 || code === -32003) {
    return true;
  }

  return [
    '429',
    'too many requests',
    'rate limit',
    'request limit',
    'daily request limit',
    'quota exceeded',
  ].some((fragment) => normalizedMessage.includes(fragment));
}
