'use client';

import React, { useState } from 'react';
import { apiFetch } from '@/lib/api';
import Image from 'next/image';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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

const ContactPage = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const shopId = '68c34f45ee89e0fd81c8aa4d'; // Default shop ID
      const response = await apiFetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          shopId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
        alert(t('contact.thankYou'));
      } else {
        throw new Error(data.error || 'Failed to submit form');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(t('contact.error'));
    }
  };

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
              {t('contact.title')}
            </h1>
            <p className="text-xl md:text-2xl font-light mb-8">
              {t('contact.subtitle')}
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-serif mb-6" style={{ color: theme.colors.text.primary }}>
              {t('contact.getInTouch')}
            </h2>
            
            <div className="space-y-6 mb-8">
              <div className="flex items-start space-x-4">
                <Phone className="w-6 h-6 mt-1" style={{ color: theme.colors.primary }} />
                <div>
                  <h3 className="font-medium" style={{ color: theme.colors.text.secondary }}>
                    {t('contact.phone')}
                  </h3>
                  <p className="text-gray-600">{t('contact.phoneNumber')}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Mail className="w-6 h-6 mt-1" style={{ color: theme.colors.primary }} />
                <div>
                  <h3 className="font-medium" style={{ color: theme.colors.text.secondary }}>
                    {t('contact.email')}
                  </h3>
                  <p className="text-gray-600">{t('contact.emailAddress')}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <MapPin className="w-6 h-6 mt-1" style={{ color: theme.colors.primary }} />
                <div>
                  <h3 className="font-medium" style={{ color: theme.colors.text.secondary }}>
                    {t('contact.address')}
                  </h3>
                  <p className="text-gray-600">
                    {t('contact.addressText').split('\n').map((line, index) => (
                      <React.Fragment key={index}>
                        {line}
                        {index < t('contact.addressText').split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </p>
                </div>
              </div>
            </div>

            {/* Store Hours */}
            <div className="mb-8">
              <div className="flex items-start space-x-4">
                <Clock className="w-6 h-6 mt-1" style={{ color: theme.colors.primary }} />
                <div>
                  <h3 className="font-medium" style={{ color: theme.colors.text.secondary }}>
                    {t('contact.storeHours')}
                  </h3>
                  <div className="space-y-1 text-gray-600">
                    <p>{t('contact.mondayFriday')}</p>
                    <p>{t('contact.saturday')}</p>
                    <p>{t('contact.sunday')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div>
              <h3 className="text-xl font-serif mb-4" style={{ color: theme.colors.text.primary }}>
                {t('contact.followUs')}
              </h3>
              <div className="flex space-x-4">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  style={{ color: theme.colors.primary }}
                >
                  <Facebook className="w-6 h-6" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  style={{ color: theme.colors.primary }}
                >
                  <Instagram className="w-6 h-6" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  style={{ color: theme.colors.primary }}
                >
                  <Twitter className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-serif mb-6" style={{ color: theme.colors.text.primary }}>
              {t('contact.sendMessage')}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.secondary }}>
                  {t('contact.nameRequired')}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.secondary }}>
                  {t('contact.emailRequired')}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.secondary }}>
                  {t('contact.phoneOptional')}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.secondary }}>
                  {t('contact.subjectRequired')}
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <option value="">{t('contact.selectSubject')}</option>
                  <option value="general">{t('contact.generalInquiry')}</option>
                  <option value="order">{t('contact.orderStatus')}</option>
                  <option value="product">{t('contact.productInformation')}</option>
                  <option value="feedback">{t('contact.feedback')}</option>
                  <option value="other">{t('contact.other')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.secondary }}>
                  {t('contact.messageRequired')}
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 text-white rounded-md transition-colors bg-primary hover:bg-[#7d5b46]"
              >
                {t('contact.sendMessageButton')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
