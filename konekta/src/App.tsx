import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { NavigationTabs } from './components/common/NavigationTabs';
import { NetworkBanner } from './components/common/NetworkBanner';
import { LogoutModal } from './components/common/LogoutModal';
import { LanguageModal } from './components/common/LanguageModal';
import { PagesModal } from './components/pages/PagesModal';
import { GroupsModal } from './components/groups/GroupsModal';
import { SwitchAccountModal } from './components/common/SwitchAccountModal';
import { UniversalSearchModal } from './components/search/UniversalSearchModal';
import { LoginView } from './components/auth/LoginView';
import { SignUpView } from './components/auth/SignUpView';
import { ForgotPasswordView } from './components/auth/ForgotPasswordView';
import { FeedView } from './components/feed/FeedView';
import { FriendsView } from './components/friends/FriendsView';
import { ChatView } from './components/chat/ChatView';
import { WatchView } from './components/watch/WatchView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { MenuView } from './components/menu/MenuView';
import { ProfileView } from './components/profile/ProfileView';
import { InstallPrompt } from './components/common/InstallPrompt';

const MainAppContent: React.FC = () => {
  const { 
    currentUser, 
    authView, 
    activeTab, 
    viewingProfileUserId, 
    setViewingProfileUserId,
    showPagesModal,
    setShowPagesModal,
    showGroupsModal,
    setShowGroupsModal,
    showLanguageModal,
    setShowLanguageModal,
    showSwitchAccountModal,
    setShowSwitchAccountModal,
    t
  } = useApp();

  if (authView === 'signup') {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
        <SignUpView />
        <LanguageModal isOpen={showLanguageModal} onClose={() => setShowLanguageModal(false)} />
      </div>
    );
  }

  if (authView === 'forgot_password') {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
        <ForgotPasswordView />
        <LanguageModal isOpen={showLanguageModal} onClose={() => setShowLanguageModal(false)} />
      </div>
    );
  }

  // Direct login or sign up page if not authenticated
  if (!currentUser && (!authView || authView === 'login')) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
        <LoginView />
        <LanguageModal isOpen={showLanguageModal} onClose={() => setShowLanguageModal(false)} />
      </div>
    );
  }

  // Render current tab content
  const renderTabContent = () => {
    if (viewingProfileUserId) {
      return (
        <ProfileView
          userId={viewingProfileUserId}
          onBack={() => setViewingProfileUserId(null)}
        />
      );
    }

    switch (activeTab) {
      case 'feed':
        return <FeedView />;
      case 'friends':
        return <FriendsView />;
      case 'messages':
        return <ChatView />;
      case 'watch':
        return <WatchView />;
      case 'notifications':
        return <NotificationsView />;
      case 'menu':
        return <MenuView />;
      default:
        return <FeedView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans flex flex-col transition-colors selection:bg-blue-200">
      {/* Main Container */}
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-xl flex flex-col bg-gray-100 dark:bg-gray-950">
          {/* Top Bar Header */}
          <Header />

          {/* Navigation Bar (6 Tabs) */}
          <NavigationTabs />

          {/* Online/Offline Detector Banner */}
          <NetworkBanner />

          {/* Active Tab Screen */}
          <main className="flex-1 overflow-y-auto">
            {renderTabContent()}
          </main>
        </div>
      </div>

      {/* Confirmation Modals & Overlays */}
      <LogoutModal />
      <PagesModal isOpen={showPagesModal} onClose={() => setShowPagesModal(false)} />
      <GroupsModal isOpen={showGroupsModal} onClose={() => setShowGroupsModal(false)} />
      <LanguageModal isOpen={showLanguageModal} onClose={() => setShowLanguageModal(false)} />
      <SwitchAccountModal isOpen={showSwitchAccountModal} onClose={() => setShowSwitchAccountModal(false)} />
      <UniversalSearchModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
      <InstallPrompt />
    </AppProvider>
  );
}
