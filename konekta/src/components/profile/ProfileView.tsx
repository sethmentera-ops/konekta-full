import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PostCard } from '../feed/PostCard';
import { StorageService } from '../../services/storage';
import { 
  ArrowLeft, 
  Camera, 
  Edit3, 
  MapPin, 
  Briefcase, 
  Calendar, 
  MessageCircle, 
  UserCheck, 
  UserPlus,
  Clock,
  Share2,
  Upload,
  Image as ImageIcon,
  Check,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Avatar, FB_LITE_DEFAULT_AVATAR } from '../common/Avatar';

interface ProfileViewProps {
  userId: string;
  onBack: () => void;
}

const PRESET_COVER_GRADIENTS = [
  { name: 'Classic Blue', bg: 'linear-gradient(135deg, #1877f2 0%, #0d5cb6 100%)' },
  { name: 'Dark Slate', bg: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)' },
  { name: 'Emerald', bg: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)' },
  { name: 'Sunset Warmth', bg: 'linear-gradient(135deg, #ea580c 0%, #9a3412 100%)' },
];

const PRESET_COLOR_AVATARS = [
  { name: 'Classic Gray', url: FB_LITE_DEFAULT_AVATAR },
  { name: 'Ocean Blue', url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23DBEAFE'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%231D4ED8'/%3E%3Cpath d='M50 63 C33 63 20 75 18 96 C18 98 19 100 21 100 L79 100 C81 100 82 98 82 96 C80 75 67 63 50 63 Z' fill='%231D4ED8'/%3E%3C/svg%3E" },
  { name: 'Emerald', url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23D1FAE5'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23047857'/%3E%3Cpath d='M50 63 C33 63 20 75 18 96 C18 98 19 100 21 100 L79 100 C81 100 82 98 82 96 C80 75 67 63 50 63 Z' fill='%23047857'/%3E%3C/svg%3E" },
  { name: 'Indigo', url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23EDE9FE'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%236D28D9'/%3E%3Cpath d='M50 63 C33 63 20 75 18 96 C18 98 19 100 21 100 L79 100 C81 100 82 98 82 96 C80 75 67 63 50 63 Z' fill='%236D28D9'/%3E%3C/svg%3E" },
];

export const ProfileView: React.FC<ProfileViewProps> = ({ userId, onBack }) => {
  const { 
    currentUser, 
    users, 
    posts, 
    setActiveChatUserId, 
    setActiveTab, 
    updateUserProfile, 
    getFriendshipStatus,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    t 
  } = useApp();

  const profileUser = users.find((u) => u.id === userId) || currentUser;
  const isMe = currentUser?.id === userId;

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(profileUser?.bio || '');
  const [locationText, setLocationText] = useState(profileUser?.location || '');
  const [workText, setWorkText] = useState(profileUser?.work || '');
  const [activeTab, setActiveTabLocal] = useState<'posts' | 'about' | 'photos'>('posts');
  const [copiedToast, setCopiedToast] = useState(false);
  
  // Modals for photo choosing
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  if (!profileUser) return null;

  const userPosts = posts.filter((p) => p.userId === profileUser.id);

  // Update profile avatar
  const handleUpdateAvatar = (newAvatarUrl: string) => {
    if (!currentUser) return;
    const updated = {
      ...profileUser,
      avatar: newAvatarUrl,
    };
    updateUserProfile(updated);
    setShowAvatarPicker(false);
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
  };

  // Upload file for avatar
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleUpdateAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Update cover photo
  const handleUpdateCover = (newCoverUrl: string) => {
    if (!currentUser) return;
    const updated = {
      ...profileUser,
      coverPhoto: newCoverUrl,
    };
    updateUserProfile(updated);
    setShowCoverPicker(false);
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.5 } });
  };

  // Upload file for cover
  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleUpdateCover(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    if (!currentUser) return;
    const updated = {
      ...profileUser,
      bio: bioText,
      location: locationText,
      work: workText,
    };
    updateUserProfile(updated);
    setIsEditingBio(false);
    confetti({ particleCount: 30, spread: 50 });
  };

  const handleMessage = () => {
    setActiveChatUserId(profileUser.id);
    setActiveTab('messages');
  };

  return (
    <div className="max-w-xl mx-auto pb-16 bg-white dark:bg-gray-900 border-x border-gray-200 dark:border-gray-800 transition-colors">
      {/* Top sticky bar */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-[49px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xs z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-sm text-gray-900 dark:text-white">
            {profileUser.firstName} {profileUser.lastName}
          </h2>
        </div>

        <div className="relative">
          <button
            onClick={() => {
              confetti({ particleCount: 20 });
              setCopiedToast(true);
              setTimeout(() => setCopiedToast(false), 2200);
            }}
            className="p-1.5 text-gray-500 hover:text-blue-600 rounded-full"
            title="I-share ang Profile"
          >
            <Share2 className="w-4 h-4" />
          </button>
          {copiedToast && (
            <div className="absolute right-0 top-8 z-30 px-2.5 py-1 bg-gray-900 text-white text-[11px] font-bold rounded-lg whitespace-nowrap shadow-md flex items-center gap-1 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Na-kopya ang link!</span>
            </div>
          )}
        </div>
      </div>

      {/* Cover Photo */}
      <div 
        className="relative h-44 sm:h-52 bg-gradient-to-r from-blue-600 to-indigo-700 overflow-hidden"
        style={profileUser.coverPhoto && profileUser.coverPhoto.startsWith('linear-gradient') ? { background: profileUser.coverPhoto } : undefined}
      >
        {profileUser.coverPhoto && !profileUser.coverPhoto.startsWith('linear-gradient') ? (
          <img
            src={profileUser.coverPhoto}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : !profileUser.coverPhoto ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/70 text-xs font-semibold gap-1 bg-gradient-to-r from-gray-600 to-gray-700 dark:from-gray-800 dark:to-gray-900">
            {isMe && (
              <>
                <Camera className="w-6 h-6 opacity-60" />
                <span>Walang cover photo. Pindutin sa ibaba para maglagay.</span>
              </>
            )}
          </div>
        ) : null}

        {/* Change Cover Photo Button (Owner only) */}
        {isMe && (
          <div className="absolute bottom-2.5 right-2.5 z-10">
            <button
              onClick={() => setShowCoverPicker(!showCoverPicker)}
              className="px-2.5 py-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-xs text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>
                {profileUser.coverPhoto ? 'Palitan ang Cover Photo' : 'Maglagay ng Cover Photo'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Cover Photo Selection Tray */}
      {showCoverPicker && isMe && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 animate-fadeIn space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
              Pumili o mag-upload ng Cover Photo:
            </span>
            <label className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 cursor-pointer hover:underline bg-white dark:bg-gray-700 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-600">
              <Upload className="w-3.5 h-3.5" />
              <span>Mag-upload mula sa Gallery</span>
              <input type="file" accept="image/*" onChange={handleCoverFileUpload} className="hidden" />
            </label>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {profileUser.coverPhoto && (
              <button
                type="button"
                onClick={() => handleUpdateCover('')}
                className="h-14 px-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 text-xs font-bold flex items-center gap-1 shrink-0 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Alisin ang Cover</span>
              </button>
            )}

            {PRESET_COVER_GRADIENTS.map((cov, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleUpdateCover(cov.bg)}
                style={{ background: cov.bg }}
                className="h-14 w-28 rounded-xl cursor-pointer hover:opacity-90 transition-opacity border-2 border-transparent hover:border-blue-500 shrink-0 text-[11px] font-bold text-white flex items-center justify-center shadow-xs"
              >
                {cov.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Profile Avatar & Info Header */}
      <div className="px-4 pb-3 relative">
        <div className="flex items-end justify-between -mt-16 sm:-mt-20 mb-3">
          {/* Avatar with Camera Button */}
          <div className="relative group">
            <Avatar
              src={profileUser.avatar}
              alt={profileUser.firstName}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover ring-4 ring-white dark:ring-gray-900 shadow-md"
            />
            
            {/* Change Profile Photo Badge (Owner only) */}
            {isMe && (
              <button
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-lg transition-transform active:scale-95"
                title="Palitan ang Profile Photo"
                aria-label="Palitan ang Profile Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 pt-8">
            {isMe ? (
              <button
                onClick={() => setIsEditingBio(!isEditingBio)}
                className="px-3.5 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-gray-200 dark:border-gray-700"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>I-edit ang Profile</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMessage}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Mag-message</span>
                </button>
                {getFriendshipStatus(profileUser.id) === 'friends' && (
                  <span className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Magkaibigan</span>
                  </span>
                )}
                {getFriendshipStatus(profileUser.id) === 'requested' && (
                  <button
                    onClick={() => cancelFriendRequest(profileUser.id)}
                    className="px-3.5 py-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-xl flex items-center gap-1 border border-amber-200 dark:border-amber-800 active:scale-95 transition-all"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Naipadala na (Kanselahin)</span>
                  </button>
                )}
                {getFriendshipStatus(profileUser.id) === 'received' && (
                  <button
                    onClick={() => {
                      acceptFriendRequest(profileUser.id);
                      confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs active:scale-95 transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Kumpirmahin</span>
                  </button>
                )}
                {getFriendshipStatus(profileUser.id) === 'none' && (
                  <button
                    onClick={() => {
                      sendFriendRequest(profileUser.id);
                      confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs active:scale-95 transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Magdagdag</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Avatar Selection Tray */}
        {showAvatarPicker && isMe && (
          <div className="p-3 mb-3 bg-gray-50 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 animate-fadeIn space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                Palitan ang Profile Photo:
              </span>
              <label className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 cursor-pointer hover:underline bg-white dark:bg-gray-700 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-600 shadow-2xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Pumili mula sa Gallery</span>
                <input type="file" accept="image/*" onChange={handleAvatarFileUpload} className="hidden" />
              </label>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {/* Reset to FB Lite Default Silhouette button */}
              <button
                type="button"
                onClick={() => handleUpdateAvatar(FB_LITE_DEFAULT_AVATAR)}
                className="h-12 px-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold flex items-center gap-1.5 shrink-0 hover:bg-gray-100 transition-colors shadow-2xs"
                title="Ibalik sa default na silhouette ng FB Lite"
              >
                <Trash2 className="w-3.5 h-3.5 text-gray-500" />
                <span>Alisin ang Larawan (Default)</span>
              </button>

              {/* Color silhouette presets */}
              {PRESET_COLOR_AVATARS.map((av, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleUpdateAvatar(av.url)}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:border-blue-500 transition-colors"
                >
                  <img
                    src={av.url}
                    alt={av.name}
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                  />
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {av.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* User Name & Bio */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-black text-gray-900 dark:text-white">
              {profileUser.firstName} {profileUser.lastName}
            </h1>
          </div>

          {/* Bio display or editor */}
          {isEditingBio ? (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-2 mt-2">
              <label className="text-[11px] font-bold text-gray-500">I-edit ang Bio:</label>
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                className="w-full p-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-gray-500">Lokasyon:</label>
                  <input
                    type="text"
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    className="w-full p-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">Trabaho:</label>
                  <input
                    type="text"
                    value={workText}
                    onChange={(e) => setWorkText(e.target.value)}
                    className="w-full p-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsEditingBio(false)}
                  className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded-lg"
                >
                  Kanselahin
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-3 py-1 text-xs bg-blue-600 text-white font-bold rounded-lg"
                >
                  I-save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
              {profileUser.bio}
            </p>
          )}

          {/* Details metadata */}
          <div className="pt-2 space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
            {profileUser.work && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>Nagtatrabaho bilang <strong className="text-gray-800 dark:text-gray-200">{profileUser.work}</strong></span>
              </div>
            )}
            {profileUser.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>Nakatira sa <strong className="text-gray-800 dark:text-gray-200">{profileUser.location}</strong></span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>Sumali sa Konekta</span>
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 mt-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTabLocal('posts')}
            className={`py-2 px-4 border-b-2 transition-colors ${
              activeTab === 'posts'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-gray-500'
            }`}
          >
            Mga Post ({userPosts.length})
          </button>
          <button
            onClick={() => setActiveTabLocal('photos')}
            className={`py-2 px-4 border-b-2 transition-colors ${
              activeTab === 'photos'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-gray-500'
            }`}
          >
            Mga Larawan
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-3">
        {activeTab === 'posts' && (
          <div>
            {userPosts.length > 0 ? (
              userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="p-6 text-center text-gray-400 text-xs">
                Wala pang mga nai-post.
              </div>
            )}
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="grid grid-cols-3 gap-1.5">
            {userPosts
              .filter((p) => p.imageUrl)
              .map((p) => (
                <img
                  key={p.id}
                  src={p.imageUrl}
                  alt="User photo"
                  className="w-full h-28 object-cover rounded-lg"
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
