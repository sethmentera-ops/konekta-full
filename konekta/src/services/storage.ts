import {
  User,
  Post,
  Story,
  Message,
  Conversation,
  NotificationItem,
  VideoItem,
  ThemeMode,
  ReactionType,
  Comment,
  PageItem,
  GroupItem
} from '../types';
import { SupportedLanguage } from './translations';
import { FB_LITE_DEFAULT_AVATAR, getCleanAvatar, isAIAvatar } from '../components/common/Avatar';

const STORAGE_KEYS = {
  USERS: 'konekta_users_v3',
  CURRENT_USER: 'konekta_current_user_v3',
  POSTS: 'konekta_posts_v3',
  STORIES: 'konekta_stories_v3',
  MESSAGES: 'konekta_messages_v3',
  NOTIFICATIONS: 'konekta_notifications_v3',
  FRIEND_REQUESTS: 'konekta_friend_requests_v3',
  FRIENDS: 'konekta_friends_v3',
  THEME: 'konekta_theme_v2',
  DATA_SAVER: 'konekta_data_saver_v2',
  LANGUAGE: 'konekta_language_v2',
  PAGES: 'konekta_pages_v2',
  GROUPS: 'konekta_groups_v2',
};

const DUMMY_IDS = ['user_juan', 'user_maria', 'user_carlo', 'user_konekta_team', 'user_ana'];
const DUMMY_NAMES = ['juan', 'maria', 'carlo', 'konekta official', 'ana gomez', 'konekta'];

function isDummyUser(u: any): boolean {
  if (!u) return false;
  if (typeof u.id === 'string' && DUMMY_IDS.includes(u.id)) return true;
  const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim().toLowerCase();
  const fName = (u.firstName || '').trim().toLowerCase();
  if (DUMMY_NAMES.some(n => fullName.includes(n) || fName === n)) return true;
  return false;
}

// Automatically purge legacy dummy data and AI avatars from localStorage on load
function purgeDummyData() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    // 1. Clean users list - keep only real user-created accounts & reset AI avatars to FB Lite default silhouette
    const oldUserKeys = ['konekta_users_v1', 'konekta_users_v2', 'konekta_users_v3'];
    let preservedUsers: User[] = [];

    for (const k of oldUserKeys) {
      const raw = localStorage.getItem(k);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const real = parsed.filter(u => !isDummyUser(u));
            for (const ru of real) {
              if (!preservedUsers.some(ex => ex.id === ru.id || ex.emailOrPhone === ru.emailOrPhone)) {
                // Sanitize any legacy stock/AI avatar to authentic FB Lite silhouette
                preservedUsers.push({
                  ...ru,
                  avatar: getCleanAvatar(ru.avatar),
                  coverPhoto: ru.coverPhoto && ru.coverPhoto.includes('unsplash') ? '' : ru.coverPhoto
                });
              }
            }
          }
        } catch (_) {}
      }
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(preservedUsers));

    // 2. Clean current logged in user if dummy or has AI avatar
    const currentRaw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || localStorage.getItem('konekta_current_user_v2');
    if (currentRaw) {
      try {
        const cur = JSON.parse(currentRaw);
        if (isDummyUser(cur)) {
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
          localStorage.removeItem('konekta_current_user_v2');
        } else {
          cur.avatar = getCleanAvatar(cur.avatar);
          if (cur.coverPhoto && cur.coverPhoto.includes('unsplash')) {
            cur.coverPhoto = '';
          }
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(cur));
        }
      } catch (_) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    }

    // 3. Clean messages - delete any dummy chats
    const oldMsgKeys = ['konekta_messages_v1', 'konekta_messages_v2', 'konekta_messages_v3'];
    let cleanMsgMap: Record<string, Message[]> = {};
    for (const k of oldMsgKeys) {
      const raw = localStorage.getItem(k);
      if (raw) {
        try {
          const parsed: Record<string, Message[]> = JSON.parse(raw);
          Object.entries(parsed).forEach(([convId, msgs]) => {
            const hasDummyId = DUMMY_IDS.some(did => convId.includes(did));
            if (!hasDummyId && Array.isArray(msgs)) {
              const validMsgs = msgs.filter(m => !DUMMY_IDS.includes(m.senderId));
              if (validMsgs.length > 0) {
                cleanMsgMap[convId] = validMsgs;
              }
            }
          });
        } catch (_) {}
      }
    }
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(cleanMsgMap));

    // 4. Clean notifications
    const notifRaw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || localStorage.getItem('konekta_notifications_v2');
    if (notifRaw) {
      try {
        const notifs = JSON.parse(notifRaw);
        if (Array.isArray(notifs)) {
          const cleanNotifs = notifs.filter((n: any) => !isDummyUser({ firstName: n.actorName }));
          localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(cleanNotifs));
        }
      } catch (_) {}
    }

    // 5. Clean posts and sanitize avatars
    const postsRaw = localStorage.getItem(STORAGE_KEYS.POSTS) || localStorage.getItem('konekta_posts_v2');
    if (postsRaw) {
      try {
        const posts = JSON.parse(postsRaw);
        if (Array.isArray(posts)) {
          const cleanPosts = posts
            .filter((p: any) => !DUMMY_IDS.includes(p.userId))
            .map((p: any) => ({
              ...p,
              userAvatar: getCleanAvatar(p.userAvatar)
            }));
          localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(cleanPosts));
        }
      } catch (_) {}
    }

    // 6. Clean friends & friend requests
    localStorage.removeItem('konekta_friend_requests_v1');
    localStorage.removeItem('konekta_friend_requests_v2');
    localStorage.removeItem('konekta_friends_v1');
    localStorage.removeItem('konekta_friends_v2');
  } catch (e) {
    console.warn('Storage purge notice:', e);
  }
}

