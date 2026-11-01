import React from 'react';
import { useApp } from '../../context/AppContext';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../services/translations';
import { X, Globe, Check } from 'lucide-react';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage, t } = useApp();

  if (!isOpen) return null;

  const handleSelectLanguage = (code: SupportedLanguage) => {
    setLanguage(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-scaleUp"
        role="dialog"
      >
        {/* Header */}
        <div className="p-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                {t('language')}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {t('languageDesc')}
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

        {/* Languages List */}
        <div className="p-3 space-y-1.5">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`w-full p-3 rounded-xl flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300 font-bold'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-800 dark:text-gray-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{lang.flag}</span>
                  <div className="text-left">
                    <p className="text-xs font-bold leading-tight">{lang.name}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{lang.nativeName}</p>
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[3]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
