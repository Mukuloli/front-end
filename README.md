## Project Overview

Next.js front-end with:
- **Firebase Auth** (email/password + Google)
- **Firestore** user storage
- **RAG API** chat page at `/` (uses external API server)

## Tech Requirements

- **Node.js**: >= 18 (recommended LTS)
- **Package manager**: npm (comes with Node)
- **Next.js**: defined in `package.json`

Install dependencies:

```bash
npm install
```

## Environment Variables

Create a file named `.env` in the project root (this file is **ignored by git**):

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=yourKey
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=yourProject.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=yourProjectId
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=yourBucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=yourSenderId
NEXT_PUBLIC_FIREBASE_APP_ID=yourAppId
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=yourMeasurementId

# RAG API
NEXT_PUBLIC_RAG_API_URL=https://pdf-rag-2.onrender.com/ask
NEXT_PUBLIC_RAG_NAMESPACE=default
```

Then run the dev server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Git / Repo

Files that **should be committed**:
- Source code in `src/`
- `package.json`, `package-lock.json`, `next.config.mjs`, `eslint.config.mjs`, `jsconfig.json`, `README.md`

Files that **should NOT be committed** (already handled by `.gitignore`):
- `node_modules/`
- `.next/`
- `.env*` files (secrets)

## Vercel Deployment Requirements

1. Push this project to GitHub / GitLab / Bitbucket.
2. In Vercel:
   - Create new project → import this repo.
3. In project **Settings → Environment Variables**, add all the keys from `.env`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`, `NEXT_PUBLIC_RAG_API_URL`, `NEXT_PUBLIC_RAG_NAMESPACE`
4. Deploy (or let Vercel auto-deploy).

No extra `requirements.txt` is needed; dependencies are managed via `package.json`.
"# front-end" 
