"use client"

import { useCart } from "@/contexts/CartContext"
import { useUser } from "@/contexts/UserContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import CheckoutForm from "@/components/CheckoutForm"
import { useState } from "react"

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
  }
}

export default function CartPage() {
  const { 
    items, 
    totalItems, 
    totalPrice, 
    updateQuantity, 
    removeFromCart, 
    clearCart 
  } = useCart()
  
  const { currentUser, loading: userLoading, session: userSession } = useUser()
  const [showCheckout, setShowCheckout] = useState(false)
  const [selectedShopId, setSelectedShopId] = useState('68c34f45ee89e0fd81c8aa4d') // Default shop ID

  // Helper function to format price
  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)} CAD`
  }

  const handleQuantityChange = (productId: string, currentQuantity: number, change: number, selectedSize?: number) => {
    const newQuantity = currentQuantity + change
    updateQuantity(productId, newQuantity, selectedSize)
  }

  const handleRemoveItem = (productId: string, selectedSize?: number) => {
    removeFromCart(productId, selectedSize)
  }

  const handleCheckout = () => {
    if (items.length === 0) {
      alert('Your cart is empty!')
      return
    }
    
    if (!currentUser) {
      alert('Please sign in to proceed with checkout!')
      window.location.href = '/auth/signin'
      return
    }
    
    setShowCheckout(true)
  }

  const handleCheckoutSuccess = (orderId: string) => {
    console.log('Order created successfully:', orderId)
    setShowCheckout(false)
    clearCart()
    // You might want to redirect to a success page or show a success message
  }

  const handleCheckoutError = (error: string) => {
    console.error('Checkout error:', error)
    alert(`Checkout error: ${error}`)
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
              <a href="/" className="text-gray-700 hover:text-gray-900" style={{ color: theme.colors.text.primary }}>
                Shop
              </a>
              <a href="/" className="text-gray-700 hover:text-gray-900" style={{ color: theme.colors.text.primary }}>
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
              <a href="/" className="text-sm" style={{ color: theme.colors.text.primary }}>
                Continue Shopping
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-light mb-2" style={{ color: theme.colors.text.primary }}>
            Shopping Cart
          </h1>
          <p style={{ color: theme.colors.text.primary }}>
            {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="h-24 w-24 mx-auto mb-4" style={{ color: theme.colors.text.light }} />
            <h2 className="text-2xl font-light mb-4" style={{ color: theme.colors.text.primary }}>
              Your cart is empty
            </h2>
            <p className="mb-8" style={{ color: theme.colors.text.light }}>
              Looks like you haven't added any items to your cart yet.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              style={{ backgroundColor: theme.colors.primary, color: theme.colors.text.white }}
            >
              Continue Shopping
            </Button>
          </div>
        ) : showCheckout ? (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Button 
                onClick={() => setShowCheckout(false)}
                variant="outline"
                className="mb-4"
              >
                ← Back to Cart
              </Button>
              <h2 className="text-2xl font-light" style={{ color: theme.colors.text.primary }}>
                Checkout
              </h2>
            </div>
            
            {/* User Authentication Status */}
            {currentUser && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Signed in as: <strong>{currentUser.name}</strong> ({currentUser.email})
                </p>
              </div>
            )}
            
            <CheckoutForm
              shopId={selectedShopId}
              onSuccess={handleCheckoutSuccess}
              onError={handleCheckoutError}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const itemPrice = item.selectedSize || item.price
                return (
                  <Card key={`${item.productId}-${item.selectedSize || 'default'}`} className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        {/* Product Image */}
                        <div className="w-20 h-20 flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                            {item.name}
                          </h3>
                          <p className="text-sm mb-2" style={{ color: theme.colors.text.light }}>
                            {formatPrice(itemPrice)} each
                          </p>
                          {item.selectedSize && (
                            <p className="text-xs" style={{ color: theme.colors.text.light }}>
                              Size: {formatPrice(item.selectedSize)}
                            </p>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleQuantityChange(item.productId, item.quantity, -1, item.selectedSize)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
                            style={{ color: theme.colors.text.secondary }}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center" style={{ color: theme.colors.text.secondary }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.productId, item.quantity, 1, item.selectedSize)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
                            style={{ color: theme.colors.text.secondary }}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Item Total */}
                        <div className="text-right">
                          <p className="text-lg font-medium" style={{ color: theme.colors.text.secondary }}>
                            {formatPrice(itemPrice * item.quantity)}
                          </p>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(item.productId, item.selectedSize)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {/* Clear Cart Button */}
              <div className="flex justify-end">
                <Button
                  onClick={clearCart}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Clear Cart
                </Button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-sm sticky top-8">
                <CardContent className="p-6">
                  <h2 className="text-xl font-medium mb-4" style={{ color: theme.colors.text.secondary }}>
                    Order Summary
                  </h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span style={{ color: theme.colors.text.light }}>Items ({totalItems})</span>
                      <span style={{ color: theme.colors.text.secondary }}>
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: theme.colors.text.light }}>Shipping</span>
                      <span style={{ color: theme.colors.text.secondary }}>Calculated at checkout</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: theme.colors.text.light }}>Tax</span>
                      <span style={{ color: theme.colors.text.secondary }}>Calculated at checkout</span>
                    </div>
                    <hr className="border-gray-200" />
                    <div className="flex justify-between text-lg font-medium">
                      <span style={{ color: theme.colors.text.secondary }}>Total</span>
                      <span style={{ color: theme.colors.text.secondary }}>
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    className="w-full py-3 text-lg font-medium"
                    style={{ backgroundColor: theme.colors.text.secondary, color: theme.colors.white }}
                  >
                    Proceed to Checkout
                  </Button>

                  <p className="text-xs text-center mt-4" style={{ color: theme.colors.text.light }}>
                    Secure checkout powered by our payment partners
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
