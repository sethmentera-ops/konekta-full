import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GroupItem } from '../../types';
import { StorageService } from '../../services/storage';
import { X, Users, Plus, Check, ShieldCheck, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GroupsModal: React.FC<GroupsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useApp();
  const [groups, setGroups] = useState<GroupItem[]>(() => StorageService.getGroups());
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrivacy, setNewPrivacy] = useState<'Pampubliko' | 'Pribado'>('Pampubliko');
  const [newDesc, setNewDesc] = useState('');

  if (!isOpen) return null;

  const handleToggleJoin = (groupId: string) => {
    const updated = StorageService.toggleJoinGroup(groupId);
    setGroups([...updated]);
    confetti({ particleCount: 25, spread: 45 });
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const created = StorageService.createGroup(newName.trim(), newPrivacy, newDesc.trim());
    setGroups([created, ...groups]);
    setIsCreating(false);
    setNewName('');
    setNewDesc('');
    confetti({ particleCount: 40, spread: 60 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp text-gray-800 dark:text-gray-100"
        role="dialog"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                {t('groups')}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {t('groupsDesc')}
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

        {/* Toolbar: Create Group Button */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 flex justify-between items-center">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
            {groups.length} Mga Grupo
          </span>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isCreating ? t('cancel') : t('createGroup')}</span>
          </button>
        </div>

        {/* Create Form Drawer */}
        {isCreating && (
          <form onSubmit={handleCreateGroup} className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/40 space-y-3">
            <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('createGroup')}</span>
            </h4>
            <input
              type="text"
              required
              placeholder="Pangalan ng Grupo (hal. Photography Enthusiasts PH)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl outline-none"
            />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setNewPrivacy('Pampubliko')}
                className={`p-2 rounded-xl border text-center font-semibold ${
                  newPrivacy === 'Pampubliko'
                    ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                Pampubliko
              </button>
              <button
                type="button"
                onClick={() => setNewPrivacy('Pribado')}
                className={`p-2 rounded-xl border text-center font-semibold ${
                  newPrivacy === 'Pribado'
                    ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                Pribado
              </button>
            </div>
            <textarea
              placeholder="Tungkol sa grupo..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={2}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl outline-none"
            />
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
            >
              Likhain ang Grupo
            </button>
          </form>
        )}

        {/* Groups List */}
        <div className="p-3 overflow-y-auto space-y-3 flex-1 divide-y divide-gray-100 dark:divide-gray-800">
          {groups.map((g) => (
            <div key={g.id} className="pt-3 first:pt-0 flex items-center gap-3">
              <img
                src={g.avatar}
                alt={g.name}
                className="w-12 h-12 rounded-xl object-cover ring-1 ring-gray-200 dark:ring-gray-700 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate">
                  {g.name}
                </h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  {g.privacy} • {g.membersCount.toLocaleString()} miyembro
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {g.description}
                </p>
              </div>

              <button
                onClick={() => handleToggleJoin(g.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                  g.isJoined
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {g.isJoined ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t('joined')}</span>
                  </>
                ) : (
                  <span>{t('joinGroup')}</span>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
