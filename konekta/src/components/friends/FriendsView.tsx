import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import { UserPlus, UserCheck, UserX, MessageSquare, Search } from 'lucide-react';
import confetti from 'canvas-confetti';

import { StorageService } from '../../services/storage';
import { Avatar } from '../common/Avatar';

export const FriendsView: React.FC = () => {
  const { 
    currentUser, 
    users, 
    setActiveChatUserId, 
    setActiveTab, 
    setViewingProfileUserId,
    setIsSearchOpen,
    sendFriendRequest,
    acceptFriendRequest,
    cancelFriendRequest,
    t 
  } = useApp();

  const [friendRequests, setFriendRequests] = useState<User[]>(() => {
    if (!currentUser) return [];
    return StorageService.getFriendRequests(currentUser.id);
  });

  const [addedFriendIds, setAddedFriendIds] = useState<Set<string>>(new Set());

  // Confirm request
  const handleConfirmRequest = (user: User) => {
    if (currentUser) {
      acceptFriendRequest(user.id);
    }
    setFriendRequests((prev) => prev.filter((r) => r.id !== user.id));
    setAddedFriendIds((prev) => new Set([...prev, user.id]));
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
  };

  // Delete request
  const handleDeleteRequest = (userId: string) => {
    if (currentUser) {
      cancelFriendRequest(userId);
    }
    setFriendRequests((prev) => prev.filter((r) => r.id !== userId));
  };

  // Add friend
  const handleAddFriend = (user: User) => {
    if (currentUser) {
      sendFriendRequest(user.id);
    }
    setAddedFriendIds((prev) => new Set([...prev, user.id]));
  };

  // People you may know (other real registered members)
  const suggestions = users.filter((u) => {
    if (u.id === currentUser?.id) return false;
    if (friendRequests.some((r) => r.id === u.id)) return false;
    return true;
  });

  return (
    <div className="max-w-xl mx-auto pb-16 px-3">
      {/* Top Header */}
      <div className="py-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            {t('friends')}
          </h2>
        </div>

        <button
          onClick={() => setIsSearchOpen(true)}
          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 shadow-2xs active:scale-95"
          title="Maghanap ng kahit sinong user sa Konekta"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Maghanap ng User</span>
        </button>
      </div>

      {/* Friend Requests Section */}
      {friendRequests.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border sm:rounded-xl border-gray-200 dark:border-gray-800 p-3.5 mb-3 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>{t('friendRequests')}</span>
              <span className="text-xs bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300 font-extrabold px-1.5 py-0.2 rounded-full">
                {friendRequests.length}
              </span>
            </h3>
          </div>

          <div className="space-y-3">
            {friendRequests.map((reqUser) => (
              <div key={reqUser.id} className="flex items-center gap-3">
                <Avatar
                  src={reqUser.avatar}
                  alt={reqUser.firstName}
                  onClick={() => setViewingProfileUserId(reqUser.id)}
                  className="w-14 h-14 rounded-full object-cover cursor-pointer ring-1 ring-gray-200 dark:ring-gray-700 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h4 
                    onClick={() => setViewingProfileUserId(reqUser.id)}
                    className="font-bold text-sm text-gray-900 dark:text-white truncate cursor-pointer hover:underline"
                  >
                    {reqUser.firstName} {reqUser.lastName}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {reqUser.bio || 'Konekta Member'}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleConfirmRequest(reqUser)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95 shadow-xs"
                    >
                      {t('confirmFriend')}
                    </button>
                    <button
                      onClick={() => handleDeleteRequest(reqUser.id)}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition-all"
                    >
                      {t('deleteFriend')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* People You May Know */}
      <div className="bg-white dark:bg-gray-900 border sm:rounded-xl border-gray-200 dark:border-gray-800 p-3.5 mb-3 shadow-2xs">
        <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3">
          {t('peopleYouMayKnow')}
        </h3>

        {suggestions.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            {suggestions.map((user) => {
              const isAdded = addedFriendIds.has(user.id);
              return (
                <div
                  key={user.id}
                  className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col justify-between"
                >
                  <div 
                    onClick={() => setViewingProfileUserId(user.id)}
                    className="cursor-pointer"
                  >
                    <Avatar
                      src={user.avatar}
                      alt={user.firstName}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-2.5">
                      <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate">
                        {user.firstName} {user.lastName}
                      </h4>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {user.location || 'Pilipinas'}
                      </p>
                    </div>
                  </div>

                  <div className="p-2 pt-0">
                    {isAdded ? (
                      <div className="w-full py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{t('joined')}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddFriend(user)}
                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs active:scale-95"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{t('addFriend')}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400 text-xs">
            <p className="font-semibold text-gray-700 dark:text-gray-300">Wala pang ibang miyembro</p>
            <p className="mt-1 text-gray-500">Kapag may lumikha ng panibagong account sa Konekta, makikita mo sila rito upang i-add bilang kaibigan!</p>
          </div>
        )}
      </div>
    </div>
  );
};
