import { SupportedLanguage } from '../services/translations';

export type ThemeMode = 'light' | 'dark';

export type Language = SupportedLanguage;

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

export interface ReactionDetail {
  userId: string;
  userName: string;
  type: ReactionType;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: string;
  likes: number;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userHandle?: string;
  isVerified?: boolean;
  content: string;
  imageUrl?: string;
  backgroundColor?: string;
  feeling?: string;
  location?: string;
  timestamp: string;
  reactions: Record<ReactionType, number>;
  userReactions: Record<string, ReactionType>;
  comments: Comment[];
  sharesCount: number;
  privacy: 'public' | 'friends' | 'only_me';
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl: string;
  caption?: string;
  timestamp: string;
  isViewed?: boolean;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  emailOrPhone: string;
  password?: string;
  avatar: string;
  coverPhoto?: string;
  bio?: string;
  gender: 'lalaki' | 'babae' | 'iba' | 'male' | 'female' | 'other';
  birthday?: string;
  location?: string;
  work?: string;
  friendsCount?: number;
  isOnline?: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  imageUrl?: string;
  audioDuration?: number;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'friend_request' | 'friend_accept' | 'share' | 'system';
  actorName: string;
  actorAvatar: string;
  targetId?: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface VideoItem {
  id: string;
  title: string;
  authorName: string;
  authorAvatar: string;
  videoUrl: string;
  thumbnailUrl: string;
  views: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
  commentsCount: number;
  category: 'foryou' | 'news' | 'music' | 'funny' | 'gaming';
}

export interface PageItem {
  id: string;
  name: string;
  category: string;
  followersCount: number;
  avatar: string;
  coverPhoto: string;
  description: string;
  isFollowed?: boolean;
}

export interface GroupItem {
  id: string;
  name: string;
  privacy: 'Pampubliko' | 'Pribado';
  membersCount: number;
  avatar: string;
  coverPhoto: string;
  description: string;
  isJoined?: boolean;
}

export type ActiveTab = 'feed' | 'friends' | 'messages' | 'watch' | 'notifications' | 'menu';
