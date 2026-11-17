// describe / test / expect are provided by Vitest (globals: true in vitest.config.js)
import { EMPTY_REPLY, MAX_REPLY_CHARS, cleanReply } from './reply-filter';

describe('cleanReply', () => {
  test('keeps a normal sentence unchanged', () => {
    expect(cleanReply('I built the backend.')).toBe('I built the backend.');
  });

  test('replaces links the AI wrote, so it cannot send visitors anywhere', () => {
    expect(cleanReply('See https://evil.example/login now')).toBe('See (link on the site) now');
    expect(cleanReply('Go to www.evil.example')).toBe('Go to (link on the site)');
  });

  test('removes markdown symbols', () => {
    expect(cleanReply('**Bold** and `code`')).toBe('Bold and code');
  });

  test('returns a friendly message instead of an empty reply', () => {
    expect(cleanReply('   ')).toBe(EMPTY_REPLY);
  });

  test('cuts long replies at a full sentence', () => {
    const long = 'This is a sentence. '.repeat(100);
    const result = cleanReply(long);
    expect(result.length).toBeLessThanOrEqual(MAX_REPLY_CHARS);
    expect(result.endsWith('.')).toBe(true);
  });
});
