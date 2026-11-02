import { User } from '../types';
import { StorageService } from './storage';
import { Api, Sessions } from './api';

const DIR_MARK = 'konekta_dir_v4';
const DIR_SINCE = 'konekta_dir_since_v4';

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

  return { changed, unauthorized: false };
}
