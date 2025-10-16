'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

const theme = {
  colors: {
    background: '#F0E7F2',
    primary: '#664b39',
    white: '#FFFFFF',
    text: {
      primary: '#d1ad8e',
      secondary: '#333333',
      light: '#666666',
      white: '#FFFFFF',
    },
    border: '#CCCCCC',
    hover: '#F5F5F5',
  },
};

export const LanguageSwitch: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-opacity-80 transition-colors"
      style={{ 
        color: theme.colors.text.primary,
        backgroundColor: 'transparent'
      }}
      title={t('language.switch')}
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm font-medium">
        {language === 'en' ? 'FR' : 'EN'}
      </span>
    </button>
  );
};
