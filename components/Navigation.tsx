'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Menu, X, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CartIcon } from '@/components/CartIcon';
import { LanguageSwitch } from '@/components/LanguageSwitch';

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

export const Navigation: React.FC = () => {
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const { currentUser } = useUser();
  const { t, language } = useLanguage();

  // Focused i18n debug for production when NEXT_PUBLIC_I18N_DEBUG=1
  const I18N_DEBUG = process.env.NEXT_PUBLIC_I18N_DEBUG === '1';
  if (I18N_DEBUG) {
    // eslint-disable-next-line no-console
    console.log('[i18n][Navigation] language:', language, {
      shop: t('nav.shop'),
      occasions: t('nav.occasions'),
      plants: t('nav.plants'),
      gift: t('nav.gift'),
      about: t('nav.about'),
      contact: t('nav.contact'),
      orders: t('nav.orders'),
      profile: t('nav.profile'),
      signOut: t('nav.signOut'),
      homeTitle: t('home.title'),
      homeSubtitle: t('home.subtitle'),
      homeShopNow: t('home.shopNow'),
      homeTimeLeft: t('home.timeLeftForNext'),
      homeDayDelivery: t('home.dayDelivery'),
    });
  }


  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);
  const [isOccasionsDropdownOpen, setIsOccasionsDropdownOpen] = useState(false);
  const [isPlantsDropdownOpen, setIsPlantsDropdownOpen] = useState(false);
  const [isGiftDropdownOpen, setIsGiftDropdownOpen] = useState(false);

  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setIsShopDropdownOpen(false);
    setIsOccasionsDropdownOpen(false);
    setIsPlantsDropdownOpen(false);
    setIsGiftDropdownOpen(false);
  };

  const handleLinkClick = () => {
    // Small delay to ensure navigation happens before closing menus
    setTimeout(() => {
      closeAllMenus();
    }, 100);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/signin');
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <header style={{ backgroundColor: theme.colors.background }} className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="text-xl" style={{ color: theme.colors.text.primary }}>Flower</div>
          <div className="animate-pulse h-6 w-20 rounded" style={{ backgroundColor: theme.colors.hover }} />
        </div>
      </header>
    );
  }

  return (
    <header style={{ backgroundColor: theme.colors.background, zIndex: 9999 }} className="border-b border-gray-200 relative overflow-visible">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 min-w-0">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="text-xl font-serif tracking-wider" style={{ color: theme.colors.text.primary }}>Flower</div>
              <div className="text-xs tracking-widest ml-1" style={{ color: theme.colors.text.primary }}>FLORIST</div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* Shop */}
            <div className="relative">
              <button
                className="flex items-center space-x-1"
                style={{ color: theme.colors.text.primary }}
                onClick={() => setIsShopDropdownOpen(!isShopDropdownOpen)}
              >
                <span>{t('nav.shop')}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isShopDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isShopDropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-64 rounded-lg shadow-lg border"
                  style={{ backgroundColor: theme.colors.white, borderColor: theme.colors.border, zIndex: 999999 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 space-y-1">
                    <Link href="/collections/rose" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>{t('shop.rose')}</Link>
                    <Link href="/collections/bouquet" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>{t('shop.bouquet')}</Link>
                    <Link href="/collections/bouquet-in-vase" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>{t('shop.bouquetInVase')}</Link>
                  </div>
                </div>
              )}
            </div>

            {/* Occasions */}
            <div className="relative">
              <button
                className="flex items-center space-x-1"
                style={{ color: theme.colors.text.primary }}
                onClick={() => setIsOccasionsDropdownOpen(!isOccasionsDropdownOpen)}
              >
                <span>{t('nav.occasions')}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOccasionsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOccasionsDropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-72 rounded-lg shadow-lg border"
                  style={{ backgroundColor: theme.colors.white, borderColor: theme.colors.border, zIndex: 999999 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 space-y-1">
                    <Link href="/collections/birthday" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>{t('occasions.birthday')}</Link>
                    <Link href="/collections/anniversary" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>{t('occasions.anniversary')}</Link>
                    <Link href="/collections/love-romantic" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>{t('occasions.loveRomantic')}</Link>
                    <Link href="/collections/get-well-soon" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>{t('occasions.getWellSoon')}</Link>
                    <Link href="/collections/wedding" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>{t('occasions.wedding')}</Link>
                    <Link href="/collections/prom" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>{t('occasions.prom')}</Link>
                    <Link href="/collections/congratulations" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>{t('occasions.congratulations')}</Link>
                    <Link href="/collections/new-baby" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>{t('occasions.newBaby')}</Link>
                    <Link href="/collections/grand-opening" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>{t('occasions.grandOpening')}</Link>
                    <div className="pt-2">
                      <h4 className="text-xs font-semibold mb-1" style={{ color: theme.colors.text.secondary }}>{t('occasions.sympathy')}</h4>
                      <div className="space-y-1 pl-2">
                        <Link href="/collections/wreaths" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>{t('occasions.wreaths')}</Link>
                        <Link href="/collections/casket-sprays" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>{t('occasions.casketSprays')}</Link>
                        <Link href="/collections/sympathy-bouquets" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>{t('occasions.sympathyBouquets')}</Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Plants */}
            <div className="relative">
              <button
                className="flex items-center space-x-1"
                style={{ color: theme.colors.text.primary }}
                onClick={() => setIsPlantsDropdownOpen(!isPlantsDropdownOpen)}
              >
                <span>{t('nav.plants')}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isPlantsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isPlantsDropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-64 rounded-lg shadow-lg border"
                  style={{ backgroundColor: theme.colors.white, borderColor: theme.colors.border, zIndex: 999999 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 space-y-1">
                    <Link href="/collections/indoor-plants" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>{t('shop.indoorPlants')}</Link>
                    <Link href="/collections/orchid" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>{t('shop.orchid')}</Link>
                  </div>
                </div>
              )}
            </div>

            {/* Gift */}
            <div className="relative">
              <button
                className="flex items-center space-x-1"
                style={{ color: theme.colors.text.primary }}
                onClick={() => setIsGiftDropdownOpen(!isGiftDropdownOpen)}
              >
                <span>{t('nav.gift')}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isGiftDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isGiftDropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-64 rounded-lg shadow-lg border"
                  style={{ backgroundColor: theme.colors.white, borderColor: theme.colors.border, zIndex: 999999 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 space-y-1">
                    <Link href="/collections/fruit-basket" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>{t('shop.fruitBasket')}</Link>
                    <Link href="/collections/flowers-box" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>{t('shop.flowersBox')}</Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/about" className="hover:opacity-80" style={{ color: theme.colors.text.primary }}>{t('nav.about')}</Link>
            <Link href="/contact" className="hover:opacity-80" style={{ color: theme.colors.text.primary }}>{t('nav.contact')}</Link>
          </nav>

          {/* Right icons */}
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <Search className="h-5 w-5 flex-shrink-0" style={{ color: theme.colors.text.primary }} />
            <CartIcon style={{ color: theme.colors.text.primary }} />
            <LanguageSwitch />
            <div className="hidden md:flex items-center space-x-2">
              {user ? (
                <>
                  {currentUser?.role === 'shop_owner' || currentUser?.role === 'admin' ? (
                    <Link href="/dashboard" className="hover:opacity-80 whitespace-nowrap" style={{ color: theme.colors.text.primary }}>{t('nav.dashboard')}</Link>
                  ) : null}
                  <Link href="/orders" className="hover:opacity-80 whitespace-nowrap" style={{ color: theme.colors.text.primary }}>{t('nav.orders')}</Link>
                  <Link href="/profile" className="hover:opacity-80 whitespace-nowrap" style={{ color: theme.colors.text.primary }}>{t('nav.profile')}</Link>
                  <button onClick={handleSignOut} className="hover:opacity-80 whitespace-nowrap" style={{ color: theme.colors.text.primary }}>{t('nav.signOut')}</button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" className="hover:opacity-80 whitespace-nowrap" style={{ color: theme.colors.text.primary }}>{t('nav.signIn')}</Link>
                  <Link href="/auth/signup" className="hover:opacity-80 whitespace-nowrap" style={{ color: theme.colors.primary }}>{t('nav.signUp')}</Link>
                </>
              )}
            </div>
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 flex-shrink-0"
              style={{ color: theme.colors.text.primary }}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden relative" style={{ zIndex: 999999 }}>
          <div className="px-2 pt-2 pb-3 space-y-4 border-t border-gray-200" style={{ backgroundColor: theme.colors.white }}>
            <div className="px-3 py-2">
              <h3 className="font-semibold mb-2" style={{ color: theme.colors.text.primary }}>{t('nav.shop')}</h3>
              <div className="space-y-1 ml-2">
                <Link href="/collections/rose" className="block py-1" style={{ color: theme.colors.text.light }}>{t('shop.rose')}</Link>
                <Link href="/collections/bouquet" className="block py-1" style={{ color: theme.colors.text.light }}>{t('shop.bouquet')}</Link>
                <Link href="/collections/bouquet-in-vase" className="block py-1" style={{ color: theme.colors.text.light }}>{t('shop.bouquetInVase')}</Link>
              </div>
            </div>

            <div className="px-3 py-2 border-t border-gray-100">
              <h3 className='font-semibold mb-2' style={{ color: theme.colors.text.primary }}>{t('nav.occasions')}</h3>
              <div className="space-y-1 ml-2">
                <Link href="/collections/birthday" className="block py-1" style={{ color: theme.colors.text.light }}>{t('occasions.birthday')}</Link>
                <Link href="/collections/anniversary" className="block py-1" style={{ color: theme.colors.text.light }}>{t('occasions.anniversary')}</Link>
                <Link href="/collections/love-romantic" className="block py-1" style={{ color: theme.colors.text.light }}>{t('occasions.loveRomantic')}</Link>
                <Link href="/collections/get-well-soon" className="block py-1" style={{ color: theme.colors.text.light }}>{t('occasions.getWellSoon')}</Link>
                <Link href="/collections/wedding" className="block py-1" style={{ color: theme.colors.text.light }}>{t('occasions.wedding')}</Link>
                <Link href="/collections/prom" className="block py-1" style={{ color: theme.colors.text.light }}>{t('occasions.prom')}</Link>
                <Link href="/collections/congratulations" className="block py-1" style={{ color: theme.colors.text.light }}>{t('occasions.congratulations')}</Link>
                <Link href="/collections/new-baby" className="block py-1" style={{ color: theme.colors.text.light }}>{t('occasions.newBaby')}</Link>
                <Link href="/collections/grand-opening" className="block py-1" style={{ color: theme.colors.text.light }}>{t('occasions.grandOpening')}</Link>
                <div className="pt-2">
                  <h4 className="text-sm font-semibold mb-1" style={{ color: theme.colors.text.secondary }}>{t('occasions.sympathy')}</h4>
                  <div className="space-y-1 ml-2">
                    <Link href="/collections/wreaths" className="block py-1" style={{ color: theme.colors.text.light }}>{t('occasions.wreaths')}</Link>
                    <Link href="/collections/casket-sprays" className="block py-1" style={{ color: theme.colors.text.light }}>{t('occasions.casketSprays')}</Link>
                    <Link href="/collections/sympathy-bouquets" className="block py-1" style={{ color: theme.colors.text.light }}>{t('occasions.sympathyBouquets')}</Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-3 py-2 border-t border-gray-100">
              <h3 className="font-semibold mb-2" style={{ color: theme.colors.text.primary }}>{t('nav.plants')}</h3>
              <div className="space-y-1 ml-2">
                <Link href="/collections/indoor-plants" className="block py-1" style={{ color: theme.colors.text.light }}>{t('shop.indoorPlants')}</Link>
                <Link href="/collections/orchid" className="block py-1" style={{ color: theme.colors.text.light }}>{t('shop.orchid')}</Link>
              </div>
            </div>

            <div className="px-3 py-2 border-t border-gray-100">
              <h3 className="font-semibold mb-2" style={{ color: theme.colors.text.primary }}>{t('nav.gift')}</h3>
              <div className="space-y-1 ml-2">
                <Link href="/collections/fruit-basket" className="block py-1" style={{ color: theme.colors.text.light }}>{t('shop.fruitBasket')}</Link>
                <Link href="/collections/flowers-box" className="block py-1" style={{ color: theme.colors.text.light }}>{t('shop.flowersBox')}</Link>
              </div>
            </div>

            <div className="px-3 py-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: theme.colors.text.primary }}>{t('language.switch')}</span>
                <LanguageSwitch />
              </div>
              <Link href="/about" className="block py-2" style={{ color: theme.colors.text.primary }}>{t('nav.about')}</Link>
              <Link href="/contact" className="block py-2" style={{ color: theme.colors.text.primary }}>{t('nav.contact')}</Link>
              {user ? (
                <>
                  {currentUser?.role === 'shop_owner' || currentUser?.role === 'admin' ? (
                    <Link href="/dashboard" className="block py-2" style={{ color: theme.colors.text.primary }}>{t('nav.dashboard')}</Link>
                  ) : null}
                  <Link href="/orders" className="block py-2" style={{ color: theme.colors.text.primary }}>{t('nav.orders')}</Link>
                  <Link href="/profile" className="block py-2" style={{ color: theme.colors.text.primary }}>{t('nav.profile')}</Link>
                  <button onClick={handleSignOut} className="block w-full text-left py-2 text-red-600">{t('nav.signOut')}</button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" className="block py-2" style={{ color: theme.colors.text.primary }}>{t('nav.signIn')}</Link>
                  <Link href="/auth/signup" className="block py-2" style={{ color: theme.colors.primary }}>{t('nav.signUp')}</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close */}
      {(isMobileMenuOpen || isShopDropdownOpen || isOccasionsDropdownOpen || isPlantsDropdownOpen || isGiftDropdownOpen) && (
        <div className="fixed inset-0 z-40" onClick={closeAllMenus} />
      )}
    </header>
  );
};