// Run purge immediately
purgeDummyData();

// Default registered users in database - clean state, only real accounts created by users exist
export const DEFAULT_USERS: User[] = [];

export const DEFAULT_POSTS: Post[] = [];

export const DEFAULT_STORIES: Story[] = [];

export const DEFAULT_VIDEOS: VideoItem[] = [
  {
    id: 'vid_1',
    title: 'Top 10 Pinakamagagandang Pasyalan sa Pilipinas ngayong 2026',
    authorName: 'Travel Pilipinas',
    authorAvatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%230284C7'/%3E%3Ctext x='50' y='65' font-size='42' text-anchor='middle'%3E✈️%3C/text%3E%3C/svg%3E",
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&auto=format&fit=crop&q=80',
    views: '128K views',
    timestamp: '3 araw ang nakalipas',
    likes: 4210,
    commentsCount: 312,
    category: 'foryou'
  },
  {
    id: 'vid_2',
    title: 'Mabilis at Masarap na Pork Sinigang Recipe (Step-by-step)',
    authorName: 'Lutong Bahay Express',
    authorAvatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%23EA580C'/%3E%3Ctext x='50' y='65' font-size='42' text-anchor='middle'%3E🍲%3C/text%3E%3C/svg%3E",
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
    views: '95K views',
    timestamp: '5 oras ang nakalipas',
    likes: 2150,
    commentsCount: 184,
    category: 'foryou'
  },
  {
    id: 'vid_3',
    title: 'OPM Acoustic Chill Session - Guitar Cover 🎸',
    authorName: 'Musika Pinoy',
    authorAvatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%237C3AED'/%3E%3Ctext x='50' y='65' font-size='42' text-anchor='middle'%3E🎸%3C/text%3E%3C/svg%3E",
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    views: '45K views',
    timestamp: '1 araw ang nakalipas',
    likes: 1890,
    commentsCount: 95,
    category: 'music'
  }
];

