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

export function buildKnowledge(profile: Profile, projects: ProjectFacts[]): string {
  const sheet = [
    profile.isPlaceholder
      ? 'NOTE: Isuru is still filling in his details. If asked about something not listed here, say it will be added soon.'
      : '',
    `Name: ${profile.name}`,
    `Headline: ${profile.headline}`,
    `Based in: ${profile.location}`,
    `About: ${profile.about}`,
    `Education: ${profile.education.join('; ')}`,
    `Skills: ${profile.skills.join(', ')}`,
    `Looking for: ${profile.lookingFor}`,
    `Public contact: email ${profile.contact.email}; GitHub and LinkedIn links are on the site.`,
    '',
    'Projects (use the id with open_project):',
    ...projects.map(projectLine),
  ]
    .filter((line) => line !== null)
    .join('\n')
    .trim();

  return sheet.length > MAX_KNOWLEDGE_CHARS ? `${sheet.slice(0, MAX_KNOWLEDGE_CHARS)}\n(more projects on the site)` : sheet;
}
