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
  const { mounted } = useLanguage();

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
