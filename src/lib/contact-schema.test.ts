// describe / test / expect are provided by Vitest (globals: true in vitest.config.js)
import { MIN_FILL_MS, contactSchema, looksLikeBot } from './contact-schema';

const valid = {
  name: 'Jane Recruiter',
  email: 'jane@company.com',
  subject: 'Internship',
  message: 'Hi Isuru, we would like to talk about an internship.',
  website: '',
  elapsedMs: 15000,
};

describe('contactSchema', () => {
  test('accepts a normal message', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  test('rejects a bad email address', () => {
    expect(contactSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
  });

  test('rejects a message that is too short or too long', () => {
    expect(contactSchema.safeParse({ ...valid, message: 'hi' }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, message: 'a'.repeat(2001) }).success).toBe(false);
  });

  test('rejects a missing name', () => {
    expect(contactSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false);
  });
});

describe('looksLikeBot', () => {
  test('a person who took their time is fine', () => {
    expect(looksLikeBot({ website: '', elapsedMs: 15000 })).toBe(false);
  });

  test('filling the hidden field gives a bot away', () => {
    expect(looksLikeBot({ website: 'http://spam.example', elapsedMs: 15000 })).toBe(true);
  });

  test('sending faster than a person could type gives a bot away', () => {
    expect(looksLikeBot({ website: '', elapsedMs: MIN_FILL_MS - 1 })).toBe(true);
  });
});
