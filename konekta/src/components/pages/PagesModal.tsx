import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PageItem } from '../../types';
import { StorageService } from '../../services/storage';
import { X, Flag, Plus, Check, Users, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PagesModal: React.FC<PagesModalProps> = ({ isOpen, onClose }) => {
  const { t } = useApp();
  const [pages, setPages] = useState<PageItem[]>(() => StorageService.getPages());
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Komunidad at Balita');
  const [newDesc, setNewDesc] = useState('');

  if (!isOpen) return null;

  const handleToggleFollow = (pageId: string) => {
    const updated = StorageService.toggleFollowPage(pageId);
    setPages([...updated]);
    confetti({ particleCount: 25, spread: 45 });
  };

  const handleCreatePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const created = StorageService.createPage(newName.trim(), newCategory, newDesc.trim());
    setPages([created, ...pages]);
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
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                {t('pages')}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {t('pagesDesc')}
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

        {/* Toolbar: Create Page Button */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 flex justify-between items-center">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
            {pages.length} Mga Pahina
          </span>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isCreating ? t('cancel') : t('createPage')}</span>
          </button>
        </div>

        {/* Create Form Drawer */}
        {isCreating && (
          <form onSubmit={handleCreatePage} className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40 space-y-3">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('createPage')}</span>
            </h4>
            <input
              type="text"
              required
              placeholder="Pangalan ng Pahina (hal. Juan's Cafe)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl outline-none"
            />
            <input
              type="text"
              placeholder="Kategorya (hal. Negosyo, Musika, Edukasyon)"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl outline-none"
            />
            <textarea
              placeholder="Maikling paglalarawan ng pahina..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={2}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl outline-none"
            />
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
            >
              I-publish ang Pahina
            </button>
          </form>
        )}

        {/* Pages List */}
        <div className="p-3 overflow-y-auto space-y-3 flex-1 divide-y divide-gray-100 dark:divide-gray-800">
          {pages.map((p) => (
            <div key={p.id} className="pt-3 first:pt-0 flex items-center gap-3">
              <img
                src={p.avatar}
                alt={p.name}
                className="w-12 h-12 rounded-xl object-cover ring-1 ring-gray-200 dark:ring-gray-700 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate">
                  {p.name}
                </h4>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold truncate">
                  {p.category}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {p.followersCount.toLocaleString()} followers • {p.description}
                </p>
              </div>

              <button
                onClick={() => handleToggleFollow(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                  p.isFollowed
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {p.isFollowed ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t('following')}</span>
                  </>
                ) : (
                  <span>{t('follow')}</span>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
