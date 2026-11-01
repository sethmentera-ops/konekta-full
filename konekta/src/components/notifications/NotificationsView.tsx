import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Bell, 
  ThumbsUp, 
  MessageCircle, 
  UserPlus, 
  CheckCheck, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const { 
    notifications, 
    markNotificationsAsRead, 
    setActiveTab, 
    setViewingProfileUserId 
  } = useApp();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return (
          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
            👍
          </div>
        );
      case 'comment':
        return (
          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
            💬
          </div>
        );
      case 'friend_request':
        return (
          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
            <UserPlus className="w-3 h-3" />
          </div>
        );
      default:
        return (
          <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">
            <Sparkles className="w-3 h-3" />
          </div>
        );
    }
  };

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    if (notif.type === 'friend_request') {
      setActiveTab('friends');
    } else if (notif.type === 'comment' || notif.type === 'like') {
      setActiveTab('feed');
    }
  };

  return (
    <div className="max-w-xl mx-auto pb-16 px-3">
      {/* Header */}
      <div className="py-3 flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">
          Mga Abiso (Notifications)
        </h2>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={markNotificationsAsRead}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark Lahat bilang Nabasa</span>
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="bg-white dark:bg-gray-900 border sm:rounded-xl border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden shadow-2xs">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3.5 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer transition-colors ${
                !notif.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
              }`}
            >
              <div className="relative shrink-0">
                <img
                  src={notif.actorAvatar}
                  alt={notif.actorName}
                  className="w-12 h-12 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                />
                <div className="absolute -bottom-1 -right-1">
                  {getNotificationIcon(notif.type)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-800 dark:text-gray-200 leading-snug">
                  <strong className="text-gray-900 dark:text-white font-bold">
                    {notif.actorName}
                  </strong>{' '}
                  {notif.message}
                </p>
                <span className="text-[10px] text-gray-400 font-medium mt-1 block">
                  {notif.timestamp}
                </span>
              </div>

              {!notif.isRead && (
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 self-center" />
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-400">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold">Walang bagong abiso sa ngayon.</p>
          </div>
        )}
      </div>
    </div>
  );
};
