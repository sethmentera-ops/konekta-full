import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Home, 
  Users, 
  MessageSquare, 
  Tv, 
  Bell, 
  Menu
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { Avatar } from './Avatar';

export const NavigationTabs: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    unreadNotificationsCount, 
    unreadMessagesCount, 
    friendRequestsCount,
    currentUser,
    setViewingProfileUserId,
    t
  } = useApp();

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setViewingProfileUserId(null);
  };

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'feed',
      label: t('home'),
      icon: <Home className="w-5 h-5" />
    },
    {
      id: 'friends',
      label: t('friends'),
      icon: <Users className="w-5 h-5" />,
      badge: friendRequestsCount
    },
    {
      id: 'messages',
      label: t('messages'),
      icon: <MessageSquare className="w-5 h-5" />,
      badge: unreadMessagesCount
    },
    {
      id: 'watch',
      label: t('watch'),
      icon: <Tv className="w-5 h-5" />
    },
    {
      id: 'notifications',
      label: t('notifications'),
      icon: <Bell className="w-5 h-5" />,
      badge: unreadNotificationsCount
    },
    {
      id: 'menu',
      label: t('menu'),
      icon: (
        <div className="relative">
          <Menu className="w-5 h-5" />
          {currentUser && (
            <Avatar 
              src={currentUser.avatar} 
              alt="Profile" 
              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border border-white dark:border-gray-900 object-cover" 
            />
          )}
        </div>
      )
    }
  ];

  return (
    <nav className="sticky top-[49px] z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors shadow-2xs">
      <div className="max-w-xl mx-auto grid grid-cols-6 text-center">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative py-2.5 flex flex-col items-center justify-center transition-colors focus:outline-none ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              aria-label={tab.label}
              title={tab.label}
            >
              <div className="relative inline-flex items-center justify-center">
                {tab.icon}
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold px-1 min-w-[15px] h-[15px] rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                    {tab.badge}
                  </span>
                )}
              </div>
              
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 dark:bg-blue-400 rounded-t-sm" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
