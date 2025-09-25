'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin, Clock, Phone, Mail } from 'lucide-react';

const theme = {
  colors: {
    background: '#F0E7F2',
    primary: '#664b39',
    secondary: '#E07A5F',
    text: {
      primary: '#d1ad8e',
      secondary: '#333333',
      light: '#666666'
    }
  }
};

const StoreLocationPage = () => {
  return (
    <div className="min-h-screen bg-white">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Store Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-serif mb-6" style={{ color: theme.colors.text.primary }}>
                Visit Our Store
              </h2>
              
              {/* Address */}
              <div className="flex items-start space-x-4 mb-6">
                <MapPin className="w-6 h-6 mt-1" style={{ color: theme.colors.primary }} />
                <div>
                  <h3 className="font-medium mb-2" style={{ color: theme.colors.text.secondary }}>
                    Address
                  </h3>
                  <p className="text-gray-600">
                    123 Flower Street<br />
                    Montreal, QC H3B 2Y5<br />
                    Canada
                  </p>
                </div>
              </div>

              {/* Store Hours */}
              <div className="flex items-start space-x-4 mb-6">
                <Clock className="w-6 h-6 mt-1" style={{ color: theme.colors.primary }} />
                <div>
                  <h3 className="font-medium mb-2" style={{ color: theme.colors.text.secondary }}>
                    Store Hours
                  </h3>
                  <div className="space-y-2 text-gray-600">
                    <div className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span>9:00 AM - 7:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday</span>
                      <span>10:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday</span>
                      <span>11:00 AM - 5:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Phone className="w-6 h-6" style={{ color: theme.colors.primary }} />
                  <div>
                    <h3 className="font-medium" style={{ color: theme.colors.text.secondary }}>
                      Phone
                    </h3>
                    <p className="text-gray-600">(514) 555-0123</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Mail className="w-6 h-6" style={{ color: theme.colors.primary }} />
                  <div>
                    <h3 className="font-medium" style={{ color: theme.colors.text.secondary }}>
                      Email
                    </h3>
                    <p className="text-gray-600">info@flowerstore.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-xl font-serif mb-4" style={{ color: theme.colors.text.primary }}>
                Parking Information
              </h3>
              <p className="text-gray-600 mb-4">
                Free parking is available for our customers in the dedicated lot behind the store.
              </p>
              
              <h3 className="text-xl font-serif mb-4" style={{ color: theme.colors.text.primary }}>
                Public Transit
              </h3>
              <p className="text-gray-600">
                We're conveniently located just 2 blocks from McGill metro station on the green line.
                Bus routes 15 and 24 stop directly in front of our store.
              </p>
            </div>
          </div>

          {/* Map */}
          <div className="h-[600px] bg-gray-100 rounded-lg overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2796.2763377348377!2d-73.57125334836146!3d45.50167397899469!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4cc91a4498edb6c1%3A0x86f51746c4f0a949!2sMcGill%20Metro%20Station!5e0!3m2!1sen!2sca!4v1632323795167!5m2!1sen!2sca"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreLocationPage;
