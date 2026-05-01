export function parseRateLimit(stdout: string): number | null {
  // Try to parse Claude/Codex specific rate limit wait times
  const matchMin = stdout.match(/wait for (\d+) minutes?/i);
  if (matchMin && matchMin[1]) {
    return parseInt(matchMin[1], 10) * 60 * 1000;
  }
  
  const matchSec = stdout.match(/wait for (\d+) seconds?/i);
  if (matchSec && matchSec[1]) {
    return parseInt(matchSec[1], 10) * 1000;
  }
  
  const matchHours = stdout.match(/wait for (\d+) hours?/i);
  if (matchHours && matchHours[1]) {
    return parseInt(matchHours[1], 10) * 60 * 60 * 1000;
  }
  
  // Default wait if just "rate limit exceeded" without time
  if (/rate limit exceeded/i.test(stdout) || /429/i.test(stdout) || /too many requests/i.test(stdout)) {
    return 60 * 1000; // 1 minute default
  }
  
  return null;
}
