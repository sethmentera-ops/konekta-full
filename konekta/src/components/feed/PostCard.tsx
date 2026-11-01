import React, { useState } from 'react';
import { Post, ReactionType, Comment } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  ThumbsUp, 
  Heart, 
  Smile, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Trash2, 
  Globe, 
  MapPin, 
  Send,
  Check,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Avatar } from '../common/Avatar';

interface PostCardProps {
  post: Post;
}

const REACTION_CONFIG: Record<ReactionType, { label: string; emoji: string; color: string; iconColor: string }> = {
  like: { label: 'Like', emoji: '👍', color: 'text-blue-600', iconColor: 'bg-blue-600' },
  love: { label: 'Love', emoji: '❤️', color: 'text-red-500', iconColor: 'bg-red-500' },
  haha: { label: 'Haha', emoji: '😆', color: 'text-amber-500', iconColor: 'bg-amber-500' },
  wow: { label: 'Wow', emoji: '😮', color: 'text-amber-500', iconColor: 'bg-amber-500' },
  sad: { label: 'Sad', emoji: '😢', color: 'text-yellow-600', iconColor: 'bg-yellow-600' },
  angry: { label: 'Angry', emoji: '😡', color: 'text-orange-600', iconColor: 'bg-orange-600' }
};

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { currentUser, toggleReaction, addComment, deletePost, setViewingProfileUserId, t } = useApp();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const currentUserId = currentUser?.id || '';
  const userReaction = post.userReactions?.[currentUserId] as ReactionType | undefined;

  const totalReactions = Object.values(post.reactions || {}).reduce((a, b) => a + b, 0);
  const isOwner = currentUser?.id === post.userId;

  const handleQuickLike = () => {
    if (userReaction) {
      toggleReaction(post.id, userReaction);
    } else {
      toggleReaction(post.id, 'like');
    }
  };

  const handleSelectReaction = (type: ReactionType) => {
    toggleReaction(post.id, type);
    setShowReactionPicker(false);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, commentText.trim());
    setCommentText('');
    setShowComments(true);
  };

  const handleShare = () => {
    setCopiedLink(true);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <article className="bg-white dark:bg-gray-900 border-y sm:border sm:rounded-xl border-gray-200 dark:border-gray-800 transition-colors shadow-2xs mb-2.5">
      {/* Post Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setViewingProfileUserId(post.userId)}
            className="focus:outline-none"
          >
            <Avatar
              src={post.userAvatar}
              alt={post.userName}
              className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
            />
          </button>
          <div className="text-left">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setViewingProfileUserId(post.userId)}
                className="font-bold text-sm text-gray-900 dark:text-gray-100 hover:underline"
              >
                {post.userName}
              </button>
              {post.isVerified && (
                <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                  ✓
                </span>
              )}
              {post.feeling && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  nararamdaman ang <strong className="text-gray-700 dark:text-gray-300">{post.feeling}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              <span>{post.timestamp}</span>
              <span>•</span>
              {post.location && (
                <>
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-red-500" />
                    <span>{post.location}</span>
                  </span>
                  <span>•</span>
                </>
              )}
              <Globe className="w-3 h-3 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Options Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            aria-label="Iba pang opsyon"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-20 text-xs">
              <button
                onClick={() => {
                  handleShare();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Kopyahin ang Link</span>
              </button>
              {isOwner && (
                <button
                  onClick={() => {
                    deletePost(post.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Burahin ang Post</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Text Content */}
      <div className="px-3 pb-2.5">
        {post.backgroundColor ? (
          <div className={`p-6 rounded-xl ${post.backgroundColor} min-h-[140px] flex items-center justify-center text-center font-bold text-base leading-snug shadow-inner`}>
            {post.content}
          </div>
        ) : (
          <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
        )}
      </div>

      {/* Post Image (if any) */}
      {post.imageUrl && (
        <div className="w-full bg-black/5 dark:bg-black/40 overflow-hidden">
          <img
            src={post.imageUrl}
            alt="Post media"
            loading="lazy"
            className="w-full max-h-[500px] object-cover hover:scale-[1.01] transition-transform"
          />
        </div>
      )}

      {/* Reactions Summary & Comments Count */}
      <div className="px-3 py-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1.5">
          {totalReactions > 0 ? (
            <div className="flex items-center gap-1">
              <span className="flex -space-x-1">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  👍
                </span>
                {Boolean(post.reactions.love && post.reactions.love > 0) && (
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]">
                    ❤️
                  </span>
                )}
                {Boolean(post.reactions.haha && post.reactions.haha > 0) && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">
                    😆
                  </span>
                )}
              </span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {totalReactions}
              </span>
            </div>
          ) : (
            <span>Maging una sa mag-react</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowComments(!showComments)}
            className="hover:underline"
          >
            {post.comments?.length || 0} komento
          </button>
          <span>{post.sharesCount || 0} shares</span>
        </div>
      </div>

      {/* Actions Bar (Like, Comment, Share) */}
      <div className="px-1 py-1 grid grid-cols-3 relative text-xs font-semibold text-gray-600 dark:text-gray-300">
        {/* Reaction Popover */}
        {showReactionPicker && (
          <div
            onMouseLeave={() => setShowReactionPicker(false)}
            className="absolute -top-11 left-2 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 p-1 flex items-center gap-1.5 z-30 animate-scaleUp"
          >
            {(Object.keys(REACTION_CONFIG) as ReactionType[]).map((rKey) => (
              <button
                key={rKey}
                onClick={() => handleSelectReaction(rKey)}
                className="w-8 h-8 rounded-full hover:scale-125 transition-transform flex items-center justify-center text-lg active:scale-95"
                title={REACTION_CONFIG[rKey].label}
              >
                {REACTION_CONFIG[rKey].emoji}
              </button>
            ))}
          </div>
        )}

        {/* Like Button */}
        <div
          className="relative"
          onMouseEnter={() => setShowReactionPicker(true)}
        >
          <button
            onClick={handleQuickLike}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowReactionPicker(true);
            }}
            className={`w-full py-2 rounded-lg flex items-center justify-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
              userReaction
                ? `${REACTION_CONFIG[userReaction].color} font-bold`
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {userReaction ? (
              <span className="text-base">{REACTION_CONFIG[userReaction].emoji}</span>
            ) : (
              <ThumbsUp className="w-4 h-4" />
            )}
            <span>{userReaction ? REACTION_CONFIG[userReaction].label : t('like')}</span>
          </button>
        </div>

        {/* Comment Button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="py-2 rounded-lg flex items-center justify-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{t('comment')}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="py-2 rounded-lg flex items-center justify-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
          <span>{copiedLink ? 'Nai-share!' : t('share')}</span>
        </button>
      </div>

      {/* Comments Drawer / Section */}
      {showComments && (
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/30">
          {/* New Comment Input */}
          <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 mb-3">
            <Avatar
              src={currentUser?.avatar}
              alt="You"
              className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700 shrink-0"
            />
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Sumulat ng komento..."
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-3.5 py-1.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="absolute right-2 text-blue-600 disabled:text-gray-400 hover:text-blue-700"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-2.5">
            {post.comments?.length > 0 ? (
              post.comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2 text-xs">
                  <Avatar
                    src={c.userAvatar}
                    alt={c.userName}
                    className="w-7 h-7 rounded-full object-cover mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-2xl inline-block max-w-[90%]">
                      <span className="font-bold text-gray-900 dark:text-gray-100 block">
                        {c.userName}
                      </span>
                      <p className="text-gray-800 dark:text-gray-200 mt-0.5 leading-snug">
                        {c.text}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 px-2 pt-0.5 text-[10px] text-gray-500">
                      <span>{c.timestamp}</span>
                      <button className="font-bold hover:underline">I-like</button>
                      <button className="font-bold hover:underline">Sumagot</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-gray-400 py-1">
                Wala pang komento. Maging una sa magkomento!
              </p>
            )}
          </div>
        </div>
      )}
    </article>
  );
};
