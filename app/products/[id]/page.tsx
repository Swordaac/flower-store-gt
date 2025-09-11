"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown, Filter, Search, ShoppingCart, User, Minus, Plus, MapPin, Clock, Truck, Store } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { CartIcon } from "@/components/CartIcon"

// Reusable theme object
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

interface Product {
  _id: string;
  name: string;
  color: string;
  description: string;
  price: {
    standard: number;
    deluxe: number;
    premium: number;
  };
  stock: number;
  category: string[];
  tags: string[];
  images: Array<{
    size: string;
    publicId: string;
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  deluxeImage?: {
    publicId: string;
    url: string;
    alt: string;
  };
  premiumImage?: {
    publicId: string;
    url: string;
    alt: string;
  };
  isActive: boolean;
  isFeatured: boolean;
  shopId: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const { addToCart, getItemQuantity, isInCart, submitOrder } = useCart()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTier, setSelectedTier] = useState<'standard' | 'deluxe' | 'premium'>('standard')
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [selectedImageSize, setSelectedImageSize] = useState<string>('all')
  const [expandedSections, setExpandedSections] = useState({
    delivery: true,
    substitution: false,
    returns: false,
    details: false
  })
  
  // Delivery and pickup options
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'pickup' | null>(null)
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Canada'
  })
  const [deliveryTime, setDeliveryTime] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`http://localhost:5001/api/products/${productId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch product: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.success) {
          setProduct(data.data)
          // Set initial image to primary image
          const primaryImage = data.data.images?.find((img: any) => img.isPrimary)
          setSelectedImage(primaryImage?.url || data.data.images?.[0]?.url || '')
        } else {
          throw new Error(data.error || 'Failed to fetch product')
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch product')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  // Helper function to format price
  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)} CAD`
  }

  // Helper function to get current price based on selected tier
  const getCurrentPrice = () => {
    if (!product) return 0
    return product.price[selectedTier]
  }

  // Helper function to get current image based on selected tier
  const getCurrentImage = () => {
    if (!product) return "/placeholder.svg"
    
    if (selectedTier === 'deluxe' && product.deluxeImage?.url) {
      return product.deluxeImage.url
    }
    if (selectedTier === 'premium' && product.premiumImage?.url) {
      return product.premiumImage.url
    }
    
    // Fall back to primary image or first image
    const primaryImage = product.images?.find(img => img.isPrimary)
    return primaryImage?.url || product.images?.[0]?.url || "/placeholder.svg"
  }

  // Helper function to get filtered images by size
  const getFilteredImages = () => {
    if (!product) return []
    
    if (selectedImageSize === 'all') {
      return product.images || []
    }
    
    return product.images?.filter(img => img.size === selectedImageSize) || []
  }

  // Helper function to get available image sizes
  const getAvailableSizes = () => {
    if (!product) return []
    
    const sizes = [...new Set(product.images?.map(img => img.size) || [])]
    return ['all', ...sizes]
  }

  // Tier options
  const tierOptions = [
    { key: 'standard' as const, label: 'Standard', price: product?.price.standard || 0 },
    { key: 'deluxe' as const, label: 'Deluxe', price: product?.price.deluxe || 0 },
    { key: 'premium' as const, label: 'Premium', price: product?.price.premium || 0 }
  ]

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change
    if (newQuantity >= 1) {
      setQuantity(newQuantity)
    }
  }

  // Validation functions
  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!deliveryOption) {
      errors.deliveryOption = 'Please select delivery or pickup option'
    }
    
    if (deliveryOption === 'delivery') {
      if (!deliveryAddress.street.trim()) errors.street = 'Street address is required'
      if (!deliveryAddress.city.trim()) errors.city = 'City is required'
      if (!deliveryAddress.province.trim()) errors.province = 'Province is required'
      if (!deliveryAddress.postalCode.trim()) errors.postalCode = 'Postal code is required'
      if (!deliveryTime) errors.deliveryTime = 'Please select a delivery time'
    }
    
    if (deliveryOption === 'pickup') {
      if (!pickupTime) errors.pickupTime = 'Please select a pickup time'
    }
    
    if (!contactPhone.trim()) errors.contactPhone = 'Phone number is required'
    if (!contactEmail.trim()) errors.contactEmail = 'Email is required'
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Generate time slots for delivery and pickup
  const generateTimeSlots = (type: 'delivery' | 'pickup') => {
    const slots = []
    const startHour = type === 'delivery' ? 9 : 8
    const endHour = type === 'delivery' ? 18 : 20
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const displayTime = new Date(2000, 0, 1, hour, minute).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
        slots.push({ value: timeString, label: displayTime })
      }
    }
    return slots
  }

  const handleAddToCart = () => {
    if (!product) return;

    // Validate form before adding to cart
    if (!validateForm()) {
      return
    }

    // Prepare delivery/pickup information
    const orderInfo = {
      deliveryOption: deliveryOption!,
      ...(deliveryOption === 'delivery' && {
        address: deliveryAddress,
        deliveryTime
      }),
      ...(deliveryOption === 'pickup' && {
        pickupTime,
        pickupLocationId: '68bf680327878268f9bfcc8e' // Main Store pickup location
      }),
      specialInstructions,
      contactPhone,
      contactEmail
    }

    // Add the item to cart with delivery/pickup info
    addToCart({
      productId: product._id,
      name: `${product.name} (${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)})`,
      price: getCurrentPrice(),
      image: getCurrentImage(),
      selectedTier: selectedTier,
      orderInfo: orderInfo
    }, quantity);

    // Show success message
    alert('Product added to cart with delivery/pickup information!');
  }

  const handleSubmitOrder = async () => {
    if (!product) return;

    // Validate form before submitting order
    if (!validateForm()) {
      return
    }

    // Prepare delivery/pickup information
    const orderInfo = {
      deliveryOption: deliveryOption!,
      ...(deliveryOption === 'delivery' && {
        address: deliveryAddress,
        deliveryTime
      }),
      ...(deliveryOption === 'pickup' && {
        pickupTime,
        pickupLocationId: '68bf680327878268f9bfcc8e' // Main Store pickup location
      }),
      specialInstructions,
      contactPhone,
      contactEmail
    }

    // Submit order directly
    const result = await submitOrder(product.shopId, orderInfo);
    
    if (result.success) {
      alert(`Order submitted successfully! Order ID: ${result.orderId}`);
    } else {
      alert(`Failed to submit order: ${result.error}`);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: theme.colors.primary }}></div>
          <p style={{ color: theme.colors.text.primary }}>Loading product...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error || 'Product not found'}</p>
          <Button 
            onClick={() => window.history.back()} 
            style={{ backgroundColor: theme.colors.primary, color: theme.colors.text.white }}
          >
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      {/* Header */}
      <header style={{ backgroundColor: theme.colors.background, zIndex: 9999 }} className="backdrop-blur-sm border-b border-gray-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="text-xl font-serif tracking-wider" style={{ color: theme.colors.text.primary }}>Flower</div>
              <div className="text-xs tracking-widest" style={{ color: theme.colors.text.primary }}>FLORIST</div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-700 hover:text-gray-900" style={{ color: theme.colors.text.primary }}>
                Shop
              </a>
              <a href="#" className="text-gray-700 hover:text-gray-900" style={{ color: theme.colors.text.primary }}>
                Best Sellers
              </a>
              <a href="#" className="text-gray-700 hover:text-gray-900" style={{ color: theme.colors.text.primary }}>
                About Us
              </a>
              <a href="#" className="text-gray-700 hover:text-gray-900" style={{ color: theme.colors.text.primary }}>
                Store Location
              </a>
              <a href="#" className="text-gray-700 hover:text-gray-900" style={{ color: theme.colors.text.primary }}>
                Contact
              </a>
            </nav>

            {/* Right side icons and auth */}
            <div className="flex items-center space-x-4">
              <Search className="h-5 w-5 cursor-pointer" style={{ color: theme.colors.text.primary }} />
              <CartIcon style={{ color: theme.colors.text.primary }} />
              
              {/* Authentication Links */}
              <div className="flex items-center space-x-3">
                <a href="/auth/signin" className="hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors" style={{ color: theme.colors.text.primary }}>
                  Sign In
                </a>
                <a href="/auth/signup" className="hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors" style={{ backgroundColor: theme.colors.primary, color: theme.colors.text.white }}>
                  Sign Up
                </a>
              </div>
              
              <span className="text-sm" style={{ color: theme.colors.text.primary }}>EN</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Image - Left 2/3 */}
          <div className="lg:col-span-2">
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
              <img
                src={getCurrentImage()}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Image Gallery */}
            {product.images.length > 0 && (
              <div className="mt-4">
                {/* Size Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Size:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {getAvailableSizes().map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedImageSize(size)}
                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                          selectedImageSize === size
                            ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {size === 'all' ? 'All Sizes' : size.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {getFilteredImages().map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(image.url)}
                      className={`aspect-square overflow-hidden rounded-lg relative ${
                        selectedImage === image.url ? 'ring-2 ring-indigo-500' : ''
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="w-full h-full object-cover"
                      />
                      {/* Size Badge */}
                      <div className="absolute top-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 rounded">
                        {image.size?.toUpperCase() || 'N/A'}
                      </div>
                      {/* Primary Badge */}
                      {image.isPrimary && (
                        <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                          ★
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product Details - Right 1/3 */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {/* Product Title */}
              <h1 className="text-3xl font-light mb-2" style={{ color: theme.colors.text.secondary }}>
                {product.name}
              </h1>

              {/* Color */}
              <p className="text-sm mb-4" style={{ color: theme.colors.text.light }}>
                Color: <span className="capitalize font-medium">{product.color}</span>
              </p>

              {/* Price */}
              <p className="text-2xl font-medium mb-6" style={{ color: theme.colors.text.secondary }}>
                {formatPrice(getCurrentPrice())}
              </p>

              {/* Description */}
              <p className="text-sm mb-8 leading-relaxed" style={{ color: theme.colors.text.light }}>
                {product.description || "Let one of our skilled designers create a one of a kind masterpiece for you. It will arrive arranged in a simple container, gift wrapped with attention."}
              </p>

              {/* Tier Options */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: theme.colors.text.secondary }}>
                  Select Tier: {formatPrice(getCurrentPrice())}
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {tierOptions.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => setSelectedTier(option.key)}
                      className={`p-4 text-left border rounded-lg transition-colors ${
                        selectedTier === option.key
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ 
                        color: theme.colors.text.secondary,
                        backgroundColor: selectedTier === option.key ? '#f0f9ff' : 'transparent'
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-lg font-semibold">{formatPrice(option.price)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: theme.colors.text.secondary }}>
                  Quantity:
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center border border-gray-300 rounded py-2"
                    style={{ color: theme.colors.text.secondary }}
                  />
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Delivery/Pickup Options */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: theme.colors.text.secondary }}>
                  Delivery Option:
                </label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => setDeliveryOption('delivery')}
                    className={`p-4 text-left border rounded-lg transition-colors flex items-center space-x-3 ${
                      deliveryOption === 'delivery'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ 
                      color: theme.colors.text.secondary,
                      backgroundColor: deliveryOption === 'delivery' ? '#f0f9ff' : 'transparent'
                    }}
                  >
                    <Truck className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Delivery</div>
                      <div className="text-xs text-gray-500">We'll deliver to you</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setDeliveryOption('pickup')}
                    className={`p-4 text-left border rounded-lg transition-colors flex items-center space-x-3 ${
                      deliveryOption === 'pickup'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ 
                      color: theme.colors.text.secondary,
                      backgroundColor: deliveryOption === 'pickup' ? '#f0f9ff' : 'transparent'
                    }}
                  >
                    <Store className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Pickup</div>
                      <div className="text-xs text-gray-500">Pick up at our store</div>
                    </div>
                  </button>
                </div>
                {formErrors.deliveryOption && (
                  <p className="text-red-500 text-sm mb-2">{formErrors.deliveryOption}</p>
                )}
              </div>

              {/* Delivery Address Form */}
              {deliveryOption === 'delivery' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3" style={{ color: theme.colors.text.secondary }}>
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Delivery Address:
                  </label>
                  <div className="space-y-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Street Address"
                        value={deliveryAddress.street}
                        onChange={(e) => setDeliveryAddress(prev => ({ ...prev, street: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        style={{ color: theme.colors.text.secondary }}
                      />
                      {formErrors.street && <p className="text-red-500 text-sm mt-1">{formErrors.street}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          placeholder="City"
                          value={deliveryAddress.city}
                          onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          style={{ color: theme.colors.text.secondary }}
                        />
                        {formErrors.city && <p className="text-red-500 text-sm mt-1">{formErrors.city}</p>}
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Province"
                          value={deliveryAddress.province}
                          onChange={(e) => setDeliveryAddress(prev => ({ ...prev, province: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          style={{ color: theme.colors.text.secondary }}
                        />
                        {formErrors.province && <p className="text-red-500 text-sm mt-1">{formErrors.province}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Postal Code"
                          value={deliveryAddress.postalCode}
                          onChange={(e) => setDeliveryAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          style={{ color: theme.colors.text.secondary }}
                        />
                        {formErrors.postalCode && <p className="text-red-500 text-sm mt-1">{formErrors.postalCode}</p>}
                      </div>
                      <div>
                        <select
                          value={deliveryAddress.country}
                          onChange={(e) => setDeliveryAddress(prev => ({ ...prev, country: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          style={{ color: theme.colors.text.secondary }}
                        >
                          <option value="Canada">Canada</option>
                          <option value="United States">United States</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Time Selection */}
              {deliveryOption === 'delivery' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3" style={{ color: theme.colors.text.secondary }}>
                    <Clock className="inline h-4 w-4 mr-1" />
                    Delivery Time:
                  </label>
                  <select
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    <option value="">Select delivery time</option>
                    {generateTimeSlots('delivery').map((slot) => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.deliveryTime && <p className="text-red-500 text-sm mt-1">{formErrors.deliveryTime}</p>}
                </div>
              )}

              {/* Pickup Time Selection */}
              {deliveryOption === 'pickup' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3" style={{ color: theme.colors.text.secondary }}>
                    <Clock className="inline h-4 w-4 mr-1" />
                    Pickup Time:
                  </label>
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    <option value="">Select pickup time</option>
                    {generateTimeSlots('pickup').map((slot) => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.pickupTime && <p className="text-red-500 text-sm mt-1">{formErrors.pickupTime}</p>}
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Pickup Location:</strong> 123 Flower Street, Toronto, ON M5V 3A8<br/>
                      <strong>Store Hours:</strong> Mon-Fri 8:00 AM - 8:00 PM, Sat-Sun 9:00 AM - 6:00 PM
                    </p>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: theme.colors.text.secondary }}>
                  Contact Information:
                </label>
                <div className="space-y-3">
                  <div>
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      style={{ color: theme.colors.text.secondary }}
                    />
                    {formErrors.contactPhone && <p className="text-red-500 text-sm mt-1">{formErrors.contactPhone}</p>}
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      style={{ color: theme.colors.text.secondary }}
                    />
                    {formErrors.contactEmail && <p className="text-red-500 text-sm mt-1">{formErrors.contactEmail}</p>}
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: theme.colors.text.secondary }}>
                  Special Instructions (Optional):
                </label>
                <textarea
                  placeholder="Any special requests or instructions for your order..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  style={{ color: theme.colors.text.secondary }}
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mb-8">
                <Button
                  onClick={handleAddToCart}
                  className="w-full py-3 text-lg font-medium"
                  style={{ backgroundColor: theme.colors.text.secondary, color: theme.colors.white }}
                >
                  Add to cart
                </Button>
                <Button
                  onClick={handleSubmitOrder}
                  className="w-full py-3 text-lg font-medium"
                  style={{ backgroundColor: theme.colors.primary, color: theme.colors.white }}
                >
                  Submit Order
                </Button>
              </div>

              {/* Expandable Sections */}
              <div className="space-y-4">
                {/* Delivery */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleSection('delivery')}
                    className="w-full flex items-center justify-between py-3 text-left"
                  >
                    <span className="font-medium" style={{ color: theme.colors.text.secondary }}>Delivery</span>
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform ${expandedSections.delivery ? 'rotate-180' : ''}`}
                      style={{ color: theme.colors.text.secondary }}
                    />
                  </button>
                  {expandedSections.delivery && (
                    <div className="pb-4">
                      <p className="text-sm mb-2" style={{ color: theme.colors.text.light }}>
                        Click here to find out if we deliver to you!
                      </p>
                      <p className="text-sm" style={{ color: theme.colors.text.light }}>
                        Want to learn more about how your delivery will be handled? Visit our FAQ.
                      </p>
                    </div>
                  )}
                </div>

                {/* Substitution Policy */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleSection('substitution')}
                    className="w-full flex items-center justify-between py-3 text-left"
                  >
                    <span className="font-medium" style={{ color: theme.colors.text.secondary }}>Substitution policy</span>
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform ${expandedSections.substitution ? 'rotate-180' : ''}`}
                      style={{ color: theme.colors.text.secondary }}
                    />
                  </button>
                  {expandedSections.substitution && (
                    <div className="pb-4">
                      <p className="text-sm" style={{ color: theme.colors.text.light }}>
                        We reserve the right to substitute flowers of equal or greater value if the requested flowers are not available.
                      </p>
                    </div>
                  )}
                </div>

                {/* Returns & Refunds */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleSection('returns')}
                    className="w-full flex items-center justify-between py-3 text-left"
                  >
                    <span className="font-medium" style={{ color: theme.colors.text.secondary }}>Returns & refunds</span>
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform ${expandedSections.returns ? 'rotate-180' : ''}`}
                      style={{ color: theme.colors.text.secondary }}
                    />
                  </button>
                  {expandedSections.returns && (
                    <div className="pb-4">
                      <p className="text-sm" style={{ color: theme.colors.text.light }}>
                        We offer a 100% satisfaction guarantee. If you're not completely satisfied, contact us within 24 hours.
                      </p>
                    </div>
                  )}
                </div>

                {/* Details & Care */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleSection('details')}
                    className="w-full flex items-center justify-between py-3 text-left"
                  >
                    <span className="font-medium" style={{ color: theme.colors.text.secondary }}>Details & care</span>
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform ${expandedSections.details ? 'rotate-180' : ''}`}
                      style={{ color: theme.colors.text.secondary }}
                    />
                  </button>
                  {expandedSections.details && (
                    <div className="pb-4">
                      <p className="text-sm mb-2" style={{ color: theme.colors.text.light }}>
                        Categories: {product.category.join(', ')}
                      </p>
                      <p className="text-sm mb-2" style={{ color: theme.colors.text.light }}>
                        Color: <span className="capitalize">{product.color}</span>
                      </p>
                      <p className="text-sm mb-2" style={{ color: theme.colors.text.light }}>
                        Stock: {product.stock} available
                      </p>
                      {product.tags.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm mb-2" style={{ color: theme.colors.text.light }}>
                            Tags:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {product.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs rounded-full bg-gray-100"
                                style={{ color: theme.colors.text.light }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
