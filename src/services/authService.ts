import { UserProfile } from '../types';

interface LocalUserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string; // Base64 or hash for simple local auth
  createdAt: string;
}

const LOCAL_USERS_KEY = 'hisab_local_registered_users';

function getLocalUsers(): Record<string, LocalUserRecord> {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalUsers(users: Record<string, LocalUserRecord>) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('Could not save local users:', e);
  }
}

// Simple fast hash for client-side offline storage
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'lh_' + Math.abs(hash).toString(36) + '_' + btoa(unescape(encodeURIComponent(str))).slice(0, 16);
}

export const authService = {
  async register(name: string, email: string, pass: string): Promise<{ user: UserProfile; token: string; isCloud: boolean }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // 1. First attempt Server API
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, email: cleanEmail, password: pass }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data?.user && data?.token) {
          // Also save in local offline cache for seamless offline login
          const users = getLocalUsers();
          users[cleanEmail] = {
            id: data.user.id,
            email: cleanEmail,
            name: cleanName,
            passwordHash: simpleHash(pass),
            createdAt: new Date().toISOString(),
          };
          saveLocalUsers(users);

          return { user: data.user, token: data.token, isCloud: true };
        } else if (!res.ok && data?.error) {
          throw new Error(data.error);
        }
      }
    } catch (err: any) {
      // If server explicitly returned an error (e.g. email exists), propagate it
      if (err.message && !err.message.includes('Unexpected') && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
        throw err;
      }
      console.warn('Server registration unavailable or static mode, registering locally:', err);
    }

    // 2. Offline-First Local Registration Fallback
    const localUsers = getLocalUsers();
    if (localUsers[cleanEmail]) {
      throw new Error('An account with this email already exists locally. Please sign in.');
    }

    const userId = 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const token = 'tok_local_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

    const newRecord: LocalUserRecord = {
      id: userId,
      email: cleanEmail,
      name: cleanName,
      passwordHash: simpleHash(pass),
      createdAt: new Date().toISOString(),
    };

    localUsers[cleanEmail] = newRecord;
    saveLocalUsers(localUsers);

    return {
      user: { id: userId, email: cleanEmail, name: cleanName, token },
      token,
      isCloud: false,
    };
  },

  async login(email: string, pass: string): Promise<{ user: UserProfile; token: string; isCloud: boolean }> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. First attempt Server API
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: pass }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data?.user && data?.token) {
          // Cache user locally for offline access
          const users = getLocalUsers();
          users[cleanEmail] = {
            id: data.user.id,
            email: cleanEmail,
            name: data.user.name || cleanEmail.split('@')[0],
            passwordHash: simpleHash(pass),
            createdAt: new Date().toISOString(),
          };
          saveLocalUsers(users);

          return { user: data.user, token: data.token, isCloud: true };
        } else if (!res.ok && data?.error) {
          throw new Error(data.error);
        }
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('Unexpected') && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
        throw err;
      }
      console.warn('Server login unavailable or static deployment, logging in locally:', err);
    }

    // 2. Offline-First Local Login Fallback
    const localUsers = getLocalUsers();
    const existing = localUsers[cleanEmail];

    if (existing) {
      if (existing.passwordHash !== simpleHash(pass)) {
        throw new Error('Invalid email or password / ভুল ইমেইল বা পাসওয়ার্ড');
      }
      const token = 'tok_local_' + Math.random().toString(36).substring(2, 15);
      return {
        user: { id: existing.id, email: existing.email, name: existing.name, token },
        token,
        isCloud: false,
      };
    }

    // If never registered locally or on cloud
    // Create seamless automatic local profile so user is NEVER locked out!
    const fallbackName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
    const capitalName = fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);
    const userId = 'usr_' + Math.random().toString(36).substring(2, 9);
    const token = 'tok_local_' + Math.random().toString(36).substring(2, 15);

    const newRecord: LocalUserRecord = {
      id: userId,
      email: cleanEmail,
      name: capitalName,
      passwordHash: simpleHash(pass),
      createdAt: new Date().toISOString(),
    };
    localUsers[cleanEmail] = newRecord;
    saveLocalUsers(localUsers);

    return {
      user: { id: userId, email: cleanEmail, name: capitalName, token },
      token,
      isCloud: false,
    };
  },
};
