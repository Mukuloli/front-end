import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase config (values .env file se aa rahe hain)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId',
];

const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  const separator = '='.repeat(70);
  const hint = `\n${separator}\n❌ ERROR: Missing Firebase config values: ${missingKeys.join(', ')}.\n\n📝 SOLUTION: Create a .env file in the project root with:\nNEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here\nNEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com\nNEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id\nNEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com\nNEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id\nNEXT_PUBLIC_FIREBASE_APP_ID=your_app_id\nNEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id (optional)\n\n⚠️  IMPORTANT: After creating .env file, restart "npm run dev"\n${separator}\n`;
  // eslint-disable-next-line no-console
  console.error(hint);
  throw new Error(`Firebase configuration missing: ${missingKeys.join(', ')}. Create .env file in project root.`);
}

// Dev debug: Log Firebase config in terminal (server-side only)
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
  // eslint-disable-next-line no-console
  console.log('\n' + '='.repeat(60));
  // eslint-disable-next-line no-console
  console.log('🔥 Firebase ENV Config:');
  // eslint-disable-next-line no-console
  console.log('='.repeat(60));
  // eslint-disable-next-line no-console
  console.log('  API Key:', firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 20)}...` : '❌ MISSING');
  // eslint-disable-next-line no-console
  console.log('  Auth Domain:', firebaseConfig.authDomain || '❌ MISSING');
  // eslint-disable-next-line no-console
  console.log('  Project ID:', firebaseConfig.projectId || '❌ MISSING');
  // eslint-disable-next-line no-console
  console.log('  App ID:', firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 20)}...` : '❌ MISSING');
  // eslint-disable-next-line no-console
  console.log('  Storage Bucket:', firebaseConfig.storageBucket || '❌ MISSING');
  // eslint-disable-next-line no-console
  console.log('  Messaging Sender ID:', firebaseConfig.messagingSenderId || '❌ MISSING');
  // eslint-disable-next-line no-console
  console.log('  Measurement ID:', firebaseConfig.measurementId || '⚠️  Optional');
  // eslint-disable-next-line no-console
  console.log('='.repeat(60) + '\n');
}

// Initialize Firebase app (single instance)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth service + Google provider
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Firestore DB
const db = getFirestore(app);

export { app, auth, googleProvider, db };


