"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown, Filter, Search, ShoppingCart, User } from "lucide-react"

export default function BestSellersPage() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 8,
    minutes: 36,
    seconds: 36,
  })

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
      image: "/placeholder-r3o8y.png",
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
    <div className="min-h-screen relative">
      {/* Wooden Background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/wooden-background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Semi-transparent overlay for content readability */}
      <div className="fixed inset-0 z-10 bg-white/85 backdrop-blur-sm" />

      {/* Content wrapper with higher z-index */}
      <div className="relative z-20">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex-shrink-0">
                <div className="text-xl font-serif tracking-wider text-gray-900">WESTMOUNT</div>
                <div className="text-xs text-gray-500 tracking-widest">FLORIST</div>
              </div>

              {/* Navigation */}
              <nav className="hidden md:flex space-x-8">
                <div className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 cursor-pointer">
                  <span>Shop</span>
                  <ChevronDown className="h-4 w-4" />
                </div>
                <a href="#" className="text-gray-900 font-medium">
                  Best Sellers
                </a>
                <a href="#" className="text-gray-700 hover:text-gray-900">
                  About Us
                </a>
                <a href="#" className="text-gray-700 hover:text-gray-900">
                  Store Locator
                </a>
                <a href="#" className="text-gray-700 hover:text-gray-900">
                  Contact
                </a>
              </nav>

              {/* Right side icons */}
              <div className="flex items-center space-x-4">
                <Search className="h-5 w-5 text-gray-600 cursor-pointer" />
                <User className="h-5 w-5 text-gray-600 cursor-pointer" />
                <ShoppingCart className="h-5 w-5 text-gray-600 cursor-pointer" />
                <span className="text-sm text-gray-600">EN</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-light text-gray-900 mb-2">Best sellers</h1>
            <p className="text-gray-600">Our latest and all-time favourites that are guaranteed to delight.</p>
          </div>

          {/* Countdown Banner */}
          <div className="bg-green-700 text-white rounded-lg p-6 mb-8 flex items-center justify-between">
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
            <div className="text-sm text-gray-600">Home {">"} Best sellers</div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </Button>
              <div className="flex items-center space-x-2 text-sm">
                <span>Sort by:</span>
                <select className="border-none bg-transparent text-gray-900 focus:outline-none">
                  <option>Featured</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {products.map((product) => (
              <Card key={product.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-square overflow-hidden rounded-t-lg">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.price}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Featured Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-purple-100 rounded-lg p-8 flex flex-col justify-center">
              <h2 className="text-2xl font-light text-gray-900 mb-4">
                Popular cut flowers and flowering plants, perfect for gifting or keeping all to yourself.
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                You'll never go wrong with these best sellers. Browse the most popular floral packages and arrangements.
                We deliver flowers that bring smiles, everywhere and everyone in Montreal, Pointe-Claire, Ile Bizard,
                Sainte Anne de Bellevue, Lachine and the West Island.
              </p>
            </div>
            <div className="relative">
              <img src="/placeholder-wrj8y.png" alt="Sunflowers" className="w-full h-full object-cover rounded-lg" />
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3">
                <h3 className="font-medium text-gray-900">12 Sunflowers</h3>
                <p className="text-sm text-gray-600">$130.00 CAD</p>
              </div>
            </div>
          </div>

          {/* Bottom Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {bottomProducts.map((product) => (
              <Card key={product.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.price}</p>
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
