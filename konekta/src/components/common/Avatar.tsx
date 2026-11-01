import React, { useState } from 'react';

// Authentic Facebook Lite default silhouette (neutral gray head-and-shoulders on light-gray circle)
export const FB_LITE_DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23D8DADF'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%238A8D91'/%3E%3Cpath d='M50 63 C33 63 20 75 18 96 C18 98 19 100 21 100 L79 100 C81 100 82 98 82 96 C80 75 67 63 50 63 Z' fill='%238A8D91'/%3E%3C/svg%3E";

// Detect if an avatar is one of the old stock/AI portrait photos
export function isAIAvatar(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed === FB_LITE_DEFAULT_AVATAR) return false;
  if (
    trimmed.includes('photo-1535713875002-d1d0cf377fde') ||
    trimmed.includes('photo-1618005182384-a83a8bd57fbe') ||
    trimmed.includes('photo-1534528741775') ||
    trimmed.includes('photo-1517841905240') ||
    trimmed.includes('photo-1507003211169') ||
    trimmed.includes('photo-1494790108377') ||
    trimmed.includes('photo-1500648767791')
  ) {
    return true;
  }
  return false;
}

// Return authentic FB Lite silhouette if empty or legacy AI avatar
export function getCleanAvatar(url?: string | null): string {
  if (!url || typeof url !== 'string' || url.trim() === '' || isAIAvatar(url)) {
    return FB_LITE_DEFAULT_AVATAR;
  }
  return url;
}

interface AvatarProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  alt?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Profile',
  className = 'w-10 h-10 rounded-full object-cover',
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);
  const cleanSrc = hasError ? FB_LITE_DEFAULT_AVATAR : getCleanAvatar(src);

  return (
    <img
      src={cleanSrc}
      alt={alt}
      onError={() => setHasError(true)}
      className={`${className} bg-gray-200 dark:bg-gray-700`}
      {...rest}
    />
  );
};
