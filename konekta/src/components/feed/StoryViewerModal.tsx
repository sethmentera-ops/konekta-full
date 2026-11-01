import React, { useState, useEffect } from 'react';
import { Story } from '../../types';
import { X, Send, Heart } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface StoryViewerModalProps {
  story: Story | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({ story, onClose, onNext, onPrev }) => {
  const { currentUser } = useApp();
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [sentHeart, setSentHeart] = useState(false);

  useEffect(() => {
    if (!story) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (onNext) onNext();
          else onClose();
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [story, onNext, onClose]);

  if (!story) return null;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplyText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm h-full max-h-[750px] bg-black rounded-2xl overflow-hidden flex flex-col justify-between shadow-2xl">
        {/* Story Progress Bar */}
        <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
          <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Top bar info */}
        <div className="absolute top-6 left-3 right-3 z-20 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <img
              src={story.userAvatar}
              alt={story.userName}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23D8DADF'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%238A8D91'/%3E%3Cpath d='M50 63 C33 63 20 75 18 96 C18 98 19 100 21 100 L79 100 C81 100 82 98 82 96 C80 75 67 63 50 63 Z' fill='%238A8D91'/%3E%3C/svg%3E";
              }}
              className="w-9 h-9 rounded-full object-cover border-2 border-blue-500 bg-gray-700"
            />
            <div>
              <p className="font-bold text-xs leading-none">{story.userName}</p>
              <p className="text-[10px] text-white/70 mt-0.5">{story.timestamp}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story Media (Image) */}
        <div className="w-full h-full relative flex items-center justify-center">
          <img
            src={story.mediaUrl}
            alt="Story media"
            className="w-full h-full object-cover select-none"
          />

          {/* Touch navigation zones */}
          <div className="absolute inset-y-0 left-0 w-1/3 cursor-pointer" onClick={onPrev} />
          <div className="absolute inset-y-0 right-0 w-1/3 cursor-pointer" onClick={onNext} />

          {/* Caption banner if any */}
          {story.caption && (
            <div className="absolute bottom-20 left-4 right-4 bg-black/50 backdrop-blur-xs text-white text-xs p-2.5 rounded-xl text-center">
              {story.caption}
            </div>
          )}
        </div>

        {/* Story Bottom Reply Bar */}
        <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center gap-2">
          <form onSubmit={handleSendReply} className="flex-1 flex items-center bg-black/50 backdrop-blur-md rounded-full border border-white/20 px-3 py-1.5 text-xs text-white">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Magpadala ng mensahe kay ${story.userName}...`}
              className="w-full bg-transparent outline-none placeholder-white/50 text-white"
            />
            <button type="submit" disabled={!replyText.trim()} className="text-white disabled:opacity-40">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <button
            onClick={() => setSentHeart(true)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-125 ${
              sentHeart ? 'bg-red-500 text-white scale-110' : 'bg-black/50 text-white border border-white/20'
            }`}
          >
            <Heart className={`w-4 h-4 ${sentHeart ? 'fill-white' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
