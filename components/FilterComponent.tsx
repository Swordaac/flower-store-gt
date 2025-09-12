'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

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
}

interface FilterComponentProps {
  productTypes: FilterOption[];
  occasions: FilterOption[];
  priceRanges?: PriceRange[];
  onFilterChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
  totalProducts: number;
  filteredCount: number;
  className?: string;
}

// Default price ranges
const defaultPriceRanges: PriceRange[] = [
  { min: 0, max: 4500, label: 'Under $45' },
  { min: 4500, max: 5500, label: '$45 - $55' },
  { min: 6000, max: 8000, label: '$60 - $80' },
  { min: 8000, max: 12000, label: '$80 - $120' },
  { min: 10000, max: 15000, label: '$100 - $150' },
  { min: 15000, max: Infinity, label: 'Over $150' }
];

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
  priceRanges = defaultPriceRanges,
  onFilterChange,
  onClearFilters,
  isVisible,
  onToggleVisibility,
  totalProducts,
  filteredCount,
  className = ''
}) => {
  const [filters, setFilters] = useState<FilterState>({
    selectedProductTypes: [],
    selectedOccasions: [],
    selectedPriceRange: null,
    searchQuery: ''
  });

  const [expandedSections, setExpandedSections] = useState({
    productTypes: true,
    occasions: true,
    priceRange: true,
    search: false
  });

  // Update parent component when filters change
  useEffect(() => {
    console.log('🔧 FilterComponent: Filters changed, calling onFilterChange:', filters);
    onFilterChange(filters);
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

  const handleClearFilters = () => {
    setFilters({
      selectedProductTypes: [],
      selectedOccasions: [],
      selectedPriceRange: null,
      searchQuery: ''
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
                          filters.searchQuery.trim() !== '';

  const activeFilterCount = filters.selectedProductTypes.length + 
                           filters.selectedOccasions.length + 
                           (filters.selectedPriceRange ? 1 : 0) +
                           (filters.searchQuery.trim() ? 1 : 0);

  if (!isVisible) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className={`flex items-center space-x-2 bg-transparent ${className}`}
        style={{ borderColor: theme.colors.border, color: theme.colors.text.primary }}
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
    <Card className={`mb-6 ${className}`} style={{ borderColor: theme.colors.border }}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
            Filter Products
          </h3>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearFilters}
                style={{ borderColor: theme.colors.border, color: theme.colors.text.primary }}
              >
                Clear All
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onToggleVisibility}
              style={{ borderColor: theme.colors.border, color: theme.colors.text.primary }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div 
            className="flex items-center justify-between cursor-pointer p-2 rounded transition-colors"
            style={{ 
              backgroundColor: theme.colors.hover,
              color: theme.colors.text.primary 
            }}
            onClick={() => toggleSection('search')}
          >
            <h4 className="font-medium">Search</h4>
            {expandedSections.search ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
          {expandedSections.search && (
            <div className="mt-2">
              <input
                type="text"
                placeholder="Search products..."
                value={filters.searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ 
                  borderColor: theme.colors.border,
                  color: theme.colors.text.secondary
                }}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Product Types Filter */}
          <div>
            <div 
              className="flex items-center justify-between cursor-pointer p-2 rounded transition-colors mb-3"
              style={{ 
                backgroundColor: theme.colors.hover,
                color: theme.colors.text.primary 
              }}
              onClick={() => toggleSection('productTypes')}
            >
              <h4 className="font-medium">Product Types</h4>
              {expandedSections.productTypes ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
            {expandedSections.productTypes && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {productTypes.map((productType) => (
                  <label key={productType._id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.selectedProductTypes.includes(productType._id)}
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
            )}
          </div>

          {/* Occasions Filter */}
          <div>
            <div 
              className="flex items-center justify-between cursor-pointer p-2 rounded transition-colors mb-3"
              style={{ 
                backgroundColor: theme.colors.hover,
                color: theme.colors.text.primary 
              }}
              onClick={() => toggleSection('occasions')}
            >
              <h4 className="font-medium">Occasions</h4>
              {expandedSections.occasions ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
            {expandedSections.occasions && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {occasions.map((occasion) => (
                  <label key={occasion._id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.selectedOccasions.includes(occasion._id)}
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
            )}
          </div>

          {/* Price Range Filter */}
          <div>
            <div 
              className="flex items-center justify-between cursor-pointer p-2 rounded transition-colors mb-3"
              style={{ 
                backgroundColor: theme.colors.hover,
                color: theme.colors.text.primary 
              }}
              onClick={() => toggleSection('priceRange')}
            >
              <h4 className="font-medium">Price Range</h4>
              {expandedSections.priceRange ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
            {expandedSections.priceRange && (
              <div className="space-y-2">
                {priceRanges.map((range, index) => (
                  <label key={index} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priceRange"
                      checked={filters.selectedPriceRange === range.label}
                      onChange={() => handlePriceRangeChange(range.label)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="text-sm" style={{ color: theme.colors.text.secondary }}>
                      {range.label}
                    </span>
                  </label>
                ))}
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priceRange"
                    checked={filters.selectedPriceRange === null}
                    onChange={() => handlePriceRangeChange(null)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="text-sm" style={{ color: theme.colors.text.secondary }}>
                    Any Price
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
        
        {/* Filter Results Summary */}
        <div className="mt-6 pt-4 border-t" style={{ borderColor: theme.colors.border }}>
          <p className="text-sm" style={{ color: theme.colors.text.primary }}>
            Showing {filteredCount} of {totalProducts} products
            {hasActiveFilters && (
              <span className="ml-2 text-xs text-gray-500">
                (filtered by {activeFilterCount} criteria)
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterComponent;
