# Crowdsourced Road Issue System

Empowering citizens to report road issues quickly and helping administrators track and resolve them efficiently.

## Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution Overview](#-solution-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Impact & Metrics](#-impact--metrics)

## 🎯 Problem Statement

**Crowdsourced Road Issue Reporting System**  
Develop a web app where users upload road issues with images and location; include admin tracking dashboard.

## 💡 Solution Overview

Crowdsourced Road Issue System is a web-based platform for reporting road problems (e.g., potholes, damaged surfaces, blocked drains) using images and precise location. It combines geolocation, media uploads, and an admin dashboard so authorities can prioritize, track, and resolve issues transparently.

**Core Value Propositions:**

- **Fast reporting** with image + location capture
- **Admin dashboard** for tracking status and performance
- **Map-based discovery** to view issues by area
- **Offline-friendly workflow** for unreliable connectivity (optional)
- **Community engagement** via upvotes/comments (optional)

## ✨ Key Features

### 📸 Issue Reporting (Citizen)

- Upload **images/videos** as evidence
- Add **description** and **category** (pothole, road damage, etc.)
- Capture **GPS location** and show on map
- Track status: *Reported → In Review → In Progress → Resolved*

### 📍 Mapping & Discovery

- Interactive map with **markers** for reported issues
- Filters by **category**, **status**, **distance**, or **area**
- Issue detail view with media carousel and location

### 📊 Admin Tracking Dashboard

- Total reports, open vs resolved, and average resolution time
- Ward/area-wise issue density (heat map)
- Category trends and priority insights
- Status updates and assignment workflow

### 🔄 Offline Support (Optional)

- Cache reports locally when offline
- Auto-sync when connection is restored

### 👥 Community Engagement (Optional)

- Upvotes to help prioritize important issues
- Comments for additional context and updates

## 🛠 Technology Stack

### Frontend

- **React** — Component-based UI
- **TypeScript** — Type-safe development
- **Vite** — Fast build tool and dev server
- **Tailwind CSS** — Utility-first styling

### Backend (BaaS)

- **Supabase**
  - **Auth** for user/admin login
  - **Postgres Database** for reports, comments, status history
  - **Storage** for images/videos
  - **Realtime** for live updates to the dashboard (optional)

### Mapping & Geolocation

- **Leaflet** + **OpenStreetMap**

## 🏗 System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                      User Interface Layer                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Citizen  │  │   Report   │  │   Admin    │            │
│  │   Feed     │  │   Form     │  │ Dashboard  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                    Application Logic Layer                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Validation   │  │ Geolocation  │  │ Analytics    │      │
│  │ & Upload     │  │ + Mapping    │  │ Aggregation  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                           Data Layer                         │
│  ┌──────────────┐            ┌──────────────────────────┐    │
│  │ Local Cache  │            │ Supabase (Auth/DB/Storage│    │
│  │ (Optional)   │            │ + Realtime)              │    │
│  └──────────────┘            └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
