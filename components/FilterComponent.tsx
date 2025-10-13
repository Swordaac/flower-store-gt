'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, X, ChevronDown, ChevronUp, Flower, Leaf, Apple, Package, Circle, Cake, Heart, Bird, PartyPopper, Church, Baby } from 'lucide-react';

// Types for filter options
export interface FilterOption {
  _id: string;
  name: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
  isSeasonal?: boolean;
  sortOrder?: number;
}

export interface PriceRange {
  min: number;
  max: number;
  label: string;
}

export interface FilterState {
  selectedProductTypes: string[];
  selectedOccasions: string[];
  selectedPriceRange: string | null;
  searchQuery: string;
  selectedColors: string[];
  bestSeller: boolean;
  minPrice: number | null;
  maxPrice: number | null;
}

interface FilterComponentProps {
  productTypes: FilterOption[];
  occasions: FilterOption[];
  products?: any[]; // Add products prop for dynamic price calculation
  colors?: string[]; // Add colors prop
  priceRanges?: PriceRange[];
  onFilterChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
  totalProducts: number;
  filteredCount: number;
  className?: string;
}

// Helper function to calculate price ranges from products
const calculatePriceRanges = (products: any[]): PriceRange[] => {
  if (!products || products.length === 0) {
    return [
      { min: 0, max: 4500, label: 'Under $45' },
      { min: 4500, max: 5500, label: '$45 - $55' },
      { min: 6000, max: 8000, label: '$60 - $80' },
      { min: 8000, max: 12000, label: '$80 - $120' },
      { min: 10000, max: 15000, label: '$100 - $150' },
      { min: 15000, max: Infinity, label: 'Over $150' }
    ];
  }

  // Get all prices from products (both variants and legacy)
  const allPrices: number[] = [];
  
  products.forEach(product => {
    if (product.variants && product.variants.length > 0) {
      // Use new variants structure
      product.variants.forEach((variant: any) => {
        if (variant.isActive && variant.price) {
          allPrices.push(variant.price);
        }
      });
    } else if (product.price) {
      // Use legacy price structure
      if (product.price.standard) allPrices.push(product.price.standard);
      if (product.price.deluxe) allPrices.push(product.price.deluxe);
      if (product.price.premium) allPrices.push(product.price.premium);
    }
  });

  if (allPrices.length === 0) {
    return [
      { min: 0, max: 4500, label: 'Under $45' },
      { min: 4500, max: 5500, label: '$45 - $55' },
      { min: 6000, max: 8000, label: '$60 - $80' },
      { min: 8000, max: 12000, label: '$80 - $120' },
      { min: 10000, max: 15000, label: '$100 - $150' },
      { min: 15000, max: Infinity, label: 'Over $150' }
    ];
  }

  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  
  // Create dynamic price ranges based on actual data
  const ranges: PriceRange[] = [];
  
  // Calculate quartiles for better distribution
  const sortedPrices = allPrices.sort((a, b) => a - b);
  const q1 = sortedPrices[Math.floor(sortedPrices.length * 0.25)];
  const q2 = sortedPrices[Math.floor(sortedPrices.length * 0.5)];
  const q3 = sortedPrices[Math.floor(sortedPrices.length * 0.75)];
  
  // Create ranges based on quartiles
  if (minPrice < q1) {
    ranges.push({ min: minPrice, max: q1, label: `Under $${(q1 / 100).toFixed(0)}` });
  }
  if (q1 < q2) {
    ranges.push({ min: q1, max: q2, label: `$${(q1 / 100).toFixed(0)} - $${(q2 / 100).toFixed(0)}` });
  }
  if (q2 < q3) {
    ranges.push({ min: q2, max: q3, label: `$${(q2 / 100).toFixed(0)} - $${(q3 / 100).toFixed(0)}` });
  }
  if (q3 < maxPrice) {
    ranges.push({ min: q3, max: maxPrice, label: `$${(q3 / 100).toFixed(0)} - $${(maxPrice / 100).toFixed(0)}` });
  }
  if (maxPrice > q3) {
    ranges.push({ min: maxPrice, max: Infinity, label: `Over $${(maxPrice / 100).toFixed(0)}` });
  }
  
  // If we don't have enough ranges, add some default ones
  if (ranges.length < 3) {
    return [
      { min: 0, max: 4500, label: 'Under $45' },
      { min: 4500, max: 5500, label: '$45 - $55' },
      { min: 6000, max: 8000, label: '$60 - $80' },
      { min: 8000, max: 12000, label: '$80 - $120' },
      { min: 10000, max: 15000, label: '$100 - $150' },
      { min: 15000, max: Infinity, label: 'Over $150' }
    ];
  }
  
  return ranges;
};

