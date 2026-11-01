# 📱 Konekta - Lightweight Social Networking Platform & Hybrid Mobile App

> **A fast, data-efficient, and accessible social networking web & hybrid mobile application inspired by Facebook Lite.**  
> Designed for students, communities, and areas with limited network connectivity.

---

## 📌 Project Overview

**Konekta** is a production-ready social media platform engineered with modern web technologies (React 19, TypeScript, Vite, Tailwind CSS, and Express.js). It adheres to Progressive Web App (PWA) standards, allowing it to run smoothly on desktop browsers and install natively on Android and iOS devices as a standalone mobile application without requiring store distribution.

This project was developed for an academic software engineering and web/mobile systems presentation, featuring clean architecture, human-centered UX, and zero third-party AI dependencies.

---

## 🚀 Key Features

### 1. 🎨 User Interface & Accessibility
* **FB Lite Inspired Aesthetic:** Clean, familiar, ultra-fast interface designed for high performance on low-end devices.
* **Dynamic Theme Engine:** Instant Light Mode & Dark Mode toggling with persistent user preference.
* **Data Saver Mode:** Toggle image/video preloading to save mobile data.
* **Multi-Language Support (Localization):**
  * 🇵🇭 Tagalog (Filipino)
  * 🇬🇧 English
  * 🇵🇭 Cebuano (Bisaya)
  * 🇵🇭 Ilocano
  * 🇪🇸 Spanish

### 2. 🔐 Authentication & Account Management
* **Sign Up:** Direct registration with full validation (Name, Gender, Birthday, Mobile/Email, Password).
* **Sign In:** Secure login with error handling and persistent user sessions.
* **Forgot Password:** Complete 2-step verification flow with 6-digit verification code.
* **Logout Confirmation:** Modal-protected sign-out to prevent accidental session termination.
* **Profile Customization:** Ability to update bio, workplace, location, avatar, and cover photo.

### 3. 🌐 Social Feed & Interactions
* **Status Updates:** Post text with custom colored gradient backgrounds and feeling/activity indicators.
* **Photo Attachments:** Upload and share photos with timestamps.
* **6-Way Emotional Reactions:** Like (👍), Love (❤️), Haha (😆), Wow (😮), Sad (😢), and Angry (😡).
* **Interactive Comments:** Full nested commenting system.
* **24-Hour Stories:** Story tray with fullscreen viewer.
* **Konekta Watch:** Video feed for entertainment and tutorials.

### 4. 💬 Direct Messaging & Chat
* Real-time 1-on-1 private messaging between registered users.
* Instant message delivery with delivery checks (`✓✓`).
* Multimedia attachments (Photos, Audio notes, Quick reaction emojis).
* Searchable contact and active user directory.

### 5. 🔍 Universal Search Engine
* Live search modal accessible anywhere across the application.
* Real-time filtering by user names, email/phone, and posts.
* View profiles, send/cancel friend requests, or initiate direct chats straight from search results.

### 6. 👥 Communities: Pages & Groups
* Follow or create custom Pages (Community, Food, Travel).
* Join or create custom Groups (Tech, Buy & Sell, Riders).

### 7. 📶 Real-Time Offline Detection (PWA)
* Automatic network listener (`window.addEventListener('online'/'offline')`).
* Real-time status banner alerting the user when Wi-Fi or mobile data is disconnected and reconnecting seamlessly when back online.
* Service Worker caching for fast reloads.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 (Functional Components & Hooks) |
| **Language** | TypeScript (Strict Typing) |
| **Styling & Design** | Tailwind CSS v4 |
| **Build Tool** | Vite 8 |
| **Icons & Visuals** | Lucide React |
| **Production Server** | Node.js & Express.js |
| **Data Persistence** | Client Storage Layer (LocalStorage Engine, SQLite / SQL-ready) |
| **Mobile Integration** | Progressive Web App (PWA), Web App Manifest, Service Worker |
| **Hosting & CI/CD** | GitHub + Render.com |

---

## 📂 Project Structure

```text
konekta/
├── public/
│   ├── .well-known/
│   │   └── assetlinks.json         # Digital Asset Links for Android verification
│   ├── manifest.webmanifest        # PWA Manifest (Icons, theme, standalone mode)
│   └── sw.js                       # Service Worker for offline caching
├── src/
│   ├── components/
│   │   ├── auth/                   # Login, Register, Forgot Password
│   │   ├── chat/                   # Direct messaging & conversations
│   │   ├── common/                 # Header, Navigation, Modals, Install Guide
│   │   ├── feed/                   # Posts, Stories, Reactions, Comments
│   │   ├── friends/                # Friend requests & community members
│   │   ├── groups/                 # Community groups
│   │   ├── menu/                   # Settings, Theme toggle, Data saver
│   │   ├── pages/                  # Followable public pages
│   │   ├── profile/                # User profile, cover photo, timeline
│   │   ├── search/                 # Universal search modal
│   │   └── watch/                  # Video hub
│   ├── context/
│   │   └── AppContext.tsx          # Central application state & reactive hooks
│   ├── services/
│   │   ├── storage.ts              # Database service & data models
│   │   └── translations.ts         # Multi-language dictionary
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces and type definitions
│   ├── App.tsx                     # Main application entry component
│   └── main.tsx                    # React DOM root and service worker registration
├── server.js                       # Express.js production web server
├── render.yaml                     # Render infrastructure deployment blueprint
├── package.json                    # Project dependencies and scripts
├── vite.config.ts                  # Vite configuration
└── README.md                       # Documentation
```

---

## 💻 Local Development Setup

To run this project on your local machine:

### Prerequisites
* [Node.js](https://nodejs.org/) (Version 18 or higher recommended)
* `git` installed on your computer

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/konekta-app.git
   cd konekta-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Open your browser and navigate to `http://localhost:3000`.

---

## 🚀 How to Deploy to GitHub and Render

### Step 1: Push Code to GitHub

1. Create a new repository on [GitHub](https://github.com/new) named `konekta-app` (set to Public or Private).
2. In your local project terminal, run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Konekta Social Platform"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/konekta-app.git
   git push -u origin main
   ```

---

### Step 2: Deploy for Free on Render (Render.com)

1. Sign up or log in at [Render.com](https://render.com/).
2. Click **"New +"** in the top navigation bar and select **"Web Service"**.
3. Choose **"Build and deploy from a Git repository"** and click **Next**.
4. Connect your GitHub account and select your `konekta-app` repository.
5. Configure the deployment settings:
   * **Name:** `konekta-app`
   * **Region:** Singapore (or closest to you)
   * **Branch:** `main`
   * **Runtime:** `Node`
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `node server.js`
   * **Plan Type:** `Free`
6. Click **"Deploy Web Service"**.
7. Render will build the project and generate a live URL (e.g., `https://konekta-app.onrender.com`).

---

## 📱 Installing on Mobile Devices

Because Konekta implements the **Web App Manifest** and **Service Worker** standards:
* **Android (Chrome):** Open the site in Chrome -> Tap **(⋮)** -> Tap **"Add to Home screen"** or **"Install app"**.
* **iOS (Safari):** Open the site in Safari -> Tap the **Share icon** (`⎋`) -> Tap **"Add to Home Screen"**.

---

## 📄 Academic Integrity & License
This project was developed strictly with standard software engineering practices (React, TypeScript, CSS, Node.js). It does not contain automated AI bots or external generative AI model APIs.

Licensed under the [Apache-2.0 License](LICENSE).
