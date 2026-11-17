// describe / test / expect are provided by Vitest (globals: true in vitest.config.js)
import { createRateLimiter, isChatEnabled, isJson, isSameOrigin } from './guard';

describe('isChatEnabled', () => {
  test('is on unless explicitly switched off', () => {
    expect(isChatEnabled(undefined)).toBe(true);
    expect(isChatEnabled('true')).toBe(true);
    expect(isChatEnabled('false')).toBe(false);
  });
});

describe('isSameOrigin', () => {
  const url = 'https://isuru.dev/api/chat';

  test('accepts a request from the same site', () => {
    expect(isSameOrigin('https://isuru.dev', url)).toBe(true);
  });

  test('rejects another site, a missing origin, and garbage', () => {
    expect(isSameOrigin('https://evil.example', url)).toBe(false);
    expect(isSameOrigin(null, url)).toBe(false);
    expect(isSameOrigin('not a url', url)).toBe(false);
  });
});

describe('isJson', () => {
  test('accepts JSON with or without a charset', () => {
    expect(isJson('application/json')).toBe(true);
    expect(isJson('application/json; charset=utf-8')).toBe(true);
  });

  test('rejects forms and missing types', () => {
    expect(isJson('application/x-www-form-urlencoded')).toBe(false);
    expect(isJson(null)).toBe(false);
  });
});

describe('createRateLimiter', () => {
  test('allows up to the limit, then blocks, then allows again after the window', () => {
    const isAllowed = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(isAllowed('ip-1', 0)).toBe(true);
    expect(isAllowed('ip-1', 100)).toBe(true);
    expect(isAllowed('ip-1', 200)).toBe(false);
    expect(isAllowed('ip-1', 1500)).toBe(true);
  });

  test('counts each visitor separately', () => {
    const isAllowed = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(isAllowed('ip-1', 0)).toBe(true);
    expect(isAllowed('ip-2', 0)).toBe(true);
    expect(isAllowed('ip-1', 10)).toBe(false);
  });
});
