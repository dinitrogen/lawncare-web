# Lawncare

Angular 21 PWA for personal lawn care management. Tracks yard zones, products, treatments, equipment, soil tests, GDD (Growing Degree Days), and seasonal task plans.

Hosted on Firebase Hosting at https://lawncare-7fa77.web.app

## Architecture

```
Angular PWA (Firebase Hosting)
  ├── Firebase Auth (email/password login)
  ├── Firebase Storage (photo uploads)
  └── REST API via /api/** rewrite → Cloud Run (.NET API) → Firestore
```

The API handles all data operations. See [lawncare-api](../lawncare-api/) for the backend.

## Tech Stack

- Angular 21 with standalone components, signals, OnPush
- Angular Material 21 (M3 theming, green primary)
- Firebase Auth, Firebase Storage (photos only)
- Service Worker for offline/PWA support

## Local Development

**Prerequisites:** Node.js 20+, the .NET API running locally on port 5021.

```bash
npm install
npm start
```

App runs at http://localhost:4200

## Building

```bash
npm run build
```

Output: `dist/lawncare/browser/`

## Deploying

### Web App (Firebase Hosting)

```bash
npm run build
firebase deploy --only hosting
```

### API (Cloud Run)

See [lawncare-api README](../lawncare-api/README.md#deploying-to-cloud-run).

### Deploy Both

```bash
npm run deploy
```

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          # Auth route guard
│   │   ├── interceptors/    # JWT auth interceptor for API calls
│   │   ├── layout/          # App shell (sidenav, toolbar)
│   │   ├── models/          # TypeScript interfaces
│   │   └── services/        # HTTP services (auth, yard, products, etc.)
│   ├── features/
│   │   ├── auth/            # Login/register
│   │   ├── calculator/      # Lawn product calculator
│   │   ├── dashboard/       # Home dashboard
│   │   ├── equipment/       # Equipment + maintenance logs
│   │   ├── gdd/             # GDD tracker with chart
│   │   ├── products/        # Product inventory
│   │   ├── seasonal/        # Seasonal task checklist
│   │   ├── settings/        # User profile, GDD settings, Discord webhook
│   │   ├── treatments/      # Treatment log
│   │   └── yard/            # Yard zones with sketch canvas
│   └── shared/              # Confirm dialog, photo attachment, zone sketch
├── environments/            # Dev + prod config (apiUrl, Firebase config)
└── styles.scss              # Global styles + Material theme
```
