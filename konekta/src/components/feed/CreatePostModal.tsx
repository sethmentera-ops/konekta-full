import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Image as ImageIcon, 
  Smile, 
  MapPin, 
  Palette, 
  Globe, 
  Sparkles,
  Upload
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Avatar } from '../common/Avatar';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BG_COLORS = [
  { id: 'plain', label: 'Plain', class: '' },
  { id: 'blue', label: 'Blue Gradient', class: 'bg-gradient-to-tr from-blue-600 to-indigo-700 text-white' },
  { id: 'sunset', label: 'Sunset', class: 'bg-gradient-to-tr from-rose-500 via-orange-500 to-amber-400 text-white' },
  { id: 'emerald', label: 'Emerald Nature', class: 'bg-gradient-to-tr from-emerald-600 to-teal-700 text-white' },
  { id: 'purple', label: 'Purple Dream', class: 'bg-gradient-to-tr from-purple-600 to-pink-600 text-white' },
  { id: 'dark', label: 'Night Sky', class: 'bg-gradient-to-tr from-gray-900 to-slate-800 text-white' }
];

const FEELINGS = [
  'Masaya 😊',
  'Kumakain ng Masarap 🍲',
  'Naglalakbay ✈️',
  'Nagpapasalamat 🙏',
  'Pagod pero Laban 💪',
  'Nag-iisip 🤔',
  'Excited 🥳',
  'In Love ❤️'
];

const PRESET_PHOTOS = [
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80'
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, createPost } = useApp();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedBg, setSelectedBg] = useState('');
  const [feeling, setFeeling] = useState('');
  const [location, setLocation] = useState('');
  const [showFeelingsList, setShowFeelingsList] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
          setSelectedBg(''); // Disable bg color if photo is added
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl) return;

    createPost(
      content.trim(),
      imageUrl || undefined,
      feeling || undefined,
      location || undefined,
      selectedBg || undefined
    );

    // Trigger celebratory confetti
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    // Reset and close
    setContent('');
    setImageUrl('');
    setSelectedBg('');
    setFeeling('');
    setLocation('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        role="dialog"
      >
        {/* Header */}
        <div className="p-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">
            Gumawa ng Post sa Konekta
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User preview */}
        <div className="p-3.5 flex items-center gap-2.5">
          <Avatar
            src={currentUser?.avatar}
            alt={currentUser?.firstName}
            className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
          />
          <div>
            <span className="font-bold text-xs text-gray-900 dark:text-white block">
              {currentUser?.firstName} {currentUser?.lastName}
            </span>
            <div className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full mt-0.5 font-medium">
              <Globe className="w-2.5 h-2.5" />
              <span>Pampubliko</span>
            </div>
          </div>
        </div>

        {/* Post text area or colorful card */}
        <div className="px-3.5 flex-1 overflow-y-auto">
          {selectedBg ? (
            <div className={`p-6 rounded-2xl ${selectedBg} min-h-[160px] flex items-center justify-center`}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Ano ang nasa isip mo?"
                rows={4}
                className="w-full bg-transparent text-center font-bold text-lg text-white placeholder-white/70 outline-none resize-none"
              />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Ano ang nasa isip mo, ${currentUser?.firstName || ''}?`}
              rows={4}
              className="w-full text-sm text-gray-900 dark:text-white placeholder:text-gray-400 bg-transparent outline-none resize-none"
            />
          )}

          {/* Active tags (feeling, location) */}
          {(feeling || location) && (
            <div className="flex flex-wrap gap-1.5 py-2">
              {feeling && (
                <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                  <Smile className="w-3 h-3 text-blue-500" />
                  <span>{feeling}</span>
                  <button onClick={() => setFeeling('')} className="ml-1 hover:text-red-500">×</button>
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                  <MapPin className="w-3 h-3 text-rose-500" />
                  <span>{location}</span>
                  <button onClick={() => setLocation('')} className="ml-1 hover:text-red-500">×</button>
                </span>
              )}
            </div>
          )}

          {/* Image preview */}
          {imageUrl && (
            <div className="relative mt-2 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
              <img src={imageUrl} alt="Attached preview" className="w-full max-h-60 object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Colored Background Selector */}
          {showBgPicker && !imageUrl && (
            <div className="p-2 mt-2 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                Pumili ng Kulay ng Background:
              </p>
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {BG_COLORS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setSelectedBg(bg.class)}
                    className={`w-7 h-7 rounded-lg shrink-0 border ${
                      bg.class || 'bg-white dark:bg-gray-800'
                    } ${selectedBg === bg.class ? 'ring-2 ring-blue-500 scale-110' : ''}`}
                    title={bg.label}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Feelings List */}
          {showFeelingsList && (
            <div className="p-2 mt-2 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                Ano ang nararamdaman mo ngayon?
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-xs max-h-36 overflow-y-auto">
                {FEELINGS.map((f, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setFeeling(f);
                      setShowFeelingsList(false);
                    }}
                    className="p-1.5 text-left rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 truncate"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sample Photo selector */}
          {showPhotoPicker && (
            <div className="p-2 mt-2 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  Mag-upload o pumili ng sample HD photo:
                </p>
                <label className="text-[11px] text-blue-600 dark:text-blue-400 font-bold cursor-pointer hover:underline flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  <span>Mag-upload</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {PRESET_PHOTOS.map((ph, i) => (
                  <img
                    key={i}
                    src={ph}
                    alt="Sample option"
                    onClick={() => {
                      setImageUrl(ph);
                      setSelectedBg('');
                      setShowPhotoPicker(false);
                    }}
                    className="h-16 w-full object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Toolbar actions (Photo, Feeling, Bg, Location) */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between gap-1 p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-3">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 ml-1">
              Idagdag sa Post:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowPhotoPicker(!showPhotoPicker)}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                title="Maglagay ng Larawan"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowFeelingsList(!showFeelingsList)}
                className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                title="Nararamdaman / Aktibidad"
              >
                <Smile className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowBgPicker(!showBgPicker)}
                className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors"
                title="Kulay ng Background"
              >
                <Palette className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const loc = prompt('Saan ka naroroon? Hal. Manila, QC, Cebu:', 'Manila, Philippines');
                  if (loc) setLocation(loc);
                }}
                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                title="Magdagdag ng Lokasyon"
              >
                <MapPin className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Submit Post button */}
          <button
            onClick={handlePostSubmit}
            disabled={!content.trim() && !imageUrl}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>I-post sa Konekta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
