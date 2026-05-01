const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

export function parseRateLimit(stdout: string): number | null {
  // "wait for N minutes/seconds/hours"
  const waitFor = stdout.match(/wait(?:ing)? for (\d+)\s*(second|minute|hour)s?/i);
  if (waitFor) return toMs(parseInt(waitFor[1], 10), waitFor[2]);

  // "retry after N seconds/minutes"
  const retryAfter = stdout.match(/retry after (\d+)\s*(second|minute|hour)s?/i);
  if (retryAfter) return toMs(parseInt(retryAfter[1], 10), retryAfter[2]);

  // "try again in N seconds/minutes"
  const tryAgainIn = stdout.match(/try again in (\d+)\s*(second|minute|hour)s?/i);
  if (tryAgainIn) return toMs(parseInt(tryAgainIn[1], 10), tryAgainIn[2]);

  // "please try again in N seconds/minutes"
  const pleaseTry = stdout.match(/please try again in (\d+)\s*(second|minute|hour)s?/i);
  if (pleaseTry) return toMs(parseInt(pleaseTry[1], 10), pleaseTry[2]);

  // HTTP Retry-After header value (seconds as integer)
  const retryAfterHeader = stdout.match(/Retry-After:\s*(\d+)/i);
  if (retryAfterHeader) return parseInt(retryAfterHeader[1], 10) * 1000;

  // "X-RateLimit-Reset: <unix timestamp>"
  const rateLimitReset = stdout.match(/X-RateLimit-Reset:\s*(\d{10,})/i);
  if (rateLimitReset) {
    const waitMs = parseInt(rateLimitReset[1], 10) * 1000 - Date.now();
    if (waitMs > 0) return waitMs;
  }

  // Generic signals — default 60s
  if (/rate.?limit(?:ed| exceeded)/i.test(stdout) || /\b429\b/.test(stdout) || /too many requests/i.test(stdout)) {
    return MINUTE_MS;
  }

  return null;
}

function toMs(value: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u.startsWith('hour')) return value * HOUR_MS;
  if (u.startsWith('minute')) return value * MINUTE_MS;
  return value * 1000;
}
