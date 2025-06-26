# ScholarMate Collaborative Research Platform

A real-time collaborative research platform built with Next.js and Firebase. Multiple users can highlight text simultaneously with anonymous authentication.

## What It Does

- Real-time text highlighting with multiple users
- Anonymous authentication (no sign-up required)
- User profiles with research backgrounds
- Color-coded highlights per user
- Admin controls for session management

## Tech Stack

- **Frontend**: Next.js, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Functions)

## Quick Start

```bash
npm install
npm run dev
```

## Firebase Setup & Deployment

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project
3. Enable Anonymous Authentication in Authentication > Sign-in method
4. Create Firestore database in test mode

### 2. Configure Environment
Create `.env.local` with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Deploy Security Rules
Copy `firestore.rules` to your Firebase project's Firestore rules. These rules allow:
- Authenticated users to read public data
- Users to create/edit their own highlights
- Users to manage their own profiles

### 4. Deploy Cloud Functions (Optional)
For automatic cleanup of inactive users:

```bash
npm install -g firebase-tools
firebase login
cd functions
npm install
firebase deploy --only functions
```

### 5. Update Firebase Config
The app uses these Firestore collections:
- `/artifacts/{appId}/public/data/highlights/` - User highlights
- `/artifacts/{appId}/public/data/users/` - User profiles

Update `appId` in your Firebase configuration if needed.

## Deployment

- **Frontend**: Deploy to Vercel (automatic with GitHub integration)
- **Backend**: Firebase handles Firestore and Functions automatically
- **Environment**: Add Firebase config to Vercel environment variables
