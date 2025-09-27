"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Eye } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown, Filter, Search, User } from "lucide-react"
import { CartIcon } from "@/components/CartIcon"
import { useCart } from "@/contexts/CartContext"
import FilterComponent, { FilterState, FilterOption } from "@/components/FilterComponent"

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
  isBestSeller: boolean;
  shopId: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductType extends FilterOption {
  description: string;
  isActive: boolean;
  sortOrder: number;
}

interface Occasion extends FilterOption {
  description: string;
  isActive: boolean;
  isSeasonal: boolean;
  sortOrder: number;
  sympathy?: string[];
}

interface ProductCardProps {
  product: Product;
  theme: typeof theme;
  getPrimaryImage: (product: Product) => string;
  formatPrice: (product: Product) => string;
}

const ProductCard = ({ product, theme, getPrimaryImage, formatPrice }: ProductCardProps) => {
  return (
    <a 
      href={`/products/${product._id}`}
      className="block group relative rounded-lg overflow-hidden hover:scale-105 transition-all duration-300"
    >
      <div className="aspect-square overflow-hidden">
        <img
          src={getPrimaryImage(product)}
          alt={product.name}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
      </div>

        <div className="pt-6">
        <h3 className="text-xl md:text-2xl font-serif mb-2 line-clamp-2 group-hover:text-primary transition-colors tracking-wide" style={{ color: theme.colors.text.primary }}>
          {product.name}
        </h3>
        <p className="text-lg md:text-xl font-light tracking-widest" style={{ color: theme.colors.text.primary }}>
          {formatPrice(product)}
        </p>
        
       
      </div>
    </a>
  );
};

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
  const [colors, setColors] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    selectedProductTypes: [],
    selectedOccasions: [],
    selectedPriceRange: null,
    searchQuery: '',
    selectedColors: [],
    bestSeller: false,
    minPrice: null,
    maxPrice: null
  })
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  // Exactly 4 rows per page: 3 + 1 + 3 + 1 = 8 products per page
  const productsPerPage = 8
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(currentFilters.searchQuery)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [currentFilters.searchQuery])

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
        console.log('🔍 Fetching products for shop:', shopId)
        const response = await fetch(`http://localhost:5001/api/products/shop/${shopId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.success) {
          const allProducts = data.data || [];
          console.log('📦 Raw products from API:', {
            total: allProducts.length,
            products: allProducts.map((p: Product) => ({
              id: p._id,
              name: p.name,
              variants: p.variants?.length || 0,
              stock: p.stock,
              isActive: p.isActive
            }))
          });

          // Filter products to only show those that are active
          const activeProducts = allProducts.filter((product: Product) => {
            // Log each product's filtering details
            console.log('🔍 Product filtering:', {
              id: product._id,
              name: product.name,
              hasVariants: !!product.variants?.length,
              variantsInfo: product.variants?.map(v => ({
                isActive: v.isActive,
                stock: v.stock
              })),
              legacyStock: product.stock,
              isActive: product.isActive
            });

            // Include product if it's active and either has active variants or legacy stock
            const isValid = product.isActive && (
              (product.variants?.length > 0 && product.variants.some(v => v.isActive)) ||
              (!product.variants?.length && product.stock >= 0)
            );

            return isValid;
          });

          console.log('📦 Products after filtering:', {
            total: activeProducts.length,
            products: activeProducts.map((p: Product) => ({
              id: p._id,
              name: p.name,
              variants: p.variants?.length || 0,
              stock: p.stock
            }))
          });

          setProducts(activeProducts);
          setFilteredProducts(activeProducts);
            
            // Extract unique colors from products
            const uniqueColors = [...new Set(activeProducts.map((product: any) => product.color).filter(Boolean))]
            setColors(uniqueColors as string[])
            console.log('✅ Colors extracted:', uniqueColors)
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

  // Fetch filtered products from API when filters change
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const shopId = '68c34f45ee89e0fd81c8aa4d'
        let url = `http://localhost:5001/api/products/shop/${shopId}?inStock=true`
        
        console.log('🔍 Fetching filtered products with filters:', currentFilters)
        
        // Add product type filters
        if (currentFilters.selectedProductTypes.length > 0) {
          currentFilters.selectedProductTypes.forEach(type => {
            url += `&productTypes[]=${type}`
          });
        }
        
        // Add occasion filters
        if (currentFilters.selectedOccasions.length > 0) {
          currentFilters.selectedOccasions.forEach(occasion => {
            url += `&occasions[]=${occasion}`
          });
        }

        // Add price range filters (legacy)
        if (currentFilters.selectedPriceRange) {
          const priceRange = getPriceRangeFromLabel(currentFilters.selectedPriceRange)
          if (priceRange) {
            if (priceRange.min > 0) {
              url += `&minPrice=${priceRange.min}`
            }
            if (priceRange.max !== Infinity) {
              url += `&maxPrice=${priceRange.max}`
            }
          }
        }

        // Add new price filters (min/max inputs)
        if (currentFilters.minPrice !== null) {
          url += `&minPrice=${currentFilters.minPrice}`
        }
        if (currentFilters.maxPrice !== null) {
          url += `&maxPrice=${currentFilters.maxPrice}`
        }

        // Add color filters
        if (currentFilters.selectedColors.length > 0) {
          currentFilters.selectedColors.forEach(color => {
            url += `&color[]=${encodeURIComponent(color)}`
          });
        }

        // Add best seller filter
        if (currentFilters.bestSeller) {
          url += `&bestSeller=true`
        }

        // Add search query (use debounced version)
        if (debouncedSearchQuery.trim()) {
          url += `&search=${encodeURIComponent(debouncedSearchQuery)}`
        }

        console.log('🌐 Making API request to:', url)
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.success) {
          // Filter products to only show those with stock > 0 (check variants for actual stock)
          const productsWithStock = (data.data || []).filter((product: Product) => {
            // Check if product has variants with stock > 0
            if (product.variants && product.variants.length > 0) {
              return product.variants.some(variant => variant.isActive && variant.stock > 0)
            }
            // Fallback to legacy stock field
            return product.stock > 0
          })
          console.log('✅ API response successful, filtered products:', productsWithStock.length, 'out of', data.data?.length || 0)
          setFilteredProducts(productsWithStock)
        } else {
          throw new Error(data.error || 'Failed to fetch products')
        }
      } catch (err) {
        console.error('Error fetching filtered products:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch products')
        // Fallback to client-side filtering
        let filtered = [...products]
        
        // First filter by stock (check variants)
        filtered = filtered.filter(product => {
          if (product.variants && product.variants.length > 0) {
            return product.variants.some(variant => variant.isActive && variant.stock > 0)
          }
          return product.stock > 0
        })
        
        if (currentFilters.selectedProductTypes.length > 0) {
          filtered = filtered.filter(product => 
            product.productTypes?.some(pt => currentFilters.selectedProductTypes.includes(pt._id))
          )
        }
        if (currentFilters.selectedOccasions.length > 0) {
          filtered = filtered.filter(product => 
            product.occasions?.some(occasion => currentFilters.selectedOccasions.includes(occasion._id))
          )
        }
        if (currentFilters.selectedColors.length > 0) {
          filtered = filtered.filter(product => 
            currentFilters.selectedColors.includes(product.color)
          )
        }
        if (currentFilters.bestSeller) {
          filtered = filtered.filter(product => product.isBestSeller)
        }
        if (currentFilters.selectedPriceRange) {
          const priceRange = getPriceRangeFromLabel(currentFilters.selectedPriceRange)
          if (priceRange) {
            filtered = filtered.filter(product => {
              const productPrice = getProductMinPrice(product)
              return productPrice >= priceRange.min && productPrice <= priceRange.max
            })
          }
        }
        // Handle simplified price filtering: standard >= min AND premium <= max
        if (currentFilters.minPrice !== null || currentFilters.maxPrice !== null) {
          filtered = filtered.filter(product => {
            // Convert input prices from dollars to cents
            const minPriceCents = currentFilters.minPrice !== null ? currentFilters.minPrice * 100 : null;
            const maxPriceCents = currentFilters.maxPrice !== null ? currentFilters.maxPrice * 100 : null;
            
            // Get min and max prices from variants
            let minVariantPrice = Infinity;
            let maxVariantPrice = 0;
            
            if (product.variants && product.variants.length > 0) {
              product.variants.forEach(variant => {
                if (variant.isActive && variant.stock > 0) {
                  minVariantPrice = Math.min(minVariantPrice, variant.price);
                  maxVariantPrice = Math.max(maxVariantPrice, variant.price);
                }
              });
            } else {
              // Fallback to legacy price structure
              const prices = [product.price.standard, product.price.deluxe, product.price.premium].filter(p => p > 0);
              if (prices.length > 0) {
                minVariantPrice = Math.min(...prices);
                maxVariantPrice = Math.max(...prices);
              }
            }
            
            // If no valid prices found, exclude the product
            if (minVariantPrice === Infinity || maxVariantPrice === 0) {
              return false;
            }
            
            const matchesMin = minPriceCents === null || minVariantPrice >= minPriceCents;
            const matchesMax = maxPriceCents === null || maxVariantPrice <= maxPriceCents;
            
            return matchesMin && matchesMax;
          })
        }
        if (currentFilters.searchQuery.trim()) {
          const query = currentFilters.searchQuery.toLowerCase()
          filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(query) ||
            product.description.toLowerCase().includes(query) ||
            product.tags?.some(tag => tag.toLowerCase().includes(query))
          )
        }
        console.log('🔄 Client-side filtering result:', filtered.length, 'products')
        setFilteredProducts(filtered)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if we have filters applied, otherwise use existing products
    const hasFilters = currentFilters.selectedProductTypes.length > 0 || 
                      currentFilters.selectedOccasions.length > 0 || 
                      currentFilters.selectedPriceRange !== null ||
                      debouncedSearchQuery.trim() !== '' ||
                      currentFilters.selectedColors.length > 0 ||
                      currentFilters.bestSeller ||
                      currentFilters.minPrice !== null ||
                      currentFilters.maxPrice !== null

    console.log('🔍 Filter check - hasFilters:', hasFilters, 'currentFilters:', currentFilters)

    if (hasFilters) {
      console.log('🚀 Making API call for filtered products')
      fetchFilteredProducts()
    } else {
      console.log('📦 Using existing products (no filters)')
      setFilteredProducts(products)
    }
  }, [currentFilters, debouncedSearchQuery])

  // Reset to first page when filters or products change
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredProducts.length])

  // Handle local filtering when products change (for non-API filters)
  useEffect(() => {
    if (products.length > 0) {
      console.log('🔄 Products changed, applying local filters')
      // Apply local filtering logic here if needed
      // This will be handled by the main filtering useEffect
    }
  }, [products])

  // Helper function to get price range from label
  const getPriceRangeFromLabel = (label: string) => {
    const priceRanges = [
      { min: 0, max: 4500, label: 'Under $45' },
      { min: 4500, max: 5500, label: '$45 - $55' },
      { min: 6000, max: 8000, label: '$60 - $80' },
      { min: 8000, max: 12000, label: '$80 - $120' },
      { min: 10000, max: 15000, label: '$100 - $150' },
      { min: 15000, max: Infinity, label: 'Over $150' }
    ]
    return priceRanges.find(range => range.label === label)
  }

  // Helper function to get minimum price from product
  const getProductMinPrice = (product: Product): number => {
    if (product.variants && product.variants.length > 0) {
      const activeVariants = product.variants.filter(v => v.isActive && v.stock > 0)
      if (activeVariants.length > 0) {
        return Math.min(...activeVariants.map(v => v.price))
      }
    }
    
    // Fallback to legacy price structure
    if (product.price) {
      const prices = [product.price.standard, product.price.deluxe, product.price.premium].filter(p => p > 0)
      if (prices.length > 0) {
        return Math.min(...prices)
      }
    }
    
    return 0
  }

  // Helper function to get price range for a product
  const getProductPriceRange = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      const activeVariants = product.variants.filter(v => v.isActive)
      if (activeVariants.length === 0) return { min: 0, max: 0 }
      
      const prices = activeVariants.map(v => v.price)
      return {
        min: Math.min(...prices),
        max: Math.max(...prices)
      }
    } else {
      // Fallback to legacy price structure
      const prices = [product.price.standard, product.price.deluxe, product.price.premium]
      return {
        min: Math.min(...prices),
        max: Math.max(...prices)
      }
    }
  }

  // Helper function to get price for specific tier
  const getProductPriceForTier = (product: Product, tier: 'standard' | 'deluxe' | 'premium') => {
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(v => v.tierName === tier && v.isActive)
      return variant ? variant.price : 0
    } else {
      // Fallback to legacy price structure
      return product.price[tier] || 0
    }
  }

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

  const handleFilterChange = (filters: FilterState) => {
    // Use a memoized comparison to prevent unnecessary state updates
    const prevFiltersStr = JSON.stringify(currentFilters);
    const newFiltersStr = JSON.stringify(filters);
    
    if (prevFiltersStr === newFiltersStr) {
      return;
    }
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Filters updated:', {
        productTypes: filters.selectedProductTypes.length,
        occasions: filters.selectedOccasions.length,
        colors: filters.selectedColors.length,
        priceRange: filters.selectedPriceRange,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        bestSeller: filters.bestSeller,
        hasSearch: !!filters.searchQuery.trim()
      });
    }
    
    setCurrentFilters(filters);
  }

  const handleClearFilters = () => {
    setCurrentFilters({
      selectedProductTypes: [],
      selectedOccasions: [],
      selectedPriceRange: null,
      searchQuery: '',
      selectedColors: [],
      bestSeller: false,
      minPrice: null,
      maxPrice: null
    })
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
        {/* Hero Section */}
        <section className="relative w-full h-96 md:h-[500px] lg:h-[718px] overflow-hidden">
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
        <main className="max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 py-8">


          {/* Countdown Banner */}
          <div className="rounded-lg py-10 px-8 md:py-12 md:px-10 mb-8 flex items-center justify-between" style={{ backgroundColor: theme.colors.countdown.background, color: theme.colors.countdown.text }}>
            <div>
              <p className="text-xl md:text-2xl font-medium mb-2">Time left for next</p>
              <p className="text-lg md:text-xl opacity-90 font-light">day delivery</p>
            </div>
            <div className="flex items-center space-x-8 md:space-x-10">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-1">{String(timeLeft.hours).padStart(2, "0")}</div>
                <div className="text-sm md:text-base opacity-75 tracking-wider">HOURS</div>
              </div>
              <div className="text-3xl md:text-4xl">:</div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-1">{String(timeLeft.minutes).padStart(2, "0")}</div>
                <div className="text-sm md:text-base opacity-75 tracking-wider">MINUTES</div>
              </div>
              <div className="text-3xl md:text-4xl">:</div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-1">{String(timeLeft.seconds).padStart(2, "0")}</div>
                <div className="text-sm md:text-base opacity-75 tracking-wider">SECONDS</div>
              </div>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <FilterComponent
                productTypes={productTypes}
                occasions={occasions}
                products={products}
                colors={colors}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                isVisible={showFilters}
                onToggleVisibility={() => setShowFilters(!showFilters)}
                totalProducts={products.length}
                filteredCount={filteredProducts.length}
              />
              
              
              
              
              
            </div>
          </div>


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
                  onClick={handleClearFilters}
                  className="mt-4"
                  style={{ backgroundColor: theme.colors.primary, color: theme.colors.text.white }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* First row of products */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts
                  .slice((currentPage - 1) * productsPerPage, (currentPage - 1) * productsPerPage + 3)
                  .map((product) => (
                    <ProductCard key={product._id} product={product} theme={theme} getPrimaryImage={getPrimaryImage} formatPrice={formatPrice} />
                  ))}
              </div>

              {/* Best Sellers Banner (always in second row) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-lg overflow-hidden relative group">
                  <div className="absolute inset-0">
                    <img 
                      src="/bright-sunflower-bouquet.png" 
                      alt="Best Sellers Collection" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
                  </div>
                  <div className="relative z-10 p-8 md:p-12">
                    <h2 className="text-3xl md:text-4xl font-light mb-4 text-white">
                      Best Sellers Collection
                    </h2>
                    <p className="text-lg mb-6 text-white/90 max-w-xl">
                      Explore our most loved arrangements, handpicked favorites that bring joy to every occasion.
                    </p>
                    <a href="/collections/best-sellers">
                      <Button 
                        className="hover:scale-105 transform transition-transform"
                        style={{ backgroundColor: theme.colors.white, color: theme.colors.primary }}
                      >
                        View Best Sellers
                      </Button>
                    </a>
                  </div>
                </div>
                {filteredProducts
                  .slice((currentPage - 1) * productsPerPage + 3, (currentPage - 1) * productsPerPage + 4)
                  .map((product) => (
                    <ProductCard key={product._id} product={product} theme={theme} getPrimaryImage={getPrimaryImage} formatPrice={formatPrice} />
                  ))}
              </div>

              {/* Second row of products */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts
                  .slice((currentPage - 1) * productsPerPage + 4, (currentPage - 1) * productsPerPage + 7)
                  .map((product) => (
                    <ProductCard key={product._id} product={product} theme={theme} getPrimaryImage={getPrimaryImage} formatPrice={formatPrice} />
                  ))}
              </div>

              {/* About Us Banner (always in fourth row) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-lg overflow-hidden relative group">
                  <div className="absolute inset-0">
                    <img 
                      src="/wooden-background.jpg" 
                      alt="About Us" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
                  </div>
                  <div className="relative z-10 p-8 md:p-12">
                    <h2 className="text-3xl md:text-4xl font-light mb-4 text-white">
                      Our Story
                    </h2>
                    <p className="text-lg mb-6 text-white/90 max-w-xl">
                      Discover the passion and craftsmanship behind every bouquet we create. Family-owned, locally loved.
                    </p>
                    <a href="/about">
                      <Button 
                        className="hover:scale-105 transform transition-transform"
                        style={{ backgroundColor: theme.colors.white, color: theme.colors.secondary }}
                      >
                        About Us
                      </Button>
                    </a>
                  </div>
                </div>
                {filteredProducts
                  .slice((currentPage - 1) * productsPerPage + 7, (currentPage - 1) * productsPerPage + 8)
                  .map((product) => (
                    <ProductCard key={product._id} product={product} theme={theme} getPrimaryImage={getPrimaryImage} formatPrice={formatPrice} />
                  ))}
              </div>

              {/* No extra rows beyond the 4 allowed per page */}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{ 
                      backgroundColor: theme.colors.primary,
                      color: theme.colors.text.white,
                      opacity: currentPage === 1 ? 0.5 : 1
                    }}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-2 mx-4">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        style={{
                          backgroundColor: currentPage === page ? theme.colors.primary : theme.colors.white,
                          color: currentPage === page ? theme.colors.text.white : theme.colors.text.primary,
                          border: `1px solid ${theme.colors.primary}`
                        }}
                        className="w-10 h-10 rounded-full"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    style={{ 
                      backgroundColor: theme.colors.primary,
                      color: theme.colors.text.white,
                      opacity: currentPage === totalPages ? 0.5 : 1
                    }}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Featured Section */}
         
        </main>
      </div>
    </div>
  );
}
