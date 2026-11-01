import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PostCard } from './PostCard';
import { CreatePostModal } from './CreatePostModal';
import { StoryViewerModal } from './StoryViewerModal';
import { Story } from '../../types';
import { StorageService } from '../../services/storage';
import { Avatar } from '../common/Avatar';
import { 
  Plus, 
  Image as ImageIcon, 
  Smile, 
  Video, 
  Sparkles, 
  RefreshCw,
  Search,
  Users
} from 'lucide-react';

export const FeedView: React.FC = () => {
  const { 
    currentUser, 
    users,
    posts, 
    stories, 
    searchQuery, 
    setSearchQuery,
    setViewingProfileUserId,
    addStory,
    t
  } = useApp();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'friends' | 'photos'>('all');

  // Filter posts based on search query and filter pills
  const filteredPosts = posts.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = p.content.toLowerCase().includes(q);
      const matchUser = p.userName.toLowerCase().includes(q);
      const matchFeeling = p.feeling?.toLowerCase().includes(q);
      if (!matchText && !matchUser && !matchFeeling) return false;
    }

    if (filterType === 'photos') {
      return Boolean(p.imageUrl);
    }
    if (filterType === 'friends') {
      const friends = currentUser ? StorageService.getFriends(currentUser.id) : [];
      return friends.includes(p.userId) || p.userId === currentUser?.id;
    }
    return true;
  });

  const handleCreateStoryClick = () => {
    const sampleStoryPhotos = [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&auto=format&fit=crop&q=80'
    ];
    const chosen = sampleStoryPhotos[Math.floor(Math.random() * sampleStoryPhotos.length)];
    const cap = prompt('Maglagay ng caption para sa iyong bagong Story:', 'Magandang araw sa lahat! ☀️🇵🇭');
    if (cap !== null) {
      addStory(chosen, cap || undefined);
    }
  };

  return (
    <div className="max-w-xl mx-auto pb-16">
      {/* Search Header Banner (if active search) */}
      {searchQuery && (
        <div className="bg-blue-50 dark:bg-blue-950/40 p-2.5 mx-2 my-2 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-200">
            <Search className="w-3.5 h-3.5 text-blue-600" />
            <span>Resulta ng paghahanap para sa: <strong>"{searchQuery}"</strong> ({filteredPosts.length})</span>
          </div>
          <button
            onClick={() => setSearchQuery('')}
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
          >
            I-clear
          </button>
        </div>
      )}

      {/* Stories Tray */}
      <div className="bg-white dark:bg-gray-900 border-b sm:border sm:rounded-xl border-gray-200 dark:border-gray-800 p-3 mb-2.5 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* Create Story Card */}
          <div
            onClick={handleCreateStoryClick}
            className="relative shrink-0 w-24 h-36 rounded-xl overflow-hidden cursor-pointer group border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 transition-all hover:scale-102"
          >
            <Avatar
              src={currentUser?.avatar}
              alt="You"
              className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute top-[82px] left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-blue-600 border-2 border-white dark:border-gray-900 flex items-center justify-center text-white shadow-sm">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <div className="absolute bottom-1.5 inset-x-1 text-center">
              <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200 block leading-tight">
                {t('createStory')}
              </span>
            </div>
          </div>

          {/* Friends' Stories */}
          {stories.map((story) => (
            <div
              key={story.id}
              onClick={() => setActiveStory(story)}
              className="relative shrink-0 w-24 h-36 rounded-xl overflow-hidden cursor-pointer group shadow-xs transition-all hover:scale-102"
            >
              <img
                src={story.mediaUrl}
                alt={story.userName}
                className="w-full h-full object-cover brightness-90 group-hover:brightness-100 group-hover:scale-105 transition-all"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
              
              {/* User Avatar badge */}
              <div className="absolute top-2 left-2 ring-2 ring-blue-500 rounded-full overflow-hidden w-7 h-7 shadow-sm">
                <Avatar src={story.userAvatar} alt={story.userName} className="w-full h-full object-cover" />
              </div>

              {/* User Name */}
              <div className="absolute bottom-1.5 inset-x-1.5">
                <p className="text-[10px] font-bold text-white leading-tight drop-shadow-sm truncate">
                  {story.userName}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Status Composer Trigger Bar (Facebook Lite classic) */}
      <div className="bg-white dark:bg-gray-900 border-y sm:border sm:rounded-xl border-gray-200 dark:border-gray-800 p-3 mb-2.5 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => currentUser && setViewingProfileUserId(currentUser.id)}
            className="shrink-0"
          >
            <Avatar
              src={currentUser?.avatar}
              alt="You"
              className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
            />
          </button>
          
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-1 text-left bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700/80 rounded-full px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 transition-colors"
          >
            {t('whatsOnYourMind')}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1 pt-2.5 mt-2 border-t border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="py-1.5 flex items-center justify-center gap-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-rose-500"
          >
            <Video className="w-4 h-4" />
            <span className="text-gray-700 dark:text-gray-300 text-[11px]">{t('live')}</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="py-1.5 flex items-center justify-center gap-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-emerald-500"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="text-gray-700 dark:text-gray-300 text-[11px]">{t('photo')}</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="py-1.5 flex items-center justify-center gap-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-amber-500"
          >
            <Smile className="w-4 h-4" />
            <span className="text-gray-700 dark:text-gray-300 text-[11px]">{t('feeling')}</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="px-3 py-1 flex items-center gap-1.5 overflow-x-auto mb-2 text-xs">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1 rounded-full font-semibold transition-colors ${
            filterType === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
          }`}
        >
          Lahat
        </button>
        <button
          onClick={() => setFilterType('friends')}
          className={`px-3 py-1 rounded-full font-semibold transition-colors ${
            filterType === 'friends'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
          }`}
        >
          Mga Kaibigan
        </button>
        <button
          onClick={() => setFilterType('photos')}
          className={`px-3 py-1 rounded-full font-semibold transition-colors ${
            filterType === 'photos'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
          }`}
        >
          Mga May Larawan
        </button>
      </div>

      {/* Post List */}
      <div>
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="p-8 text-center bg-white dark:bg-gray-900 border sm:rounded-xl border-gray-200 dark:border-gray-800 text-gray-500">
            <p className="text-sm font-semibold">Walang nahanap na post.</p>
            <p className="text-xs text-gray-400 mt-1">
              Subukang baguhin ang iyong paghahanap o mag-post ng bago!
            </p>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Story Viewer Modal */}
      <StoryViewerModal
        story={activeStory}
        onClose={() => setActiveStory(null)}
      />
    </div>
  );
};
