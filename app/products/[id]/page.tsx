"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "@/lib/api"
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
  // Legacy price structure (deprecated)
  price: {
    standard: number;
    deluxe: number;
    premium: number;
  };
  // New variants structure
  variants: Array<{
    _id: string;
    tierName: 'standard' | 'deluxe' | 'premium';
    price: number;
    stock: number;
    images: Array<{
      size: string;
      publicId: string;
      url: string;
      alt: string;
      isPrimary: boolean;
    }>;
    isActive: boolean;
  }>;
  // Legacy stock field (deprecated)
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
  

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await apiFetch(`/api/products/${productId}`)
        
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

  // Update selected image when tier changes
  useEffect(() => {
    if (product) {
      const newImage = getCurrentImage()
      setSelectedImage(newImage)
    }
  }, [selectedTier, product])

  // Helper function to format price
  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)} CAD`
  }

  // Helper function to get current price based on selected tier
  const getCurrentPrice = () => {
    if (!product) return 0
    
    // Try to get price from variants first (new structure)
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(v => v.tierName === selectedTier && v.isActive && v.stock > 0)
      if (variant) return variant.price
    }
    
    // Fallback to legacy price structure
    return product.price[selectedTier] || 0
  }

  // Helper function to get stock for a specific tier (always infinite)
  const getTierStock = (tier: 'standard' | 'deluxe' | 'premium') => {
    // Stock is always infinite, return a large number for display
    return 999999
  }

  // Helper function to check if a tier is available (always true)
  const isTierAvailable = (tier: 'standard' | 'deluxe' | 'premium') => {
    if (!product) return false
    
    // Check if tier exists and is active
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(v => v.tierName === tier && v.isActive)
      return !!variant
    }
    
    // Fallback to legacy structure - always available if product exists
    return true
  }

  // Helper function to get maximum available quantity for current tier (always infinite)
  const getMaxQuantity = () => {
    // Stock is always infinite, return a large number
    return 999999
  }

  // Helper function to get current image based on selected tier
  const getCurrentImage = () => {
    if (!product) return "/placeholder.svg"
    
    // Try to get image from variants first (new structure)
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(v => v.tierName === selectedTier && v.isActive)
      if (variant && variant.images && variant.images.length > 0) {
        const primaryImage = variant.images.find(img => img.isPrimary)
        return primaryImage?.url || variant.images[0]?.url || "/placeholder.svg"
      }
    }
    
    // Fallback to legacy image structure
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
    
    // Try to get images from variants first (new structure)
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(v => v.tierName === selectedTier && v.isActive)
      if (variant && variant.images && variant.images.length > 0) {
        if (selectedImageSize === 'all') {
          return variant.images
        }
        return variant.images.filter(img => img.size === selectedImageSize)
      }
    }
    
    // Fallback to main product images
    if (selectedImageSize === 'all') {
      return product.images || []
    }
    
    return product.images?.filter(img => img.size === selectedImageSize) || []
  }

  // Helper function to get available image sizes
  const getAvailableSizes = () => {
    if (!product) return []
    
    // Try to get sizes from variants first (new structure)
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(v => v.tierName === selectedTier && v.isActive)
      if (variant && variant.images && variant.images.length > 0) {
        const sizes = [...new Set(variant.images.map(img => img.size))]
        return ['all', ...sizes]
      }
    }
    
    // Fallback to main product images
    const sizes = [...new Set(product.images?.map(img => img.size) || [])]
    return ['all', ...sizes]
  }

  // Helper function to get price for a specific tier
  const getTierPrice = (tier: 'standard' | 'deluxe' | 'premium') => {
    if (!product) return 0
    
    // Try to get price from variants first (new structure)
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(v => v.tierName === tier && v.isActive)
      if (variant) return variant.price
    }
    
    // Fallback to legacy price structure
    return product.price[tier] || 0
  }

  // Tier options
  const tierOptions = [
    { key: 'standard' as const, label: 'Standard', price: getTierPrice('standard') },
    { key: 'deluxe' as const, label: 'Deluxe', price: getTierPrice('deluxe') },
    { key: 'premium' as const, label: 'Premium', price: getTierPrice('premium') }
  ]

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change
    const maxQty = getMaxQuantity()
    if (newQuantity >= 1 && newQuantity <= maxQty) {
      setQuantity(newQuantity)
    }
  }


  const [addingToCart, setAddingToCart] = useState(false);
  const [addToCartError, setAddToCartError] = useState<string | null>(null);

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      setAddingToCart(true);
      setAddToCartError(null);

      // Add the item to cart (no stock validation needed)
      const success = await addToCart({
        productId: product._id,
        name: `${product.name} (${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)})`,
        price: getCurrentPrice(),
        image: getCurrentImage(),
        selectedTier: selectedTier
      }, quantity);

      if (success) {
        // Show success message
        alert('Product added to cart!');
      } else {
        setAddToCartError('Failed to add product to cart. Please try again.');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setAddToCartError('An error occurred while adding to cart. Please try again.');
    } finally {
      setAddingToCart(false);
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Image - Left 2/3 */}
          <div className="lg:col-span-2">
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
              <img
                src={selectedImage || getCurrentImage()}
                alt={product.name}
                className="max-w-full max-h-full object-contain"
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
                    <div key={option.key}>
                      <button
                        onClick={() => setSelectedTier(option.key)}
                        className={`p-4 text-left border rounded-lg transition-colors w-full ${
                          selectedTier === option.key
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${!isTierAvailable(option.key) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{ 
                          color: theme.colors.text.secondary,
                          backgroundColor: selectedTier === option.key ? '#f0f9ff' : 'transparent'
                        }}
                        disabled={!isTierAvailable(option.key)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-lg font-semibold">{formatPrice(option.price)}</span>
                        </div>
                        <div className="mt-1 text-sm" style={{ color: theme.colors.text.light }}>
                          {isTierAvailable(option.key) 
                            ? 'In stock' 
                            : 'Not available'}
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: theme.colors.text.secondary }}>
                  Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className={`w-8 h-8 flex items-center justify-center border border-gray-300 rounded ${
                      quantity > 1 ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'
                    }`}
                    style={{ color: theme.colors.text.secondary }}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      const maxQty = getMaxQuantity();
                      setQuantity(Math.min(Math.max(1, val), maxQty));
                    }}
                    className="w-16 text-center border border-gray-300 rounded py-2"
                    style={{ color: theme.colors.text.secondary }}
                    min="1"
                    max={getMaxQuantity()}
                  />
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className={`w-8 h-8 flex items-center justify-center border border-gray-300 rounded ${
                      quantity < getMaxQuantity() ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'
                    }`}
                    style={{ color: theme.colors.text.secondary }}
                    disabled={quantity >= getMaxQuantity()}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className="mb-8">
                <Button
                  onClick={handleAddToCart}
                  className="w-full py-3 text-lg font-medium relative"
                  disabled={!isTierAvailable(selectedTier) || addingToCart}
                  style={{ backgroundColor: theme.colors.text.secondary, color: theme.colors.white }}
                >
                  {addingToCart ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Adding...
                    </div>
                  ) : isTierAvailable(selectedTier) ? 'Add to cart' : 'Not available'}
                </Button>
                {addToCartError && (
                  <p className="mt-2 text-sm text-red-600">{addToCartError}</p>
                )}
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
                        Stock: In stock
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
