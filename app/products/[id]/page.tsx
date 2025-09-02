"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown, Filter, Search, ShoppingCart, User, Minus, Plus } from "lucide-react"
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
  description: string;
  price: number;
  quantity: number;
  category: string;
  tags: string[];
  images: Array<{
    publicId: string;
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  isActive: boolean;
  isFeatured: boolean;
  shopId: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const { addToCart, getItemQuantity, isInCart } = useCart()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<number>(0)
  const [quantity, setQuantity] = useState(1)
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
        
        const response = await fetch(`http://localhost:5001/api/products/${productId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch product: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.success) {
          setProduct(data.data)
          setSelectedSize(data.data.price) // Set initial size to current price
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

  // Helper function to get primary image
  const getPrimaryImage = (images: Product['images']) => {
    const primaryImage = images.find(img => img.isPrimary)
    return primaryImage?.url || images[0]?.url || "/placeholder.svg"
  }

  // Size options (you can customize these based on your product)
  const sizeOptions = [
    { price: 15000, label: "$150" },
    { price: 20000, label: "$200" },
    { price: 25000, label: "$250" },
    { price: 30000, label: "$300" },
    { price: 35000, label: "$350" },
    { price: 40000, label: "$400" },
    { price: 45000, label: "$450" },
    { price: 50000, label: "$500" },
    { price: 55000, label: "$550" },
    { price: 60000, label: "$600" }
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

  const handleAddToCart = () => {
    if (!product) return;

    // Add the item to cart
    addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: getPrimaryImage(product.images),
      selectedSize: selectedSize !== product.price ? selectedSize : undefined
    });

    // Show success message
    alert('Product added to cart!');
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
                src={getPrimaryImage(product.images)}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Details - Right 1/3 */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {/* Product Title */}
              <h1 className="text-3xl font-light mb-4" style={{ color: theme.colors.text.secondary }}>
                {product.name}
              </h1>

              {/* Price */}
              <p className="text-2xl font-medium mb-6" style={{ color: theme.colors.text.secondary }}>
                {formatPrice(selectedSize)}
              </p>

              {/* Description */}
              <p className="text-sm mb-8 leading-relaxed" style={{ color: theme.colors.text.light }}>
                {product.description || "Let one of our skilled designers create a one of a kind masterpiece for you. It will arrive arranged in a simple container, gift wrapped with attention."}
              </p>

              {/* Size Options */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: theme.colors.text.secondary }}>
                  Size: {formatPrice(selectedSize)}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {sizeOptions.map((option) => (
                    <button
                      key={option.price}
                      onClick={() => setSelectedSize(option.price)}
                      className={`p-3 text-sm border rounded transition-colors ${
                        selectedSize === option.price
                          ? 'border-gray-400 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ 
                        color: theme.colors.text.secondary,
                        backgroundColor: selectedSize === option.price ? theme.colors.hover : 'transparent'
                      }}
                    >
                      {option.label}
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

              {/* Add to Cart Button */}
              <Button
                onClick={handleAddToCart}
                className="w-full py-3 text-lg font-medium mb-8"
                style={{ backgroundColor: theme.colors.text.secondary, color: theme.colors.white }}
              >
                Add to cart
              </Button>

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
                        Category: {product.category}
                      </p>
                      {product.tags.length > 0 && (
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
