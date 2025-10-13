'use client';

import React from 'react';
import { MapPin, Heart, Coffee, Palette, Sparkles, Clock, Phone, Mail, Car, Bus } from 'lucide-react';

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
  return (
    <div className="min-h-screen relative" style={{ backgroundColor: theme.colors.background }}>
      
      
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
              About <span style={{ color: theme.colors.text.primary }}>Atelier Floral</span>
            </h1>
            <p className="text-xl md:text-2xl font-light mb-8">
              Where flowers meet art, coffee, and community in the heart of Montreal
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16" style={{ backgroundColor: theme.colors.white }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-6 w-6 mt-1 flex-shrink-0" style={{ color: theme.colors.primary }} />
                  <div>
                    <p className="text-lg leading-relaxed" style={{ color: theme.colors.text.secondary }}>
                      Located at <span className="font-semibold" style={{ color: theme.colors.text.primary }}>1208 Rue Crescent</span> in Montreal, 
                      our flower store is more than just a flower shop — it's a creative space where custom floral design, 
                      a cozy café, and a vibrant art gallery come together.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Heart className="h-6 w-6 mt-1 flex-shrink-0" style={{ color: theme.colors.secondary }} />
                  <div>
                    <p className="text-lg leading-relaxed" style={{ color: theme.colors.text.secondary }}>
                      Every bouquet we make is handcrafted and personalized, turning flowers into emotion — 
                      <span className="font-medium" style={{ color: theme.colors.text.primary }}> bold, delicate, wild, or elegant</span> — just like you.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Coffee className="h-6 w-6 mt-1 flex-shrink-0" style={{ color: theme.colors.primary }} />
                  <div>
                    <p className="text-lg leading-relaxed" style={{ color: theme.colors.text.secondary }}>
                      Whether you're picking up a gift, grabbing a coffee, or exploring local art, our warm, 
                      wood-filled space is your new favorite stop. Come feel the vibe, take a breath, and let flowers do the talking.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tagline */}
              <div className="p-8 rounded-2xl" style={{ backgroundColor: theme.colors.background }}>
                <div className="text-center">
                  <Sparkles className="h-8 w-8 mx-auto mb-4" style={{ color: theme.colors.primary }} />
                  <p className="text-2xl font-serif italic" style={{ color: theme.colors.text.primary }}>
                    "Flowers with soul. Moments with meaning."
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
                  <h3 className="font-semibold mb-1" style={{ color: theme.colors.text.secondary }}>Custom Design</h3>
                  <p className="text-sm" style={{ color: theme.colors.text.light }}>Handcrafted bouquets</p>
                </div>
                
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: theme.colors.white, borderColor: theme.colors.border, border: '1px solid' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: theme.colors.background }}>
                    <Coffee className="h-6 w-6" style={{ color: theme.colors.primary }} />
                  </div>
                  <h3 className="font-semibold mb-1" style={{ color: theme.colors.text.secondary }}>Cozy Café</h3>
                  <p className="text-sm" style={{ color: theme.colors.text.light }}>Fresh coffee & treats</p>
                </div>
                
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: theme.colors.white, borderColor: theme.colors.border, border: '1px solid' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: theme.colors.background }}>
                    <Palette className="h-6 w-6" style={{ color: theme.colors.primary }} />
                  </div>
                  <h3 className="font-semibold mb-1" style={{ color: theme.colors.text.secondary }}>Art Gallery</h3>
                  <p className="text-sm" style={{ color: theme.colors.text.light }}>Local artists featured</p>
                </div>
                
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: theme.colors.white, borderColor: theme.colors.border, border: '1px solid' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: theme.colors.background }}>
                    <MapPin className="h-6 w-6" style={{ color: theme.colors.secondary }} />
                  </div>
                  <h3 className="font-semibold mb-1" style={{ color: theme.colors.text.secondary }}>Montreal Location</h3>
                  <p className="text-sm" style={{ color: theme.colors.text.light }}>1208 Rue Crescent</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visit Our Store Section */}
      <section className="py-16" style={{ backgroundColor: theme.colors.background }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light mb-4" style={{ color: theme.colors.text.primary }}>Visit Our Store</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: theme.colors.text.secondary }}>
              Come experience our beautiful space and let us help you find the perfect flowers
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Store Information */}
            <div className="space-y-8">
              {/* Address */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.colors.white }}>
                  <MapPin className="h-6 w-6" style={{ color: theme.colors.primary }} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: theme.colors.text.secondary }}>Address</h3>
                  <p className="text-lg" style={{ color: theme.colors.text.light }}>
                    1208 Rue Crescent<br />
                    Montréal, QC H3G 2A9<br />
                    Canada
                  </p>
                </div>
              </div>

              {/* Store Hours */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.colors.white }}>
                  <Clock className="h-6 w-6" style={{ color: theme.colors.secondary }} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: theme.colors.text.secondary }}>Store Hours</h3>
                  <div className="space-y-1" style={{ color: theme.colors.text.light }}>
                    <p>Monday-Friday: 10:00 AM - 7:30 PM</p>
                    <p>Saturday: 10:30 AM - 7:30 PM</p>
                    <p>Sunday: 10:30 AM - 5:30 PM</p>
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
                    <h3 className="text-xl font-semibold mb-1" style={{ color: theme.colors.text.secondary }}>Phone</h3>
                    <p className="text-lg" style={{ color: theme.colors.text.light }}>(438) 282-1208</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.colors.white }}>
                    <Mail className="h-6 w-6" style={{ color: theme.colors.secondary }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1" style={{ color: theme.colors.text.secondary }}>Email</h3>
                    <p className="text-lg" style={{ color: theme.colors.text.light }}>1208crescent@gmail.com</p>
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
                  <h3 className="text-xl font-semibold mb-2" style={{ color: theme.colors.text.secondary }}>Parking Information</h3>
                  <p style={{ color: theme.colors.text.light }}>
                    Free parking is available for our customers in the store.
                  </p>
                </div>
              </div>

              {/* Public Transit */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.colors.white }}>
                  <Bus className="h-6 w-6" style={{ color: theme.colors.secondary }} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: theme.colors.text.secondary }}>Public Transit</h3>
                  <p style={{ color: theme.colors.text.light }}>
                    Easily accessible by public transportation. Multiple bus routes and metro stations nearby.
                  </p>
                </div>
              </div>

             
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12" style={{ backgroundColor: theme.colors.primary, color: theme.colors.text.white }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-2xl font-light mb-4">Flower Store</div>
            <p className="mb-6" style={{ color: theme.colors.text.primary }}>1208 Rue Crescent, Montréal, QC H3G 2A9, Canada</p>
            <p className="text-sm" style={{ color: theme.colors.text.primary }}>
              Flowers with soul. Moments with meaning.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
