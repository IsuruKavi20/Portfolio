// describe / test / expect are provided by Vitest (globals: true in vitest.config.js)
import { MAX_ACTIONS_PER_REPLY, validateAction, validateActions } from './bot-actions';

const projects = ['swiftdrop', 'ube-booking'];

describe('validateAction', () => {
  test('accepts a scroll to a known section', () => {
    expect(validateAction({ type: 'scroll_to', section: 'projects' }, projects)).toEqual({ type: 'scroll_to', section: 'projects' });
  });

  test('rejects a scroll to an unknown section', () => {
    expect(validateAction({ type: 'scroll_to', section: 'admin' }, projects)).toBeNull();
  });

  test('rejects an unknown action type, such as opening another website', () => {
    expect(validateAction({ type: 'open_url', url: 'https://evil.example' }, projects)).toBeNull();
  });

  test('opens only projects that exist', () => {
    expect(validateAction({ type: 'open_project', id: 'swiftdrop' }, projects)).toEqual({ type: 'open_project', id: 'swiftdrop' });
    expect(validateAction({ type: 'open_project', id: 'not-real' }, projects)).toBeNull();
    expect(validateAction({ type: 'open_project', id: '../admin' }, projects)).toBeNull();
  });

  test('highlights only listed targets, not inherited object keys', () => {
    expect(validateAction({ type: 'highlight', target: 'contact-form' }, projects)).toEqual({ type: 'highlight', target: 'contact-form' });
    expect(validateAction({ type: 'highlight', target: 'body' }, projects)).toBeNull();
    expect(validateAction({ type: 'highlight', target: 'toString' }, projects)).toBeNull();
  });

  test('drops extra fields so nothing unexpected reaches the browser', () => {
    expect(validateAction({ type: 'offer_cv', script: 'alert(1)' }, projects)).toEqual({ type: 'offer_cv' });
  });

  test('rejects things that are not objects', () => {
    expect(validateAction('scroll_to', projects)).toBeNull();
    expect(validateAction(null, projects)).toBeNull();
    expect(validateAction([{ type: 'offer_cv' }], projects)).toBeNull();
  });
});

describe('validateActions', () => {
  test('keeps good actions and drops bad ones', () => {
    const result = validateActions([{ type: 'offer_cv' }, { type: 'hack' }, { type: 'scroll_to', section: 'skills' }], projects);
    expect(result).toEqual([{ type: 'offer_cv' }, { type: 'scroll_to', section: 'skills' }]);
  });

  test('never returns more than the maximum', () => {
    const many = Array(10).fill({ type: 'offer_cv' });
    expect(validateActions(many, projects)).toHaveLength(MAX_ACTIONS_PER_REPLY);
  });

  test('returns an empty list when the input is not a list', () => {
    expect(validateActions({ type: 'offer_cv' }, projects)).toEqual([]);
  });
});

describe('education highlight', () => {
  test('allows highlighting the education cards', () => {
    expect(validateAction({ type: 'highlight', target: 'education-cards' }, [])).toEqual({ type: 'highlight', target: 'education-cards' });
  });
});
