---
title: "Hirujaya Green Energy Sales Platform"
summary: "A ground-up rebuild of a solar company's sales and operations system: quotations, payments, invoices, commissions and reports, built mobile-first for field staff."
order: 2
status: "Live Demo"            # the public version is a demo with made-up data
year: "2026"
role: "Built alone: architecture, UI, development, security and deployment"
tech: ["nextjs", "typescript", "react", "tailwind", "shadcn", "threejs", "postgresql", "prisma", "redis", "authjs", "inngest", "zod", "vitest", "playwright", "docker", "cloudrun", "r2", "sentry"]
links:
  live: "https://hirujaya-erp-demo-345017909453.asia-southeast1.run.app"   # public demo, made-up data
  # github: add once the repository is public
cover: "./images/hirujaya-cover.jpeg"
coverAlt: "Sales rep's daily view: late and due tasks, and progress from quote to installation"
gallery:
  - src: "./images/hirujaya-dashboard.png"
    alt: "Admin dashboard with conversion rate, collections and the quotation funnel"
    caption: "Admins see the whole business at a glance (demo data)"
  - src: "./images/hirujaya-login.png"
    alt: "Sign-in page with wind turbines over green fields"
    caption: "A sign-in page with two-step login behind it"
  - src: "./images/hirujaya-products.jpeg"
    alt: "Product catalog with inverters, panels and batteries"
    caption: "Field staff show customers the real parts, specs and datasheets"
  - src: "./images/hirujaya-add-component.png"
    alt: "Admin form for adding a new inverter to the catalog"
    caption: "Admins add products themselves, with no code changes"
  - src: "./images/hirujaya-loading.png"
    alt: "Loading screen with a glowing light bulb"
    caption: "Even the loading screen got attention to detail"
highlights:
  - "Role-based access for a 7-level sales hierarchy: each person sees only the deals they are allowed to"
  - "Full sales flow: customers, quotations with approvals, payments, invoices, refunds and commissions"
  - "Mobile-first progressive web app for staff working at customer sites"
  - "Security tested: two-step login, account lockout, and an attack test of 229 server actions with no critical or high findings"
  - "Admins add products, regions and business settings themselves, with no code changes"
teamSize: "Solo"
placeholder: false
---

## The problem

Hirujaya Green Energy, a Sri Lankan solar PV and solar water pump company, ran its sales on an older internal system that worked but was slow, hard to use on phones, and hard to maintain. The company wanted a better architecture, speed, security and a much better user experience.

## What I built

I rebuilt the system from the ground up as the only developer. Sales staff create customers and quotations; managers approve them; payments, invoices, refunds and commissions follow automatically through the chain. Every list is filtered by role and area, so a sales rep sees their own deals while managers see their whole region.

It runs on Next.js with TypeScript, a PostgreSQL database through Prisma, and Auth.js for sign-in with two-step login. It installs on phones as a web app for field visits. Admins can add new products, regions and business values (like tariffs and commission rates) from the admin panel, without touching code.

I treated security as a feature: strict access control, protected file uploads, privacy rules for personal data, backups, monitoring, and a full attack test of the app before the demo went live. The public demo runs in a Docker container on Google Cloud Run with made-up data.

## What I learned

Designing for one maintainer changed every decision: simple, proven tools, clear records of how each part works, and automated tests (over 100 test files) so changes stay safe. I also learned to turn real business rules, like who earns commission on which deal, into code that the company can trust.
