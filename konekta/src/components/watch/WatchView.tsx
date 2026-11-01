import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VideoItem } from '../../types';
import { 
  Play, 
  Pause, 
  ThumbsUp, 
  MessageCircle, 
  Share2, 
  Volume2, 
  VolumeX, 
  Tv, 
  Bookmark, 
  Sparkles 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const WatchView: React.FC = () => {
  const { videos, isDataSaver } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [likedVideoIds, setLikedVideoIds] = useState<Set<string>>(new Set());
  const [savedVideoIds, setSavedVideoIds] = useState<Set<string>>(new Set());
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [activeCommentVidId, setActiveCommentVidId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  const categories = [
    { id: 'all', label: 'Lahat' },
    { id: 'foryou', label: 'Para sa \'Yo' },
    { id: 'news', label: 'Balita' },
    { id: 'music', label: 'Musika' },
    { id: 'funny', label: 'Nakakatawa' }
  ];

  const handleLike = (id: string) => {
    setLikedVideoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        confetti({ particleCount: 25, spread: 45, origin: { y: 0.8 } });
      }
      return next;
    });
  };

  const handleSave = (id: string) => {
    setSavedVideoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAddComment = (vidId: string) => {
    if (!newCommentText.trim()) return;
    setCommentCounts((prev) => ({
      ...prev,
      [vidId]: (prev[vidId] || 0) + 1
    }));
    setNewCommentText('');
    showToast('Nai-post ang iyong komento sa video! 💬');
  };

  const filteredVideos = videos.filter((v) => {
    if (activeCategory === 'all') return true;
    return v.category === activeCategory;
  });

  return (
    <div className="max-w-xl mx-auto pb-16">
      {/* Watch Top Header & Categories */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-3 sticky top-[49px] z-20 transition-colors shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Tv className="w-4 h-4" />
            </div>
            <h2 className="text-base font-black text-gray-900 dark:text-white">
              Konekta Watch
            </h2>
          </div>

          {isDataSaver && (
            <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
              Data Saver Active
            </span>
          )}
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                activeCategory === c.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Videos Feed */}
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {filteredVideos.map((vid) => {
          const isLiked = likedVideoIds.has(vid.id);
          const isSaved = savedVideoIds.has(vid.id);
          const extraComments = commentCounts[vid.id] || 0;

          return (
            <div
              key={vid.id}
              className="bg-white dark:bg-gray-900 mb-2.5 sm:border sm:rounded-xl border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xs"
            >
              {/* Video Author Header */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={vid.authorAvatar}
                    alt={vid.authorName}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                  />
                  <div>
                    <h4 className="font-bold text-xs text-gray-900 dark:text-white">
                      {vid.authorName}
                    </h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {vid.timestamp} • {vid.views}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleSave(vid.id)}
                  className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    isSaved ? 'text-blue-600' : 'text-gray-400'
                  }`}
                  title="I-save ang video"
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-blue-600' : ''}`} />
                </button>
              </div>

              {/* Video Title */}
              <div className="px-3 pb-2 text-xs font-semibold text-gray-800 dark:text-gray-200 leading-snug">
                {vid.title}
              </div>

              {/* HTML5 Native Video Player */}
              <div className="w-full bg-black relative aspect-video flex items-center justify-center">
                <video
                  src={vid.videoUrl}
                  poster={vid.thumbnailUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Video Reaction and Comments Count */}
              <div className="px-3 py-2 flex items-center justify-between text-xs text-gray-500 border-b border-gray-100 dark:border-gray-800">
                <span>{vid.likes + (isLiked ? 1 : 0)} likes</span>
                <span>{vid.commentsCount + extraComments} komento</span>
              </div>

              {/* Action Bar */}
              <div className="px-1 py-1 grid grid-cols-3 text-xs font-semibold text-gray-600 dark:text-gray-300">
                <button
                  onClick={() => handleLike(vid.id)}
                  className={`py-2 flex items-center justify-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors ${
                    isLiked ? 'text-blue-600 font-bold' : ''
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-blue-600' : ''}`} />
                  <span>{isLiked ? 'Nai-like' : 'I-like'}</span>
                </button>

                <button
                  onClick={() => setActiveCommentVidId(activeCommentVidId === vid.id ? null : vid.id)}
                  className="py-2 flex items-center justify-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Komento</span>
                </button>

                <button
                  onClick={() => {
                    confetti({ particleCount: 25, spread: 45, origin: { y: 0.8 } });
                    showToast('Nai-share ang video sa iyong Konekta feed! 🚀');
                  }}
                  className="py-2 flex items-center justify-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>I-share</span>
                </button>
              </div>

              {/* Comment Drawer if active */}
              {activeCommentVidId === vid.id && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Maglagay ng komento sa video..."
                      className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full px-3 py-1.5 text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleAddComment(vid.id)}
                      disabled={!newCommentText.trim()}
                      className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-full disabled:opacity-40"
                    >
                      I-send
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg animate-fadeIn flex items-center gap-1.5 border border-gray-700">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
