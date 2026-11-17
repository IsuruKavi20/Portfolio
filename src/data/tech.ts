// ============================================================
//  Technology registry: one entry per technology a project can list.
//
//  To add one: add a line below. If you have a white SVG logo, put it in
//  public/logos/ and set `logo`. Without a logo the page shows the
//  initials in a tile instead, so a missing logo never breaks anything.
// ============================================================

export type TechCategory = 'Frontend' | 'Backend' | 'Database' | 'Tools' | 'Hardware';

export interface Tech {
  name: string;
  category: TechCategory;
  /** Path under public/, e.g. "/logos/react.svg" */
  logo?: string;
}

export const TECH = {
  html: { name: 'HTML', category: 'Frontend', logo: '/logos/html.svg' },
  css: { name: 'CSS', category: 'Frontend', logo: '/logos/css.svg' },
  javascript: { name: 'JavaScript', category: 'Frontend', logo: '/logos/javascript.svg' },
  typescript: { name: 'TypeScript', category: 'Frontend' },
  react: { name: 'React', category: 'Frontend', logo: '/logos/react.svg' },
  astro: { name: 'Astro', category: 'Frontend' },
  tailwind: { name: 'Tailwind CSS', category: 'Frontend', logo: '/logos/tailwind.svg' },
  gsap: { name: 'GSAP', category: 'Frontend' },
  ejs: { name: 'EJS', category: 'Frontend' },
  node: { name: 'Node.js', category: 'Backend', logo: '/logos/node.svg' },
  express: { name: 'Express', category: 'Backend' },
  python: { name: 'Python', category: 'Backend', logo: '/logos/python.svg' },
  java: { name: 'Java', category: 'Backend', logo: '/logos/java.svg' },
  php: { name: 'PHP', category: 'Backend' },
  mysql: { name: 'MySQL', category: 'Database', logo: '/logos/mysql.svg' },
  mongodb: { name: 'MongoDB', category: 'Database', logo: '/logos/mongodb.svg' },
  git: { name: 'Git', category: 'Tools', logo: '/logos/git.svg' },
  docker: { name: 'Docker', category: 'Tools', logo: '/logos/docker.svg' },
  esp32: { name: 'ESP32', category: 'Hardware' },
  arduino: { name: 'Arduino', category: 'Hardware' },
} as const satisfies Record<string, Tech>;

export type TechId = keyof typeof TECH;

export const TECH_IDS = Object.keys(TECH) as [TechId, ...TechId[]];

const CATEGORY_ORDER: TechCategory[] = ['Frontend', 'Backend', 'Database', 'Tools', 'Hardware'];

/** Groups technology ids by category, in a fixed category order. */
export function groupTech(ids: readonly TechId[]): { category: TechCategory; items: (Tech & { id: TechId })[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    items: ids
      .map((id) => ({ id, ...(TECH[id] as Tech) }))
      .filter((tech) => tech.category === category),
  })).filter((group) => group.items.length > 0);
}

/** "Tailwind CSS" → "TC": shown when a technology has no logo. */
export function initials(name: string): string {
  return name
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}
