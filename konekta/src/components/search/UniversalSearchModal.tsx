import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Post } from '../../types';
import { 
  Search, 
  ArrowLeft, 
  X, 
  UserPlus, 
  UserCheck, 
  UserX, 
  MessageCircle, 
  Eye, 
  MapPin, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Users,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Avatar } from '../common/Avatar';

export const UniversalSearchModal: React.FC = () => {
  const { 
    isSearchOpen, 
    setIsSearchOpen, 
    searchQuery, 
    setSearchQuery, 
    users, 
    posts, 
    currentUser, 
    getFriendshipStatus, 
    sendFriendRequest, 
    cancelFriendRequest, 
    acceptFriendRequest, 
    openUserProfile, 
    openUserChat, 
    t 
  } = useApp();

  const [activeSearchTab, setActiveSearchTab] = useState<'all' | 'users' | 'posts'>('all');

  // Filter users based on query
  const matchingUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users; // Show all users when query is empty for effortless discovery/stalking
    return users.filter((u) => {
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
      const emailOrPhone = (u.emailOrPhone || '').toLowerCase();
      const bio = (u.bio || '').toLowerCase();
      const location = (u.location || '').toLowerCase();
      const work = (u.work || '').toLowerCase();
      return (
        fullName.includes(q) ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        emailOrPhone.includes(q) ||
        bio.includes(q) ||
        location.includes(q) ||
        work.includes(q)
      );
    });
  }, [searchQuery, users]);

  // Filter posts based on query
  const matchingPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return posts.filter((p) => {
      const content = p.content.toLowerCase();
      const userName = p.userName.toLowerCase();
      const feeling = (p.feeling || '').toLowerCase();
      const location = (p.location || '').toLowerCase();
      return (
        content.includes(q) ||
        userName.includes(q) ||
        feeling.includes(q) ||
        location.includes(q)
      );
    });
  }, [searchQuery, posts]);

  if (!isSearchOpen) return null;

  const handleAddFriendClick = (targetUser: User) => {
    sendFriendRequest(targetUser.id);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
  };

  const handleAcceptFriendClick = (targetUser: User) => {
    acceptFriendRequest(targetUser.id);
    confetti({ particleCount: 45, spread: 70, origin: { y: 0.6 } });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-start items-center p-0 sm:p-4 animate-fadeIn">
      <div 
        className="w-full max-w-xl h-full sm:h-[92vh] bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10 flex items-center gap-2">
          <button
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery('');
            }}
            className="p-2 -ml-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            title="Bumalik / Isara"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-3.5 py-2 ring-1 ring-transparent focus-within:ring-blue-500 focus-within:bg-white dark:focus-within:bg-gray-850 transition-all">
            <Search className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchAnytime') || 'Maghanap ng users, tao, o posts...'}
              autoFocus
              className="w-full bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                title="I-clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tab Chips */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 overflow-x-auto text-xs shrink-0">
          <button
            onClick={() => setActiveSearchTab('all')}
            className={`px-3 py-1.5 rounded-full font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSearchTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Lahat</span>
          </button>

          <button
            onClick={() => setActiveSearchTab('users')}
            className={`px-3 py-1.5 rounded-full font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSearchTab === 'users'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t('searchUsersTab') || 'Mga Tao / Users'}</span>
            <span className="text-[10px] bg-black/10 dark:bg-white/15 px-1.5 py-0.2 rounded-full">
              {matchingUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSearchTab('posts')}
            className={`px-3 py-1.5 rounded-full font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSearchTab === 'posts'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('searchPostsTab') || 'Mga Post'}</span>
            {matchingPosts.length > 0 && (
              <span className="text-[10px] bg-black/10 dark:bg-white/15 px-1.5 py-0.2 rounded-full">
                {matchingPosts.length}
              </span>
            )}
          </button>
        </div>

        {/* Search Results Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* USERS SECTION (Rendered if tab is 'all' or 'users') */}
          {(activeSearchTab === 'all' || activeSearchTab === 'users') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>
                    {searchQuery.trim()
                      ? `${t('searchUsersTab') || 'Mga Tao'} (${matchingUsers.length})`
                      : `${t('allRegisteredUsers') || 'Lahat ng User sa Konekta'} (${matchingUsers.length})`}
                  </span>
                </h3>
                {!searchQuery.trim() && (
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                    Maaaring i-stalk, i-chat, o i-add
                  </span>
                )}
              </div>

              {matchingUsers.length === 0 ? (
                <div className="p-6 text-center bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {t('searchNoResults') || 'Walang nahanap na user'} &quot;{searchQuery}&quot;
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Subukan mag-search gamit ang ibang pangalan o bahagi ng pangalan.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {matchingUsers.map((targetUser) => {
                    const status = getFriendshipStatus(targetUser.id);
                    const isSelf = targetUser.id === currentUser?.id;

                    return (
                      <div
                        key={targetUser.id}
                        className="bg-white dark:bg-gray-800/80 rounded-xl p-3 border border-gray-200 dark:border-gray-700/80 hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-2xs group"
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar with Online Badge */}
                          <div 
                            className="relative cursor-pointer shrink-0"
                            onClick={() => openUserProfile(targetUser.id)}
                            title="Tingnan ang profile (Stalk)"
                          >
                            <Avatar
                              src={targetUser.avatar}
                              alt={targetUser.firstName}
                              className="w-13 h-13 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700 group-hover:ring-blue-500 transition-all"
                            />
                            {targetUser.isOnline && (
                              <span 
                                className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900 ring-1 ring-emerald-600/30"
                                title="Online" 
                              />
                            )}
                          </div>

                          {/* User Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4
                                onClick={() => openUserProfile(targetUser.id)}
                                className="text-sm font-bold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors truncate"
                              >
                                {targetUser.firstName} {targetUser.lastName}
                              </h4>
                              {isSelf && (
                                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold px-1.5 py-0.2 rounded-full">
                                  {t('youBadge') || 'Ikaw'}
                                </span>
                              )}
                            </div>

                            {/* Bio / Work / Location Snippet */}
                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1 mt-0.5">
                              {targetUser.bio || targetUser.work || 'Konekta Member'}
                            </p>

                            <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                              {targetUser.location && (
                                <span className="flex items-center gap-1 truncate max-w-[140px]">
                                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                  <span className="truncate">{targetUser.location}</span>
                                </span>
                              )}
                              {targetUser.friendsCount !== undefined && (
                                <span>
                                  {targetUser.friendsCount} {t('mutualFriends') || 'mga kaibigan'}
                                </span>
                              )}
                            </div>

                            {/* Action Buttons: STALK / MESSAGE / ADD FRIEND */}
                            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                              {/* 1. STALK / VIEW PROFILE BUTTON */}
                              <button
                                onClick={() => openUserProfile(targetUser.id)}
                                className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 border border-gray-200/80 dark:border-gray-600/80"
                                title="Tingnan ang profile, cover photo, at lahat ng post nito"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>{t('stalkProfile') || 'Tingnan Profile'}</span>
                              </button>

                              {/* 2. SEND MESSAGE / CHAT BUTTON (If not self) */}
                              {!isSelf && (
                                <button
                                  onClick={() => openUserChat(targetUser.id)}
                                  className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 border border-blue-200 dark:border-blue-800/80"
                                  title="Direktang magpadala ng mensahe / chat"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                  <span>{t('sendDirectMessage') || 'Mensahe'}</span>
                                </button>
                              )}

                              {/* 3. FRIENDSHIP ACTION BUTTON */}
                              {!isSelf && (
                                <>
                                  {status === 'friends' && (
                                    <span className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/80">
                                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                      <span>{t('friendStatusFriends') || 'Magkaibigan'}</span>
                                    </span>
                                  )}

                                  {status === 'requested' && (
                                    <button
                                      onClick={() => cancelFriendRequest(targetUser.id)}
                                      className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-amber-200 dark:border-amber-800/80 active:scale-95"
                                      title="Kanselahin ang ipinadalang friend request"
                                    >
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>{t('friendStatusRequested') || 'Naipadala na (Kanselahin)'}</span>
                                    </button>
                                  )}

                                  {status === 'received' && (
                                    <button
                                      onClick={() => handleAcceptFriendClick(targetUser)}
                                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs active:scale-95"
                                      title="Tanggapin ang friend request"
                                    >
                                      <UserPlus className="w-3.5 h-3.5" />
                                      <span>Kumpirmahin</span>
                                    </button>
                                  )}

                                  {status === 'none' && (
                                    <button
                                      onClick={() => handleAddFriendClick(targetUser)}
                                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs active:scale-95"
                                      title="Magpadala ng friend request"
                                    >
                                      <UserPlus className="w-3.5 h-3.5" />
                                      <span>{t('addFriend') || 'I-add'}</span>
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* POSTS SECTION (Rendered if tab is 'all' or 'posts') */}
          {(activeSearchTab === 'all' || activeSearchTab === 'posts') && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>
                    {searchQuery.trim()
                      ? `${t('searchPostsTab') || 'Mga Post'} (${matchingPosts.length})`
                      : `${t('searchPostsTab') || 'Mga Post'}`}
                  </span>
                </h3>
              </div>

              {!searchQuery.trim() ? (
                <div className="p-4 text-center bg-gray-50 dark:bg-gray-800/40 rounded-xl text-xs text-gray-500 dark:text-gray-400">
                  Mag-type ng paksa o salita sa search box para maghanap ng posts.
                </div>
              ) : matchingPosts.length === 0 ? (
                <div className="p-4 text-center bg-gray-50 dark:bg-gray-800/40 rounded-xl text-xs text-gray-500 dark:text-gray-400">
                  Walang nahanap na post na tumutugma sa &quot;{searchQuery}&quot;.
                </div>
              ) : (
                <div className="space-y-2">
                  {matchingPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => openUserProfile(post.userId)}
                      className="p-3 bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Avatar
                          src={post.userAvatar}
                          alt={post.userName}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div>
                          <h5 className="text-xs font-bold text-gray-900 dark:text-white">
                            {post.userName}
                          </h5>
                          <p className="text-[10px] text-gray-400">
                            {post.timestamp} {post.location ? `• ${post.location}` : ''}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-800 dark:text-gray-200 line-clamp-2">
                        {post.content}
                      </p>
                      {post.imageUrl && (
                        <div className="mt-2 text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                          <span>May kalakip na larawan</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search Footer Quick Tip */}
        <div className="p-3 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
          <span>Tip: Pindutin ang <strong>Tingnan Profile</strong> para ma-stalk ang posts ng user</span>
          <button
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery('');
            }}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Isara
          </button>
        </div>
      </div>
    </div>
  );
};
