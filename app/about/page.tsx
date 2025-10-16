'use client';

import React from 'react';
import { MapPin, Heart, Coffee, Palette, Sparkles, Clock, Phone, Mail, Car, Bus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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

export default function AboutPage() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen w-full relative overflow-x-hidden" style={{ backgroundColor: theme.colors.background }}>
      {/* Hero Section */}
      <section className="relative w-full h-96 md:h-[500px] lg:h-[600px] overflow-hidden">
        <img
          src="/flowerstore-hero.jpg"
          alt="Beautiful flower arrangements and bouquets"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="text-center text-white max-w-4xl px-4">
            <h1 className="text-4xl md:text-6xl font-light mb-4">
              {t('about.title')}
            </h1>
            <p className="text-xl md:text-2xl font-light mb-8">
              {t('about.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 w-full" style={{ backgroundColor: theme.colors.white }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-6 w-6 mt-1 flex-shrink-0" style={{ color: theme.colors.primary }} />
                  <div>
                    <p className="text-lg leading-relaxed" style={{ color: theme.colors.text.secondary }}>
                      {t('about.locationText')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Heart className="h-6 w-6 mt-1 flex-shrink-0" style={{ color: theme.colors.secondary }} />
                  <div>
                    <p className="text-lg leading-relaxed" style={{ color: theme.colors.text.secondary }}>
                      {t('about.passionText')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Coffee className="h-6 w-6 mt-1 flex-shrink-0" style={{ color: theme.colors.primary }} />
                  <div>
                    <p className="text-lg leading-relaxed" style={{ color: theme.colors.text.secondary }}>
                      {t('about.experienceText')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tagline */}
              <div className="p-8 rounded-2xl" style={{ backgroundColor: theme.colors.background }}>
                <div className="text-center">
                  <Sparkles className="h-8 w-8 mx-auto mb-4" style={{ color: theme.colors.primary }} />
                  <p className="text-2xl font-serif italic" style={{ color: theme.colors.text.primary }}>
                    "{t('about.tagline')}"
                  </p>
                </div>
              </div>
            </div>

            {/* Image/Visual Content */}
            <div className="space-y-6">
              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: theme.colors.white, borderColor: theme.colors.border, border: '1px solid' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: theme.colors.background }}>
                    <Heart className="h-6 w-6" style={{ color: theme.colors.secondary }} />
                  </div>
                  <h3 className="font-semibold mb-1" style={{ color: theme.colors.text.secondary }}>{t('about.customDesign')}</h3>
                  <p className="text-sm" style={{ color: theme.colors.text.light }}>{t('about.customDesignDesc')}</p>
                </div>
                
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: theme.colors.white, borderColor: theme.colors.border, border: '1px solid' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: theme.colors.background }}>
                    <Coffee className="h-6 w-6" style={{ color: theme.colors.primary }} />
                  </div>
                  <h3 className="font-semibold mb-1" style={{ color: theme.colors.text.secondary }}>{t('about.cozyCafe')}</h3>
                  <p className="text-sm" style={{ color: theme.colors.text.light }}>{t('about.cozyCafeDesc')}</p>
                </div>
                
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: theme.colors.white, borderColor: theme.colors.border, border: '1px solid' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: theme.colors.background }}>
                    <Palette className="h-6 w-6" style={{ color: theme.colors.primary }} />
                  </div>
                  <h3 className="font-semibold mb-1" style={{ color: theme.colors.text.secondary }}>{t('about.artGallery')}</h3>
                  <p className="text-sm" style={{ color: theme.colors.text.light }}>{t('about.artGalleryDesc')}</p>
                </div>
                
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: theme.colors.white, borderColor: theme.colors.border, border: '1px solid' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: theme.colors.background }}>
                    <MapPin className="h-6 w-6" style={{ color: theme.colors.secondary }} />
                  </div>
                  <h3 className="font-semibold mb-1" style={{ color: theme.colors.text.secondary }}>{t('about.montrealLocation')}</h3>
                  <p className="text-sm" style={{ color: theme.colors.text.light }}>{t('about.montrealLocationDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visit Our Store Section */}
      <section className="py-16 w-full" style={{ backgroundColor: theme.colors.background }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light mb-4" style={{ color: theme.colors.text.primary }}>{t('about.visitStore')}</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: theme.colors.text.secondary }}>
              {t('about.visitStoreDesc')}
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Store Information */}
            <div className="space-y-8">
              {/* Address */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.colors.white }}>
                  <MapPin className="h-6 w-6" style={{ color: theme.colors.primary }} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: theme.colors.text.secondary }}>{t('about.address')}</h3>
                  <p className="text-lg" style={{ color: theme.colors.text.light }}>
                    {t('about.addressText').split('\n').map((line, index) => (
                      <React.Fragment key={index}>
                        {line}
                        {index < t('about.addressText').split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </p>
                </div>
              </div>

              {/* Store Hours */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.colors.white }}>
                  <Clock className="h-6 w-6" style={{ color: theme.colors.secondary }} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: theme.colors.text.secondary }}>{t('about.storeHours')}</h3>
                  <div className="space-y-1" style={{ color: theme.colors.text.light }}>
                    <p>{t('about.mondayFriday')}</p>
                    <p>{t('about.saturday')}</p>
                    <p>{t('about.sunday')}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.colors.white }}>
                    <Phone className="h-6 w-6" style={{ color: theme.colors.primary }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1" style={{ color: theme.colors.text.secondary }}>{t('about.phone')}</h3>
                    <p className="text-lg" style={{ color: theme.colors.text.light }}>{t('about.phoneNumber')}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.colors.white }}>
                    <Mail className="h-6 w-6" style={{ color: theme.colors.secondary }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1" style={{ color: theme.colors.text.secondary }}>{t('about.email')}</h3>
                    <p className="text-lg" style={{ color: theme.colors.text.light }}>{t('about.emailAddress')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-8">
              {/* Parking Information */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.colors.white }}>
                  <Car className="h-6 w-6" style={{ color: theme.colors.primary }} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: theme.colors.text.secondary }}>{t('about.parkingInfo')}</h3>
                  <p style={{ color: theme.colors.text.light }}>
                    {t('about.parkingText')}
                  </p>
                </div>
              </div>

              {/* Public Transit */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.colors.white }}>
                  <Bus className="h-6 w-6" style={{ color: theme.colors.secondary }} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: theme.colors.text.secondary }}>{t('about.publicTransit')}</h3>
                  <p style={{ color: theme.colors.text.light }}>
                    {t('about.publicTransitText')}
                  </p>
                </div>
              </div>

             
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 w-full" style={{ backgroundColor: theme.colors.primary, color: theme.colors.text.white }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center">
            <div className="text-2xl font-light mb-4">{t('about.footerTitle')}</div>
            <p className="mb-6" style={{ color: theme.colors.text.primary }}>{t('about.footerAddress')}</p>
            <p className="text-sm" style={{ color: theme.colors.text.primary }}>
              {t('about.footerTagline')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
