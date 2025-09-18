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

interface FormDataType {
  recipient: {
    name: string;
    phone: string;
    email: string;
  };
  occasion: string;
  cardMessage: string;
  contactPhone: string;
  contactEmail: string;
  specialInstructions: string;
  delivery: {
    address: {
      company: string;
      street: string;
      city: string;
      province: string;
      postalCode: string;
      country: string;
    };
    date: string;
    time: string;
    instructions: string;
    buzzerCode: string;
  };
  pickup: {
    date: string;
    time: string;
    storeAddress: string;
  };
}

interface CheckoutFormProps {
  shopId: string;
  onSuccess?: (orderId: string) => void;
  onError?: (error: string) => void;
}

export default function CheckoutForm({ shopId, onSuccess, onError }: CheckoutFormProps) {
  const { items, totalPrice, clearCart } = useCart();
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'pickup'>('delivery');
  const [formData, setFormData] = useState<FormDataType>({
    // Recipient information
    recipient: {
      name: '',
      phone: '',
      email: ''
    },
    // Optional occasion and card message
    occasion: '',
    cardMessage: '',
    // Contact information
    contactPhone: '',
    contactEmail: '',
    specialInstructions: '',
    // Delivery fields
    delivery: {
      address: {
        company: '',
        street: '',
        city: '',
        province: '',
        postalCode: '',
        country: 'Canada'
      },
      date: '',
      time: '',
      instructions: '',
      buzzerCode: ''
    },
    // Pickup fields
    pickup: {
      date: '',
      time: '',
      storeAddress: '1208 Crescent St, Montreal, Quebec H3G 2A9'
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  type NestedKeyOf<ObjectType extends object> = {
    [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
      ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
      : `${Key}`;
  }[keyof ObjectType & (string | number)];

  const handleInputChange = (path: NestedKeyOf<FormDataType>, value: string) => {
    setFormData(prev => {
      const keys = path.split('.');
      const result = { ...prev };
      let current: any = result;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return result;
    });
  };

  const validateForm = () => {
    // Validate recipient information
    if (!formData.recipient.name?.trim()) {
      return 'Recipient name is required';
    }
    if (!formData.recipient.phone?.trim()) {
      return 'Recipient phone number is required';
    }
    if (!formData.recipient.email?.trim()) {
      return 'Recipient email is required';
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.recipient.email.trim())) {
      return 'Please enter a valid recipient email address';
    }
    if (!emailRegex.test(formData.contactEmail.trim())) {
      return 'Please enter a valid contact email address';
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    if (!phoneRegex.test(formData.recipient.phone.trim())) {
      return 'Please enter a valid recipient phone number';
    }
    if (!phoneRegex.test(formData.contactPhone.trim())) {
      return 'Please enter a valid contact phone number';
    }

    // Validate contact information
    if (!formData.contactPhone?.trim()) {
      return 'Contact phone is required';
    }
    if (!formData.contactEmail?.trim()) {
      return 'Contact email is required';
    }

    // Validate dates are in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (deliveryOption === 'delivery') {
      const { address, date, time } = formData.delivery;
      
      // Validate address
      if (!address.street?.trim()) {
        return 'Street address is required for delivery';
      }
      if (!address.city?.trim()) {
        return 'City is required for delivery';
      }
      if (!address.province?.trim()) {
        return 'Province is required for delivery';
      }
      if (!address.postalCode?.trim()) {
        return 'Postal code is required for delivery';
      }

      // Validate postal code format
      const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
      if (!postalCodeRegex.test(address.postalCode.trim())) {
        return 'Please enter a valid postal code';
      }

      // Validate date and time
      if (!date) {
        return 'Delivery date is required';
      }
      if (!time) {
        return 'Delivery time is required';
      }

      const deliveryDate = new Date(date);
      if (deliveryDate <= today) {
        return 'Delivery date must be in the future';
      }
    } else {
      const { date, time } = formData.pickup;
      
      // Validate date and time
      if (!date) {
        return 'Pickup date is required';
      }
      if (!time) {
        return 'Pickup time is required';
      }

      const pickupDate = new Date(date);
      if (pickupDate <= today) {
        return 'Pickup date must be in the future';
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

    // Debug log the form data before transformation
    console.log('=== Form Data Before Transformation ===', {
      formData,
      deliveryOption
    });

    const deliveryInfo = {
      deliveryOption,
      recipient: {
        name: formData.recipient.name.trim(),
        phone: formData.recipient.phone.trim(),
        email: formData.recipient.email.trim()
      },
      occasion: formData.occasion || '',
      cardMessage: formData.cardMessage || '',
      contactPhone: formData.contactPhone.trim(),
      contactEmail: formData.contactEmail.trim(),
      specialInstructions: formData.specialInstructions || '',
      ...(deliveryOption === 'delivery' && {
        delivery: {
          address: {
            company: formData.delivery.address.company.trim() || '',
            street: formData.delivery.address.street.trim(),
            city: formData.delivery.address.city.trim(),
            province: formData.delivery.address.province.trim(),
            postalCode: formData.delivery.address.postalCode.trim(),
            country: 'Canada'
          },
          date: formData.delivery.date,
          time: formData.delivery.time,
          instructions: formData.delivery.instructions.trim() || '',
          buzzerCode: formData.delivery.buzzerCode.trim() || ''
        }
      }),
      ...(deliveryOption === 'pickup' && {
        pickup: {
          date: formData.pickup.date,
          time: formData.pickup.time,
          storeAddress: '1208 Crescent St, Montreal, Quebec H3G 2A9'
        }
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

      {/* Recipient Information */}
      <Card>
        <CardHeader>
          <CardTitle>Recipient Information</CardTitle>
          <CardDescription>Who will receive this order?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="recipientName">Recipient Name *</Label>
            <Input
              id="recipientName"
              value={formData.recipient.name}
              onChange={(e) => handleInputChange('recipient.name', e.target.value)}
              placeholder="Full Name"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recipientPhone">Recipient Phone *</Label>
              <Input
                id="recipientPhone"
                type="tel"
                value={formData.recipient.phone}
                onChange={(e) => handleInputChange('recipient.phone', e.target.value)}
                placeholder="(555) 123-4567"
                required
              />
            </div>
            <div>
              <Label htmlFor="recipientEmail">Recipient Email *</Label>
              <Input
                id="recipientEmail"
                type="email"
                value={formData.recipient.email}
                onChange={(e) => handleInputChange('recipient.email', e.target.value)}
                placeholder="recipient@email.com"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Occasion and Card Message */}
      <Card>
        <CardHeader>
          <CardTitle>Occasion & Card Message</CardTitle>
          <CardDescription>Add a personal touch to your order</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="occasion">Occasion</Label>
            <Select value={formData.occasion} onValueChange={(value) => handleInputChange('occasion', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an occasion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="birthday">Birthday</SelectItem>
                <SelectItem value="anniversary">Anniversary</SelectItem>
                <SelectItem value="wedding">Wedding</SelectItem>
                <SelectItem value="sympathy">Sympathy</SelectItem>
                <SelectItem value="congratulations">Congratulations</SelectItem>
                <SelectItem value="get-well">Get Well</SelectItem>
                <SelectItem value="thank-you">Thank You</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="cardMessage">Card Message</Label>
            <Textarea
              id="cardMessage"
              value={formData.cardMessage}
              onChange={(e) => handleInputChange('cardMessage', e.target.value)}
              placeholder="Enter your card message here..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Your Contact Information</CardTitle>
          <CardDescription>We'll use this to contact you about the order</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactPhone">Your Phone Number *</Label>
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
              <Label htmlFor="contactEmail">Your Email Address *</Label>
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
              <Label htmlFor="company">Company/Business Name (Optional)</Label>
              <Input
                id="company"
                value={formData.delivery.address.company}
                onChange={(e) => handleInputChange('delivery.address.company', e.target.value)}
                placeholder="Company Name"
              />
            </div>
            <div>
              <Label htmlFor="street">Street Address *</Label>
              <Input
                id="street"
                value={formData.delivery.address.street}
                onChange={(e) => handleInputChange('delivery.address.street', e.target.value)}
                placeholder="123 Main Street"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.delivery.address.city}
                  onChange={(e) => handleInputChange('delivery.address.city', e.target.value)}
                  placeholder="Montreal"
                  required
                />
              </div>
              <div>
                <Label htmlFor="province">Province *</Label>
                <Select 
                  value={formData.delivery.address.province} 
                  onValueChange={(value) => handleInputChange('delivery.address.province', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Province" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QC">Quebec</SelectItem>
                    <SelectItem value="ON">Ontario</SelectItem>
                    <SelectItem value="BC">British Columbia</SelectItem>
                    <SelectItem value="AB">Alberta</SelectItem>
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
                  value={formData.delivery.address.postalCode}
                  onChange={(e) => handleInputChange('delivery.address.postalCode', e.target.value)}
                  placeholder="H4P 1G6"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deliveryDate">Delivery Date *</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={formData.delivery.date}
                  onChange={(e) => handleInputChange('delivery.date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="deliveryTime">Delivery Time *</Label>
                <Select 
                  value={formData.delivery.time} 
                  onValueChange={(value) => handleInputChange('delivery.time', value)}
                >
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
            </div>
            <div>
              <Label htmlFor="deliveryInstructions">Delivery Instructions</Label>
              <Textarea
                id="deliveryInstructions"
                value={formData.delivery.instructions}
                onChange={(e) => handleInputChange('delivery.instructions', e.target.value)}
                placeholder="Any special delivery instructions..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="buzzerCode">Buzzer/Entry Code</Label>
              <Input
                id="buzzerCode"
                value={formData.delivery.buzzerCode}
                onChange={(e) => handleInputChange('delivery.buzzerCode', e.target.value)}
                placeholder="Enter buzzer or entry code if needed"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pickup Information */}
      {deliveryOption === 'pickup' && (
        <Card>
          <CardHeader>
            <CardTitle>Pickup Information</CardTitle>
            <CardDescription>When would you like to pick up your order?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Pickup Location</Label>
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-900">Main Store</p>
                <p className="text-sm text-gray-600">{formData.pickup.storeAddress}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pickupDate">Pickup Date *</Label>
                <Input
                  id="pickupDate"
                  type="date"
                  value={formData.pickup.date}
                  onChange={(e) => handleInputChange('pickup.date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="pickupTime">Pickup Time *</Label>
                <Select 
                  value={formData.pickup.time} 
                  onValueChange={(value) => handleInputChange('pickup.time', value)}
                >
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
              recipient: {
                name: formData.recipient.name.trim(),
                phone: formData.recipient.phone.trim(),
                email: formData.recipient.email.trim()
              },
              occasion: formData.occasion || '',
              cardMessage: formData.cardMessage || '',
              contactPhone: formData.contactPhone.trim(),
              contactEmail: formData.contactEmail.trim(),
              specialInstructions: formData.specialInstructions || '',
              ...(deliveryOption === 'delivery' && {
                delivery: {
                  address: {
                    company: formData.delivery.address.company.trim() || '',
                    street: formData.delivery.address.street.trim(),
                    city: formData.delivery.address.city.trim(),
                    province: formData.delivery.address.province.trim(),
                    postalCode: formData.delivery.address.postalCode.trim(),
                    country: 'Canada'
                  },
                  date: formData.delivery.date,
                  time: formData.delivery.time,
                  instructions: formData.delivery.instructions.trim() || '',
                  buzzerCode: formData.delivery.buzzerCode.trim() || ''
                }
              }),
              ...(deliveryOption === 'pickup' && {
                pickup: {
                  date: formData.pickup.date,
                  time: formData.pickup.time,
                  storeAddress: '1208 Crescent St, Montreal, Quebec H3G 2A9'
                }
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
              recipient: formData.recipient,
              occasion: formData.occasion,
              cardMessage: formData.cardMessage,
              contactPhone: formData.contactPhone,
              contactEmail: formData.contactEmail,
              specialInstructions: formData.specialInstructions,
              ...(deliveryOption === 'delivery' && {
                delivery: {
                  address: formData.delivery.address,
                  date: formData.delivery.date,
                  time: formData.delivery.time,
                  instructions: formData.delivery.instructions,
                  buzzerCode: formData.delivery.buzzerCode
                }
              }),
              ...(deliveryOption === 'pickup' && {
                pickup: {
                  date: formData.pickup.date,
                  time: formData.pickup.time,
                  storeAddress: formData.pickup.storeAddress
                }
              })
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
