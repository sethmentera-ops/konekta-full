import React from 'react';
import { useApp } from '../../context/AppContext';
import { LogOut, X } from 'lucide-react';

export const LogoutModal: React.FC = () => {
  const { showLogoutModal, setShowLogoutModal, logout, currentUser } = useApp();

  if (!showLogoutModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-5 overflow-hidden transform transition-all animate-scaleUp"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 id="logout-title" className="font-bold text-gray-900 dark:text-gray-100 text-base">
              Log Out of Konekta?
            </h3>
          </div>
          <button
            onClick={() => setShowLogoutModal(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Are you sure you want to log out of your account{' '}
            <strong className="text-gray-900 dark:text-white">
              {currentUser ? `(${currentUser.firstName} ${currentUser.lastName})` : ''}
            </strong>
            ? You will need to enter your username and password to log back in.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
          {/* Cancel Button */}
          <button
            onClick={() => setShowLogoutModal(false)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>

          {/* Confirm Button */}
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all shadow-sm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
