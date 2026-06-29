# 🍿 PopcornPoll (Frontend App)

This directory contains the React + Vite frontend application for PopcornPoll.

## 🚀 Features
- **Search & Filter:** Title search and genre/rating filters using TMDB & OMDB APIs.
- **Real-Time Polls:** Create multi-option movie polls that sync instantly across clients.
- **Resilient Voting:** Automatic offline/flaky connection fallback using local storage.

---

## ⚙️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in this directory and add:
```env
VITE_TMDB_API_KEY=your_tmdb_key
VITE_OMDB_API_KEY=your_omdb_key

VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Run Locally
```bash
npm run dev
```
Open `http://localhost:5173`.