export const DEFAULT_PAGES: PageItem[] = [
  {
    id: 'page_1',
    name: 'Konekta Pilipinas',
    category: 'Opisyal na Komunidad',
    followersCount: 124500,
    avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%231877F2'/%3E%3Ctext x='50' y='68' font-size='56' font-weight='bold' fill='white' text-anchor='middle'%3EK%3C/text%3E%3C/svg%3E",
    coverPhoto: 'linear-gradient(135deg, #1877f2 0%, #0d5cb6 100%)',
    description: 'Ang sentro ng mga pinakabagong anunsyo, tampok, at kaganapan sa Konekta.',
    isFollowed: true,
  },
  {
    id: 'page_2',
    name: 'Pinoy Food & Street Bites',
    category: 'Pagkain at Inumin',
    followersCount: 78900,
    avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%23D97706'/%3E%3Ctext x='50' y='65' font-size='42' text-anchor='middle'%3E🍢%3C/text%3E%3C/svg%3E",
    coverPhoto: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    description: 'Araw-araw na mga masasarap na lutong bahay, meryenda, at sikat na street foods sa Pinas.',
    isFollowed: false,
  },
  {
    id: 'page_3',
    name: 'Byaheng Pilipinas Travel',
    category: 'Paglalakbay at Kalikasan',
    followersCount: 92400,
    avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%23059669'/%3E%3Ctext x='50' y='65' font-size='42' text-anchor='middle'%3E🏖️%3C/text%3E%3C/svg%3E",
    coverPhoto: 'linear-gradient(135deg, #059669 0%, #065f46 100%)',
    description: 'Mga gabay, larawan, at tips sa pinakamagagandang isla, bundok, at dagat sa Pilipinas.',
    isFollowed: false,
  }
];

export const DEFAULT_GROUPS: GroupItem[] = [
  {
    id: 'group_1',
    name: 'Konekta Developers & Creators PH',
    privacy: 'Pampubliko',
    membersCount: 14200,
    avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232563EB'/%3E%3Ctext x='50' y='65' font-size='38' font-family='monospace' font-weight='bold' fill='white' text-anchor='middle'%3E%26lt;/%26gt;%3C/text%3E%3C/svg%3E",
    coverPhoto: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
    description: 'Komunidad para sa mga tech enthusiasts, web developers, mobile builders, at digital creators.',
    isJoined: true,
  },
  {
    id: 'group_2',
    name: 'Buy, Sell & Trade Online Pinas',
    privacy: 'Pampubliko',
    membersCount: 85600,
    avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%2316A34A'/%3E%3Ctext x='50' y='65' font-size='42' text-anchor='middle'%3E🛍️%3C/text%3E%3C/svg%3E",
    coverPhoto: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    description: 'Ligtas na bilihan, palitan, at negosyong Pinoy. Walang hidden charges.',
    isJoined: false,
  },
  {
    id: 'group_3',
    name: 'Pinoy Motor & Car Riders Club',
    privacy: 'Pampubliko',
    membersCount: 32100,
    avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%23DC2626'/%3E%3Ctext x='50' y='65' font-size='42' text-anchor='middle'%3E🏍️%3C/text%3E%3C/svg%3E",
    coverPhoto: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
    description: 'Para sa mga mahilig sa rides, weekend trips, tips sa pag-maintain ng sasakyan at motor. Ride safe!',
    isJoined: false,
  }
];

export const DEFAULT_NOTIFICATIONS: NotificationItem[] = [];

export const DEFAULT_MESSAGES: Record<string, Message[]> = {};

