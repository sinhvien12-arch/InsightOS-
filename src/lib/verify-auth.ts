// Server-side Firebase ID-token verification (no firebase-admin / service account needed).
// Validates the JWT signature against Google's public keys and enforces the org domain.

import type { NextRequest } from 'next/server'
import { createRemoteJWKSet, jwtVerify } from 'jose'

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? ''
const ALLOWED_DOMAIN = '@hsb.edu.vn'

// Google's public keys for Firebase Secure Token (cached internally by jose).
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
)

export interface AuthedUser { uid: string; email: string }

/** Returns the verified user, or null if the request is unauthenticated/invalid. */
export async function verifyRequest(req: NextRequest): Promise<AuthedUser | null> {
  if (!PROJECT_ID) return null
  const header = req.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
    })
    const email = typeof payload.email === 'string' ? payload.email : ''
    if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) return null
    return { uid: String(payload.sub), email }
  } catch {
    return null
  }
}