// Theme object matching the existing design
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
};

export const FilterComponent: React.FC<FilterComponentProps> = ({
  productTypes,
  occasions,
  products = [],
  colors = [],
  priceRanges,
  onFilterChange,
  onClearFilters,
  isVisible,
  onToggleVisibility,
  totalProducts,
  filteredCount,
  className = ''
}) => {
  // Calculate dynamic price ranges from products
  const dynamicPriceRanges = priceRanges || calculatePriceRanges(products);
  const [filters, setFilters] = useState<FilterState>({
    selectedProductTypes: [],
    selectedOccasions: [],
    selectedPriceRange: null,
    searchQuery: '',
    selectedColors: [],
    bestSeller: false,
    minPrice: null,
    maxPrice: null
  });

  const [expandedSections, setExpandedSections] = useState({
    productTypes: true,
    occasions: true,
    colors: true,
    priceRange: true,
    bestSeller: true,
    search: false,
    gift: true,
    balloons: true
  });

  // Helper functions to get specific product types
  const getGiftProductTypes = () => {
    return productTypes.filter(type => 
      type.name === 'Fruit Basket' || type.name === 'Flowers Box'
    );
  };

  const getBalloonProductTypes = () => {
    return productTypes.filter(type => 
      type.name === 'Balloons'
    );
  };

  // Helper function to get icon for product types
  const getProductTypeIcon = (name: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'Orchid': <Flower className="h-4 w-4" />,
      'Indoor Plant': <Leaf className="h-4 w-4" />,
      'Fruit Basket': <Apple className="h-4 w-4" />,
      'Flowers Box': <Package className="h-4 w-4" />,
      'Balloons': <Circle className="h-4 w-4" />,
    };
    return iconMap[name] || null;
  };

  // Helper function to get icon for occasions
  const getOccasionIcon = (name: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'Birthday': <Cake className="h-4 w-4" />,
      'Get Well Soon': <Heart className="h-4 w-4" />,
      'Anniversary': <Heart className="h-4 w-4" />,
      'Sympathy': <Bird className="h-4 w-4" />,
      'Congratulation': <PartyPopper className="h-4 w-4" />,
      'Wedding': <Church className="h-4 w-4" />,
      'New Baby': <Baby className="h-4 w-4" />,
    };
    return iconMap[name] || null;
  };

  // Debounced filter update
  useEffect(() => {
    const debouncedUpdate = setTimeout(() => {
      // Deep compare the filters to prevent unnecessary updates
      const defaultFilters = {
        selectedProductTypes: [],
        selectedOccasions: [],
        selectedPriceRange: null,
        searchQuery: '',
        selectedColors: [],
        bestSeller: false,
        minPrice: null,
        maxPrice: null
      };
      
      const hasChanged = JSON.stringify(filters) !== JSON.stringify(defaultFilters);
      
      if (hasChanged) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 FilterComponent: Filters changed:', filters);
        }
        onFilterChange(filters);
      }
    }, 300); // 300ms debounce delay
    
    return () => clearTimeout(debouncedUpdate);
  }, [filters, onFilterChange]);

  const handleProductTypeChange = (productTypeId: string, checked: boolean) => {
    console.log('🔧 FilterComponent: Product type changed:', productTypeId, checked);
    setFilters(prev => ({
      ...prev,
      selectedProductTypes: checked
        ? [...prev.selectedProductTypes, productTypeId]
        : prev.selectedProductTypes.filter(id => id !== productTypeId)
    }));
  };

  const handleOccasionChange = (occasionId: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      selectedOccasions: checked
        ? [...prev.selectedOccasions, occasionId]
        : prev.selectedOccasions.filter(id => id !== occasionId)
    }));
  };

  const handlePriceRangeChange = (priceRange: string | null) => {
    setFilters(prev => ({
      ...prev,
      selectedPriceRange: priceRange
    }));
  };

  const handleSearchChange = (query: string) => {
    setFilters(prev => ({
      ...prev,
      searchQuery: query
    }));
  };

  const handleColorChange = (color: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      selectedColors: checked
        ? [...prev.selectedColors, color]
        : prev.selectedColors.filter(c => c !== color)
    }));
  };

  const handleBestSellerChange = (checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      bestSeller: checked
    }));
  };

  const handlePriceInputChange = (field: 'minPrice' | 'maxPrice', value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value === '' ? null : Number(value)
    }));
  };


  const handleClearFilters = () => {
    setFilters({
      selectedProductTypes: [],
      selectedOccasions: [],
      selectedPriceRange: null,
      searchQuery: '',
      selectedColors: [],
      bestSeller: false,
      minPrice: null,
      maxPrice: null
    });
    onClearFilters();
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const hasActiveFilters = filters.selectedProductTypes.length > 0 ||
                          filters.selectedOccasions.length > 0 ||
                          filters.selectedPriceRange !== null ||
                          filters.searchQuery.trim() !== '' ||
                          filters.selectedColors.length > 0 ||
                          filters.bestSeller ||
                          filters.minPrice !== null ||
                          filters.maxPrice !== null;

  const activeFilterCount = filters.selectedProductTypes.length + 
                           filters.selectedOccasions.length + 
                           (filters.selectedPriceRange ? 1 : 0) +
                           (filters.searchQuery.trim() ? 1 : 0) +
                           filters.selectedColors.length +
                           (filters.bestSeller ? 1 : 0) +
                           (filters.minPrice !== null ? 1 : 0) +
                           (filters.maxPrice !== null ? 1 : 0);

  if (!isVisible) {
    return (
      <Button 
        size="sm" 
        className={`flex items-center space-x-2 ${className}`}
        style={{ 
          backgroundColor: theme.colors.primary, 
          color: theme.colors.text.white,
          border: 'none',
          borderRadius: '8px'
        }}
        onClick={onToggleVisibility}
      >
        <Filter className="h-4 w-4" />
        <span>Filters</span>
        {hasActiveFilters && (
          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-1">
            {activeFilterCount}
          </span>
        )}
      </Button>
    );
  }

  return (
    <>
      <style jsx>{`
        .slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 3px;
          outline: none;
        }
        
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
      <div className={`fixed left-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto z-50 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Filters
          </h3>
          <button
            onClick={onToggleVisibility}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div 
            className="flex items-center justify-between cursor-pointer p-3 rounded-lg transition-colors hover:bg-gray-50"
            onClick={() => toggleSection('search')}
          >
            <h4 className="font-medium text-gray-900">Search</h4>
            {expandedSections.search ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </div>
          {expandedSections.search && (
            <div className="mt-3">
              <input
                type="text"
                placeholder="Search products..."
                value={filters.searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Filter Content */}
        <div className="p-6 space-y-6">
          {/* Product Types Filter */}
          <div>
            <div 
              className="flex items-center justify-between cursor-pointer p-3 rounded-lg transition-colors hover:bg-gray-50"
              onClick={() => toggleSection('productTypes')}
            >
              <h4 className="font-medium text-gray-900">Types</h4>
              {expandedSections.productTypes ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
            {expandedSections.productTypes && (
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {productTypes.map((productType) => (
                  <label key={productType._id} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={filters.selectedProductTypes.includes(productType._id)}
                      onChange={(e) => handleProductTypeChange(productType._id, e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm flex items-center text-gray-700">
                      {getProductTypeIcon(productType.name) && (
                        <span className="mr-2 text-gray-600">
                          {getProductTypeIcon(productType.name)}
                        </span>
                      )}
                      {productType.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Occasions Filter */}
          <div>
            <div 
              className="flex items-center justify-between cursor-pointer p-3 rounded-lg transition-colors hover:bg-gray-50"
              onClick={() => toggleSection('occasions')}
            >
              <h4 className="font-medium text-gray-900">Occasions</h4>
              {expandedSections.occasions ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
            {expandedSections.occasions && (
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {occasions.map((occasion) => (
                  <label key={occasion._id} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={filters.selectedOccasions.includes(occasion._id)}
                      onChange={(e) => handleOccasionChange(occasion._id, e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm flex items-center text-gray-700">
                      {getOccasionIcon(occasion.name) && (
                        <span className="mr-2 text-gray-600">
                          {getOccasionIcon(occasion.name)}
                        </span>
                      )}
                      {occasion.name}
                      {occasion.isSeasonal && <span className="ml-1 text-xs text-orange-500">(Seasonal)</span>}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Colors Filter */}
          <div>
            <div 
              className="flex items-center justify-between cursor-pointer p-3 rounded-lg transition-colors hover:bg-gray-50"
              onClick={() => toggleSection('colors')}
            >
              <h4 className="font-medium text-gray-900">Colors</h4>
              {expandedSections.colors ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
            {expandedSections.colors && (
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {colors.map((color) => (
                  <label key={color} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={filters.selectedColors.includes(color)}
                      onChange={(e) => handleColorChange(color, e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm capitalize text-gray-700">
                      {color}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Best Seller Filter */}
          <div>
            <div 
              className="flex items-center justify-between cursor-pointer p-3 rounded-lg transition-colors hover:bg-gray-50"
              onClick={() => toggleSection('bestSeller')}
            >
              <h4 className="font-medium text-gray-900">Best Seller</h4>
              {expandedSections.bestSeller ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
            {expandedSections.bestSeller && (
              <div className="mt-3">
                <label className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={filters.bestSeller}
                    onChange={(e) => handleBestSellerChange(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Show only best sellers
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Gift Filter */}
          <div>
            <div 
              className="flex items-center justify-between cursor-pointer p-3 rounded-lg transition-colors hover:bg-gray-50"
              onClick={() => toggleSection('gift')}
            >
              <h4 className="font-medium text-gray-900">Gift</h4>
              {expandedSections.gift ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
            {expandedSections.gift && (
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {getGiftProductTypes().map((productType) => (
                  <label key={productType._id} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={filters.selectedProductTypes.includes(productType._id)}
                      onChange={(e) => handleProductTypeChange(productType._id, e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm flex items-center text-gray-700">
                      {getProductTypeIcon(productType.name) && (
                        <span className="mr-2 text-gray-600">
                          {getProductTypeIcon(productType.name)}
                        </span>
                      )}
                      {productType.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Balloons Filter */}
          <div>
            <div 
              className="flex items-center justify-between cursor-pointer p-3 rounded-lg transition-colors hover:bg-gray-50"
              onClick={() => toggleSection('balloons')}
            >
              <h4 className="font-medium text-gray-900">Balloons</h4>
              {expandedSections.balloons ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
            {expandedSections.balloons && (
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {getBalloonProductTypes().map((productType) => (
                  <label key={productType._id} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={filters.selectedProductTypes.includes(productType._id)}
                      onChange={(e) => handleProductTypeChange(productType._id, e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm flex items-center text-gray-700">
                      {getProductTypeIcon(productType.name) && (
                        <span className="mr-2 text-gray-600">
                          {getProductTypeIcon(productType.name)}
                        </span>
                      )}
                      {productType.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Price Range Filter */}
          <div>
            <div 
              className="flex items-center justify-between cursor-pointer p-3 rounded-lg transition-colors hover:bg-gray-50"
              onClick={() => toggleSection('priceRange')}
            >
              <h4 className="font-medium text-gray-900">Price Range</h4>
              {expandedSections.priceRange ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
            {expandedSections.priceRange && (
              <div className="mt-3 space-y-4">
                <div className="text-sm text-gray-600 mb-3">
                  Filter products where standard price ≥ min and premium price ≤ max
                </div>
                
                {/* Min/Max Price Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Price (CAD)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        value={filters.minPrice || ''}
                        onChange={(e) => handlePriceInputChange('minPrice', e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="pl-8 block w-full text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Price (CAD)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        value={filters.maxPrice || ''}
                        onChange={(e) => handlePriceInputChange('maxPrice', e.target.value)}
                        placeholder="No limit"
                        min="0"
                        step="0.01"
                        className="pl-8 block w-full text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Apply Button */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={handleClearFilters}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={onToggleVisibility}
              className="flex-1 py-3 px-4 rounded-lg font-medium transition-colors"
              style={{ 
                backgroundColor: theme.colors.primary, 
                color: theme.colors.text.white 
              }}
            >
              Apply ({activeFilterCount})
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterComponent;
