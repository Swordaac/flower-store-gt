"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"

interface Product {
  _id: string;
  name: string;
  color: string;
  description: string;
  price: { standard: number; deluxe: number; premium: number };
  stock: number;
  productTypes: Array<{ _id: string; name: string; color: string; icon?: string }>;
  occasions: Array<{ _id: string; name: string; color: string; icon?: string; isSeasonal: boolean }>;
  variants: Array<{
    tierName: string;
    price: number;
    stock: number;
    images: Array<{ publicId: string; url: string; alt: string; isPrimary: boolean }>;
    isActive: boolean;
  }>;
  tags: string[];
  images: Array<{ publicId: string; url: string; alt: string; isPrimary: boolean }>;
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  shopId: string;
}

const theme = {
  colors: {
    background: '#F0E7F2',
    primary: '#664b39',
    text: { primary: '#d1ad8e', secondary: '#333333', white: '#FFFFFF' },
    border: '#CCCCCC'
  }
}

export default function BestSellersPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        const shopId = '68c34f45ee89e0fd81c8aa4d'
        const url = `/api/products/shop/${shopId}?inStock=true&bestSeller=true`
        const res = await apiFetch(url)
        if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`)
        const data = await res.json()
        if (!data.success) throw new Error(data.error || 'Failed to fetch products')
        const productsWithStock = (data.data || []).filter((p: Product) => {
          if (p.variants && p.variants.length > 0) {
            return p.variants.some(v => v.isActive && v.stock > 0)
          }
          return p.stock > 0
        })
        setProducts(productsWithStock)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch products')
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const getPrimaryImage = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        if (variant.isActive && variant.images && variant.images.length > 0) {
          const primary = variant.images.find(img => img.isPrimary)
          if (primary) return primary.url
          if (variant.images[0]) return variant.images[0].url
        }
      }
    }
    if (product.images && product.images.length > 0) {
      const primary = product.images.find(img => img.isPrimary)
      return primary?.url || product.images[0]?.url || "/placeholder.svg"
    }
    return "/placeholder.svg"
  }

  const formatPrice = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      const active = product.variants.filter(v => v.isActive && v.stock > 0)
      if (active.length > 0) {
        const minPrice = Math.min(...active.map(v => v.price))
        return `From $${(minPrice / 100).toFixed(2)}`
      }
    }
    if (product.price) {
      const prices = [product.price.standard, product.price.deluxe, product.price.premium].filter(p => p > 0)
      if (prices.length > 0) {
        const minPrice = Math.min(...prices)
        return `From $${(minPrice / 100).toFixed(2)}`
      }
    }
    return 'Price not available'
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light mb-2" style={{ color: theme.colors.text.primary }}>Best sellers</h1>
          <p style={{ color: theme.colors.text.primary }}>Our most popular items</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
            <span className="ml-3" style={{ color: theme.colors.text.primary }}>Loading products...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Button onClick={() => window.location.reload()} style={{ backgroundColor: theme.colors.primary, color: theme.colors.text.white }}>Retry</Button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ color: theme.colors.text.primary }}>No best sellers available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {products.map(product => (
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
                    <h3 className="text-sm mb-1" style={{ color: theme.colors.text.secondary }}>{product.name}</h3>
                    <p className="text-sm" style={{ color: theme.colors.text.secondary }}>{formatPrice(product)}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {product.productTypes?.slice(0, 2).map(pt => (
                        <span key={pt._id} className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: (pt.color || '#6B7280') + '20', color: pt.color || '#6B7280' }}>
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
      </main>
    </div>
  )
}
