"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown, Filter, Search, ShoppingCart, User } from "lucide-react"

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

export default function BestSellersPage() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 8,
    minutes: 36,
    seconds: 36,
  })
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

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

  const products = [
    {
      id: 1,
      name: "White and Green Happiness Create Your Arrangement",
      price: "From $130.00 CAD",
      image: "/white-green-roses.png",
    },
    {
      id: 2,
      name: "Designer's Choice Vase Arrangement",
      price: "From $130.00 CAD",
      image: "/pink-purple-flowers-vase.png",
    },
    {
      id: 3,
      name: "Designer's Choice Vase Arrangement",
      price: "From $130.00 CAD",
      image: "/9552a6e2198342c00675c026a4b94383.jpg",
    },
  ]

  const bottomProducts = [
    {
      id: 4,
      name: "Harvest Bouquet",
      price: "$130.00 CAD",
      image: "/autumn-harvest-bouquet.png",
    },
    {
      id: 5,
      name: "Sunny",
      price: "$130.00 CAD",
      image: "/bright-sunflower-bouquet.png",
    },
    {
      id: 6,
      name: "Lily",
      price: "$130.00 CAD",
      image: "/placeholder-fpyhg.png",
    },
  ]

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
                <ShoppingCart className="h-5 w-5 cursor-pointer" style={{ color: theme.colors.text.primary }} />
                
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
              <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent" style={{ borderColor: theme.colors.border, color: theme.colors.text.primary }}>
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </Button>
              <div className="flex items-center space-x-2 text-sm">
                <span style={{ color: theme.colors.text.primary }}>Sort by:</span>
                <select className="border-none bg-transparent focus:outline-none" style={{ color: theme.colors.text.primary }}>
                  <option>Featured</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {products.map((product) => (
              <Card key={product.id} className="border-0 shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: theme.colors.primary }}>
                <CardContent className="p-0">
                  <div className="aspect-square overflow-hidden rounded-t-lg">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm mb-2 line-clamp-2" style={{ color: theme.colors.text.white }}>{product.name}</h3>
                    <p className="text-sm" style={{ color: theme.colors.text.white }}>{product.price}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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

          {/* Bottom Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {bottomProducts.map((product) => (
              <Card key={product.id} className="border-0 shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: theme.colors.primary }}>
                <CardContent className="p-0">
                  <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.white }}>{product.name}</h3>
                    <p className="text-sm" style={{ color: theme.colors.text.white }}>{product.price}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
