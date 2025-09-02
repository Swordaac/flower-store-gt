'use client';

import React, { useState } from 'react';
import { ProductForm } from './ProductForm';
import { useUser } from '@/contexts/UserContext';

interface ProductFormExampleProps {
  onProductCreated?: (product: any) => void;
}

export const ProductFormExample: React.FC<ProductFormExampleProps> = ({
  onProductCreated
}) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { userShop, session } = useUser();

  const handleSubmit = async (formData: any) => {
    if (!session?.access_token || !userShop) {
      alert('Authentication required or no shop found');
      return;
    }

    setLoading(true);

    try {
      // Create the product
      const response = await fetch('http://localhost:5001/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ...formData,
          shopId: userShop._id,
          price: parseInt(formData.price),
          quantity: parseInt(formData.quantity)
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Product created successfully!');
        setShowForm(false);
        if (onProductCreated) {
          onProductCreated(data.data);
        }
      } else {
        alert(data.error || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!userShop) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-800">
          You need to have a shop to create products. Please create a shop first.
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setShowForm(true)}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Add New Product'}
      </button>

      {showForm && (
        <ProductForm
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          shopId={userShop._id}
        />
      )}
    </div>
  );
};

// Example usage in a page or component:
/*
import { ProductFormExample } from '@/components/ProductFormExample';

export default function ProductsPage() {
  const handleProductCreated = (product: any) => {
    console.log('New product created:', product);
    // Refresh product list, show success message, etc.
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      <ProductFormExample onProductCreated={handleProductCreated} />
    </div>
  );
}
*/
