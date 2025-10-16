'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();
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
      return t('checkout.validation.recipientNameRequired');
    }
    if (!formData.recipient.phone?.trim()) {
      return t('checkout.validation.recipientPhoneRequired');
    }
    if (!formData.recipient.email?.trim()) {
      return t('checkout.validation.recipientEmailRequired');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.recipient.email.trim())) {
      return t('checkout.validation.validRecipientEmail');
    }
    if (!emailRegex.test(formData.contactEmail.trim())) {
      return t('checkout.validation.validContactEmail');
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    if (!phoneRegex.test(formData.recipient.phone.trim())) {
      return t('checkout.validation.validRecipientPhone');
    }
    if (!phoneRegex.test(formData.contactPhone.trim())) {
      return t('checkout.validation.validContactPhone');
    }

    // Validate contact information
    if (!formData.contactPhone?.trim()) {
      return t('checkout.validation.contactPhoneRequired');
    }
    if (!formData.contactEmail?.trim()) {
      return t('checkout.validation.contactEmailRequired');
    }

    // Validate dates are in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (deliveryOption === 'delivery') {
      const { address, date, time } = formData.delivery;
      
      // Validate address
      if (!address.street?.trim()) {
        return t('checkout.validation.streetRequired');
      }
      if (!address.city?.trim()) {
        return t('checkout.validation.cityRequired');
      }
      if (!address.province?.trim()) {
        return t('checkout.validation.provinceRequired');
      }
      if (!address.postalCode?.trim()) {
        return t('checkout.validation.postalCodeRequired');
      }

      // Validate postal code format
      const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
      if (!postalCodeRegex.test(address.postalCode.trim())) {
        return t('checkout.validation.validPostalCode');
      }

      // Validate date and time
      if (!date) {
        return t('checkout.validation.deliveryDateRequired');
      }
      if (!time) {
        return t('checkout.validation.deliveryTimeRequired');
      }

      const deliveryDate = new Date(date);
      if (deliveryDate <= today) {
        return t('checkout.validation.deliveryDateFuture');
      }
    } else {
      const { date, time } = formData.pickup;
      
      // Validate date and time
      if (!date) {
        return t('checkout.validation.pickupDateRequired');
      }
      if (!time) {
        return t('checkout.validation.pickupTimeRequired');
      }

      const pickupDate = new Date(date);
      if (pickupDate <= today) {
        return t('checkout.validation.pickupDateFuture');
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
          <p className="text-gray-600">{t('checkout.emptyCart')}</p>
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
          <CardTitle>{t('checkout.deliveryMethod')}</CardTitle>
          <CardDescription>{t('checkout.deliveryMethodDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={deliveryOption} onValueChange={(value) => setDeliveryOption(value as 'delivery' | 'pickup')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="delivery" id="delivery" />
              <Label htmlFor="delivery">{t('checkout.homeDelivery')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pickup" id="pickup" />
              <Label htmlFor="pickup">{t('checkout.storePickup')}</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Recipient Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('checkout.recipientInfo')}</CardTitle>
          <CardDescription>{t('checkout.recipientInfoDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="recipientName">{t('checkout.recipientName')} *</Label>
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
              <Label htmlFor="recipientPhone">{t('checkout.recipientPhone')} *</Label>
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
              <Label htmlFor="recipientEmail">{t('checkout.recipientEmail')} *</Label>
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
          <CardTitle>{t('checkout.occasionCard')}</CardTitle>
          <CardDescription>{t('checkout.occasionCardDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="occasion">{t('checkout.occasion')}</Label>
            <Select value={formData.occasion} onValueChange={(value) => handleInputChange('occasion', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('checkout.selectOccasion')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="birthday">{t('checkout.birthday')}</SelectItem>
                <SelectItem value="anniversary">{t('checkout.anniversary')}</SelectItem>
                <SelectItem value="wedding">{t('checkout.wedding')}</SelectItem>
                <SelectItem value="sympathy">{t('checkout.sympathy')}</SelectItem>
                <SelectItem value="congratulations">{t('checkout.congratulations')}</SelectItem>
                <SelectItem value="get-well">{t('checkout.getWell')}</SelectItem>
                <SelectItem value="thank-you">{t('checkout.thankYou')}</SelectItem>
                <SelectItem value="other">{t('checkout.other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="cardMessage">{t('checkout.cardMessage')}</Label>
            <Textarea
              id="cardMessage"
              value={formData.cardMessage}
              onChange={(e) => handleInputChange('cardMessage', e.target.value)}
              placeholder={t('checkout.cardMessagePlaceholder')}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('checkout.contactInfo')}</CardTitle>
          <CardDescription>{t('checkout.contactInfoDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactPhone">{t('checkout.yourPhone')} *</Label>
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
              <Label htmlFor="contactEmail">{t('checkout.yourEmail')} *</Label>
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
            <CardTitle>{t('checkout.deliveryAddress')}</CardTitle>
            <CardDescription>{t('checkout.deliveryAddressDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company">{t('checkout.company')}</Label>
              <Input
                id="company"
                value={formData.delivery.address.company}
                onChange={(e) => handleInputChange('delivery.address.company', e.target.value)}
                placeholder={t('checkout.companyPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="street">{t('checkout.street')} *</Label>
              <Input
                id="street"
                value={formData.delivery.address.street}
                onChange={(e) => handleInputChange('delivery.address.street', e.target.value)}
                placeholder={t('checkout.streetPlaceholder')}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">{t('checkout.city')} *</Label>
                <Input
                  id="city"
                  value={formData.delivery.address.city}
                  onChange={(e) => handleInputChange('delivery.address.city', e.target.value)}
                  placeholder={t('checkout.cityPlaceholder')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="province">{t('checkout.province')} *</Label>
                <Select 
                  value={formData.delivery.address.province} 
                  onValueChange={(value) => handleInputChange('delivery.address.province', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('checkout.selectProvince')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QC">{t('checkout.quebec')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="postalCode">{t('checkout.postalCode')} *</Label>
                <Input
                  id="postalCode"
                  value={formData.delivery.address.postalCode}
                  onChange={(e) => handleInputChange('delivery.address.postalCode', e.target.value)}
                  placeholder={t('checkout.postalCodePlaceholder')}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deliveryDate">{t('checkout.deliveryDate')} *</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={formData.delivery.date}
                  onChange={(e) => handleInputChange('delivery.date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="deliveryTime">{t('checkout.deliveryTime')} *</Label>
                <Select 
                  value={formData.delivery.time} 
                  onValueChange={(value) => handleInputChange('delivery.time', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('checkout.selectDeliveryTime')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="09:00">{t('checkout.timeSlots.09:00')}</SelectItem>
                    <SelectItem value="10:00">{t('checkout.timeSlots.10:00')}</SelectItem>
                    <SelectItem value="11:00">{t('checkout.timeSlots.11:00')}</SelectItem>
                    <SelectItem value="12:00">{t('checkout.timeSlots.12:00')}</SelectItem>
                    <SelectItem value="13:00">{t('checkout.timeSlots.13:00')}</SelectItem>
                    <SelectItem value="14:00">{t('checkout.timeSlots.14:00')}</SelectItem>
                    <SelectItem value="15:00">{t('checkout.timeSlots.15:00')}</SelectItem>
                    <SelectItem value="16:00">{t('checkout.timeSlots.16:00')}</SelectItem>
                    <SelectItem value="17:00">{t('checkout.timeSlots.17:00')}</SelectItem>
                    <SelectItem value="18:00">{t('checkout.timeSlots.18:00')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="deliveryInstructions">{t('checkout.deliveryInstructions')}</Label>
              <Textarea
                id="deliveryInstructions"
                value={formData.delivery.instructions}
                onChange={(e) => handleInputChange('delivery.instructions', e.target.value)}
                placeholder={t('checkout.deliveryInstructionsPlaceholder')}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="buzzerCode">{t('checkout.buzzerCode')}</Label>
              <Input
                id="buzzerCode"
                value={formData.delivery.buzzerCode}
                onChange={(e) => handleInputChange('delivery.buzzerCode', e.target.value)}
                placeholder={t('checkout.buzzerCodePlaceholder')}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pickup Information */}
      {deliveryOption === 'pickup' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('checkout.pickupInfo')}</CardTitle>
            <CardDescription>{t('checkout.pickupInfoDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('checkout.pickupLocation')}</Label>
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-900">{t('checkout.mainStore')}</p>
                <p className="text-sm text-gray-600">{formData.pickup.storeAddress}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pickupDate">{t('checkout.pickupDate')} *</Label>
                <Input
                  id="pickupDate"
                  type="date"
                  value={formData.pickup.date}
                  onChange={(e) => handleInputChange('pickup.date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="pickupTime">{t('checkout.pickupTime')} *</Label>
                <Select 
                  value={formData.pickup.time} 
                  onValueChange={(value) => handleInputChange('pickup.time', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('checkout.selectPickupTime')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="09:00">{t('checkout.timeSlots.09:00')}</SelectItem>
                    <SelectItem value="10:00">{t('checkout.timeSlots.10:00')}</SelectItem>
                    <SelectItem value="11:00">{t('checkout.timeSlots.11:00')}</SelectItem>
                    <SelectItem value="12:00">{t('checkout.timeSlots.12:00')}</SelectItem>
                    <SelectItem value="13:00">{t('checkout.timeSlots.13:00')}</SelectItem>
                    <SelectItem value="14:00">{t('checkout.timeSlots.14:00')}</SelectItem>
                    <SelectItem value="15:00">{t('checkout.timeSlots.15:00')}</SelectItem>
                    <SelectItem value="16:00">{t('checkout.timeSlots.16:00')}</SelectItem>
                    <SelectItem value="17:00">{t('checkout.timeSlots.17:00')}</SelectItem>
                    <SelectItem value="18:00">{t('checkout.timeSlots.18:00')}</SelectItem>
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
          <CardTitle>{t('checkout.specialInstructions')}</CardTitle>
          <CardDescription>{t('checkout.specialInstructionsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.specialInstructions}
            onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
            placeholder={t('checkout.specialInstructionsPlaceholder')}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Order Summary and Checkout */}
      <Card>
        <CardHeader>
          <CardTitle>{t('checkout.orderSummary')}</CardTitle>
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
            <span>{t('checkout.total')}</span>
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
            {t('checkout.payWithStripe')} - ${(totalPrice / 100).toFixed(2)} CAD
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
