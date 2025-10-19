"use client"

import { useCart } from "@/contexts/CartContext"
import { useUser } from "@/contexts/UserContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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
  const { t } = useLanguage()
  const [showCheckout, setShowCheckout] = useState(false)
  const [selectedShopId, setSelectedShopId] = useState('68c34f45ee89e0fd81c8aa4d') // Default shop ID
  
  // Delivery option state
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'pickup'>('delivery')
  const [postalCode, setPostalCode] = useState('')
  
  // Quantity input state
  const [quantityInputs, setQuantityInputs] = useState<{[key: string]: string}>({})
  

  // Helper function to format price
  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)} CAD`
  }

  // Handle postal code change
  const handlePostalCodeChange = (value: string) => {
    setPostalCode(value)
  }

  const handleQuantityChange = (
    productId: string,
    currentQuantity: number,
    change: number,
    selectedSize?: number,
    selectedTier?: 'standard' | 'deluxe' | 'premium'
  ) => {
    const newQuantity = currentQuantity + change
    if (newQuantity <= 0) {
      removeFromCart(productId, selectedSize, selectedTier)
    } else {
      updateQuantity(productId, newQuantity, selectedSize, selectedTier)
    }
  }

  const handleQuantityInputChange = (
    productId: string,
    value: string,
    selectedSize?: number,
    selectedTier?: 'standard' | 'deluxe' | 'premium'
  ) => {
    const key = `${productId}-${selectedSize || 'default'}-${selectedTier || 'none'}`
    setQuantityInputs(prev => ({ ...prev, [key]: value }))
  }

  const handleQuantityInputBlur = (
    productId: string,
    selectedSize?: number,
    selectedTier?: 'standard' | 'deluxe' | 'premium'
  ) => {
    const key = `${productId}-${selectedSize || 'default'}-${selectedTier || 'none'}`
    const inputValue = quantityInputs[key]
    
    if (inputValue !== undefined) {
      const newQuantity = parseInt(inputValue) || 1
      const validQuantity = Math.max(1, Math.min(999, newQuantity)) // Cap at 999 for reasonable limits
      updateQuantity(productId, validQuantity, selectedSize, selectedTier)
      
      // Clear the input state
      setQuantityInputs(prev => {
        const updated = { ...prev }
        delete updated[key]
        return updated
      })
    }
  }

  const handleQuantityInputKeyPress = (
    e: React.KeyboardEvent,
    productId: string,
    selectedSize?: number,
    selectedTier?: 'standard' | 'deluxe' | 'premium'
  ) => {
    if (e.key === 'Enter') {
      handleQuantityInputBlur(productId, selectedSize, selectedTier)
    }
  }

  const handleRemoveItem = (
    productId: string,
    selectedSize?: number,
    selectedTier?: 'standard' | 'deluxe' | 'premium'
  ) => {
    removeFromCart(productId, selectedSize, selectedTier)
  }

  const handleCheckout = () => {
    if (items.length === 0) {
      alert(t('cart.emptyAlert'))
      return
    }
    
    if (!currentUser) {
      alert(t('cart.signInRequired'))
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
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-light mb-2" style={{ color: theme.colors.text.primary }}>
            {t('cart.title')}
          </h1>
          <p style={{ color: theme.colors.text.primary }}>
            {totalItems} {totalItems === 1 ? t('cart.itemInCart') : t('cart.itemsInCart')}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="h-24 w-24 mx-auto mb-4" style={{ color: theme.colors.text.light }} />
            <h2 className="text-2xl font-light mb-4" style={{ color: theme.colors.text.primary }}>
              {t('cart.empty')}
            </h2>
            <p className="mb-8" style={{ color: theme.colors.text.light }}>
              {t('cart.emptyDescription')}
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              style={{ backgroundColor: theme.colors.primary, color: theme.colors.text.white }}
            >
              {t('cart.continueShopping')}
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
                {t('cart.backToCart')}
              </Button>
              <h2 className="text-2xl font-light" style={{ color: theme.colors.text.primary }}>
                {t('cart.checkout')}
              </h2>
            </div>
            
            {/* User Authentication Status */}
            {currentUser && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  {t('cart.signedInAs')} <strong>{currentUser.name}</strong> ({currentUser.email})
                </p>
              </div>
            )}
            
            <CheckoutForm
              shopId={selectedShopId}
              onSuccess={handleCheckoutSuccess}
              onError={handleCheckoutError}
              deliveryOption={deliveryOption}
              postalCode={postalCode}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      

            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const itemPrice = item.selectedSize || item.price
                return (
                  <Card key={`${item.productId}-${item.selectedSize || 'default'}-${item.selectedTier || 'none'}`} className="border-0 shadow-sm">
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
                            {formatPrice(itemPrice)} {t('cart.each')}
                          </p>
                          {item.selectedSize && (
                            <p className="text-xs" style={{ color: theme.colors.text.light }}>
                              {t('cart.size')} {formatPrice(item.selectedSize)}
                            </p>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.productId, item.quantity, -1, item.selectedSize, item.selectedTier)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
                            style={{ color: theme.colors.text.secondary }}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          
                          <Input
                            type="number"
                            min="1"
                            max="999"
                            value={quantityInputs[`${item.productId}-${item.selectedSize || 'default'}-${item.selectedTier || 'none'}`] ?? item.quantity}
                            onChange={(e) => handleQuantityInputChange(item.productId, e.target.value, item.selectedSize, item.selectedTier)}
                            onBlur={() => handleQuantityInputBlur(item.productId, item.selectedSize, item.selectedTier)}
                            onKeyPress={(e) => handleQuantityInputKeyPress(e, item.productId, item.selectedSize, item.selectedTier)}
                            className="w-16 h-8 text-center text-sm border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                            style={{ color: theme.colors.text.secondary }}
                          />
                          
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.productId, item.quantity, 1, item.selectedSize, item.selectedTier)}
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
                          type="button"
                          onClick={() => handleRemoveItem(item.productId, item.selectedSize, item.selectedTier)}
                          className="text-red-500 hover:text-red-700 p-2 transition-colors duration-200"
                          title={t('cart.removeItem')}
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
                  {t('cart.clearCart')}
                </Button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-sm sticky top-8">
                <CardContent className="p-6">
                  <h2 className="text-xl font-medium mb-4" style={{ color: theme.colors.text.secondary }}>
                    {t('cart.orderSummary')}
                  </h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span style={{ color: theme.colors.text.light }}>{t('cart.items')} ({totalItems})</span>
                      <span style={{ color: theme.colors.text.secondary }}>
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: theme.colors.text.light }}>{t('cart.shipping')}</span>
                      <span style={{ color: theme.colors.text.secondary }}>{t('cart.shippingCalculated')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: theme.colors.text.light }}>{t('cart.tax')}</span>
                      <span style={{ color: theme.colors.text.secondary }}>{t('cart.taxCalculated')}</span>
                    </div>
                    <hr className="border-gray-200" />
                    <div className="flex justify-between text-lg font-medium">
                      <span style={{ color: theme.colors.text.secondary }}>{t('cart.total')}</span>
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
                    {t('cart.proceedToCheckout')}
                  </Button>

                  <p className="text-xs text-center mt-4" style={{ color: theme.colors.text.light }}>
                    {t('cart.secureCheckout')}
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
