import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

// Only initialize if running in the browser AND credentials are present
const hasCredentials = typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY

const app = hasCredentials
  ? (getApps().length ? getApps()[0] : initializeApp(firebaseConfig))
  : null

export const auth     = (app ? getAuth(app) : null) as ReturnType<typeof getAuth>
export const provider = new GoogleAuthProvider()
