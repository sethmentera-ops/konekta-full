import { User } from '../types';

// ---- Sessions: one login token per account, kept on this device -------------
const SESSIONS_KEY = 'konekta_sessions_v1';
type SessionMap = Record<string, string>;

function readSessions(): SessionMap {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

function writeSessions(map: SessionMap) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable */
  }
}

export const Sessions = {
  tokenFor(userId?: string | null): string | null {
    return userId ? readSessions()[userId] || null : null;
  },
  has(userId: string): boolean {
    return !!readSessions()[userId];
  },
  save(userId: string, token: string) {
    const m = readSessions();
    m[userId] = token;
    writeSessions(m);
  },
  remove(userId: string) {
    const m = readSessions();
    delete m[userId];
    writeSessions(m);
  },
};

// ---- Server calls ------------------------------------------------------------
export interface ApiResult<T = any> {
  ok: boolean;
  status: number;
  error?: string;
  data?: T;
}

async function call<T = any>(
  path: string,
  opts: { method?: string; body?: unknown; token?: string | null; timeoutMs?: number } = {}
): Promise<ApiResult<T>> {
  try {
    const r = await fetch(path, {
      method: opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      // the free Render server can take up to a minute to wake up
      signal: AbortSignal.timeout(opts.timeoutMs ?? 60000),
    });
    let json: any = null;
    try {
      json = await r.json();
    } catch {
      /* no body */
    }
    if (!r.ok || (json && json.ok === false)) {
      return { ok: false, status: r.status, error: json?.error || 'May error. Subukan ulit.' };
    }
    return { ok: true, status: r.status, data: json };
  } catch {
    return { ok: false, status: 0, error: 'Walang koneksyon sa server. Subukan ulit.' };
  }
}

type AuthData = { user: User; token: string };

export const Api = {
  signup: (payload: object) => call<AuthData>('/api/auth/signup', { method: 'POST', body: payload }),
  login: (identifier: string, password: string) =>
    call<AuthData>('/api/auth/login', { method: 'POST', body: { identifier, password } }),
  reset: (proof: string, newPassword: string) =>
    call<AuthData>('/api/auth/reset', { method: 'POST', body: { proof, newPassword } }),
  users: (token: string, since?: string) =>
    call<{ users: User[]; cursor: string | null }>(
      `/api/users${since ? `?since=${encodeURIComponent(since)}` : ''}`,
      { token }
    ),
  friends: (token: string) =>
    call<{ friends: string[]; sent: string[]; received: string[] }>('/api/friends', { token }),
  friendAction: (token: string, action: 'request' | 'cancel' | 'accept' | 'unfriend', body: object) =>
    call(`/api/friends/${action}`, { method: 'POST', token, body }),
  feed: (token: string, since?: string) =>
    call<{ posts: any[]; cursor: string | null }>(`/api/feed${since ? `?since=${encodeURIComponent(since)}` : ''}`, { token }),
  stories: (token: string) => call<{ stories: any[] }>('/api/stories', { token }),
  messages: (token: string, since?: string) =>
    call<{ messages: any[]; cursor: string | null }>(`/api/messages${since ? `?since=${encodeURIComponent(since)}` : ''}`, { token }),
  notifications: (token: string) => call<{ notifications: any[] }>('/api/notifications', { token }),
  post: (token: string, path: string, body: object = {}) => call(path, { method: 'POST', token, body }),
  updateMe: (token: string, fields: object) =>
    call<{ user: User }>('/api/me', { method: 'PUT', token, body: fields }),
};
