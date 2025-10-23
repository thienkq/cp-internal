# Technical Implementation Details: Self-Coded Google OAuth

## 🔧 Code Examples

### 1. Session Utilities (`lib/session-utils.ts`)

```typescript
import jwt from 'jsonwebtoken';
import { getDb } from '@/db';
import { sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function createSession(payload: JWTPayload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  
  const db = getDb();
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour
  
  await db.insert(sessions).values({
    user_id: payload.userId,
    token,
    refresh_token: refreshToken,
    expires_at: expiresAt.toISOString(),
  });
  
  return { token, refreshToken };
}

export async function verifySession(token: string): Promise<JWTPayload | null> {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return payload;
  } catch (error) {
    return null;
  }
}

export async function deleteSession(userId: string) {
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.user_id, userId));
}
```

### 2. Google OAuth Handler (`app/api/auth/google/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSession } from '@/lib/session-utils';

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error('No payload');

    const { sub: googleId, email, name, picture } = payload;

    // Create or update user
    const db = getDb();
    let user = await db.select().from(users).where(eq(users.email, email!));

    if (user.length === 0) {
      await db.insert(users).values({
        id: googleId,
        email,
        full_name: name,
        role: 'employee',
      });
    }

    // Create session
    const { token } = await createSession({
      userId: googleId,
      email: email!,
      role: user[0]?.role || 'employee',
    });

    // Set secure cookie
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
    });

    return response;
  } catch (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(new URL('/auth/login?error=oauth_failed', request.url));
  }
}
```

### 3. Callback Route (`app/auth/google/callback/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${error}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/auth/login?error=no_code', request.url)
    );
  }

  // Redirect to API route to handle token exchange
  return NextResponse.redirect(
    new URL(`/api/auth/google?code=${code}&state=${state}`, request.url)
  );
}
```

### 4. Updated Middleware (`middleware.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/session-utils';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  // Public routes
  if (
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/auth')
  ) {
    return NextResponse.next();
  }

  // Protected routes
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  const payload = await verifySession(token);
  if (!payload) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### 5. Updated Auth Utils (`lib/auth-utils.ts`)

```typescript
import { cookies } from 'next/headers';
import { verifySession } from './session-utils';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return null;

  const payload = await verifySession(token);
  if (!payload) return null;

  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.userId));

  return user || null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
```

### 6. Updated GoogleSignInButton

```typescript
'use client'

export default function GoogleSignInButton() {
  const handleSignIn = async () => {
    const state = Math.random().toString(36).substring(7);
    const scope = 'openid email profile';
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
      state,
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  return (
    <button onClick={handleSignIn}>
      Sign in with Google
    </button>
  );
}
```

---

## 🗄️ Database Schema Addition

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  refresh_token TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

---

## 🔐 Environment Variables

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars

# Database (existing)
DATABASE_URL=postgresql://...
```

---

## 📦 Dependencies to Add

```json
{
  "dependencies": {
    "google-auth-library": "^9.0.0",
    "jsonwebtoken": "^9.0.0"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.0.0"
  }
}
```

---

## ✅ Testing Checklist

- [ ] Google OAuth login works
- [ ] User created in database
- [ ] Session token generated
- [ ] Cookie set correctly
- [ ] Middleware validates token
- [ ] Protected routes accessible
- [ ] Logout clears session
- [ ] Token refresh works
- [ ] Expired tokens rejected
- [ ] CSRF protection works

