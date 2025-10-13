'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Menu, X, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CartIcon } from '@/components/CartIcon';

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
    <header style={{ backgroundColor: theme.colors.background, zIndex: 9999 }} className="border-b border-gray-200 relative overflow-x-hidden">
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
                <span>Shop</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isShopDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isShopDropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-64 rounded-lg shadow-lg border z-50"
                  style={{ backgroundColor: theme.colors.white, borderColor: theme.colors.border }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 space-y-1">
                    <Link href="/collections/rose" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>Rose</Link>
                    <Link href="/collections/bouquet" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>Bouquet</Link>
                    <Link href="/collections/bouquet-in-vase" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>Bouquet in Vase</Link>
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
                <span>Occasions</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOccasionsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOccasionsDropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-72 rounded-lg shadow-lg border z-50"
                  style={{ backgroundColor: theme.colors.white, borderColor: theme.colors.border }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 space-y-1">
                    <Link href="/collections/birthday" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>Birthday</Link>
                    <Link href="/collections/anniversary" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>Anniversary</Link>
                    <Link href="/collections/love-romantic" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>Love & Romantic</Link>
                    <Link href="/collections/get-well-soon" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>Get Well Soon</Link>
                    <Link href="/collections/wedding" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>Wedding</Link>
                    <Link href="/collections/prom" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>Prom</Link>
                    <Link href="/collections/congratulations" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>Congratulations</Link>
                    <Link href="/collections/new-baby" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>New Baby</Link>
                    <Link href="/collections/grand-opening" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>Grand Opening</Link>
                    <div className="pt-2">
                      <h4 className="text-xs font-semibold mb-1" style={{ color: theme.colors.text.secondary }}>Sympathy</h4>
                      <div className="space-y-1 pl-2">
                        <Link href="/collections/wreaths" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>Wreaths</Link>
                        <Link href="/collections/casket-sprays" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>Casket Sprays</Link>
                        <Link href="/collections/sympathy-bouquets" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>Sympathy Bouquets</Link>
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
                <span>Plants</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isPlantsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isPlantsDropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-64 rounded-lg shadow-lg border z-50"
                  style={{ backgroundColor: theme.colors.white, borderColor: theme.colors.border }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 space-y-1">
                    <Link href="/collections/indoor-plants" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>Indoor Plants</Link>
                    <Link href="/collections/orchid" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>Orchid</Link>
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
                <span>Gift</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isGiftDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isGiftDropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-64 rounded-lg shadow-lg border z-50"
                  style={{ backgroundColor: theme.colors.white, borderColor: theme.colors.border }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 space-y-1">
                    <Link href="/collections/fruit-basket" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>Fruit Basket</Link>
                    <Link href="/collections/flowers-box" className="block text-sm py-1" style={{ color: theme.colors.text.light }}>Flowers Box</Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/about" className="hover:opacity-80" style={{ color: theme.colors.text.primary }}>About Us</Link>
            <Link href="/contact" className="hover:opacity-80" style={{ color: theme.colors.text.primary }}>Contact</Link>
          </nav>

          {/* Right icons */}
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <Search className="h-5 w-5 flex-shrink-0" style={{ color: theme.colors.text.primary }} />
            <CartIcon style={{ color: theme.colors.text.primary }} />
            <div className="hidden md:flex items-center space-x-2">
              {user ? (
                <>
                  <Link href="/dashboard" className="hover:opacity-80 whitespace-nowrap" style={{ color: theme.colors.text.primary }}>Dashboard</Link>
                  <Link href="/orders" className="hover:opacity-80 whitespace-nowrap" style={{ color: theme.colors.text.primary }}>Orders</Link>
                  <Link href="/profile" className="hover:opacity-80 whitespace-nowrap" style={{ color: theme.colors.text.primary }}>Profile</Link>
                  <button onClick={handleSignOut} className="hover:opacity-80 whitespace-nowrap" style={{ color: theme.colors.text.primary }}>Sign Out</button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" className="hover:opacity-80 whitespace-nowrap" style={{ color: theme.colors.text.primary }}>Sign In</Link>
                  <Link href="/auth/signup" className="hover:opacity-80 whitespace-nowrap" style={{ color: theme.colors.primary }}>Sign Up</Link>
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
        <div className="md:hidden relative z-50">
          <div className="px-2 pt-2 pb-3 space-y-4 border-t border-gray-200" style={{ backgroundColor: theme.colors.white }}>
            <div className="px-3 py-2">
              <h3 className="font-semibold mb-2" style={{ color: theme.colors.text.primary }}>Shop</h3>
              <div className="space-y-1 ml-2">
                <Link href="/collections/rose" className="block py-1" style={{ color: theme.colors.text.light }}>Rose</Link>
                <Link href="/collections/bouquet" className="block py-1" style={{ color: theme.colors.text.light }}>Bouquet</Link>
                <Link href="/collections/bouquet-in-vase" className="block py-1" style={{ color: theme.colors.text.light }}>Bouquet in Vase</Link>
              </div>
            </div>

            <div className="px-3 py-2 border-t border-gray-100">
              <h3 className="font-semibold mb-2" style={{ color: theme.colors.text.primary }}>Occasions</h3>
              <div className="space-y-1 ml-2">
                <Link href="/collections/birthday" className="block py-1" style={{ color: theme.colors.text.light }}>Birthday</Link>
                <Link href="/collections/anniversary" className="block py-1" style={{ color: theme.colors.text.light }}>Anniversary</Link>
                <Link href="/collections/love-romantic" className="block py-1" style={{ color: theme.colors.text.light }}>Love & Romantic</Link>
                <Link href="/collections/get-well-soon" className="block py-1" style={{ color: theme.colors.text.light }}>Get Well Soon</Link>
                <Link href="/collections/wedding" className="block py-1" style={{ color: theme.colors.text.light }}>Wedding</Link>
                <Link href="/collections/prom" className="block py-1" style={{ color: theme.colors.text.light }}>Prom</Link>
                <Link href="/collections/congratulations" className="block py-1" style={{ color: theme.colors.text.light }}>Congratulations</Link>
                <Link href="/collections/new-baby" className="block py-1" style={{ color: theme.colors.text.light }}>New Baby</Link>
                <Link href="/collections/grand-opening" className="block py-1" style={{ color: theme.colors.text.light }}>Grand Opening</Link>
                <div className="pt-2">
                  <h4 className="text-sm font-semibold mb-1" style={{ color: theme.colors.text.secondary }}>Sympathy</h4>
                  <div className="space-y-1 ml-2">
                    <Link href="/collections/wreaths" className="block py-1" style={{ color: theme.colors.text.light }}>Wreaths</Link>
                    <Link href="/collections/casket-sprays" className="block py-1" style={{ color: theme.colors.text.light }}>Casket Sprays</Link>
                    <Link href="/collections/sympathy-bouquets" className="block py-1" style={{ color: theme.colors.text.light }}>Sympathy Bouquets</Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-3 py-2 border-t border-gray-100">
              <h3 className="font-semibold mb-2" style={{ color: theme.colors.text.primary }}>Plants</h3>
              <div className="space-y-1 ml-2">
                <Link href="/collections/indoor-plants" className="block py-1" style={{ color: theme.colors.text.light }}>Indoor Plants</Link>
                <Link href="/collections/orchid" className="block py-1" style={{ color: theme.colors.text.light }}>Orchid</Link>
              </div>
            </div>

            <div className="px-3 py-2 border-t border-gray-100">
              <h3 className="font-semibold mb-2" style={{ color: theme.colors.text.primary }}>Gift</h3>
              <div className="space-y-1 ml-2">
                <Link href="/collections/fruit-basket" className="block py-1" style={{ color: theme.colors.text.light }}>Fruit Basket</Link>
                <Link href="/collections/flowers-box" className="block py-1" style={{ color: theme.colors.text.light }}>Flowers Box</Link>
              </div>
            </div>

            <div className="px-3 py-2 border-t border-gray-100">
              <Link href="/about" className="block py-2" style={{ color: theme.colors.text.primary }}>About Us</Link>
              <Link href="/contact" className="block py-2" style={{ color: theme.colors.text.primary }}>Contact</Link>
              {user ? (
                <>
                  <Link href="/dashboard" className="block py-2" style={{ color: theme.colors.text.primary }}>Dashboard</Link>
                  <Link href="/orders" className="block py-2" style={{ color: theme.colors.text.primary }}>Orders</Link>
                  <Link href="/profile" className="block py-2" style={{ color: theme.colors.text.primary }}>Profile</Link>
                  <button onClick={handleSignOut} className="block w-full text-left py-2 text-red-600">Sign Out</button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" className="block py-2" style={{ color: theme.colors.text.primary }}>Sign In</Link>
                  <Link href="/auth/signup" className="block py-2" style={{ color: theme.colors.primary }}>Sign Up</Link>
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