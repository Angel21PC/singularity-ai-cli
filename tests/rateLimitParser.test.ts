import { describe, it, expect } from 'vitest';
import { parseRateLimit } from '../src/cli-wrappers/rateLimitParser.js';

describe('parseRateLimit', () => {
  it('should parse minutes correctly', () => {
    expect(parseRateLimit('Please wait for 5 minutes before trying again.')).toBe(5 * 60 * 1000);
    expect(parseRateLimit('Wait for 1 minute.')).toBe(60 * 1000);
  });

  it('should parse seconds correctly', () => {
    expect(parseRateLimit('Please wait for 30 seconds.')).toBe(30 * 1000);
  });

  it('should parse hours correctly', () => {
    expect(parseRateLimit('Wait for 2 hours.')).toBe(2 * 60 * 60 * 1000);
  });

  it('should fallback to 1 minute for generic rate limit messages', () => {
    expect(parseRateLimit('Error 429: Too many requests.')).toBe(60 * 1000);
    expect(parseRateLimit('Rate limit exceeded.')).toBe(60 * 1000);
  });

  it('should return null for unrelated text', () => {
    expect(parseRateLimit('Success! Done.')).toBeNull();
  });
});
