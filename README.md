# 🍿 PopcornPoll

PopcornPoll is a real-time movie and TV show polling platform powered by React, Vite, and Firebase.

## 🚀 Features
- **Search & Filter:** Title search and genre/rating filters using TMDB & OMDB APIs.
- **Real-Time Polls:** Create multi-option movie polls that sync instantly across clients.
- **Analytics:** Interactive genre distribution charts and vote tracking.
- **Resilient Voting:** Automatic offline/flaky connection fallback using local storage.

## 🛠️ Tech Stack
- React + Vite
- Firebase Firestore & Authentication
- Chart.js

---

## ⚙️ Quick Start

### 1. Install Dependencies
```bash
cd popcornpoll
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `popcornpoll/` folder and add:
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

---

## 🏗️ Deploy to Vercel
1. Set the **Root Directory** to `popcornpoll`.
2. Add your environment variables in your Vercel project settings.
3. Deploy!
