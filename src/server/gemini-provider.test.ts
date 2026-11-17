// describe / test / expect are provided by Vitest (globals: true in vitest.config.js)
import { buildToolDeclarations, toGeminiContents, toRawActions } from './gemini-provider';
import { validateActions } from '../lib/bot-actions';

describe('buildToolDeclarations', () => {
  test('offers open_project only with real project ids', () => {
    const tools = buildToolDeclarations(['swiftdrop']);
    const open = tools.find((tool) => tool.name === 'open_project');
    expect(open?.parametersJsonSchema).toMatchObject({ properties: { id: { enum: ['swiftdrop'] } } });
  });

  test('leaves out open_project when there are no projects', () => {
    expect(buildToolDeclarations([]).some((tool) => tool.name === 'open_project')).toBe(false);
  });
});

describe('toGeminiContents', () => {
  test('maps roles and adds the page context to the newest message only', () => {
    const contents = toGeminiContents(
      [{ role: 'visitor', text: 'hi' }, { role: 'bot', text: 'hello' }, { role: 'visitor', text: 'projects?' }],
      '(context)',
    );
    expect(contents.map((c) => c.role)).toEqual(['user', 'model', 'user']);
    expect(contents[0].parts?.[0].text).toBe('hi');
    expect(contents[2].parts?.[0].text).toBe('(context)\nprojects?');
  });
});

describe('toRawActions', () => {
  test('turns tool calls into action objects', () => {
    expect(toRawActions([{ name: 'scroll_to', args: { section: 'skills' } }])).toEqual([{ section: 'skills', type: 'scroll_to' }]);
  });

  test('cannot be tricked into another action type through its arguments', () => {
    const raw = toRawActions([{ name: 'offer_cv', args: { type: 'open_url', url: 'https://evil.example' } }]);
    expect(validateActions(raw, [])).toEqual([{ type: 'offer_cv' }]);
  });

  test('returns nothing when there are no calls', () => {
    expect(toRawActions(undefined)).toEqual([]);
  });
});
