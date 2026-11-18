---
title: "UBE Booking Platform"
summary: "A multi-vendor booking marketplace for hotels, car rentals, events, activities and restaurants. I designed the architecture, planned the UI and backend, and built core modules."
order: 3
status: "Concept"
year: "2026"
role: "System architecture, UI and backend planning, and core modules (team project)"
teamSize: "Team"
tech: ["react", "typescript", "vite", "mui", "tailwind", "dotnet", "efcore", "sqlserver", "signalr", "azure", "vitest"]
links:
  github: "https://github.com/SkyteIT/booking-frontend"
  githubBackend: "https://github.com/SkyteIT/booking-backend"
highlights:
  - "Second-year university team project; not deployed live"
  - "I designed the Clean Architecture backend (Domain, Application, Infrastructure, API) and planned the UI and backend"
  - "Top contributor on both repositories: about 270 commits across frontend and backend"
  - "Built availability, bookings, payments and ledger, reviews, fraud detection, roles and admin approval modules"
  - "Security: JWT with roles, two-factor login for admin and finance, encrypted bank details, tamper-proof payment ledger"
  - "196 automated backend tests"
placeholder: false
---

## The problem

UBE is a marketplace where vendors list what they offer (hotel rooms, rental cars, event tickets, activities and restaurant tables) and customers search, book and pay in one place. Each type of listing books differently, so the system needed a flexible design that one team could build in parallel. This was our second-year software project, built by a team of five; it is not deployed live.

## My part

**System architecture.** I set up the backend on .NET 10 using Clean Architecture: Domain (entities and rules), Application (features), Infrastructure (database, email, SMS, storage, payments) and API. Code is organised by feature (bookings, payments, reviews and so on), so each teammate could own a module without stepping on others. I also wrote the frontend contribution guide: folder structure, naming rules, linting and formatting.

**UI and backend planning.** I planned the screens and the API together, splitting the work into modules with clear boundaries so everyone knew what they owned. On the UI side I rebuilt the landing page, reworked the search and product pages, and kept the customer, vendor and admin portals consistent.

### Modules I built

- **Availability:** a calendar with date blocking and a strategy-based design, so each listing type (hotel, car, event, activity, restaurant) checks availability its own way; seat availability and an overlap check that prevents double bookings.
- **Bookings:** status rules (who can move a booking from one state to the next), booking numbers, combinable booking options, percentage and occupancy pricing, and vendor booking lists with filtering, sorting and pagination.
- **Payments:** a ledger, commission rules, refunds, disputes and chargebacks, vendor payouts and advances, reconciliation and a payment scheduler running in the background.
- **Reviews:** customers can only review after a completed booking, and vendors can't review themselves.
- **Fraud detection**, **vendor approval** for new vendors, **super admin and role management**, **vendor pricing and promotions**, **vendor reports and analytics**, and **localization**.
- **File storage** on Azure Blob Storage, private for documents, with a local fallback for development.

### Security

- Login with **JWT** and **role-based access** (customer, vendor, admin, super admin, finance), plus Google sign-in.
- **Two-factor login** (authenticator app, with backup codes) required for admin and finance accounts; password reset through email.
- Passwords hashed with **BCrypt**; vendor **bank account numbers encrypted**.
- The **payment ledger is append-only**: the code has no way to edit or delete entries, and a database rule denies it too.
- Secrets in **Azure Key Vault**, never in the code; notification endpoints never trust a user ID from the URL.
- Central error handling, so errors never leak internal details.

### Performance and real-time

- Database indexes from a query audit, and batched checkout lookups that remove an N+1 query problem.
- Live updates with **SignalR**, plus email, SMS and web push notifications.

## What I learned

Designing the architecture first is what let five people build one large system at the same time. I learned how to model money safely (a ledger that can only grow), how to protect admin accounts with two-factor login, and how to keep a growing codebase consistent with clear structure, naming rules and tests.
