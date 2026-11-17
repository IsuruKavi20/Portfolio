// ============================================================
//  profile.ts — what "Ask Isuru" knows about you, besides projects.
//
//  EVERYTHING HERE IS PUBLIC: the bot may repeat any of it to anyone.
//  Never put a phone number, home address, ID numbers, grades you do
//  not want shared, or anything private in this file.
//
//  `isPlaceholder: true` makes the bot say its details are still being
//  filled in. Set it to false once the real details are in.
// ============================================================

export interface Profile {
  isPlaceholder: boolean;
  name: string;
  headline: string;
  location: string;
  about: string;
  education: string[];
  skills: string[];
  lookingFor: string;
  contact: { email: string; github: string; linkedin: string };
}

export const PROFILE: Profile = {
  isPlaceholder: true,
  name: 'Isuru K. Premasiri',
  headline: 'Creative developer and IT undergraduate',
  location: 'Sri Lanka',
  about:
    'Builds interactive, cinematic web experiences where motion, space and typography work together.',
  education: ['IT undergraduate at the University of Moratuwa (2023 – present)'],
  skills: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Tailwind CSS', 'Astro', 'Node.js', 'Java', 'MySQL', 'MongoDB', 'Git', 'Docker'],
  lookingFor: 'Internship opportunities and collaborations',
  contact: {
    email: 'isurukpremasiri2001@gmail.com',
    github: 'https://github.com/isurukavi20',
    linkedin: 'https://linkedin.com/in/isurukavi20',
  },
};
