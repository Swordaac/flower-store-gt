'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import StripeCheckoutButton from '@/components/StripeCheckoutButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DebugCheckoutData from '@/components/DebugCheckoutData';
import AuthStatus from '@/components/AuthStatus';

interface CheckoutFormProps {
  shopId: string;
  onSuccess?: (orderId: string) => void;
  onError?: (error: string) => void;
}

export default function CheckoutForm({ shopId, onSuccess, onError }: CheckoutFormProps) {
  const { items, totalPrice, clearCart } = useCart();
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'pickup'>('delivery');
  const [formData, setFormData] = useState({
    contactPhone: '',
    contactEmail: '',
    specialInstructions: '',
    // Delivery fields
    street: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Canada',
    deliveryTime: '',
    // Pickup fields
    pickupTime: '',
    pickupLocationId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.contactPhone || !formData.contactEmail) {
      return 'Contact phone and email are required';
    }

    if (deliveryOption === 'delivery') {
      if (!formData.street || !formData.city || !formData.province || !formData.postalCode) {
        return 'Complete delivery address is required';
      }
      if (!formData.deliveryTime) {
        return 'Delivery time is required';
      }
    } else {
      if (!formData.pickupTime) {
        return 'Pickup time is required';
      }
      if (!formData.pickupLocationId) {
        return 'Pickup location is required';
      }
    }

    return null;
  };

  const handleStripeCheckout = async () => {
    const validationError = validateForm();
    if (validationError) {
      onError?.(validationError);
      return;
    }

    const deliveryInfo = {
      deliveryOption,
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail,
      specialInstructions: formData.specialInstructions,
      ...(deliveryOption === 'delivery' && {
        address: {
          street: formData.street,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
          country: formData.country
        },
        deliveryTime: formData.deliveryTime
      }),
      ...(deliveryOption === 'pickup' && {
        pickupTime: formData.pickupTime,
        pickupLocationId: formData.pickupLocationId
      })
    };

    // The StripeCheckoutButton will handle the actual checkout
    return deliveryInfo;
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Your cart is empty. Add some items to proceed with checkout.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Authentication Status */}
      <AuthStatus />
      
      {/* Delivery Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Method</CardTitle>
          <CardDescription>Choose how you'd like to receive your order</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={deliveryOption} onValueChange={(value) => setDeliveryOption(value as 'delivery' | 'pickup')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="delivery" id="delivery" />
              <Label htmlFor="delivery">Home Delivery</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pickup" id="pickup" />
              <Label htmlFor="pickup">Store Pickup</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>We'll use this to contact you about your order</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactPhone">Phone Number *</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                placeholder="(555) 123-4567"
                required
              />
            </div>
            <div>
              <Label htmlFor="contactEmail">Email Address *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Address */}
      {deliveryOption === 'delivery' && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery Address</CardTitle>
            <CardDescription>Where should we deliver your order?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="street">Street Address *</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => handleInputChange('street', e.target.value)}
                placeholder="123 Main Street"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Toronto"
                  required
                />
              </div>
              <div>
                <Label htmlFor="province">Province *</Label>
                <Select value={formData.province} onValueChange={(value) => handleInputChange('province', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Province" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ON">Ontario</SelectItem>
                    <SelectItem value="BC">British Columbia</SelectItem>
                    <SelectItem value="AB">Alberta</SelectItem>
                    <SelectItem value="QC">Quebec</SelectItem>
                    <SelectItem value="MB">Manitoba</SelectItem>
                    <SelectItem value="SK">Saskatchewan</SelectItem>
                    <SelectItem value="NS">Nova Scotia</SelectItem>
                    <SelectItem value="NB">New Brunswick</SelectItem>
                    <SelectItem value="NL">Newfoundland and Labrador</SelectItem>
                    <SelectItem value="PE">Prince Edward Island</SelectItem>
                    <SelectItem value="YT">Yukon</SelectItem>
                    <SelectItem value="NT">Northwest Territories</SelectItem>
                    <SelectItem value="NU">Nunavut</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code *</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  placeholder="M5V 3A8"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="deliveryTime">Preferred Delivery Time *</Label>
              <Select value={formData.deliveryTime} onValueChange={(value) => handleInputChange('deliveryTime', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select delivery time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="09:00">9:00 AM</SelectItem>
                  <SelectItem value="10:00">10:00 AM</SelectItem>
                  <SelectItem value="11:00">11:00 AM</SelectItem>
                  <SelectItem value="12:00">12:00 PM</SelectItem>
                  <SelectItem value="13:00">1:00 PM</SelectItem>
                  <SelectItem value="14:00">2:00 PM</SelectItem>
                  <SelectItem value="15:00">3:00 PM</SelectItem>
                  <SelectItem value="16:00">4:00 PM</SelectItem>
                  <SelectItem value="17:00">5:00 PM</SelectItem>
                  <SelectItem value="18:00">6:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pickup Information */}
      {deliveryOption === 'pickup' && (
        <Card>
          <CardHeader>
            <CardTitle>Pickup Information</CardTitle>
            <CardDescription>When and where would you like to pick up your order?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pickupTime">Preferred Pickup Time *</Label>
              <Select value={formData.pickupTime} onValueChange={(value) => handleInputChange('pickupTime', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pickup time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="09:00">9:00 AM</SelectItem>
                  <SelectItem value="10:00">10:00 AM</SelectItem>
                  <SelectItem value="11:00">11:00 AM</SelectItem>
                  <SelectItem value="12:00">12:00 PM</SelectItem>
                  <SelectItem value="13:00">1:00 PM</SelectItem>
                  <SelectItem value="14:00">2:00 PM</SelectItem>
                  <SelectItem value="15:00">3:00 PM</SelectItem>
                  <SelectItem value="16:00">4:00 PM</SelectItem>
                  <SelectItem value="17:00">5:00 PM</SelectItem>
                  <SelectItem value="18:00">6:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pickupLocationId">Pickup Location *</Label>
              <Select value={formData.pickupLocationId} onValueChange={(value) => handleInputChange('pickupLocationId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pickup location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="68bf680327878268f9bfcc8e">Main Store - 123 Flower Street, Toronto, ON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Special Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Special Instructions</CardTitle>
          <CardDescription>Any special requests or notes for your order?</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.specialInstructions}
            onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
            placeholder="Please leave at front door, ring doorbell, etc."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Order Summary and Checkout */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {items.map((item) => {
              const itemPrice = item.selectedSize || item.price;
              return (
                <div key={`${item.productId}-${item.selectedSize || 'default'}`} className="flex justify-between">
                  <span className="text-sm">
                    {item.name} x {item.quantity}
                  </span>
                  <span className="text-sm font-medium">
                    ${(itemPrice * item.quantity / 100).toFixed(2)} CAD
                  </span>
                </div>
              );
            })}
          </div>
          <hr />
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>${(totalPrice / 100).toFixed(2)} CAD</span>
          </div>
          
          <StripeCheckoutButton
            shopId={shopId}
            deliveryInfo={{
              deliveryOption,
              contactPhone: formData.contactPhone,
              contactEmail: formData.contactEmail,
              specialInstructions: formData.specialInstructions,
              ...(deliveryOption === 'delivery' && {
                address: {
                  street: formData.street,
                  city: formData.city,
                  province: formData.province,
                  postalCode: formData.postalCode,
                  country: formData.country
                },
                deliveryTime: formData.deliveryTime
              }),
              ...(deliveryOption === 'pickup' && {
                pickupTime: formData.pickupTime,
                pickupLocationId: formData.pickupLocationId
              })
            }}
            className="w-full"
          >
            Pay with Stripe - ${(totalPrice / 100).toFixed(2)} CAD
          </StripeCheckoutButton>
          
          <DebugCheckoutData
            shopId={shopId}
            deliveryInfo={{
              deliveryOption,
              contactPhone: formData.contactPhone,
              contactEmail: formData.contactEmail,
              specialInstructions: formData.specialInstructions,
              ...(deliveryOption === 'delivery' && {
                address: {
                  street: formData.street,
                  city: formData.city,
                  province: formData.province,
                  postalCode: formData.postalCode,
                  country: formData.country
                },
                deliveryTime: formData.deliveryTime
              }),
              ...(deliveryOption === 'pickup' && {
                pickupTime: formData.pickupTime,
                pickupLocationId: formData.pickupLocationId
              })
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
