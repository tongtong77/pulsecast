<div align="center">

# 📡 PulseCast

### Enterprise Digital Out-of-Home (DOOH) Content Management Platform

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma_7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## What is PulseCast?

**PulseCast** is a production-ready, multi-tenant SaaS platform for managing digital signage and DOOH (Digital Out-of-Home) displays at scale. Built for enterprises that need to deliver dynamic content to hundreds of screens across multiple locations — with real-time control, zero-downtime updates, and military-grade reliability.

Think of it as a **command center** for your TV screens: upload media, arrange playlists, schedule content across time zones, and push updates to every screen instantly — all from a single dashboard.

---

## Key Enterprise Features

| Category | Feature |
|----------|---------|
| 🏢 **Multi-Tenant SaaS** | Full organizational isolation, per-tenant branding (logo, color), plan-based limits (FREE/PRO/ENTERPRISE) |
| 📡 **SSE Real-Time Sync** | Server-Sent Events push playlist/schedule changes to TVs instantly — no polling, no manual refresh |
| 🚨 **Emergency Alert Override** | One-click emergency broadcast forcibly overrides ALL screens with evacuation/alert messaging |
| 🔧 **Remote Maintenance Mode** | Global SSE broadcast instantly switches all TVs to maintenance screen |
| 📊 **PoP Analytics** | Proof-of-Play impressions tracking with daily charts per device/playlist |
| ✅ **Approval Workflow** | Content review pipeline — Content Creators submit, Reviewers approve, only then content goes live |
| 🛡️ **RBAC (6 Roles)** | Owner · Admin · Editor · Reviewer · Content Creator · Viewer — strict sidebar and action guards |
| 📺 **Multi-Zone Layouts** | Fullscreen, L-Shape, Split Vertical, Bottom Ticker — with CSS Grid and marquee animation |
| 🎨 **White-Label Branding** | Per-tenant logo and brand color reflected on IDLE screens and player UI |
| 📱 **Device Fleet Management** | QR-code pairing, heartbeat monitoring, remote commands (reload, clear cache) |
| 👑 **Super Admin Console** | Full CRUD for tenants & users, plan management, password reset, suspend/unsuspend, system health dashboard |
| ⚡ **Aggressive Offline Caching** | Service Worker + Cache API ensures TVs keep playing even during network outages |
| 🐳 **Docker Ready** | Standalone Next.js output, production-optimized `docker-compose.yml` included |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   PulseCast Server                   │
│  ┌────────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │ Next.js 16 │  │ Prisma 7 │  │  PostgreSQL DB  │  │
│  │ App Router │──│   ORM    │──│  Multi-Tenant   │  │
│  │  + API     │  │          │  │                 │  │
│  └─────┬──────┘  └──────────┘  └─────────────────┘  │
│        │ SSE Stream                                  │
│  ┌─────┴──────────────────────────────────────────┐  │
│  │         /api/sse   (Real-Time Events)          │  │
│  │  REMOTE_COMMAND · EMERGENCY · MAINTENANCE      │  │
│  └────────────────────────┬───────────────────────┘  │
└───────────────────────────┼──────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  TV #1   │ │  TV #2   │ │  TV #N   │
        │ /player/ │ │ /player/ │ │ /player/ │
        │ [id]     │ │ [id]     │ │ [id]     │
        └──────────┘ └──────────┘ └──────────┘
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **PostgreSQL** ≥ 15 (or use Docker)
- **npm** ≥ 10

### 1. Clone & Install

```bash
git clone https://github.com/your-username/pulsecast.git
cd pulsecast
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your PostgreSQL connection string and secrets
```

### 3. Setup Database

```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the default credentials.

---

### Docker (Production)

```bash
docker compose up -d
```

This spins up PostgreSQL + PulseCast in standalone mode. See `.env.production.example` for production environment variables.

---

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | `super@domain.com` | `admin123` |

> ⚠️ **Change the default password immediately after first login in production.**

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Authenticated dashboard routes
│   ├── api/                # API routes (SSE, upload, auth, telemetry)
│   ├── player/[deviceId]/  # TV player engine
│   └── super-admin/        # Platform administration
├── components/
│   ├── dashboard/          # Sidebar, Header, data tables
│   ├── player/             # PlaybackEngine, SSEListener, EmergencyOverlay
│   ├── super-admin/        # TenantTable, GlobalUsersTab, SystemHealthTab
│   └── ui/                 # shadcn/ui primitives
├── lib/
│   ├── actions/            # Server Actions (media, playlist, schedule, etc.)
│   ├── prisma.ts           # Prisma client singleton
│   └── sse-notify.ts       # SSE broadcast helper
└── generated/prisma/       # Generated Prisma Client
```

---

## RBAC Role Matrix

| Role | Dashboard | Media | Playlist | Devices | Schedules | Analytics | Approvals | Settings |
|------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **Viewer** | ✅ | — | — | — | — | — | — | — |
| **Content Creator** | ✅ | ✅ | — | — | — | — | — | — |
| **Reviewer** | ✅ | ✅ | ✅ | — | — | — | ✅ | — |
| **Editor** | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## License

This project is proprietary software. All rights reserved.

---

<div align="center">
  <sub>Built with precision by <a href="https://github.com/ribato22">ribato</a></sub>
</div>
