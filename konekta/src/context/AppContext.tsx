import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Post,
  Story,
  VideoItem,
  NotificationItem,
  ThemeMode,
  ReactionType,
  ActiveTab,
  Comment
} from '../types';
import { StorageService } from '../services/storage';
import { SupportedLanguage, TRANSLATIONS } from '../services/translations';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  posts: Post[];
  stories: Story[];
  videos: VideoItem[];
  notifications: NotificationItem[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  isDataSaver: boolean;
  toggleDataSaver: () => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  toggleSimulateOffline: () => void;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  friendRequestsCount: number;
  activeChatUserId: string | null;
  setActiveChatUserId: (userId: string | null) => void;
  viewingProfileUserId: string | null;
  setViewingProfileUserId: (userId: string | null) => void;
  showLogoutModal: boolean;
  setShowLogoutModal: (show: boolean) => void;
  showInstallModal: boolean;
  setShowInstallModal: (show: boolean) => void;
  showPagesModal: boolean;
  setShowPagesModal: (show: boolean) => void;
  showGroupsModal: boolean;
  setShowGroupsModal: (show: boolean) => void;
  showLanguageModal: boolean;
  setShowLanguageModal: (show: boolean) => void;
  showSwitchAccountModal: boolean;
  setShowSwitchAccountModal: (show: boolean) => void;
  authView: 'login' | 'signup' | 'forgot_password' | null;
  setAuthView: (view: 'login' | 'signup' | 'forgot_password' | null) => void;
  login: (emailOrPhone: string, password: string) => { success: boolean; error?: string };
  signup: (userData: Omit<User, 'id' | 'createdAt' | 'friendsCount'>) => { success: boolean; user?: User; error?: string };
  logout: () => void;
  switchAccount: (userId: string) => void;
  updateUserProfile: (user: User) => void;
  resetUserPassword: (emailOrPhone: string, newPass: string) => boolean;
  createPost: (content: string, imageUrl?: string, feeling?: string, location?: string, backgroundColor?: string) => Post;
  deletePost: (postId: string) => void;
  toggleReaction: (postId: string, reaction: ReactionType) => void;
  addComment: (postId: string, text: string) => Comment | null;
  addStory: (mediaUrl: string, caption?: string) => Story;
  markNotificationsAsRead: () => void;
  refreshData: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  sendFriendRequest: (targetUserId: string) => void;
  cancelFriendRequest: (targetUserId: string) => void;
  acceptFriendRequest: (targetUserId: string) => void;
  unfriend: (targetUserId: string) => void;
  getFriendshipStatus: (targetUserId: string) => 'self' | 'friends' | 'requested' | 'received' | 'none';
  openUserChat: (targetUserId: string) => void;
  openUserProfile: (targetUserId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [posts, setPosts] = useState<Post[]>(() => StorageService.getPosts());
  const [stories, setStories] = useState<Story[]>(() => StorageService.getStories());
  const [videos] = useState<VideoItem[]>(() => StorageService.getVideos());
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');
  const [theme, setThemeState] = useState<ThemeMode>(() => StorageService.getTheme());
  const [isDataSaver, setIsDataSaver] = useState<boolean>(() => StorageService.getDataSaver());
  const [language, setLanguageState] = useState<SupportedLanguage>(() => StorageService.getLanguage());

  // Network state
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);

  // Modals
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [viewingProfileUserId, setViewingProfileUserId] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [showPagesModal, setShowPagesModal] = useState<boolean>(false);
  const [showGroupsModal, setShowGroupsModal] = useState<boolean>(false);
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [showSwitchAccountModal, setShowSwitchAccountModal] = useState<boolean>(false);
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot_password' | null>('login');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [friendshipsVersion, setFriendshipsVersion] = useState<number>(0);

  const isOnline = isBrowserOnline && !isSimulatedOffline;

  // Translation helper
  const t = (key: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.tl;
    return langDict[key] || TRANSLATIONS.tl[key] || key;
  };

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    StorageService.setLanguage(lang);
  };

  useEffect(() => {
    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    StorageService.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (currentUser) {
      setNotifications(StorageService.getNotifications(currentUser.id));
    } else {
      setNotifications([]);
    }
  }, [currentUser]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleDataSaver = () => {
    setIsDataSaver(prev => {
      const next = !prev;
      StorageService.setDataSaver(next);
      return next;
    });
  };

  const toggleSimulateOffline = () => {
    setIsSimulatedOffline(prev => !prev);
  };

  const refreshData = () => {
    setUsers(StorageService.getUsers());
    setPosts(StorageService.getPosts());
    setStories(StorageService.getStories());
    if (currentUser) {
      setNotifications(StorageService.getNotifications(currentUser.id));
    }
  };

  const login = (emailOrPhone: string, password: string) => {
    const allUsers = StorageService.getUsers();
    const cleanId = emailOrPhone.trim().toLowerCase();
    const found = allUsers.find(
      u => (u.emailOrPhone.toLowerCase() === cleanId) && (u.password === password)
    );

    if (found) {
      StorageService.setCurrentUser(found);
      setCurrentUser(found);
      setAuthView(null);
      return { success: true };
    }
    return { success: false, error: 'Maling email/numero o password. Pakisuri muli.' };
  };

  const signup = (userData: Omit<User, 'id' | 'createdAt' | 'friendsCount'>) => {
    const existing = StorageService.findUserByEmailOrPhone(userData.emailOrPhone);
    if (existing) {
      return { success: false, error: 'May gumagamit na ng email o mobile number na ito sa Konekta.' };
    }
    const newUser = StorageService.createUser(userData);
    StorageService.setCurrentUser(newUser);
    setCurrentUser(newUser);
    setUsers(StorageService.getUsers());
    setAuthView(null);

    StorageService.addNotification({
      userId: newUser.id,
      type: 'system',
      actorName: 'Konekta',
      actorAvatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%231877F2'/%3E%3Ctext x='50' y='68' font-size='56' font-family='sans-serif' font-weight='bold' fill='white' text-anchor='middle'%3EK%3C/text%3E%3C/svg%3E",
      message: 'Maligayang pagdating sa Konekta! Maaari mong i-customize ang iyong Profile at Cover photo sa Profile page.'
    });

    return { success: true, user: newUser };
  };

  const logout = () => {
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
    setShowLogoutModal(false);
    setAuthView('login');
  };

  const switchAccount = (userId: string) => {
    const allUsers = StorageService.getUsers();
    const target = allUsers.find(u => u.id === userId);
    if (target) {
      StorageService.setCurrentUser(target);
      setCurrentUser(target);
      setAuthView(null);
      refreshData();
    }
  };

  const updateUserProfile = (updated: User) => {
    StorageService.updateUser(updated);
    setCurrentUser(updated);
    const updatedUsers = StorageService.getUsers();
    setUsers(updatedUsers);

    // Update avatar and name on existing posts authored by this user
    const currentPosts = StorageService.getPosts();
    const modifiedPosts = currentPosts.map(p => {
      if (p.userId === updated.id) {
        return {
          ...p,
          userName: `${updated.firstName} ${updated.lastName}`,
          userAvatar: updated.avatar
        };
      }
      return p;
    });
    StorageService.savePosts(modifiedPosts);
    setPosts(modifiedPosts);
  };

  const resetUserPassword = (emailOrPhone: string, newPass: string) => {
    const success = StorageService.resetPassword(emailOrPhone, newPass);
    if (success) {
      setUsers(StorageService.getUsers());
    }
    return success;
  };

  const createPost = (
    content: string,
    imageUrl?: string,
    feeling?: string,
    location?: string,
    backgroundColor?: string
  ): Post => {
    if (!currentUser) throw new Error('Dapat munang mag-login');

    const newPost = StorageService.createPost({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userAvatar: currentUser.avatar,
      content,
      imageUrl,
      feeling,
      location,
      backgroundColor,
      privacy: 'public'
    });

    setPosts(StorageService.getPosts());
    return newPost;
  };

  const deletePost = (postId: string) => {
    StorageService.deletePost(postId);
    setPosts(StorageService.getPosts());
  };

  const toggleReaction = (postId: string, reaction: ReactionType) => {
    if (!currentUser) return;
    StorageService.toggleReaction(postId, currentUser.id, reaction);
    setPosts(StorageService.getPosts());
  };

  const addComment = (postId: string, text: string) => {
    if (!currentUser) return null;
    const comment = StorageService.addComment(postId, currentUser, text);
    setPosts(StorageService.getPosts());
    return comment;
  };

  const addStory = (mediaUrl: string, caption?: string) => {
    if (!currentUser) throw new Error('Dapat munang mag-login');
    const newStory = StorageService.addStory(currentUser, mediaUrl, caption);
    setStories(StorageService.getStories());
    return newStory;
  };

  const markNotificationsAsRead = () => {
    if (currentUser) {
      StorageService.markAllNotificationsRead(currentUser.id);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const openUserProfile = (targetUserId: string) => {
    setViewingProfileUserId(targetUserId);
    setIsSearchOpen(false);
  };

  const openUserChat = (targetUserId: string) => {
    setActiveChatUserId(targetUserId);
    setActiveTab('messages');
    setViewingProfileUserId(null);
    setIsSearchOpen(false);
  };

  const sendFriendRequest = (targetUserId: string) => {
    if (!currentUser) return;
    StorageService.sendFriendRequest(currentUser.id, targetUserId);
    const targetUser = users.find(u => u.id === targetUserId);
    if (targetUser) {
      StorageService.addNotification({
        userId: targetUserId,
        type: 'friend_request',
        actorName: `${currentUser.firstName} ${currentUser.lastName}`,
        actorAvatar: currentUser.avatar,
        message: 'ay nagpadala sa iyo ng friend request.'
      });
    }
    setFriendshipsVersion(v => v + 1);
  };

  const cancelFriendRequest = (targetUserId: string) => {
    if (!currentUser) return;
    StorageService.cancelFriendRequest(currentUser.id, targetUserId);
    setFriendshipsVersion(v => v + 1);
  };

  const acceptFriendRequest = (targetUserId: string) => {
    if (!currentUser) return;
    StorageService.acceptFriendRequest(currentUser.id, targetUserId);
    const targetUser = users.find(u => u.id === targetUserId);
    if (targetUser) {
      StorageService.addNotification({
        userId: targetUserId,
        type: 'friend_accept',
        actorName: `${currentUser.firstName} ${currentUser.lastName}`,
        actorAvatar: currentUser.avatar,
        message: 'ay tinanggap ang iyong friend request.'
      });
    }
    setFriendshipsVersion(v => v + 1);
  };

  const unfriend = (targetUserId: string) => {
    if (!currentUser) return;
    StorageService.unfriend(currentUser.id, targetUserId);
    setFriendshipsVersion(v => v + 1);
  };

  const getFriendshipStatus = (targetUserId: string) => {
    if (!currentUser) return 'none';
    // referencing friendshipsVersion ensures reactivity
    if (friendshipsVersion < 0) return 'none';
    return StorageService.getFriendshipStatus(currentUser.id, targetUserId);
  };

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;
  const unreadMessagesCount = currentUser ? (() => {
    const map = StorageService.getMessagesMap();
    let count = 0;
    Object.values(map).forEach(msgs => {
      if (Array.isArray(msgs)) {
        msgs.forEach(m => {
          if (m.senderId !== currentUser.id && !m.isRead) count++;
        });
      }
    });
    return count;
  })() : 0;
  const friendRequestsCount = currentUser ? StorageService.getFriendRequests(currentUser.id).length : 0;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        posts,
        stories,
        videos,
        notifications,
        activeTab,
        setActiveTab,
        theme,
        toggleTheme,
        isDataSaver,
        toggleDataSaver,
        language,
        setLanguage,
        t,
        isOnline,
        isSimulatedOffline,
        toggleSimulateOffline,
        unreadMessagesCount,
        unreadNotificationsCount,
        friendRequestsCount,
        activeChatUserId,
        setActiveChatUserId,
        viewingProfileUserId,
        setViewingProfileUserId,
        showLogoutModal,
        setShowLogoutModal,
        showInstallModal,
        setShowInstallModal,
        showPagesModal,
        setShowPagesModal,
        showGroupsModal,
        setShowGroupsModal,
        showLanguageModal,
        setShowLanguageModal,
        showSwitchAccountModal,
        setShowSwitchAccountModal,
        authView,
        setAuthView,
        login,
        signup,
        logout,
        switchAccount,
        updateUserProfile,
        resetUserPassword,
        createPost,
        deletePost,
        toggleReaction,
        addComment,
        addStory,
        markNotificationsAsRead,
        refreshData,
        searchQuery,
        setSearchQuery,
        isSearchOpen,
        setIsSearchOpen,
        sendFriendRequest,
        cancelFriendRequest,
        acceptFriendRequest,
        unfriend,
        getFriendshipStatus,
        openUserChat,
        openUserProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
