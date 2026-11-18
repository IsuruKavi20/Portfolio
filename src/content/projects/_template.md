---
# ─────────────────────────────────────────────────────────────
#  PROJECT TEMPLATE
#  1. Copy this file and rename it, e.g. "lms-platform.md".
#     The file name becomes the page address: /projects/lms-platform
#  2. Fill in the fields below. Lines starting with # are notes.
#  3. Put images in src/content/projects/images/ and point to them
#     with a path starting "./images/".
#  4. Run `npm run build`: it tells you exactly what is missing or wrong.
# ─────────────────────────────────────────────────────────────

title: "Project name"
summary: "One or two sentences: what it is and who it is for. Max 200 characters."
order: 4                     # position on the home page (1 = first)
status: "In Progress"        # Live | In Progress | Coming Soon | Concept
year: "2026"
role: "Built the frontend and the login" # what YOU did

# Technology ids from src/data/tech.ts (add new ones there first)
tech: ["react", "node", "mongodb"]

# Leave out any link you do not have; its button is then hidden
links:
  live: "https://example.com"                    # the working site
  demo: "https://youtube.com/watch?v=..."        # a video walkthrough
  github: "https://github.com/isurukavi20/repo"  # the code
  # githubBackend: "https://github.com/..."     # only if the backend is a separate repo

# Optional: big image at the top of the page
# cover: "./images/project-cover.png"
# coverAlt: "Dashboard showing live sensor readings"

# Optional: screenshots
# gallery:
#   - src: "./images/project-1.png"
#     alt: "Login screen"
#     caption: "Role-based login for students and teachers"

# Optional: short points shown as a list
highlights:
  - "Something you are proud of"
  - "A hard problem you solved"
---

## The problem

What was wrong or missing, and for whom.

## What I built

How it works, the main features, the interesting decisions.

## What I learned

What you would do differently, what you now know.
