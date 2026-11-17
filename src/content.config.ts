// ============================================================
//  Content collections: the "database" of the site, as files.
//
//  Each project is one Markdown file in src/content/projects/.
//  The schema below checks every file when the site builds: a missing
//  title or a broken link stops the build with a clear message,
//  instead of a broken page going live.
//
//  To add a project: copy src/content/projects/_template.md, rename it
//  (the file name becomes the page address), and fill it in.
// ============================================================

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { TECH_IDS } from './data/tech';

const STATUSES = ['Live', 'In Progress', 'Coming Soon', 'Concept'] as const;

const projects = defineCollection({
  // Files starting with "_" (the template) are ignored
  loader: glob({ base: './src/content/projects', pattern: '[^_]*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      summary: z.string().min(1).max(200),
      /** Position on the home page: 1 shows first */
      order: z.number().int().positive(),
      status: z.enum(STATUSES),
      year: z.string(),
      role: z.string(),
      /** Ids from src/data/tech.ts, e.g. "react" */
      tech: z.array(z.enum(TECH_IDS)).min(1),
      links: z
        .object({
          live: z.url().optional(),
          demo: z.url().optional(),
          github: z.url().optional(),
        })
        .default({}),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      gallery: z
        .array(z.object({ src: image(), alt: z.string().min(1), caption: z.string().optional() }))
        .default([]),
      highlights: z.array(z.string()).default([]),
      /** true while the text is still example content; shows a notice on the page */
      placeholder: z.boolean().default(false),
    }),
});

export const collections = { projects };
