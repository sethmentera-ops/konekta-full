import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  MessageCircle, 
  ArrowDownToLine, 
  WifiOff, 
  Zap, 
  X,
  Globe
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../services/translations';

export const Header: React.FC = () => {
  const { 
    unreadMessagesCount, 
    setActiveTab, 
    isOnline, 
    toggleSimulateOffline,
    isSimulatedOffline,
    setShowLanguageModal,
    language,
    t,
    setIsSearchOpen,
    setViewingProfileUserId
  } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors shadow-xs">
      <div className="max-w-xl mx-auto px-3 py-2 flex items-center justify-between gap-2">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('feed');
              setViewingProfileUserId(null);
            }}
            className="flex items-center gap-1.5 focus:outline-none group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              K
            </div>
            <span className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400 font-sans">
              {t('appTitle')}
            </span>
            <span className="text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full ml-0.5">
              LITE
            </span>
          </button>
        </div>

        {/* Quick Search Pill Bar (Anytime User Search) */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex-1 max-w-[200px] hidden sm:flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full px-3 py-1.5 text-xs transition-colors cursor-pointer text-left truncate border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
          title="Maghanap ng kahit sinong user o post anytime"
        >
          <Search className="w-3.5 h-3.5 shrink-0 text-gray-500 dark:text-gray-400" />
          <span className="truncate">{t('searchAnytime') || 'Maghanap ng users...'}</span>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Search Button (Accessible Anytime) */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 transition-colors"
            title="Maghanap ng users (i-stalk, i-add, o i-message)"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Quick Language Switcher Button */}
          <button
            onClick={() => setShowLanguageModal(true)}
            className="px-2 py-1 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center gap-1 border border-gray-200 dark:border-gray-700 transition-colors"
            title="Wika / Language"
          >
            <Globe className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span className="uppercase">{language}</span>
          </button>

          {/* Network Indicator / Simulator */}
          <button
            onClick={toggleSimulateOffline}
            className={`px-2 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 transition-all border ${
              isOnline
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 animate-pulse'
            }`}
            title={isSimulatedOffline ? "I-on muli ang koneksyon" : "Subukan ang Offline Mode"}
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="hidden xs:inline">{t('online')}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-rose-500" />
                <span>{t('offline')}</span>
              </>
            )}
          </button>

          {/* Messenger Shortcut */}
          <button
            onClick={() => {
              setActiveTab('messages');
              setViewingProfileUserId(null);
            }}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 relative transition-colors"
            title={t('messages')}
            aria-label="Messenger"
          >
            <MessageCircle className="w-4 h-4" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          
        </div>
      </div>
    </header>
  );
};
