// describe / test / expect are provided by Vitest (globals: true in vitest.config.js)
import { buildContactEmail, toHeaderSafe } from './contact-email';

const message = {
  name: 'Jane Recruiter',
  email: 'jane@company.com',
  subject: 'Internship',
  message: 'Hello!\nSecond line.',
  website: '',
  elapsedMs: 15000,
};

describe('toHeaderSafe', () => {
  test('removes line breaks so no extra email headers can be added', () => {
    expect(toHeaderSafe('Hi\r\nBcc: victim@example.com', 120)).toBe('Hi Bcc: victim@example.com');
  });

  test('trims and limits length', () => {
    expect(toHeaderSafe('   long name   ', 4)).toBe('long');
  });
});

describe('buildContactEmail', () => {
  test('sends to you, with the visitor in Reply-To', () => {
    const email = buildContactEmail(message, 'me@example.com');
    expect(email.to).toEqual(['me@example.com']);
    expect(email.reply_to).toBe('jane@company.com');
    expect(email.subject).toBe('[Portfolio] Internship');
  });

  test('is plain text and keeps the message lines', () => {
    const email = buildContactEmail(message, 'me@example.com');
    expect(email).not.toHaveProperty('html');
    expect(email.text).toContain('Hello!\nSecond line.');
  });

  test('a subject with line breaks cannot inject headers', () => {
    const email = buildContactEmail({ ...message, subject: 'Hi\nBcc: x@y.z' }, 'me@example.com');
    expect(email.subject).not.toContain('\n');
  });

  test('uses a default subject when none is given', () => {
    expect(buildContactEmail({ ...message, subject: '' }, 'me@example.com').subject).toBe('[Portfolio] New message from your portfolio');
  });
});
