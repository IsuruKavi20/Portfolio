// describe / test / expect are provided by Vitest (globals: true in vitest.config.js)
import { MAX_KNOWLEDGE_CHARS, buildKnowledge, buildVoice, type ProjectFacts } from './knowledge';
import type { Profile } from '../data/profile';

const profile: Profile = {
  isDraft: false,
  name: 'Test Person',
  shortName: 'Test',
  headline: 'Developer',
  location: 'Sri Lanka',
  about: 'Builds things.',
  strengths: ['UI design'],
  education: ['Some university'],
  gpa: '',
  skills: ['React'],
  currentlyLearning: [],
  interests: [],
  lookingFor: 'Internships',
  availability: 'Open',
  contact: { email: 'test@example.com', github: 'https://github.com/x', linkedin: 'https://linkedin.com/in/x' },
  voice: { tone: 'friendly', habits: ['short sentences'], phrases: ['Happy to show you!'] },
};

const project: ProjectFacts = {
  id: 'swiftdrop', title: 'SwiftDrop', summary: 'Fast delivery app.', status: 'Live', year: '2026',
  role: 'Backend developer', tech: ['Java', 'React'], highlights: ['Auth service'], hasLiveSite: true, hasCode: true, isPlaceholder: false,
};

describe('buildKnowledge', () => {
  test('includes the profile and each project with its id', () => {
    const text = buildKnowledge(profile, [project]);
    expect(text).toContain('Test Person');
    expect(text).toContain('[id: swiftdrop] SwiftDrop');
    expect(text).toContain('Backend developer');
  });

  test('marks unfinished projects instead of describing them', () => {
    const text = buildKnowledge(profile, [{ ...project, isPlaceholder: true }]);
    expect(text).toContain('details not written yet');
    expect(text).not.toContain('Backend developer');
  });

  test('tells the bot when the profile is still a draft', () => {
    expect(buildKnowledge({ ...profile, isDraft: true }, [])).toContain('still being completed');
  });

  test('says not shared yet instead of leaving a gap, so the bot never guesses', () => {
    expect(buildKnowledge(profile, [])).toContain('GPA: not shared yet');
    expect(buildKnowledge({ ...profile, gpa: '3.6 / 4.0' }, [])).toContain('GPA: 3.6 / 4.0');
  });

  test('never includes link addresses, only whether a link exists', () => {
    const text = buildKnowledge(profile, [project]);
    expect(text).not.toContain('https://');
  });

  test('stays under the size limit with many projects', () => {
    const many = Array.from({ length: 200 }, (_, i) => ({ ...project, id: `p-${i}` }));
    expect(buildKnowledge(profile, many).length).toBeLessThan(MAX_KNOWLEDGE_CHARS + 50);
  });
});

describe('buildVoice', () => {
  test('describes the tone, habits and phrases', () => {
    const voice = buildVoice(profile);
    expect(voice).toContain('Tone: friendly.');
    expect(voice).toContain('short sentences');
    expect(voice).toContain('"Happy to show you!"');
  });

  test('leaves out the phrases line when there are none', () => {
    expect(buildVoice({ ...profile, voice: { ...profile.voice, phrases: [] } })).not.toContain('Phrases');
  });
});

describe('strengths', () => {
  test('lists my strengths in the facts sheet', () => {
    expect(buildKnowledge(profile, [])).toContain('Strengths: UI design');
  });
});
