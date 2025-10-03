'use client';

import React from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';

export const NotificationSettings: React.FC = () => {
  const { isSoundEnabled, toggleSound, notifications, refreshNotifications, playNotificationSound } = useNotifications();

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
      
      <div className="space-y-4">
        {/* Sound Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {isSoundEnabled ? (
              <SpeakerWaveIcon className="h-5 w-5 text-gray-400 mr-3" />
            ) : (
              <SpeakerXMarkIcon className="h-5 w-5 text-gray-400 mr-3" />
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Notification Sound
              </label>
              <p className="text-xs text-gray-500">
                Play sound when new orders or messages arrive
              </p>
            </div>
          </div>
          <button
            onClick={toggleSound}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isSoundEnabled ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isSoundEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Current Notification Status */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Notifications</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-gray-600">New Orders:</span>
              <span className="ml-2 font-medium text-gray-900">{notifications.newOrders}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-gray-600">New Messages:</span>
              <span className="ml-2 font-medium text-gray-900">{notifications.newMessages}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t pt-4">
          <div className="flex space-x-3">
            <button
              onClick={refreshNotifications}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Refresh Notifications
            </button>
            <button
              onClick={playNotificationSound}
              disabled={!isSoundEnabled}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test Sound
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
