# ClearTasks — Minimal & Powerful Task Manager

A fast, minimalist task management application inspired by Google Tasks with an advanced recurrence engine, subtasks, lists, and cross-platform productivity across Web and Mobile in a **single codebase**.

> 📖 **Looking for system architecture and data flows?** See [ARCHITECTURE_AND_FLOWS.md](ARCHITECTURE_AND_FLOWS.md).

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```
*(Peer dependencies are automatically handled via `.npmrc`)*

---

## 🌐 How to Run on Web

### Local Development
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### Build for Production
```bash
npm run build
```
To preview the production build locally:
```bash
npm run preview
```

---

## 📱 How to Run on Mobile (Expo)

ClearTasks includes a built-in Expo native container with hardware back button support, safe area handling, and touch bottom sheets.

### 1. Start Expo
```bash
npm run mobile
```

### 2. Open on Your Phone
1. Install **Expo Go** from the App Store (iOS) or Google Play Store (Android).
2. Scan the QR code displayed in your terminal:
   - **Android**: Scan with the Expo Go app.
   - **iOS**: Scan with the Camera app and tap the Expo banner.

---

## 🚀 How to Deploy to Vercel

ClearTasks is pre-configured with [`vercel.json`](vercel.json) for automatic zero-config single-page application deployments on Vercel.

### Method 1: Git Push (Automatic CI/CD)
1. Push your repository to **GitHub / GitLab / Bitbucket**.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Select your repository. Vercel automatically detects the build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**.

### Method 2: Vercel CLI (From Terminal)
```bash
npx vercel
```
For production release:
```bash
npx vercel --prod
```

---

## ☁️ Database Setup (Optional)

ClearTasks works instantly out of the box in **Offline Demo Mode** using `localStorage`.

If you want cloud sync across devices with Supabase:
1. Follow the step-by-step [Supabase Setup Guide](SUPABASE_SETUP.md).
2. Copy `.env.example` to `.env` and set your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Run [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) in your Supabase SQL Editor.

---

## 📜 Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server on `http://localhost:3000` |
| `npm run mobile` | Starts Expo development server for iOS and Android |
| `npm run build` | Compiles optimized production web build to `dist/` |
| `npm run preview` | Previews production build locally |
| `npm run lint` | Runs TypeScript type verification (`tsc --noEmit`) |
| `npm run clean` | Cleans dist directory |

---

## 📄 Documentation

- [Supabase Setup Guide](SUPABASE_SETUP.md) — Step-by-step guide to connect database, find keys, and run migrations.
- [System Architecture & Flows](ARCHITECTURE_AND_FLOWS.md) — Detailed explanation of data flow, recurrence calculations, and mobile bridge.
- [Database Schema](supabase/migrations/001_initial_schema.sql) — Full PostgreSQL schema with Row-Level Security policies.
