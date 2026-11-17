// describe / test / expect are provided by Vitest (globals: true in vitest.config.js)
import { FIREWALL_BUCKETS, firewallKey } from './firewall';

describe('firewallKey', () => {
  test('gives the bot and the contact form separate counts for the same visitor', () => {
    const chat = firewallKey('203.0.113.5', FIREWALL_BUCKETS.chat);
    const contact = firewallKey('203.0.113.5', FIREWALL_BUCKETS.contact);
    expect(chat).not.toBe(contact);
  });

  test('gives different visitors separate counts', () => {
    expect(firewallKey('203.0.113.5', 'chat')).not.toBe(firewallKey('198.51.100.7', 'chat'));
  });
});
