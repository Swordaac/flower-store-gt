'use client';

import { useState, useEffect } from 'react';
import { 
  MapPinIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

interface PickupLocation {
  _id: string;
  name: string;
  shopId: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  location: {
    type: string;
    coordinates: [number, number];
  };
  phone?: string;
  email?: string;
  businessHours: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };
  settings: {
    minNoticeHours: number;
    maxAdvanceDays: number;
    timeSlotInterval: number;
    isActive: boolean;
  };
  description?: string;
  pickupInstructions?: string;
}

interface PickupLocationManagementProps {
  shopId?: string;
  onClose?: () => void;
}

export function PickupLocationManagement({ shopId, onClose }: PickupLocationManagementProps) {
  const { session } = useAuth();
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<PickupLocation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'Canada'
    },
    location: {
      type: 'Point',
      coordinates: [0, 0] as [number, number]
    },
    phone: '',
    email: '',
    businessHours: {
      monday: { open: '09:00', close: '18:00', isOpen: true },
      tuesday: { open: '09:00', close: '18:00', isOpen: true },
      wednesday: { open: '09:00', close: '18:00', isOpen: true },
      thursday: { open: '09:00', close: '18:00', isOpen: true },
      friday: { open: '09:00', close: '18:00', isOpen: true },
      saturday: { open: '09:00', close: '17:00', isOpen: true },
      sunday: { open: '10:00', close: '16:00', isOpen: false }
    },
    settings: {
      minNoticeHours: 2,
      maxAdvanceDays: 30,
      timeSlotInterval: 30,
      isActive: true
    },
    description: '',
    pickupInstructions: ''
  });

  // Fetch pickup locations
  const fetchPickupLocations = async () => {
    try {
      setLoading(true);
      const url = shopId 
        ? `http://localhost:5001/api/pickup-locations?shopId=${shopId}`
        : 'http://localhost:5001/api/pickup-locations';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setPickupLocations(result.data);
      } else {
        setError(result.error || 'Failed to fetch pickup locations');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickupLocations();
  }, [shopId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingLocation 
        ? `http://localhost:5001/api/pickup-locations/${editingLocation._id}`
        : 'http://localhost:5001/api/pickup-locations';
      
      const method = editingLocation ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          ...formData,
          shopId: shopId || 'default-shop-id' // This should come from context
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchPickupLocations();
        setShowForm(false);
        setEditingLocation(null);
        resetForm();
      } else {
        setError(result.error || 'Failed to save pickup location');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pickup location?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5001/api/pickup-locations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchPickupLocations();
      } else {
        setError(result.error || 'Failed to delete pickup location');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      address: {
        street: '',
        city: '',
        province: '',
        postalCode: '',
        country: 'Canada'
      },
      location: {
        type: 'Point',
        coordinates: [0, 0]
      },
      phone: '',
      email: '',
      businessHours: {
        monday: { open: '09:00', close: '18:00', isOpen: true },
        tuesday: { open: '09:00', close: '18:00', isOpen: true },
        wednesday: { open: '09:00', close: '18:00', isOpen: true },
        thursday: { open: '09:00', close: '18:00', isOpen: true },
        friday: { open: '09:00', close: '18:00', isOpen: true },
        saturday: { open: '09:00', close: '17:00', isOpen: true },
        sunday: { open: '10:00', close: '16:00', isOpen: false }
      },
      settings: {
        minNoticeHours: 2,
        maxAdvanceDays: 30,
        timeSlotInterval: 30,
        isActive: true
      },
      description: '',
      pickupInstructions: ''
    });
  };

  // Start editing
  const startEditing = (location: PickupLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      location: location.location,
      phone: location.phone || '',
      email: location.email || '',
      businessHours: location.businessHours,
      settings: location.settings,
      description: location.description || '',
      pickupInstructions: location.pickupInstructions || ''
    });
    setShowForm(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setShowForm(false);
    setEditingLocation(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Pickup Locations</h2>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Location
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingLocation ? 'Edit Pickup Location' : 'Add Pickup Location'}
              </h3>
              <button
                onClick={cancelEditing}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Street Address</label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value }
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value }
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Province</label>
                  <input
                    type="text"
                    value={formData.address.province}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, province: e.target.value }
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                  <input
                    type="text"
                    value={formData.address.postalCode}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, postalCode: e.target.value }
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Min Notice (hours)</label>
                  <input
                    type="number"
                    value={formData.settings.minNoticeHours}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, minNoticeHours: parseInt(e.target.value) }
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Advance (days)</label>
                  <input
                    type="number"
                    value={formData.settings.maxAdvanceDays}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, maxAdvanceDays: parseInt(e.target.value) }
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time Slot Interval (min)</label>
                  <input
                    type="number"
                    value={formData.settings.timeSlotInterval}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, timeSlotInterval: parseInt(e.target.value) }
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    min="15"
                  />
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.settings.isActive}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, isActive: e.target.checked }
                  })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Pickup Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Pickup Instructions</label>
                <textarea
                  value={formData.pickupInstructions}
                  onChange={(e) => setFormData({ ...formData, pickupInstructions: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  {editingLocation ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pickup Locations List */}
      <div className="grid gap-4">
        {pickupLocations.map((location) => (
          <div key={location._id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">{location.name}</h3>
                  {location.settings.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckIcon className="h-3 w-3 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XMarkIcon className="h-3 w-3 mr-1" />
                      Inactive
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  {location.address.street}, {location.address.city}, {location.address.province} {location.address.postalCode}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  {location.phone && (
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-1" />
                      {location.phone}
                    </div>
                  )}
                  {location.email && (
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-4 w-4 mr-1" />
                      {location.email}
                    </div>
                  )}
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {location.settings.minNoticeHours}h notice
                  </div>
                </div>
                
                {location.description && (
                  <p className="text-sm text-gray-600 mt-2">{location.description}</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => startEditing(location)}
                  className="p-2 text-gray-400 hover:text-indigo-600"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(location._id)}
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {pickupLocations.length === 0 && (
          <div className="text-center py-8">
            <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pickup locations</h3>
            <p className="text-gray-500">Get started by adding your first pickup location.</p>
          </div>
        )}
      </div>
    </div>
  );
}
