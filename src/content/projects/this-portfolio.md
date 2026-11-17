---
title: "This Portfolio"
summary: "The site you are on: a fast, mobile-first portfolio with an AI assistant that can answer questions and move around the page, built and secured by me alone."
order: 4
status: "Live"
year: "2026"
role: "Design, development, security and deployment (solo)"
teamSize: "Solo"
tech: ["astro", "typescript", "tailwind", "gsap", "threejs", "gemini", "zod", "vitest", "vercel"]
links:
  live: "https://isurukavi.vercel.app"
  github: "https://github.com/IsuruKavi20/Portfolio"
highlights:
  - "\"Ask Isuru\" AI assistant (Gemini) that answers in my voice and can scroll, open projects and fill the contact form"
  - "The assistant can only use a fixed, safe list of actions, and only knows facts I wrote"
  - "Mobile-first: animation quality adapts to each device, so cheap phones stay smooth"
  - "Security built in: strict Content Security Policy, rate limits, bot traps and no secrets in the browser"
  - "Auto-deployed on Vercel from Git, with 79 automated tests"
placeholder: false
---

## The problem

A portfolio should prove what I can do, not just list it. I wanted a site that feels smooth on any phone, answers visitors' questions any time, and is built with the same care for security I would give a real product.

## What I built

### The "Ask Isuru" assistant

- A chat assistant powered by **Google Gemini** that answers questions about my projects and skills in my own voice.
- It only knows what I wrote (my profile and these project pages), so it doesn't invent facts.
- It can **act on the page** through tool calling: scroll to a section, open a project or fill in the contact form for the visitor. Every action comes from a fixed allow-list, and the page checks it again before doing anything.

### Smooth on every device

- **Mobile-first** design in a dark, minimal theme.
- The site checks what the device can handle and picks a **quality level**, so the 3D particle sphere and **GSAP** animations stay smooth even on low-end phones, and turn off for people who prefer reduced motion.
- Smooth scrolling only on mouse devices; touch scrolling stays native.
- Built with **Astro**, so pages ship as fast static HTML with very little JavaScript.

### Security

- A strict **Content Security Policy** that only allows my own scripts, so injected code can't run.
- **Rate limits** at the Vercel firewall plus per-visitor limits in the code, protecting both the assistant and the contact form.
- API keys live only on the server (never in the browser bundle or in Git), the AI key is locked to one API, and spending has a hard monthly cap.
- The contact form checks every field with **Zod**, uses bot traps, and sends email through Resend.

### Deployment and testing

- Every push to the main branch **deploys automatically on Vercel**, with server routes for the assistant and the contact form.
- **79 automated tests** with Vitest cover the assistant's safety rules, the input checks and the rate limits.

## What I learned

Building it end to end taught me to treat a small site like a real product: plan the security first, test the risky parts, measure performance on real phones, and design an AI feature so it stays useful while it can only do safe things.
