import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Moon, 
  Sun, 
  Zap, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  LogOut, 
  ChevronRight, 
  Shield, 
  Info,
  Flag,
  Users,
  Globe,
  ArrowDownToLine,
  UserCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../services/translations';
import { Avatar } from '../common/Avatar';

export const MenuView: React.FC = () => {
  const { 
    currentUser, 
    theme, 
    toggleTheme, 
    isDataSaver, 
    toggleDataSaver,
    isOnline,
    isSimulatedOffline,
    toggleSimulateOffline,
    setShowLogoutModal,
    setShowPagesModal,
    setShowGroupsModal,
    setShowLanguageModal,
    setShowSwitchAccountModal,
    language,
    t,
    setViewingProfileUserId
  } = useApp();

  const currentLanguageInfo = SUPPORTED_LANGUAGES.find((l) => l.code === language);

  return (
    <div className="max-w-xl mx-auto pb-16 px-3">
      {/* Header */}
      <div className="py-3">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">
          {t('menu')}
        </h2>
      </div>

      {/* User Profile Banner Shortcut */}
      {currentUser && (
        <div
          onClick={() => setViewingProfileUserId(currentUser.id)}
          className="bg-white dark:bg-gray-900 border sm:rounded-xl border-gray-200 dark:border-gray-800 p-3.5 mb-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <Avatar
              src={currentUser.avatar}
              alt={currentUser.firstName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500"
            />
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                {currentUser.firstName} {currentUser.lastName}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {currentUser.emailOrPhone}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      )}

      {/* Switch Account */}
      <div className="bg-white dark:bg-gray-900 border sm:rounded-xl border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 mb-3 overflow-hidden shadow-2xs">
        <div
          onClick={() => setShowSwitchAccountModal(true)}
          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-gray-900 dark:text-white">
                Lumipat ng Account (Switch Account)
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Pumili o magpalit sa pagitan ng mga nakarehistrong user
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Pages, Groups, and Install App Section */}
      <div className="bg-white dark:bg-gray-900 border sm:rounded-xl border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 mb-3 overflow-hidden shadow-2xs">
        {/* Pages */}
        <div
          onClick={() => setShowPagesModal(true)}
          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                <span>{t('pages')}</span>
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {t('pagesDesc')}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        {/* Groups */}
        <div
          onClick={() => setShowGroupsModal(true)}
          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                <span>{t('groups')}</span>
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {t('groupsDesc')}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Preferences & Settings */}
      <div className="bg-white dark:bg-gray-900 border sm:rounded-xl border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 mb-3 overflow-hidden shadow-2xs">
        {/* Language Selection */}
        <div
          onClick={() => setShowLanguageModal(true)}
          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-gray-900 dark:text-white">
                {t('language')}
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {currentLanguageInfo?.flag} {currentLanguageInfo?.nativeName} ({currentLanguageInfo?.name})
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        {/* Dark Mode Toggle */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="font-bold text-xs text-gray-900 dark:text-white">
                {t('darkMode')}
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {theme === 'dark' ? t('darkModeOn') : t('darkModeOff')}
              </p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none ${
              theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
            }`}
            aria-label="I-toggle ang Dark Mode"
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white transition-transform transform shadow-sm ${
                theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Data Saver Mode Toggle */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-gray-900 dark:text-white">
                {t('dataSaver')}
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {t('dataSaverDesc')}
              </p>
            </div>
          </div>

          <button
            onClick={toggleDataSaver}
            className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none ${
              isDataSaver ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-700'
            }`}
            aria-label="I-toggle ang Data Saver"
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white transition-transform transform shadow-sm ${
                isDataSaver ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Real-time Network Simulator Toggle */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              {isOnline ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-rose-500" />}
            </div>
            <div>
              <h4 className="font-bold text-xs text-gray-900 dark:text-white">
                {t('offlineSimulator')}
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {t('offlineSimulatorDesc')}
              </p>
            </div>
          </div>

          <button
            onClick={toggleSimulateOffline}
            className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none ${
              isSimulatedOffline ? 'bg-rose-600' : 'bg-gray-300 dark:bg-gray-700'
            }`}
            aria-label="Subukan ang Offline Mode"
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white transition-transform transform shadow-sm ${
                isSimulatedOffline ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Info & Legal */}
      <div className="bg-white dark:bg-gray-900 border sm:rounded-xl border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 mb-3 overflow-hidden shadow-2xs text-xs">
        <div className="p-3.5 flex items-center justify-between text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-gray-400" />
            <span>Konekta Security & Privacy</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        <div className="p-3.5 flex items-center justify-between text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-3">
            <Info className="w-4 h-4 text-gray-400" />
            <span>Konekta Lite Mobile App v1.0.0</span>
          </div>
          <span className="text-[10px] text-gray-400">2026</span>
        </div>
      </div>

      {/* Log Out Button */}
      <button
        onClick={() => setShowLogoutModal(true)}
        className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-2xs"
      >
        <LogOut className="w-4 h-4" />
        <span>{t('logout')}</span>
      </button>
    </div>
  );
};
