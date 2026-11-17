// describe / test / expect are provided by Vitest (globals: true in vitest.config.js)
import { MAX_KNOWLEDGE_CHARS, buildKnowledge, type ProjectFacts } from './knowledge';
import type { Profile } from '../data/profile';

const profile: Profile = {
  isPlaceholder: false,
  name: 'Test Person',
  headline: 'Developer',
  location: 'Sri Lanka',
  about: 'Builds things.',
  education: ['Some university'],
  skills: ['React'],
  lookingFor: 'Internships',
  contact: { email: 'test@example.com', github: 'https://github.com/x', linkedin: 'https://linkedin.com/in/x' },
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

  test('tells the bot when the profile is still a placeholder', () => {
    expect(buildKnowledge({ ...profile, isPlaceholder: true }, [])).toContain('still filling in');
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
