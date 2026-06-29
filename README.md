# 🍿 PopcornPoll

PopcornPoll is a premium, real-time movie & TV show discovery and polling platform. It allows communities, friend groups, and film enthusiasts to search for films, review consolidated ratings and meta-information from TMDB & OMDB, create multi-option voting polls with custom questions and deadlines, cast votes with real-time updates, and analyze aggregate metrics through interactive dashboards.

---

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
- **Resilience Engine:** If Firestore is offline or slow, the app automatically switches to local storage tracking to keep the voting flow working without popups or freezes.

### 👥 3. Social Sharing & Profiles
- **Quick Links:** Unique, shareable short URLs for each poll.
- **One-Click Share:** Built-in modal templates for Twitter/X, WhatsApp, and Discord.
- **Authentication:** Supports Google login for cross-device access, plus automatic anonymous sign-in for seamless onboarding.
- **User Dashboard:** View your created polls, profiles, custom avatars, and voting statistics.

### 📊 4. Interactive Analytics Dashboard
- **Aggregate Stats:** Real-time totals for active polls, votes cast, and most popular categories.
- **Genre Distribution Chart:** Interactive Doughnut chart showing the percentage of genres represented in votes.
- **Data Export:** Instantly download poll results in standardized **JSON** or **CSV** formats.

### 🎨 5. Premium UI/UX Features
- **Responsive Fluid Layouts:** Mobile-first design adapting to tablets (2 columns) and desktop monitors (3-4 columns).
- **Persisted Dark Mode:** Auto-detects preferences and persists selection using local storage.
- **Micro-Animations:** Clean CSS-animated progress bars, hover scales, and bouncy icons.
- **Loading Skeletons:** Provides visual feedback during API search fetches.
- **Global Toast Notifications:** Custom notification alerts for copy actions, voting successes, and warnings.

---

## 🛠️ Tech Stack
- **Frontend Framework:** React + Vite
- **Database & Auth:** Firebase Firestore & Firebase Authentication
- **Charts:** Chart.js & react-chartjs-2
- **Styling:** Vanilla CSS (Glassmorphism design system)
- **APIs:** TMDB API (Discovery) & OMDB API (IMDb Ratings)

---

## ⚙️ Setup & Installation

The main React application resides in the `popcornpoll/` subdirectory.

### 1. Clone the Project & Install Dependencies
Navigate into the `popcornpoll` folder and install the packages:
```bash
cd popcornpoll
npm install
```

### 2. Configure Environment Variables
Create a `.env` file inside the `popcornpoll` directory (based on `.env.example`):
```bash
cp .env.example .env
```
Open `.env` and fill in your API credentials:
```env
# TMDB API
VITE_TMDB_API_KEY=your_tmdb_api_key

# OMDB API
VITE_OMDB_API_KEY=your_omdb_api_key

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

### 3. Firebase Console Setup
1. **Create a Firebase Project** at the [Firebase Console](https://console.firebase.google.com/).
2. **Enable Firestore Database** in test or production mode.
3. **Enable Authentication** and activate the **Google** & **Anonymous** providers under the sign-in methods tab.
4. **Deploy Firestore Rules:** Ensure your Firestore collection rules are configured to permit voter operations and protect polls from duplicate manipulation.

#### Firestore Security Rules Template:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Poll documents rules
    match /polls/{pollId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      
      // Voters subcollection rules (limits voter duplicate manipulation)
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
cd popcornpoll
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🏗️ Production & Vercel Deployment

To deploy this project to Vercel:

1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Import the project.
3. Set the **Framework Preset** to **Vite**.
4. Set the **Root Directory** to `popcornpoll`.
5. Add the environment variables from your `.env` file under the project settings on Vercel:
   - `VITE_TMDB_API_KEY`
   - `VITE_OMDB_API_KEY`
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
6. Deploy! Vercel will automatically build and host the application, and the `vercel.json` already present in the folder will handle client routing redirects.
