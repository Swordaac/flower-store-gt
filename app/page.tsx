"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown, Filter, Search, ShoppingCart, User } from "lucide-react"
import { CartIcon } from "@/components/CartIcon"
import { useCart } from "@/contexts/CartContext"

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
  price: {
    standard: number;
    deluxe: number;
    premium: number;
  };
  stock: number;
  category: string[];
  productTypes: Array<{
    _id: string;
    name: string;
    color: string;
    icon?: string;
  }>;
  occasions: Array<{
    _id: string;
    name: string;
    color: string;
    icon?: string;
    isSeasonal: boolean;
  }>;
  variants: Array<{
    tierName: string;
    price: number;
    stock: number;
    images: Array<{
      publicId: string;
      url: string;
      alt: string;
      isPrimary: boolean;
    }>;
    isActive: boolean;
  }>;
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

interface ProductType {
  _id: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
}

interface Occasion {
  _id: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
  isActive: boolean;
  isSeasonal: boolean;
  sortOrder: number;
}

export default function BestSellersPage() {
  const searchParams = useSearchParams()
  const { clearCart } = useCart()
  const [timeLeft, setTimeLeft] = useState({
    hours: 8,
    minutes: 36,
    seconds: 36,
  })
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [occasions, setOccasions] = useState<Occasion[]>([])
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([])
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Clear cart if returning from successful payment
  useEffect(() => {
    const paymentSuccess = searchParams.get('payment_success')
    const orderId = searchParams.get('order_id')
    
    if (paymentSuccess === 'true' && orderId) {
      console.log('Payment success detected, clearing cart for order:', orderId)
      clearCart()
      // Clean up URL parameters
      const url = new URL(window.location.href)
      url.searchParams.delete('payment_success')
      url.searchParams.delete('order_id')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams, clearCart])

  // Load product types and occasions
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        // Load product types
        const productTypesResponse = await fetch('http://localhost:5001/api/products/types')
        if (productTypesResponse.ok) {
          const productTypesData = await productTypesResponse.json()
          setProductTypes(productTypesData.data || [])
        }
        
        // Load occasions
        const occasionsResponse = await fetch('http://localhost:5001/api/products/occasions')
        if (occasionsResponse.ok) {
          const occasionsData = await occasionsResponse.json()
          setOccasions(occasionsData.data || [])
        }
      } catch (error) {
        console.error('Error loading filter data:', error)
      }
    }
    
    loadFilterData()
  }, [])

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const shopId = '68c34f45ee89e0fd81c8aa4d'
        const response = await fetch(`http://localhost:5001/api/products/shop/${shopId}?inStock=true`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.success) {
          // Filter products to only show those with stock > 0 (extra safety)
          const productsWithStock = (data.data || []).filter((product: Product) => product.stock > 0)
          setProducts(productsWithStock)
          setFilteredProducts(productsWithStock)
        } else {
          throw new Error(data.error || 'Failed to fetch products')
        }
      } catch (err) {
        console.error('Error fetching products:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch products')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Filter products based on selected filters
  useEffect(() => {
    let filtered = [...products]

    // Filter by product types
    if (selectedProductTypes.length > 0) {
      filtered = filtered.filter(product => 
        product.productTypes?.some(pt => selectedProductTypes.includes(pt._id))
      )
    }

    // Filter by occasions
    if (selectedOccasions.length > 0) {
      filtered = filtered.filter(product => 
        product.occasions?.some(occasion => selectedOccasions.includes(occasion._id))
      )
    }

    setFilteredProducts(filtered)
  }, [products, selectedProductTypes, selectedOccasions])

  // Fetch filtered products from API when filters change
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      if (selectedProductTypes.length === 0 && selectedOccasions.length === 0) {
        return // Use existing products
      }

      try {
        const shopId = '68c34f45ee89e0fd81c8aa4d'
        let url = `http://localhost:5001/api/products/shop/${shopId}?inStock=true`
        
        // Add product type filters
        if (selectedProductTypes.length > 0) {
          url += `&productTypes=${selectedProductTypes.join(',')}`
        }
        
        // Add occasion filters
        if (selectedOccasions.length > 0) {
          url += `&occasions=${selectedOccasions.join(',')}`
        }

        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const productsWithStock = (data.data || []).filter((product: Product) => product.stock > 0)
            setFilteredProducts(productsWithStock)
          }
        }
      } catch (error) {
        console.error('Error fetching filtered products:', error)
        // Fallback to client-side filtering
        let filtered = [...products]
        if (selectedProductTypes.length > 0) {
          filtered = filtered.filter(product => 
            product.productTypes?.some(pt => selectedProductTypes.includes(pt._id))
          )
        }
        if (selectedOccasions.length > 0) {
          filtered = filtered.filter(product => 
            product.occasions?.some(occasion => selectedOccasions.includes(occasion._id))
          )
        }
        setFilteredProducts(filtered)
      }
    }

    fetchFilteredProducts()
  }, [selectedProductTypes, selectedOccasions, products])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleCategoryClick = (category: string) => {
    if (activeCategory === category) {
      setActiveCategory(null)
    } else {
      setActiveCategory(category)
    }
  }

  const handleShopClick = () => {
    setIsShopDropdownOpen(!isShopDropdownOpen)
  }

  const handleClickOutside = () => {
    setIsShopDropdownOpen(false)
    setActiveCategory(null)
  }

  const handleProductTypeChange = (productTypeId: string, checked: boolean) => {
    if (checked) {
      setSelectedProductTypes(prev => [...prev, productTypeId])
    } else {
      setSelectedProductTypes(prev => prev.filter(id => id !== productTypeId))
    }
  }

  const handleOccasionChange = (occasionId: string, checked: boolean) => {
    if (checked) {
      setSelectedOccasions(prev => [...prev, occasionId])
    } else {
      setSelectedOccasions(prev => prev.filter(id => id !== occasionId))
    }
  }

  const clearFilters = () => {
    setSelectedProductTypes([])
    setSelectedOccasions([])
  }

  useEffect(() => {
    const handleClickOutsideDropdown = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.shop-dropdown-container')) {
        handleClickOutside()
      }
    }

    if (isShopDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutsideDropdown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideDropdown)
    }
  }, [isShopDropdownOpen])

  // Helper function to format price
  const formatPrice = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      const activeVariants = product.variants.filter(v => v.isActive && v.stock > 0)
      if (activeVariants.length > 0) {
        const minPrice = Math.min(...activeVariants.map(v => v.price))
        return `From $${(minPrice / 100).toFixed(2)}`
      }
    }
    
    // Fallback to legacy price structure
    if (product.price) {
      const prices = [product.price.standard, product.price.deluxe, product.price.premium].filter(p => p > 0)
      if (prices.length > 0) {
        const minPrice = Math.min(...prices)
        return `From $${(minPrice / 100).toFixed(2)}`
      }
    }
    
    return 'Price not available'
  }

  // Helper function to get primary image
  const getPrimaryImage = (product: Product) => {
    // Try to get image from variants first
    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        if (variant.isActive && variant.images && variant.images.length > 0) {
          const primaryImage = variant.images.find(img => img.isPrimary)
          if (primaryImage) return primaryImage.url
          if (variant.images[0]) return variant.images[0].url
        }
      }
    }
    
    // Fallback to legacy images
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.isPrimary)
      return primaryImage?.url || product.images[0]?.url || "/placeholder.svg"
    }
    
    return "/placeholder.svg"
  }

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: theme.colors.background }}>
      {/* Content wrapper */}
      <div className="relative">
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
                {/* Shop Dropdown */}
                <div className="relative shop-dropdown-container">
                  <div 
                    className="flex items-center space-x-1 hover:text-gray-900 cursor-pointer" 
                    style={{ color: theme.colors.text.primary }}
                    onClick={handleShopClick}
                  >
                    <span>Shop</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isShopDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {/* Dropdown Menu */}
                  {isShopDropdownOpen && (
                    <div 
                      className="absolute top-full left-0 mt-2 w-80 rounded-lg shadow-lg border"
                      style={{ 
                        backgroundColor: theme.colors.white,
                        borderColor: theme.colors.border,
                        zIndex: 99999 
                      }}
                    >
                      <div className="p-4">
                        {/* Occasion */}
                        <div className="mb-4">
                          <div 
                            className="flex items-center justify-between cursor-pointer p-2 rounded transition-colors"
                            style={{ 
                              backgroundColor: theme.colors.hover,
                              color: theme.colors.text.primary 
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.hover}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            onClick={() => handleCategoryClick('occasion')}
                          >
                            <h3 className="font-semibold" style={{ color: theme.colors.text.primary }}>Occasion</h3>
                            <ChevronDown className={`h-4 w-4 transition-transform ${activeCategory === 'occasion' ? 'rotate-180' : ''}`} style={{ color: theme.colors.text.primary }} />
                          </div>
                          {activeCategory === 'occasion' && (
                            <ul className="ml-4 mt-2 space-y-1">
                              <li><a href="#" className="text-sm block py-1 transition-colors" style={{ color: theme.colors.text.light }} onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary} onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.light }>Birthday</a></li>
                              <li><a href="#" className="text-sm block py-1 transition-colors" style={{ color: theme.colors.text.light }} onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary} onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.light }>Get well soon</a></li>
                              <li><a href="#" className="text-sm block py-1 transition-colors" style={{ color: theme.colors.text.light }} onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary} onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.light }>Anniversary</a></li>
                              <li><a href="#" className="text-sm block py-1 transition-colors" style={{ color: theme.colors.text.light }} onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary} onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.light }>Sympathy</a>
                                <ul className="ml-4 mt-1 space-y-1">
                                  <li><a href="#" className="text-xs block py-1 transition-colors" style={{ color: theme.colors.text.light }} onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary} onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.light }>Wreaths</a></li>
                                  <li><a href="#" className="text-xs block py-1 transition-colors" style={{ color: theme.colors.text.light }} onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary} onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.light }>Casket sprays</a></li>
                                  <li><a href="#" className="text-xs block py-1 transition-colors" style={{ color: theme.colors.text.light }} onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary} onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.light }>Funeral Bouquet</a></li>
                                </ul>
                              </li>
                              <li><a href="#" className="text-sm block py-1 transition-colors" style={{ color: theme.colors.text.light }} onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary} onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.light }>Congratulation</a></li>
                              <li><a href="#" className="text-sm block py-1 transition-colors" style={{ color: theme.colors.text.light }} onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary} onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.light }>Wedding</a></li>
                              <li><a href="#" className="text-sm block py-1 transition-colors" style={{ color: theme.colors.text.light }} onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary} onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.light }>New baby</a></li>
                            </ul>
                          )}
                        </div>
                        
                        {/* Plant & Flower */}
                        <div className="mb-4">
                          <div 
                            className="flex items-center justify-between cursor-pointer p-2 rounded transition-colors"
                            style={{ 
                              backgroundColor: theme.colors.hover,
                              color: theme.colors.text.primary 
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.hover}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            onClick={() => handleCategoryClick('plant')}
                          >
                            <h3 className="font-semibold" style={{ color: theme.colors.text.primary }}>Plant & Flower</h3>
                            <ChevronDown className={`h-4 w-4 transition-transform ${activeCategory === 'plant' ? 'rotate-180' : ''}`} style={{ color: theme.colors.text.primary }} />
                          </div>
                          {activeCategory === 'plant' && (
                            <ul className="ml-4 mt-2 space-y-1">
                              <li><a href="#" className="text-sm block py-1 transition-colors" style={{ color: theme.colors.text.light }} onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary} onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.light }>Orchid</a></li>
                              <li><a href="#" className="text-sm block py-1 transition-colors" style={{ color: theme.colors.text.light }} onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary} onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.light }>Rose only</a></li>
                              <li><a href="#" className="text-sm block py-1 transition-colors" style={{ color: theme.colors.text.light }} onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary} onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.light }>Indoor plant</a></li>
                            </ul>
                          )}
                        </div>
                        
                        {/* Price Range */}
                        <div className="mb-4">
                          <div 
                            className="flex items-center justify-between cursor-pointer p-2 rounded transition-colors"
                            style={{ 
                              backgroundColor: theme.colors.hover,
                              color: theme.colors.text.primary 
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.hover}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            onClick={() => handleCategoryClick('price')}
                          >
                            <h3 className="font-semibold" style={{ color: theme.colors.text.primary }}>Price Range</h3>
                            <ChevronDown className={`h-4 w-4 transition-transform ${activeCategory === 'price' ? 'rotate-180' : ''}`} style={{ color: theme.colors.text.primary }} />
                          </div>
                          {activeCategory === 'price' && (
                            <ul className="ml-4 mt-2 space-y-1">
                              <li><a href="#" className="text-sm block py-1 transition-colors" style={{ color: theme.colors.text.light }} onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary} onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.light }>&lt;$45</a></li>
                              <li><a href="#" className="text-sm block py-1 transition-colors" style={{ color: theme.colors.text.light }} onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary} onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.light }>$45-$55</a></li>
                              <li><a href="#" className="text-sm block py-1 transition-colors" style={{ color: theme.colors.text.light }} onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary} onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.light }>$60-$80</a></li>
                              <li><a href="#" className="text-sm block py-1 transition-colors" style={{ color: theme.colors.text.light }} onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary} onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.light }>$80-$120</a></li>
                              <li><a href="#" className="text-sm block py-1 transition-colors" style={{ color: theme.colors.text.light }} onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary} onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.light }>$100-$150</a></li>
                            </ul>
                          )}
                        </div>
                        
                        {/* Best seller */}
                        <div className="mb-4">
                          <div 
                            className="flex items-center justify-between cursor-pointer p-2 rounded transition-colors"
                            style={{ 
                              backgroundColor: theme.colors.hover,
                              color: theme.colors.text.primary 
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.hover}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            onClick={() => handleCategoryClick('bestseller')}
                          >
                            <h3 className="font-semibold" style={{ color: theme.colors.text.primary }}>Best seller</h3>
                            <ChevronDown className={`h-4 w-4 transition-transform ${activeCategory === 'bestseller' ? 'rotate-180' : ''}`} style={{ color: theme.colors.text.primary }} />
                          </div>
                          {activeCategory === 'bestseller' && (
                            <div className="ml-4 mt-2">
                              <p className="text-sm" style={{ color: theme.colors.text.light }}>View our most popular items</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <a href="/about" className="text-gray-700 hover:text-gray-900" style={{ color: theme.colors.text.primary }}>
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
                Welcome to FLORIST
              </h1>
              <p className="text-xl md:text-2xl font-light mb-8">
                Discover our beautiful collection of fresh flowers and arrangements
              </p>
              <Button size="lg" style={{ backgroundColor: theme.colors.primary, color: theme.colors.text.white }} className="hover:bg-gray-100">
                Shop Now
              </Button>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-light mb-2" style={{ color: theme.colors.text.primary }}>Best sellers</h1>
            <p style={{ color: theme.colors.text.primary }}>Our latest and all-time favourites that are guaranteed to delight.</p>
          </div>

          {/* Countdown Banner */}
          <div className="rounded-lg p-6 mb-8 flex items-center justify-between" style={{ backgroundColor: theme.colors.countdown.background, color: theme.colors.countdown.text }}>
            <div>
              <p className="text-lg font-medium mb-1">Time left for next</p>
              <p className="text-sm opacity-90">day delivery</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{String(timeLeft.hours).padStart(2, "0")}</div>
                <div className="text-xs opacity-75">HOURS</div>
              </div>
              <div className="text-2xl">:</div>
              <div className="text-center">
                <div className="text-2xl font-bold">{String(timeLeft.minutes).padStart(2, "0")}</div>
                <div className="text-xs opacity-75">MINUTES</div>
              </div>
              <div className="text-2xl">:</div>
              <div className="text-center">
                <div className="text-2xl font-bold">{String(timeLeft.seconds).padStart(2, "0")}</div>
                <div className="text-xs opacity-75">SECONDS</div>
              </div>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm" style={{ color: theme.colors.text.primary }}>Home {">"} Best sellers</div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center space-x-2 bg-transparent" 
                style={{ borderColor: theme.colors.border, color: theme.colors.text.primary }}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {(selectedProductTypes.length > 0 || selectedOccasions.length > 0) && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-1">
                    {selectedProductTypes.length + selectedOccasions.length}
                  </span>
                )}
              </Button>
              
              {/* Quick Filter for Bouquets */}
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center space-x-2 bg-transparent" 
                style={{ borderColor: theme.colors.border, color: theme.colors.text.primary }}
                onClick={() => {
                  const bouquetType = productTypes.find(pt => pt.name.toLowerCase() === 'bouquets')
                  if (bouquetType) {
                    setSelectedProductTypes([bouquetType._id])
                    setSelectedOccasions([])
                  }
                }}
              >
                🌸 Bouquets
              </Button>
              <div className="flex items-center space-x-2 text-sm">
                <span style={{ color: theme.colors.text.primary }}>Sort by:</span>
                <select className="border-none bg-transparent focus:outline-none" style={{ color: theme.colors.text.primary }}>
                  <option>Featured</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white rounded-lg border p-6 mb-6" style={{ borderColor: theme.colors.border }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>Filter Products</h3>
                <div className="flex items-center space-x-2">
                  {(selectedProductTypes.length > 0 || selectedOccasions.length > 0) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearFilters}
                      style={{ borderColor: theme.colors.border, color: theme.colors.text.primary }}
                    >
                      Clear All
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowFilters(false)}
                    style={{ borderColor: theme.colors.border, color: theme.colors.text.primary }}
                  >
                    Close
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Types Filter */}
                <div>
                  <h4 className="font-medium mb-3" style={{ color: theme.colors.text.primary }}>Product Types</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {productTypes.map((productType) => (
                      <label key={productType._id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedProductTypes.includes(productType._id)}
                          onChange={(e) => handleProductTypeChange(productType._id, e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="text-sm flex items-center" style={{ color: theme.colors.text.secondary }}>
                          {productType.icon && <span className="mr-2">{productType.icon}</span>}
                          {productType.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Occasions Filter */}
                <div>
                  <h4 className="font-medium mb-3" style={{ color: theme.colors.text.primary }}>Occasions</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {occasions.map((occasion) => (
                      <label key={occasion._id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedOccasions.includes(occasion._id)}
                          onChange={(e) => handleOccasionChange(occasion._id, e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="text-sm flex items-center" style={{ color: theme.colors.text.secondary }}>
                          {occasion.icon && <span className="mr-2">{occasion.icon}</span>}
                          {occasion.name}
                          {occasion.isSeasonal && <span className="ml-1 text-xs text-orange-500">(Seasonal)</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Filter Results Summary */}
              <div className="mt-4 pt-4 border-t" style={{ borderColor: theme.colors.border }}>
                <p className="text-sm" style={{ color: theme.colors.text.primary }}>
                  Showing {filteredProducts.length} of {products.length} products
                  {(selectedProductTypes.length > 0 || selectedOccasions.length > 0) && (
                    <span className="ml-2 text-xs text-gray-500">
                      (filtered by {selectedProductTypes.length + selectedOccasions.length} criteria)
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
              <span className="ml-3" style={{ color: theme.colors.text.primary }}>Loading products...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                style={{ backgroundColor: theme.colors.primary, color: theme.colors.text.white }}
              >
                Retry
              </Button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p style={{ color: theme.colors.text.primary }}>
                {products.length === 0 
                  ? "No products found for this shop." 
                  : "No products match your current filters. Try adjusting your filter criteria."
                }
              </p>
              {products.length > 0 && (
                <Button 
                  onClick={clearFilters}
                  className="mt-4"
                  style={{ backgroundColor: theme.colors.primary, color: theme.colors.text.white }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {filteredProducts.map((product) => (
                <a key={product._id} href={`/products/${product._id}`} className="block">
                  <div className="cursor-pointer hover:opacity-90 transition-opacity">
                    <div className="w-full overflow-hidden rounded-lg">
                      <img
                        src={getPrimaryImage(product)}
                        alt={product.name}
                        className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                        style={{ width: '463.992px', height: '463.992px' }}
                      />
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm mb-1 line-clamp-2" style={{ color: theme.colors.text.secondary }}>{product.name}</h3>
                      <p className="text-sm" style={{ color: theme.colors.text.secondary }}>{formatPrice(product)}</p>
                      {/* Show product types and occasions */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {product.productTypes?.slice(0, 2).map((pt) => (
                          <span 
                            key={pt._id} 
                            className="text-xs px-2 py-1 rounded-full"
                            style={{ backgroundColor: pt.color + '20', color: pt.color }}
                          >
                            {pt.icon} {pt.name}
                          </span>
                        ))}
                        {product.productTypes?.length > 2 && (
                          <span className="text-xs text-gray-500">+{product.productTypes.length - 2} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Featured Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-purple-100 rounded-lg p-8 flex flex-col justify-center">
              <h2 className="text-2xl font-light mb-4" style={{ color: theme.colors.text.primary }}>
                Popular cut flowers and flowering plants, perfect for gifting or keeping all to yourself.
              </h2>
              <p className="text-sm mb-6" style={{ color: theme.colors.text.primary }}>
                You'll never go wrong with these best sellers. Browse the most popular floral packages and arrangements.
                We deliver flowers that bring smiles, everywhere and everyone in Montreal, Pointe-Claire, Ile Bizard,
                Sainte Anne de Bellevue, Lachine and the West Island.
              </p>
            </div>
            <div className="relative">
              <img src="/placeholder-wrj8y.png" alt="Sunflowers" className="w-full h-full object-cover rounded-lg" />
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3">
                <h3 className="font-medium" style={{ color: theme.colors.text.secondary }}>12 Sunflowers</h3>
                <p className="text-sm" style={{ color: theme.colors.text.secondary }}>$130.00 CAD</p>
              </div>
            </div>
          </div>


        </main>
      </div>
    </div>
  )
}
