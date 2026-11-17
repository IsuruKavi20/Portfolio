// ============================================================
//  knowledge.ts — turns the profile and the project files into the
//  short fact sheet the AI answers from (Repository pattern: the same
//  Markdown files feed the project pages AND the bot).
//
//  Pure functions: no file access, so they are easy to test.
// ============================================================

import type { Profile } from '../data/profile';

export interface ProjectFacts {
  id: string;
  title: string;
  summary: string;
  status: string;
  year: string;
  role: string;
  tech: string[];
  highlights: string[];
  hasLiveSite: boolean;
  hasCode: boolean;
  isPlaceholder: boolean;
}

/** Hard cap so a long project list can never blow up the prompt (cost and speed). */
export const MAX_KNOWLEDGE_CHARS = 6000;

const NOT_SHARED = 'not shared yet';

function projectLine(project: ProjectFacts): string {
  if (project.isPlaceholder) {
    return `- [id: ${project.id}] ${project.title}: details not written yet. Say you can show the page, but the full story is coming soon.`;
  }
  const parts = [
    `- [id: ${project.id}] ${project.title} (${project.status}, ${project.year}). ${project.summary}`,
    `  Role: ${project.role}. Built with: ${project.tech.join(', ')}.`,
    project.highlights.length ? `  Highlights: ${project.highlights.join('; ')}.` : '',
    `  Live site: ${project.hasLiveSite ? 'yes (button on its page)' : 'no'}. Code: ${project.hasCode ? 'yes (button on its page)' : 'not public'}.`,
  ];
  return parts.filter(Boolean).join('\n');
}

/** A list, or "not shared yet" so the bot never guesses. */
const listOrUnknown = (items: string[]): string => (items.length ? items.join(', ') : NOT_SHARED);
const textOrUnknown = (text: string): string => text.trim() || NOT_SHARED;

export function buildKnowledge(profile: Profile, projects: ProjectFacts[]): string {
  const sheet = [
    profile.isDraft
      ? `NOTE: these details are still being completed. For anything not listed or marked "${NOT_SHARED}", say it will be added soon.`
      : '',
    `Name: ${profile.name} (call yourself ${profile.shortName})`,
    `Headline: ${profile.headline}`,
    `Based in: ${profile.location} (never give a more exact location)`,
    `About: ${profile.about}`,
    `Education: ${listOrUnknown(profile.education)}`,
    `GPA: ${textOrUnknown(profile.gpa)}`,
    `Skills: ${listOrUnknown(profile.skills)}`,
    `Currently learning: ${listOrUnknown(profile.currentlyLearning)}`,
    `Interests: ${listOrUnknown(profile.interests)}`,
    `Looking for: ${textOrUnknown(profile.lookingFor)}`,
    `Availability: ${textOrUnknown(profile.availability)}`,
    `Public contact: email ${profile.contact.email}; GitHub and LinkedIn links are on the site.`,
    '',
    'Projects (use the id with open_project):',
    ...projects.map(projectLine),
  ]
    .join('\n')
    .trim();

  return sheet.length > MAX_KNOWLEDGE_CHARS ? `${sheet.slice(0, MAX_KNOWLEDGE_CHARS)}\n(more projects on the site)` : sheet;
}

/** How Isuru sounds: added to the bot's rules so it talks like him. */
export function buildVoice(profile: Profile): string {
  const phrases = profile.voice.phrases.map((phrase) => `"${phrase}"`).join(', ');
  return [
    `Tone: ${profile.voice.tone}.`,
    `Habits: ${profile.voice.habits.join('; ')}.`,
    phrases ? `Phrases you naturally use (only now and then, never in every reply): ${phrases}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
