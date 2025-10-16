'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface AfterHydrationProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that only renders children after hydration is complete
 * This prevents SSR/hydration mismatches for translation-dependent content
 */
export const AfterHydration: React.FC<AfterHydrationProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { isHydrated } = useLanguage();

  if (!isHydrated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
