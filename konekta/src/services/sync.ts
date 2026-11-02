import { User, Post, Story, Message, NotificationItem } from '../types';
import { StorageService } from './storage';
import { Api, Sessions } from './api';

const DIR_MARK = 'konekta_dir_v4';
const DIR_SINCE = 'konekta_dir_since_v4';
const FEED_SINCE = 'konekta_feed_since_v5';
const MSG_SINCE = 'konekta_msg_since_v5';

const lsGet = (k: string) => {
  try { return localStorage.getItem(k) || undefined; } catch { return undefined; }
};
const lsSet = (k: string, v: string | null) => {
  try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch { /* ignore */ }
};

// "Kani-kanina lang", "5 min", "2 oras", "3 araw" ...
export function relTime(iso?: string): string {
  if (!iso) return 'Kani-kanina lang';
  const sec = (Date.now() - new Date(iso).getTime()) / 1000;
  if (!(sec >= 0) || sec < 60) return 'Kani-kanina lang';
  if (sec < 3600) return `${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} oras`;
  if (sec < 604800) return `${Math.floor(sec / 86400)} araw`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const convIdOf = (a: string, b: string) => `conv_${[a, b].sort().join('_')}`;

const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Pulls the shared user directory and this user's friend graph from the server
 * into the local cache that the rest of the app reads from.
 */
export async function syncFromServer(
  meId: string
): Promise<{ changed: boolean; unauthorized: boolean }> {
  const token = Sessions.tokenFor(meId);
  if (!token) return { changed: false, unauthorized: true };

  const full = localStorage.getItem(DIR_MARK) !== '1';
  const since = full ? undefined : localStorage.getItem(DIR_SINCE) || undefined;

  const [u, f] = await Promise.all([Api.users(token, since), Api.friends(token)]);
  if (u.status === 401 || f.status === 401) return { changed: false, unauthorized: true };

  let changed = false;

  if (u.ok && u.data) {
    const byId = new Map<string, User>();
    if (!full) StorageService.getUsers().forEach((x) => byId.set(x.id, x));

    for (const incoming of u.data.users) {
      const old = byId.get(incoming.id);
      let emailOrPhone = incoming.emailOrPhone;
      // keep the full contact we already know (own accounts) instead of the masked one
      if (old && !old.emailOrPhone.includes('*') && emailOrPhone.includes('*')) {
        emailOrPhone = old.emailOrPhone;
      }
      const merged: User = { ...old, ...incoming, emailOrPhone, friendsCount: old?.friendsCount ?? 0 };
      if (!old || !sameJson(old, merged)) changed = true;
      byId.set(incoming.id, merged);
    }

    if (full || changed) {
      StorageService.saveUsers(Array.from(byId.values()));
      changed = true;
    }
    try {
      localStorage.setItem(DIR_MARK, '1');
      if (u.data.cursor) localStorage.setItem(DIR_SINCE, u.data.cursor);
    } catch {
      /* ignore */
    }
  }

  if (f.ok && f.data) {
    const { friends, sent, received } = f.data;

    const oldFriends = StorageService.getFriendsMap();
    const newFriends = { ...oldFriends, [meId]: friends };
    if (!sameJson([...(oldFriends[meId] || [])].sort(), [...friends].sort())) {
      lsSet(FEED_SINCE, null); // new friend => their friends-only posts must be loaded
    }
    if (!sameJson(oldFriends, newFriends)) {
      StorageService.setFriendsMap(newFriends);
      changed = true;
    }

    const oldSent = StorageService.getSentRequestsMap();
    const newSent: Record<string, string[]> = {};
    for (const [from, tos] of Object.entries(oldSent)) {
      if (from === meId) continue;
      const kept = tos.filter((id) => id !== meId);
      if (kept.length) newSent[from] = kept;
    }
    newSent[meId] = sent;
    for (const from of received) newSent[from] = [...(newSent[from] || []), meId];
    if (!sameJson(oldSent, newSent)) {
      StorageService.setSentRequestsMap(newSent);
      changed = true;
    }

    const users = StorageService.getUsers();
    const idx = users.findIndex((x) => x.id === meId);
    if (idx !== -1 && users[idx].friendsCount !== friends.length) {
      users[idx] = { ...users[idx], friendsCount: friends.length };
      StorageService.saveUsers(users);
      changed = true;
    }
  }

  // ---- posts, stories, chat, notifications ---------------------------------
  try {
    if (await syncContent(meId, token)) changed = true;
  } catch (e) {
    console.warn('content sync failed', e);
  }

  return { changed, unauthorized: false };
}

async function syncContent(meId: string, token: string): Promise<boolean> {
  const feedSince = lsGet(FEED_SINCE);
  const msgSince = lsGet(MSG_SINCE);
  const [fd, st, ms, nt] = await Promise.all([
    Api.feed(token, feedSince),
    Api.stories(token),
    Api.messages(token, msgSince),
    Api.notifications(token),
  ]);

  const dir = new Map(StorageService.getUsers().map((u) => [u.id, u]));
  const nameOf = (id: string, fallback = 'Konekta User') => {
    const u = dir.get(id);
    return u ? `${u.firstName} ${u.lastName}` : fallback;
  };
  const avatarOf = (id: string) => dir.get(id)?.avatar ?? '';
  let changed = false;

  // Posts
  if (fd.ok && fd.data) {
    const full = !feedSince;
    const byId = new Map<string, Post>();
    if (!full) StorageService.getPosts().forEach((p) => byId.set(p.id, p));
    for (const sp of fd.data.posts) {
      if (sp.deleted) byId.delete(sp.id);
      else byId.set(sp.id, sp as Post);
    }
    const posts = Array.from(byId.values())
      .map((p: any) => ({
        ...p,
        userName: nameOf(p.userId, p.userName),
        userAvatar: avatarOf(p.userId) || p.userAvatar || '',
        timestamp: relTime(p.createdAt),
        comments: (p.comments || []).map((c: any) => ({
          ...c,
          userName: nameOf(c.userId, c.userName),
          userAvatar: avatarOf(c.userId) || c.userAvatar || '',
          timestamp: relTime(c.createdAt),
        })),
      }))
      .sort((a: any, b: any) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    if (!sameJson(posts, StorageService.getPosts())) {
      StorageService.savePosts(posts as Post[]);
      changed = true;
    }
    lsSet(FEED_SINCE, fd.data.cursor || feedSince || null);
  }

  // Stories
  if (st.ok && st.data) {
    const old = StorageService.getStories();
    const viewed = new Set(old.filter((x) => x.isViewed).map((x) => x.id));
    const stories: Story[] = st.data.stories.map((x: any) => ({
      id: x.id,
      userId: x.userId,
      userName: nameOf(x.userId),
      userAvatar: avatarOf(x.userId),
      mediaUrl: x.mediaUrl,
      caption: x.caption,
      timestamp: relTime(x.createdAt),
      createdAt: x.createdAt,
      isViewed: viewed.has(x.id),
    }));
    if (!sameJson(stories, old)) {
      StorageService.saveStories(stories);
      changed = true;
    }
  }

  // Chat
  if (ms.ok && ms.data) {
    const full = !msgSince;
    const map: Record<string, Message[]> = full ? {} : StorageService.getMessagesMap();
    const upsert = (m: any) => {
      const other = m.senderId === meId ? m.recipientId : m.senderId;
      const convId = convIdOf(meId, other);
      const msg: Message = {
        id: m.id,
        conversationId: convId,
        senderId: m.senderId,
        text: m.text,
        imageUrl: m.imageUrl,
        timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: m.createdAt,
        isRead: m.senderId === meId ? true : !!m.isRead,
      };
      const list = (map[convId] = map[convId] || []);
      const i = list.findIndex((x) => x.id === m.id);
      if (i === -1) list.push(msg);
      else list[i] = msg;
    };
    ms.data.messages.forEach(upsert);
    Object.values(map).forEach((list) => list.sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || ''))));
    if (!sameJson(map, StorageService.getMessagesMap())) {
      StorageService.saveMessagesMap(map);
      changed = true;
    }
    lsSet(MSG_SINCE, ms.data.cursor || msgSince || null);
  }

  // Notifications (replace this user's entries with the server's)
  if (nt.ok && nt.data) {
    const mine: NotificationItem[] = nt.data.notifications.map((n: any) => ({
      id: n.id,
      userId: n.userId,
      type: n.type,
      actorName: n.actorName,
      actorAvatar: n.actorId ? avatarOf(n.actorId) : '',
      targetId: n.targetId,
      message: n.message,
      timestamp: relTime(n.createdAt),
      createdAt: n.createdAt,
      isRead: n.isRead,
    }));
    const all = StorageService.getAllNotifications();
    const others = all.filter((n) => n.userId !== meId);
    const before = all.filter((n) => n.userId === meId);
    if (!sameJson(before, mine)) {
      StorageService.saveAllNotifications([...mine, ...others]);
      changed = true;
    }
  }

  return changed;
}
