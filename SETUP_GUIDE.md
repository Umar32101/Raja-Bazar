# React Project Setup Guide

## ✨ What's Changed

Your vanilla HTML/JavaScript project has been converted to a modern React application with:

- **Vite** - Lightning-fast build tool and dev server
- **React 18** - Latest React with hooks
- **Firebase 10** - Real-time backend for auth & data
- **Context API** - Clean state management without Redux
- **Component Architecture** - Modular, reusable code
- **Same Design** - All original CSS and styling preserved

## 🎯 What to Do Next

### Step 1: Install Node Modules
```bash
npm install
```
This installs Vite, React, Firebase, and other dependencies.

### Step 2: Set Up Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Authentication** → Google Provider
4. Create a **Firestore Database** (production mode)
5. Create collection: `listings` (collection)
6. Copy your Firebase credentials

### Step 3: Configure Environment
1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your Firebase details in `.env`:
```env
VITE_FIREBASE_API_KEY=abc123...
VITE_FIREBASE_AUTH_DOMAIN=myapp.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=myapp-12345
VITE_FIREBASE_STORAGE_BUCKET=myapp.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123...
VITE_ADMIN_WHATSAPP=923001234567
```

### Step 4: Start Development Server
```bash
npm run dev
```
Open http://localhost:5173 in your browser.

## 🔧 Common Tasks

### Add a New Component
Create `src/components/MyComponent.jsx`:
```jsx
import React from 'react'

export function MyComponent() {
  return <div>My Component</div>
}
```

Then import in `src/App.jsx`.

### Access Auth State
```jsx
import { useAuth } from '../hooks/useAuth'

export function MyComponent() {
  const { currentUser, login, logout } = useAuth()
  
  return <div>{currentUser?.email}</div>
}
```

### Access Listings
```jsx
import { useListings } from '../hooks/useListings'

export function MyComponent() {
  const { listings, addListing, deleteListing } = useListings()
  
  return <div>{listings.length} listings</div>
}
```

### Add Global Toast Notification
```jsx
window.showToast('Success!', 'success')
window.showToast('Error!', 'error')
```

## 📁 File Structure

```
src/
├── App.jsx                    # Main app
├── main.jsx                   # Entry point
├── firebase.js                # Firebase config
├── components/                # UI components
│   ├── Navbar.jsx
│   ├── Hero.jsx
│   ├── Marketplace.jsx
│   ├── ListingCard.jsx
│   ├── PostForm.jsx
│   ├── PostFormSection.jsx
│   ├── HowItWorks.jsx
│   ├── Trust.jsx
│   ├── CTA.jsx
│   ├── Footer.jsx
│   └── Toast.jsx
├── context/                   # State management
│   ├── AuthContext.jsx
│   └── ListingsContext.jsx
├── hooks/                     # Custom hooks
│   ├── useAuth.js
│   └── useListings.js
└── styles/
    └── globals.css            # All site CSS
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```
Creates optimized `dist/` folder.

### Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Firebase Hosting
```bash
npm run build
firebase deploy
```

### Deploy to Netlify
```bash
npm run build
# Drag dist/ to Netlify
```

## 🐛 Debugging

### Enable React DevTools
Install "React Developer Tools" extension in Chrome/Firefox

### View Errors
- Check browser Console (F12)
- Check terminal output for build errors
- Verify `.env` file is correct

### Firebase Issues?
- Ensure Firestore rules allow public read/write
- Check Authentication providers are enabled
- Verify API keys are correct

## 📚 Useful Resources

- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Firebase Web Guide](https://firebase.google.com/docs/web/setup)
- [Context API Guide](https://react.dev/learn/passing-data-deeply-with-context)

## ❓ FAQ

**Q: Can I use it without Firebase?**
Yes! The app includes demo listings and works in demo mode without Firebase.

**Q: Can I add a database (SQL)?**
Yes! Replace Firebase with any backend (Node.js, Python, etc.)

**Q: How do I customize colors?**
Edit CSS variables in `src/styles/globals.css` (`:root` section)

**Q: Can I add more pages?**
Yes! Create components and add routing with React Router.

## 🎉 You're Ready!

Your React project is set up and ready to go. 

```bash
npm run dev     # Start development
npm run build   # Build for production
```

Happy coding! 🚀