// Storage helper functions
export const StorageService = {
  // Users
  getUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Storage read error:', e);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  },

  saveUsers(users: User[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Storage save error:', e);
    }
  },

  findUserByEmailOrPhone(identifier: string): User | undefined {
    const users = this.getUsers();
    const cleanId = identifier.trim().toLowerCase();
    return users.find(u => u.emailOrPhone.toLowerCase() === cleanId);
  },

  createUser(userData: Omit<User, 'id' | 'createdAt' | 'friendsCount'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...userData,
      avatar: getCleanAvatar(userData.avatar),
      coverPhoto: userData.coverPhoto || '',
      id: 'user_' + Date.now(),
      friendsCount: 0,
      isOnline: true,
      createdAt: new Date().toISOString(),
    };
    users.unshift(newUser);
    this.saveUsers(users);
    return newUser;
  },

  updateUser(updated: User): void {
    const users = this.getUsers().map(u => (u.id === updated.id ? updated : u));
    this.saveUsers(users);
    const current = this.getCurrentUser();
    if (current && current.id === updated.id) {
      this.setCurrentUser(updated);
    }
  },

  resetPassword(emailOrPhone: string, newPass: string): boolean {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.emailOrPhone.toLowerCase() === emailOrPhone.trim().toLowerCase());
    if (idx !== -1) {
      users[idx].password = newPass;
      this.saveUsers(users);
      return true;
    }
    return false;
  },

  // Current session - NO DEMO AUTO LOGIN
  getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading current user:', e);
    }
    // Return null so user is directed to login/signup page as requested
    return null;
  },

  setCurrentUser(user: User | null): void {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) {
      console.error('Error saving current user:', e);
    }
  },

  // Posts
  getPosts(): Post[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading posts:', e);
    }
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(DEFAULT_POSTS));
    return DEFAULT_POSTS;
  },

  savePosts(posts: Post[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    } catch (e) {
      console.error('Error saving posts:', e);
    }
  },

  createPost(newPostData: Omit<Post, 'id' | 'timestamp' | 'reactions' | 'userReactions' | 'comments' | 'sharesCount'>): Post {
    const posts = this.getPosts();
    const post: Post = {
      ...newPostData,
      id: 'post_' + Date.now(),
      timestamp: 'Kani-kanina lang',
      reactions: { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
      userReactions: {},
      comments: [],
      sharesCount: 0,
      privacy: newPostData.privacy || 'public'
    };
    posts.unshift(post);
    this.savePosts(posts);
    return post;
  },

  deletePost(postId: string): void {
    const posts = this.getPosts().filter(p => p.id !== postId);
    this.savePosts(posts);
  },

  toggleReaction(postId: string, userId: string, reaction: ReactionType): Post | null {
    const posts = this.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return null;

    if (!post.userReactions) post.userReactions = {};
    if (!post.reactions) post.reactions = { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 };

    const currentReaction = post.userReactions[userId];

    if (currentReaction === reaction) {
      post.reactions[reaction] = Math.max(0, (post.reactions[reaction] || 0) - 1);
      delete post.userReactions[userId];
    } else {
      if (currentReaction) {
        post.reactions[currentReaction] = Math.max(0, (post.reactions[currentReaction] || 0) - 1);
      }
      post.reactions[reaction] = (post.reactions[reaction] || 0) + 1;
      post.userReactions[userId] = reaction;
    }

    this.savePosts(posts);
    return post;
  },

  addComment(postId: string, user: User, text: string): Comment | null {
    const posts = this.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return null;

    const newComment: Comment = {
      id: 'c_' + Date.now(),
      postId,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userAvatar: user.avatar,
      text,
      timestamp: 'Kani-kanina lang',
      likes: 0
    };

    if (!post.comments) post.comments = [];
    post.comments.push(newComment);
    this.savePosts(posts);

    if (post.userId !== user.id) {
      this.addNotification({
        userId: post.userId,
        type: 'comment',
        actorName: `${user.firstName} ${user.lastName}`,
        actorAvatar: user.avatar,
        targetId: post.id,
        message: `nagkomento sa iyong post: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`
      });
    }

    return newComment;
  },

  incrementShare(postId: string): void {
    const posts = this.getPosts();
    const post = posts.find(p => p.id === postId);
    if (post) {
      post.sharesCount = (post.sharesCount || 0) + 1;
      this.savePosts(posts);
    }
  },

  // Stories
  getStories(): Story[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STORIES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading stories:', e);
    }
    localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(DEFAULT_STORIES));
    return DEFAULT_STORIES;
  },

  addStory(user: User, mediaUrl: string, caption?: string): Story {
    const stories = this.getStories();
    const newStory: Story = {
      id: 'story_' + Date.now(),
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userAvatar: user.avatar,
      mediaUrl,
      caption,
      timestamp: 'Kani-kanina lang'
    };
    stories.unshift(newStory);
    localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(stories));
    return newStory;
  },

  // Videos
  getVideos(): VideoItem[] {
    return DEFAULT_VIDEOS;
  },

  // Pages
  getPages(): PageItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAGES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn(e);
    }
    localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(DEFAULT_PAGES));
    return DEFAULT_PAGES;
  },

  toggleFollowPage(pageId: string): PageItem[] {
    const pages = this.getPages();
    const target = pages.find(p => p.id === pageId);
    if (target) {
      target.isFollowed = !target.isFollowed;
      target.followersCount += target.isFollowed ? 1 : -1;
      localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(pages));
    }
    return pages;
  },

  createPage(name: string, category: string, description: string): PageItem {
    const pages = this.getPages();
    const newPage: PageItem = {
      id: 'page_' + Date.now(),
      name,
      category,
      description,
      followersCount: 1,
      avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%231877F2'/%3E%3Ctext x='50' y='65' font-size='42' text-anchor='middle'%3E📄%3C/text%3E%3C/svg%3E",
      coverPhoto: 'linear-gradient(135deg, #1877f2 0%, #0d5cb6 100%)',
      isFollowed: true
    };
    pages.unshift(newPage);
    localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(pages));
    return newPage;
  },

  // Groups
  getGroups(): GroupItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GROUPS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn(e);
    }
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(DEFAULT_GROUPS));
    return DEFAULT_GROUPS;
  },

  toggleJoinGroup(groupId: string): GroupItem[] {
    const groups = this.getGroups();
    const target = groups.find(g => g.id === groupId);
    if (target) {
      target.isJoined = !target.isJoined;
      target.membersCount += target.isJoined ? 1 : -1;
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
    }
    return groups;
  },

  createGroup(name: string, privacy: 'Pampubliko' | 'Pribado', description: string): GroupItem {
    const groups = this.getGroups();
    const newGroup: GroupItem = {
      id: 'group_' + Date.now(),
      name,
      privacy,
      description,
      membersCount: 1,
      avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232563EB'/%3E%3Ctext x='50' y='65' font-size='42' text-anchor='middle'%3E👥%3C/text%3E%3C/svg%3E",
      coverPhoto: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
      isJoined: true
    };
    groups.unshift(newGroup);
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
    return newGroup;
  },

  // Notifications
  getNotifications(userId: string): NotificationItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (data) {
        const notifs: NotificationItem[] = JSON.parse(data);
        return notifs.filter(n => n.userId === userId);
      }
    } catch (e) {
      console.warn('Error reading notifications:', e);
    }
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
    return DEFAULT_NOTIFICATIONS.filter(n => n.userId === userId);
  },

  addNotification(item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>): NotificationItem {
    let notifs: NotificationItem[] = [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (data) notifs = JSON.parse(data);
    } catch (e) {
      console.warn(e);
    }
    const newNotif: NotificationItem = {
      ...item,
      id: 'notif_' + Date.now(),
      timestamp: 'Kani-kanina lang',
      isRead: false
    };
    notifs.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    return newNotif;
  },

  markAllNotificationsRead(userId: string): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (data) {
        const notifs: NotificationItem[] = JSON.parse(data);
        const updated = notifs.map(n => (n.userId === userId ? { ...n, isRead: true } : n));
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn(e);
    }
  },

  // Messages & Chat
  getMessagesMap(): Record<string, Message[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn(e);
    }
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(DEFAULT_MESSAGES));
    return DEFAULT_MESSAGES;
  },

  getConversationMessages(convId: string): Message[] {
    const map = this.getMessagesMap();
    return map[convId] || [];
  },

  sendMessage(convId: string, senderId: string, text: string, imageUrl?: string): Message {
    const map = this.getMessagesMap();
    if (!map[convId]) map[convId] = [];

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: Message = {
      id: 'm_' + Date.now(),
      conversationId: convId,
      senderId,
      text,
      imageUrl,
      timestamp: timeStr,
      isRead: true
    };

    map[convId].push(newMsg);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(map));
    return newMsg;
  },

  // Friends & Relationships
  getFriendsMap(): Record<string, string[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FRIENDS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn(e);
    }
    const defaults: Record<string, string[]> = {};
    localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(defaults));
    return defaults;
  },

  getFriends(userId: string): string[] {
    const map = this.getFriendsMap();
    return map[userId] || [];
  },

  getSentRequestsMap(): Record<string, string[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FRIEND_REQUESTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn(e);
    }
    const defaults: Record<string, string[]> = {};
    localStorage.setItem(STORAGE_KEYS.FRIEND_REQUESTS, JSON.stringify(defaults));
    return defaults;
  },

  getSentRequests(userId: string): string[] {
    const map = this.getSentRequestsMap();
    return map[userId] || [];
  },

  getFriendRequests(userId: string): User[] {
    const reqMap = this.getSentRequestsMap();
    const users = this.getUsers();
    const requesterIds = Object.keys(reqMap).filter(senderId => reqMap[senderId]?.includes(userId));
    return users.filter(u => requesterIds.includes(u.id));
  },

  sendFriendRequest(fromUserId: string, toUserId: string): void {
    const map = this.getSentRequestsMap();
    if (!map[fromUserId]) map[fromUserId] = [];
    if (!map[fromUserId].includes(toUserId)) {
      map[fromUserId].push(toUserId);
      localStorage.setItem(STORAGE_KEYS.FRIEND_REQUESTS, JSON.stringify(map));
    }
  },

  cancelFriendRequest(fromUserId: string, toUserId: string): void {
    const map = this.getSentRequestsMap();
    if (map[fromUserId]) {
      map[fromUserId] = map[fromUserId].filter(id => id !== toUserId);
      localStorage.setItem(STORAGE_KEYS.FRIEND_REQUESTS, JSON.stringify(map));
    }
  },

  acceptFriendRequest(userId: string, targetUserId: string): void {
    const reqMap = this.getSentRequestsMap();
    if (reqMap[targetUserId]) {
      reqMap[targetUserId] = reqMap[targetUserId].filter(id => id !== userId);
    }
    if (reqMap[userId]) {
      reqMap[userId] = reqMap[userId].filter(id => id !== targetUserId);
    }
    localStorage.setItem(STORAGE_KEYS.FRIEND_REQUESTS, JSON.stringify(reqMap));

    const friendsMap = this.getFriendsMap();
    if (!friendsMap[userId]) friendsMap[userId] = [];
    if (!friendsMap[targetUserId]) friendsMap[targetUserId] = [];

    if (!friendsMap[userId].includes(targetUserId)) friendsMap[userId].push(targetUserId);
    if (!friendsMap[targetUserId].includes(userId)) friendsMap[targetUserId].push(userId);

    localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(friendsMap));
  },

  unfriend(userId: string, targetUserId: string): void {
    const friendsMap = this.getFriendsMap();
    if (friendsMap[userId]) {
      friendsMap[userId] = friendsMap[userId].filter(id => id !== targetUserId);
    }
    if (friendsMap[targetUserId]) {
      friendsMap[targetUserId] = friendsMap[targetUserId].filter(id => id !== userId);
    }
    localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(friendsMap));
  },

  getFriendshipStatus(userId: string, targetUserId: string): 'self' | 'friends' | 'requested' | 'received' | 'none' {
    if (userId === targetUserId) return 'self';
    const friends = this.getFriends(userId);
    if (friends.includes(targetUserId)) return 'friends';
    const sent = this.getSentRequests(userId);
    if (sent.includes(targetUserId)) return 'requested';
    const receivedFromTarget = this.getSentRequests(targetUserId);
    if (receivedFromTarget.includes(userId)) return 'received';
    return 'none';
  },

  // Theme & Data Saver & Language
  getTheme(): ThemeMode {
    try {
      const theme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (theme === 'dark' || theme === 'light') return theme;
    } catch (e) {
      console.warn(e);
    }
    return 'light';
  },

  setTheme(theme: ThemeMode): void {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      console.warn(e);
    }
  },

  getDataSaver(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.DATA_SAVER) === 'true';
    } catch (e) {
      return false;
    }
  },

  setDataSaver(enabled: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DATA_SAVER, enabled ? 'true' : 'false');
    } catch (e) {
      console.warn(e);
    }
  },

  getLanguage(): SupportedLanguage {
    try {
      const lang = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as SupportedLanguage;
      if (lang && ['tl', 'en', 'ceb', 'ilo', 'es'].includes(lang)) {
        return lang;
      }
    } catch (e) {
      console.warn(e);
    }
    return 'tl'; // Default Tagalog
  },

  setLanguage(lang: SupportedLanguage): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    } catch (e) {
      console.warn(e);
    }
  }
};
