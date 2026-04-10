# Raja Bazar — React Conversion

A modern React conversion of the PUBG gaming marketplace using Vite, Firebase, and Context API for state management.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase
1. Copy `.env.example` to `.env`
2. Add your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_ADMIN_WHATSAPP=923001234567
```

### 3. Start Development Server
```bash
npm run dev
```
The app will open at `http://localhost:5173`

## 📦 Build for Production
```bash
npm run build
```

This generates a `dist/` folder ready for deployment.

## 🏗️ Project Structure

```
src/
├── components/          # React components
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
├── context/            # Context API providers
│   ├── AuthContext.jsx
│   └── ListingsContext.jsx
├── hooks/              # Custom React hooks
│   ├── useAuth.js
│   └── useListings.js
├── styles/
│   └── globals.css    # Global styles (unchanged from original)
├── firebase.js        # Firebase initialization
├── App.jsx            # Main app component
└── main.jsx           # Entry point
```

## 🔑 Key Features

✅ **Authentication** - Google Sign-In via Firebase Auth
✅ **Listings Management** - Create, read, delete listings with Firestore
✅ **Real-time Updates** - Firestore queries with live data sync
✅ **Context API** - Centralized state management for Auth & Listings
✅ **Responsive Design** - Mobile-first approach with Tailwind CSS
✅ **Demo Mode** - Works without Firebase configuration (demo data)
✅ **Toast Notifications** - User feedback for actions

## 🔄 State Management

### AuthContext
- Manages user authentication state
- Provides login/logout functions
- Shares Firebase references

### ListingsContext
- Stores all marketplace listings
- Handles add, delete, load operations
- Falls back to demo data if Firebase unavailable

## 📝 Environment Variables

All configuration is done through environment variables in `.env`:

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_ADMIN_WHATSAPP` | Admin WhatsApp number |

## 🎨 Styling

- Original CSS design preserved in `src/styles/globals.css`
- CSS Variables for theming (--bg, --accent, --gold, etc.)
- Responsive breakpoints for mobile/desktop
- Smooth animations and transitions

## 🚀 Deployment

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### Vercel
```bash
npm run build
# Connect GitHub repo to Vercel
```

### Netlify
```bash
npm run build
# Drag & drop dist/ folder to Netlify
```

## 🐛 Troubleshooting

**"Firebase not configured" error?**
- Add valid Firebase credentials to `.env`
- Or use demo mode (default)

**"Build failing with module errors?"**
- Run `npm install` again
- Check Node version (14+)

**"WhatsApp links not working?"**
- Ensure `VITE_ADMIN_WHATSAPP` is in correct format (923001234567)

## 📄 License

© 2025 Raja Bazar. All rights reserved.
