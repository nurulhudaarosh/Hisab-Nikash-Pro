import { UserProfile } from '../types';

interface LocalUserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
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

// Deterministic offline ID generator based on email so offline-to-online remains consistent
function generateDeterministicUserId(email: string): string {
  let hash = 0;
  const clean = email.trim().toLowerCase();
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  return 'usr_' + Math.abs(hash).toString(36) + '_' + btoa(unescape(encodeURIComponent(clean))).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return 'lh_' + Math.abs(hash).toString(36) + '_' + btoa(unescape(encodeURIComponent(str))).slice(0, 16);
}

export const authService = {
  async register(name: string, email: string, pass: string): Promise<{ user: UserProfile; token: string; isCloud: boolean }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName || !cleanEmail || !pass) {
      throw new Error('Please provide name, email, and password / নাম, ইমেইল এবং পাসওয়ার্ড আবশ্যক');
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, email: cleanEmail, password: pass }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await res.json().catch(() => null);
      } else {
        const text = await res.text().catch(() => '');
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            // text response
          }
        }
      }

      if (res.ok && data?.user && data?.token) {
        return { user: data.user, token: data.token, isCloud: true };
      } else {
        const errorMsg = data?.error || `Registration failed (HTTP ${res.status}). Please verify MongoDB connection.`;
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const isNetworkError =
        err.name === 'TypeError' ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError') ||
        err.message?.includes('Load failed');

      if (isNetworkError) {
        throw new Error('Could not connect to the cloud server / সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। অনুগ্রহ করে ইন্টারনেট কানেকশন বা Vercel ডেটাবেজ সেটিংস চেক করুন।');
      }
      throw err;
    }
  },

  async login(email: string, pass: string): Promise<{ user: UserProfile; token: string; isCloud: boolean }> {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !pass) {
      throw new Error('Email and password are required / ইমেইল এবং পাসওয়ার্ড আবশ্যক');
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: pass }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await res.json().catch(() => null);
      } else {
        const text = await res.text().catch(() => '');
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            // text response
          }
        }
      }

      if (res.ok && data?.user && data?.token) {
        return { user: data.user, token: data.token, isCloud: true };
      } else {
        const errorMsg = data?.error || `Sign in failed (HTTP ${res.status}). Please check credentials or MongoDB connection.`;
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const isNetworkError =
        err.name === 'TypeError' ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError') ||
        err.message?.includes('Load failed');

      if (isNetworkError) {
        throw new Error('Could not connect to cloud authentication server / ক্লাউড সার্ভারের সাথে কানেক্ট করা যাচ্ছে না। ইন্টারনেট কানেকশন চেক করুন।');
      }
      throw err;
    }
  },
};
