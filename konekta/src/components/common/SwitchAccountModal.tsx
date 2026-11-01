import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Users, UserCheck, Plus, Check } from 'lucide-react';
import { Avatar } from './Avatar';

interface SwitchAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SwitchAccountModal: React.FC<SwitchAccountModalProps> = ({ isOpen, onClose }) => {
  const { users, currentUser, switchAccount, setAuthView } = useApp();

  if (!isOpen) return null;

  const handleSelectAccount = (userId: string) => {
    switchAccount(userId);
    onClose();
  };

  const handleAddNewAccount = () => {
    onClose();
    setAuthView('signup');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-scaleUp text-gray-800 dark:text-gray-100"
        role="dialog"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Lumipat ng Account (Switch Account)
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Pumili sa mga existing account na nakarehistro
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account list */}
        <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
          {users.map((u) => {
            const isCurrent = u.id === currentUser?.id;
            return (
              <button
                key={u.id}
                onClick={() => handleSelectAccount(u.id)}
                className={`w-full p-2.5 rounded-2xl flex items-center justify-between transition-colors ${
                  isCurrent
                    ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 border border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={u.avatar}
                    alt={u.firstName}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                  />
                  <div className="text-left truncate">
                    <p className="text-xs font-bold truncate text-gray-900 dark:text-white">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                      {u.emailOrPhone}
                    </p>
                  </div>
                </div>

                {isCurrent && (
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                    <span>Aktibo</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Add Another Account Button */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
          <button
            onClick={handleAddNewAccount}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Mag-create ng Iba Pang Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
