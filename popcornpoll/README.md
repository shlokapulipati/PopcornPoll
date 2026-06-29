# 🍿 PopcornPoll

PopcornPoll is a premium, real-time movie & TV show discovery and polling platform. It allows communities, friend groups, and film enthusiasts to search for films, review consolidated ratings and meta-information from TMDB & OMDB, create multi-option voting polls with custom questions and deadlines, cast votes with real-time updates, and analyze aggregate metrics through interactive dashboards.

## 🚀 Key Features

### 🎬 1. TMDB & OMDB API Integration
- **Title Search with Autocomplete:** Debounced real-time search suggestions powered by TMDB.
- **IMDb Ratings & Metadata:** Merges TMDB discovery and poster assets with full plots, cast lists, runtimes, and IMDb ratings from OMDB API.
- **Advanced Filtering:** Query content by genre list, release year range, and minimum IMDb rating thresholds (6.0+, 7.0+, 8.0+).

### 🗳️ 2. Real-Time Polling System
- **Multi-Option Polls:** Build polls with 2 to 8 different movie options (not just binary yes/no choices).
- **Voter Deduplication:** Prevents duplicate voting using a robust transaction system checking unique user IDs (Google Auth or local anonymous devices).
- **Timeframes:** Configure custom deadlines or standard presets (1 hour, 24 hours, 7 days, never expires).
- **Real-Time Synchronisation:** Automatically updates option percentages and progress bars across all clients using Firestore listeners.

### 👥 3. Social Sharing & Profiles
- **Quick Links:** Unique, shareable short URLs for each poll.
- **One-Click Share:** Built-in modal templates for Twitter/X, WhatsApp, and Discord.
- **Authentication:** Supports Google login for cross-device access, plus automatic anonymous sign-in for seamless onboarding.
- **User Dashboard:** View your created polls, profiles, custom avatars, and voting statistics.

### 📊 4. Interactive Analytics Dashboard
- **Aggregate Stats:** Real-time totals for active polls, votes cast, and most popular categories.
- **Genre Distribution Chart:** Interactive Doughnut chart showing the percentage of genres represented in votes.
- **Voting Activity Timeline:** Bar chart depicting daily vote metrics to track community engagement over the last 7 active days.
- **Data Export:** Instantly download poll results in standardized **JSON** or **CSV** formats.

### 🎨 5. Premium UI/UX Features
- **Responsive Fluid Layouts:** Mobile-first design adapting to tablets (2 columns) and desktop monitors (3-4 columns).
- **Persisted Dark Mode:** Auto-detects preferences and persists selection using local storage.
- **Micro-Animations:** Clean CSS-animated progress bars, hover scales, and bouncy icons.
- **Loading Skeletons:** Provides visual feedback during API search fetches.
- **Global Toast Notifications:** Custom notification alerts for copy actions, voting successes, and warnings.

---

## 🛠️ Project Structure

```
popcornpoll/
├── .env                          # Root environment variables
├── .env.example                  # Environment template
├── .gitignore                    # Updated to ignore .env secrets
├── index.html                    # SEO tags & fonts
├── package.json                  # Dependencies (firebase, chart.js, react-router-dom)
└── src/
    ├── main.jsx                  # App bootstrapper (Providers, Router)
    ├── App.jsx                   # Central route configurations
    ├── firebase/
    │   └── config.js             # Firebase initialization
    ├── context/
    │   ├── ThemeContext.jsx      # Light/Dark theme provider
    │   ├── AuthContext.jsx       # Firebase Auth / Anonymous state
    │   └── ToastContext.jsx      # Custom notification provider
    ├── hooks/
    │   └── useMovies.js          # API querying & filters hook
    ├── utils/
    │   ├── api.js                # TMDB/OMDB API helpers + Session Cache
    │   ├── firebase.js           # Firestore CRUD transactions
    │   ├── helpers.js            # Formatters, Clipboard, Exporter helpers
    │   └── analytics.js          # Metrics calculations
    ├── pages/
    │   ├── Home.jsx              # Landing, hero, and category sliders
    │   ├── Browse.jsx            # Detailed search and filter panel
    │   ├── PollCreate.jsx        # Poll builder with AI templates
    │   ├── PollView.jsx          # Live voting and progress results
    │   ├── Dashboard.jsx         # Analytics charts
    │   ├── Profile.jsx           # Profiles and user histories
    │   └── NotFound.jsx          # 404 page
    └── components/               # Sub-component styles & views (Navbar, Poll, DarkMode...)
```

---

## ⚙️ Setup & Installation

### 1. Clone the Project & Install Dependencies
Navigate into the frontend project root and install packages:
```bash
cd popcornpoll
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):
```bash
cp .env.example .env
```
Ensure the values are set:
```env
VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_OMDB_API_KEY=your_omdb_api_key

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

### 3. Firebase Console Setup
1. **Create a Firebase Project** at [Firebase Console](https://console.firebase.google.com/).
2. **Enable Firestore Database** in test or production mode.
3. **Enable Authentication** and activate the **Google** & **Anonymous** providers under the sign-in methods tab.
4. **Deploy Firestore Rules:** Ensure your Firestore collection rules are configured to permit voter operations and protect polls from duplicate manipulation.

#### Firestore Security Rules template:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Poll documents rules
    match /polls/{pollId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      
      // Voters subcollection rules (limits voter duplicate manip)
      match /voters/{voterId} {
        allow read: if true;
        allow create: if request.auth != null && request.auth.uid == voterId;
      }
    }
    
    // User profile rules
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🚀 Running the App Locally

Start the local development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

## 🏗️ Production Build

Build static assets optimized for production deployment:
```bash
npm run build
```
The output will be created inside the `dist/` directory, ready to deploy to Vercel or Netlify.
