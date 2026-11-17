---
title: "SwiftDrop"
summary: "A parcel delivery platform built by a student team. I led the architecture, the UI design and the AWS deployment, and built its authentication service alone, running on Oracle Cloud."
order: 1
status: "Live"
year: "2026"
role: "Architecture, UI design and AWS deployment; built the auth service solo"
teamSize: "Team"
tech: ["react", "typescript", "vite", "java", "spring", "springsecurity", "postgresql", "redis", "rabbitmq", "flyway", "docker", "kubernetes", "helm", "aws", "oci", "githubactions", "playwright"]
links:
  live: "https://app.getswiftdrop.me"
  github: "https://github.com/Tharusha-Heshan/SwiftDrop"
  # githubBackend: add the auth service repo (IsuruKavi20/swiftdrop-auth) once it is public
cover: "./images/swiftdrop-home.jpeg"
coverAlt: "SwiftDrop home page: parcel tracking search, a sample tracking card and the three ways to use the service"
gallery:
  - src: "./images/swiftdrop-login.jpeg"
    alt: "Sign-in page with email and password, Google sign-in and links for new users and merchants"
    caption: "Sign-in, powered by the auth service I built (email and password or Google)"
  - src: "./images/swiftdrop-profile.jpeg"
    alt: "Customer portal asking a new user to add a phone number and address"
    caption: "Customer portal: first-time profile setup (sample details)"
highlights:
  - "Team project: I designed the architecture, led the UI and deployed the platform to AWS"
  - "Built the authentication service from scratch, alone: signed tokens, Google sign-in, roles, merchant API access, audit log"
  - "Security-first auth: Argon2id passwords, breached-password check, refresh-token theft detection, rate limits, 346 automated tests"
  - "Auth service on Oracle Cloud Kubernetes: two replicas, default-deny network firewall, encrypted database, nightly encrypted backups"
  - "Main app on AWS: React on S3 + CloudFront, backend on k3s (EC2), PostgreSQL on RDS, deployed by GitHub Actions with automatic rollback"
  - "No cloud keys stored anywhere: GitHub logs in to AWS with short-lived identity tokens; secrets live in AWS Parameter Store"
placeholder: false
---

## The problem

SwiftDrop is a parcel delivery platform made by a university team of more than ten developers: customers book deliveries, merchants send parcels through it, and dispatchers and couriers handle the work. With many people building different parts, it needed a clear structure, one secure way for everyone to sign in, and a reliable way to put it all online.

## My part in the team

**Architecture.** I designed the backend as one Spring Boot application made of modules (identity, customers, merchants, pricing, dispatch, notifications) with strict rules about how they talk to each other. A Spring Modulith test checks those rules on every pull request, so the codebase stays clean as the team grows. Modules share news through events instead of calling each other, with RabbitMQ carrying the messages and an outbox so no event is lost.

**UI design.** I led the visual design and gave the landing page, sign-in pages and customer portal a professional refresh, with a new logo and consistent styling, and fixed sign-in flows across customer, merchant and admin views.

## The authentication service (built alone)

I built SwiftDrop's identity system from scratch as its own service: version 1.1 with 346 automated tests, including real database tests (Testcontainers) and architecture rules (ArchUnit). Every other part of SwiftDrop trusts its tokens.

### How it keeps accounts safe

- **Passwords:** hashed with **Argon2id**; NIST-style rules; a **breached-password check** against Have I Been Pwned using k-anonymity, so only 5 characters of a hash ever leave the server.
- **Sign-up that leaks nothing:** it always answers the same way, so nobody can find out which emails have accounts; the email must be verified.
- **Login protection:** progressive temporary lockout after wrong passwords, plus per-IP rate limits (Bucket4j, shared through Redis across replicas).
- **Tokens:** short-lived **RS256 signed access tokens** (15 minutes) that other services verify themselves with the public key (JWKS); **rotating refresh tokens** with **reuse detection**, so a stolen refresh token ends the whole session; key rotation supported.
- **Google sign-in** with OpenID Connect and **PKCE**, returning users only to a fixed list of registered websites.
- **Access control:** roles and fine-grained permissions inside tokens, ownership checks (a courier can never see another courier's deliveries), and admin role management.
- **Machine access:** merchants apply, an admin approves, and they get OAuth 2.0 client credentials; tokens can be **introspected and revoked** at once (RFC 7662 / 7009).
- **Audit log:** append-only, chained with SHA-256 so any tampering is detectable, with a nightly external anchor; admin actions always need a reason.
- **Privacy:** users can export their data and delete their account; email changes come with a 7-day undo link.
- **Safe input:** strict JSON, request size limits, a CORS allow-list and standard error messages (RFC 9457) that never reveal internals.
- **Secrets:** never in the code or the image; the service refuses to start if a required production setting is missing or unsafe.

### How it runs on Oracle Cloud

- **Kubernetes (OKE)** in Oracle Cloud, deployed with **Helm**; **two replicas**, so one can fail without an outage.
- **Traefik** for HTTPS with HSTS and automatic Let's Encrypt certificates (cert-manager), behind a network load balancer that keeps the real visitor IP.
- **Locked-down cluster:** Pod Security "restricted", a **default-deny network firewall** (Calico NetworkPolicies) so each part can only reach what it needs, and TLS between the app, PostgreSQL and Redis.
- **Containers:** a non-root image with no secrets inside, scanned for vulnerabilities by **Trivy** in CI before it is published to Oracle's private registry.
- **Data:** PostgreSQL on an encrypted disk with separate users for the app and for migrations (Flyway); **nightly encrypted backups** to Object Storage with a monthly restore test.
- **Safe releases:** Helm upgrades keep old replicas serving until new ones are healthy, with one-command rollback; a break-glass tool for emergencies, itself audited.

## Deploying the main app on AWS

- **Frontend:** the React app on a private **S3** bucket served through **CloudFront** (HTTPS, HTTP/3, modern TLS), with a free AWS certificate.
- **Backend:** a small Docker image (build with the JDK, run on a slim JRE as a non-root user) stored in **ECR**, running in a **k3s Kubernetes** cluster on an **EC2** server with **Traefik** and Let's Encrypt HTTPS, next to **RabbitMQ**.
- **Database:** **PostgreSQL on RDS**, private, reachable only by the backend.
- **Automatic deploys:** merging to main runs **GitHub Actions**: tests, image build, push to ECR, then a **Helm** upgrade on the server through AWS Systems Manager (no SSH) and the frontend upload to S3 with a CloudFront refresh. If the new version isn't healthy, Helm **rolls back automatically** (`--atomic`).
- **No stored keys:** GitHub signs in to AWS with **OIDC** short-lived tokens, limited to the main branch; production secrets live in **AWS Parameter Store** and are copied into Kubernetes at start.
- **Cost control:** a monthly budget with alerts, a free-tier plan and small ARM servers.

## What I learned

Building the auth service taught me how real login systems protect people: careful hashing, short-lived signed tokens, theft detection, rate limits and errors that leak nothing. Deploying on two clouds taught me infrastructure end to end, from DNS and certificates to Kubernetes, network policies, backups and automatic rollbacks. Working in a team of more than ten developers taught me why clear module boundaries and good documentation matter as much as the code itself.
