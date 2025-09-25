'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ChevronDown, Search, ShoppingCart, User, Menu, X } from 'lucide-react';
import { CartIcon } from '@/components/CartIcon';

// Reusable theme object matching the landing page
const theme = {
  colors: {
    background: '#F0E7F2',
    primary: '#664b39',
    secondary: '#E07A5F',
    white: '#FFFFFF',
    text: {
      primary: '#d1ad8e',
      secondary: '#333333',
      light: '#666666',
      white: '#FFFFFF'
    },
    border: '#CCCCCC',
    hover: '#F5F5F5',
    countdown: {
      background: '#664b39',
      text: '#FFFFFF'
    }
  }
}

export const Navigation: React.FC = () => {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push('/auth/signin');
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <header style={{ backgroundColor: theme.colors.background, zIndex: 9999 }} className="backdrop-blur-sm border-b border-gray-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <div className="text-xl font-serif tracking-wider" style={{ color: theme.colors.text.primary }}>Flower</div>
              <div className="text-xs tracking-widest" style={{ color: theme.colors.text.primary }}>FLORIST</div>
            </div>
            <div className="animate-pulse h-8 w-32 rounded" style={{ backgroundColor: theme.colors.hover }}></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header style={{ backgroundColor: theme.colors.background, zIndex: 9999 }} className="backdrop-blur-sm border-b border-gray-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="text-xl font-serif tracking-wider" style={{ color: theme.colors.text.primary }}>Flower</div>
              <div className="text-xs tracking-widest" style={{ color: theme.colors.text.primary }}>FLORIST</div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {/* Shop Dropdown */}
            <div className="relative">
              <div 
                className="flex items-center space-x-1 cursor-pointer" 
                style={{ color: theme.colors.text.primary }}
                onClick={() => setIsShopDropdownOpen(!isShopDropdownOpen)}
              >
                <span>Shop</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isShopDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {/* Shop Dropdown Menu */}
              {isShopDropdownOpen && (
                <div 
                  className="absolute top-full left-0 mt-2 w-64 rounded-lg shadow-lg border"
                  style={{ 
                    backgroundColor: theme.colors.white,
                    borderColor: theme.colors.border,
                    zIndex: 99999 
                  }}
                >
                  <div className="p-4">
                    {/* Popular */}
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2" style={{ color: theme.colors.text.primary }}>Popular</h3>
                      <div className="space-y-1">
                        <Link 
                          href="/collections/best-sellers" 
                          className="block text-sm py-1 transition-colors"
                          style={{ color: theme.colors.text.light }}
                          onClick={() => setIsShopDropdownOpen(false)}
                        >
                          Best Sellers
                        </Link>
                        <Link 
                          href="/collections/bouquets" 
                          className="block text-sm py-1 transition-colors"
                          style={{ color: theme.colors.text.light }}
                          onClick={() => setIsShopDropdownOpen(false)}
                        >
                          Bouquets
                        </Link>
                        <Link 
                          href="/collections/orchids" 
                          className="block text-sm py-1 transition-colors"
                          style={{ color: theme.colors.text.light }}
                          onClick={() => setIsShopDropdownOpen(false)}
                        >
                          Orchids
                        </Link>
                      </div>
                    </div>

                    {/* Occasions */}
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2" style={{ color: theme.colors.text.primary }}>Occasions</h3>
                      <div className="space-y-1">
                        <Link 
                          href="/collections/birthday" 
                          className="block text-sm py-1 transition-colors"
                          style={{ color: theme.colors.text.light }}
                          onClick={() => setIsShopDropdownOpen(false)}
                        >
                          Birthday
                        </Link>
                        <Link 
                          href="/collections/get-well-soon" 
                          className="block text-sm py-1 transition-colors"
                          style={{ color: theme.colors.text.light }}
                          onClick={() => setIsShopDropdownOpen(false)}
                        >
                          Get Well Soon
                        </Link>
                        <Link 
                          href="/collections/anniversary" 
                          className="block text-sm py-1 transition-colors"
                          style={{ color: theme.colors.text.light }}
                          onClick={() => setIsShopDropdownOpen(false)}
                        >
                          Anniversary
                        </Link>
                        <Link 
                          href="/collections/sympathy" 
                          className="block text-sm py-1 transition-colors"
                          style={{ color: theme.colors.text.light }}
                          onClick={() => setIsShopDropdownOpen(false)}
                        >
                          Sympathy
                        </Link>
                        <Link 
                          href="/collections/congratulation" 
                          className="block text-sm py-1 transition-colors"
                          style={{ color: theme.colors.text.light }}
                          onClick={() => setIsShopDropdownOpen(false)}
                        >
                          Congratulation
                        </Link>
                        <Link 
                          href="/collections/wedding" 
                          className="block text-sm py-1 transition-colors"
                          style={{ color: theme.colors.text.light }}
                          onClick={() => setIsShopDropdownOpen(false)}
                        >
                          Wedding
                        </Link>
                        <Link 
                          href="/collections/new-baby" 
                          className="block text-sm py-1 transition-colors"
                          style={{ color: theme.colors.text.light }}
                          onClick={() => setIsShopDropdownOpen(false)}
                        >
                          New Baby
                        </Link>
                      </div>
                    </div>

                    {/* Plants & Flowers */}
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2" style={{ color: theme.colors.text.primary }}>Plants & Flowers</h3>
                      <div className="space-y-1">
                        <Link 
                          href="/collections/orchid" 
                          className="block text-sm py-1 transition-colors"
                          style={{ color: theme.colors.text.light }}
                          onClick={() => setIsShopDropdownOpen(false)}
                        >
                          Orchid
                        </Link>
                        <Link 
                          href="/collections/rose-only" 
                          className="block text-sm py-1 transition-colors"
                          style={{ color: theme.colors.text.light }}
                          onClick={() => setIsShopDropdownOpen(false)}
                        >
                          Rose Only
                        </Link>
                        <Link 
                          href="/collections/indoor-plant" 
                          className="block text-sm py-1 transition-colors"
                          style={{ color: theme.colors.text.light }}
                          onClick={() => setIsShopDropdownOpen(false)}
                        >
                          Indoor Plant
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link href="/collections/best-sellers" className="font-medium" style={{ color: theme.colors.text.primary }}>
              Best Sellers
            </Link>
            <Link href="/about" className="hover:text-gray-900" style={{ color: theme.colors.text.primary }}>
              About Us
            </Link>
            <Link href="/store-location" className="hover:text-gray-900" style={{ color: theme.colors.text.primary }}>
              Store Location
            </Link>
            <Link href="/contact" className="hover:text-gray-900" style={{ color: theme.colors.text.primary }}>
              Contact
            </Link>
          </nav>

          {/* Right side icons and user menu */}
          <div className="flex items-center space-x-4">
            <Search className="h-5 w-5 cursor-pointer" style={{ color: theme.colors.text.primary }} />
            <CartIcon style={{ color: theme.colors.text.primary }} />
            
            {/* User Authentication */}
            {user ? (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md p-2"
                  style={{ color: theme.colors.text.primary }}
                >
                  <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.colors.primary }}>
                    <span className="text-sm font-medium" style={{ color: theme.colors.text.white }}>
                      {user.user_metadata?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="hidden lg:block text-sm font-medium">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50" style={{ backgroundColor: theme.colors.white, borderColor: theme.colors.border, border: '1px solid' }}>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm hover:bg-gray-100"
                      style={{ color: theme.colors.text.secondary }}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm hover:bg-gray-100"
                      style={{ color: theme.colors.text.secondary }}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sm hover:bg-gray-100"
                      style={{ color: theme.colors.text.secondary }}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      My Orders
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 disabled:opacity-50"
                    >
                      {isSigningOut ? 'Signing out...' : 'Sign Out'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/signin"
                  className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  style={{ color: theme.colors.text.primary }}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  style={{ backgroundColor: theme.colors.primary, color: theme.colors.text.white }}
                >
                  Sign Up
                </Link>
              </div>
            )}

            <span className="text-sm" style={{ color: theme.colors.text.primary }}>EN</span>

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              style={{ color: theme.colors.text.primary }}
            >
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200" style={{ backgroundColor: theme.colors.white }}>
            {/* Popular */}
            <div className="px-3 py-2">
              <h3 className="font-semibold mb-2" style={{ color: theme.colors.text.primary }}>Popular</h3>
              <div className="space-y-1 ml-2">
                <Link
                  href="/collections/best-sellers"
                  className="block text-base font-medium hover:text-gray-900 hover:bg-gray-50 py-1"
                  style={{ color: theme.colors.text.light }}
                  onClick={closeMobileMenu}
                >
                  Best Sellers
                </Link>
                <Link
                  href="/collections/bouquets"
                  className="block text-base font-medium hover:text-gray-900 hover:bg-gray-50 py-1"
                  style={{ color: theme.colors.text.light }}
                  onClick={closeMobileMenu}
                >
                  Bouquets
                </Link>
                <Link
                  href="/collections/orchids"
                  className="block text-base font-medium hover:text-gray-900 hover:bg-gray-50 py-1"
                  style={{ color: theme.colors.text.light }}
                  onClick={closeMobileMenu}
                >
                  Orchids
                </Link>
              </div>
            </div>

            {/* Occasions */}
            <div className="px-3 py-2 border-t border-gray-100">
              <h3 className="font-semibold mb-2" style={{ color: theme.colors.text.primary }}>Occasions</h3>
              <div className="space-y-1 ml-2">
                <Link
                  href="/collections/birthday"
                  className="block text-base font-medium hover:text-gray-900 hover:bg-gray-50 py-1"
                  style={{ color: theme.colors.text.light }}
                  onClick={closeMobileMenu}
                >
                  Birthday
                </Link>
                <Link
                  href="/collections/anniversary"
                  className="block text-base font-medium hover:text-gray-900 hover:bg-gray-50 py-1"
                  style={{ color: theme.colors.text.light }}
                  onClick={closeMobileMenu}
                >
                  Anniversary
                </Link>
                <Link
                  href="/collections/sympathy"
                  className="block text-base font-medium hover:text-gray-900 hover:bg-gray-50 py-1"
                  style={{ color: theme.colors.text.light }}
                  onClick={closeMobileMenu}
                >
                  Sympathy
                </Link>
              </div>
            </div>

            {/* Plants & Flowers */}
            <div className="px-3 py-2 border-t border-gray-100">
              <h3 className="font-semibold mb-2" style={{ color: theme.colors.text.primary }}>Plants & Flowers</h3>
              <div className="space-y-1 ml-2">
                <Link
                  href="/collections/indoor-plants"
                  className="block text-base font-medium hover:text-gray-900 hover:bg-gray-50 py-1"
                  style={{ color: theme.colors.text.light }}
                  onClick={closeMobileMenu}
                >
                  Indoor Plants
                </Link>
                <Link
                  href="/collections/roses"
                  className="block text-base font-medium hover:text-gray-900 hover:bg-gray-50 py-1"
                  style={{ color: theme.colors.text.light }}
                  onClick={closeMobileMenu}
                >
                  Roses
                </Link>
                <Link
                  href="/collections/sunflowers"
                  className="block text-base font-medium hover:text-gray-900 hover:bg-gray-50 py-1"
                  style={{ color: theme.colors.text.light }}
                  onClick={closeMobileMenu}
                >
                  Sunflowers
                </Link>
              </div>
            </div>

            {/* Main Links */}
            <div className="px-3 py-2 border-t border-gray-100">
              <Link
                href="/about"
                className="block text-base font-medium hover:text-gray-900 hover:bg-gray-50 py-2"
                style={{ color: theme.colors.text.primary }}
                onClick={closeMobileMenu}
              >
                About Us
              </Link>
              <Link
                href="/store-location"
                className="block text-base font-medium hover:text-gray-900 hover:bg-gray-50 py-2"
                style={{ color: theme.colors.text.primary }}
                onClick={closeMobileMenu}
              >
                Store Location
              </Link>
              <Link
                href="/contact"
                className="block text-base font-medium hover:text-gray-900 hover:bg-gray-50 py-2"
                style={{ color: theme.colors.text.primary }}
                onClick={closeMobileMenu}
              >
                Contact
              </Link>
            </div>
            
            {/* Mobile User Menu */}
            {user ? (
              <div className="border-t border-gray-200 pt-4">
                <div className="px-3 py-2">
                  <p className="text-sm" style={{ color: theme.colors.text.light }}>Signed in as</p>
                  <p className="text-base font-medium" style={{ color: theme.colors.text.secondary }}>
                    {user.user_metadata?.full_name || user.email}
                  </p>
                </div>
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 text-base font-medium hover:text-gray-900 hover:bg-gray-50"
                  style={{ color: theme.colors.text.primary }}
                  onClick={closeMobileMenu}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="block px-3 py-2 text-base font-medium hover:text-gray-900 hover:bg-gray-50"
                  style={{ color: theme.colors.text.primary }}
                  onClick={closeMobileMenu}
                >
                  Profile
                </Link>
                <Link
                  href="/orders"
                  className="block px-3 py-2 text-base font-medium hover:text-gray-900 hover:bg-gray-50"
                  style={{ color: theme.colors.text.primary }}
                  onClick={closeMobileMenu}
                >
                  My Orders
                </Link>
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:text-red-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <Link
                  href="/auth/signin"
                  className="block px-3 py-2 text-base font-medium hover:text-gray-900 hover:bg-gray-50"
                  style={{ color: theme.colors.text.primary }}
                  onClick={closeMobileMenu}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="block px-3 py-2 text-base font-medium hover:bg-gray-50"
                  style={{ color: theme.colors.primary }}
                  onClick={closeMobileMenu}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(isUserMenuOpen || isMobileMenuOpen || isShopDropdownOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsMobileMenuOpen(false);
            setIsShopDropdownOpen(false);
          }}
        />
      )}
    </header>
  );
};
