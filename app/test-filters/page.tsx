'use client';

import React, { useState, useEffect } from 'react';
import FilterComponent, { FilterState, FilterOption } from '@/components/FilterComponent';

export default function TestFiltersPage() {
  const [productTypes, setProductTypes] = useState<FilterOption[]>([]);
  const [occasions, setOccasions] = useState<FilterOption[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    selectedProductTypes: [],
    selectedOccasions: [],
    selectedPriceRange: null,
    searchQuery: ''
  });

  // Load filter data
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        console.log('🔄 Loading filter data...');
        
        // Load product types
        const productTypesResponse = await fetch('http://localhost:5001/api/products/types');
        if (productTypesResponse.ok) {
          const productTypesData = await productTypesResponse.json();
          console.log('✅ Product types loaded:', productTypesData.data?.length || 0);
          setProductTypes(productTypesData.data || []);
        }
        
        // Load occasions
        const occasionsResponse = await fetch('http://localhost:5001/api/products/occasions');
        if (occasionsResponse.ok) {
          const occasionsData = await occasionsResponse.json();
          console.log('✅ Occasions loaded:', occasionsData.data?.length || 0);
          setOccasions(occasionsData.data || []);
        }
      } catch (error) {
        console.error('❌ Error loading filter data:', error);
      }
    };
    
    loadFilterData();
  }, []);

  const handleFilterChange = (filters: FilterState) => {
    console.log('🔄 Filter changed in test page:', filters);
    setCurrentFilters(filters);
  };

  const handleClearFilters = () => {
    console.log('🧹 Clearing filters');
    setCurrentFilters({
      selectedProductTypes: [],
      selectedOccasions: [],
      selectedPriceRange: null,
      searchQuery: ''
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Filter Component Test</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Current Filter State:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(currentFilters, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Filter Component:</h2>
        <FilterComponent
          productTypes={productTypes}
          occasions={occasions}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          isVisible={showFilters}
          onToggleVisibility={() => setShowFilters(!showFilters)}
          totalProducts={50}
          filteredCount={25}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Debug Info:</h2>
        <ul className="text-sm space-y-1">
          <li>Product Types: {productTypes.length}</li>
          <li>Occasions: {occasions.length}</li>
          <li>Show Filters: {showFilters ? 'Yes' : 'No'}</li>
        </ul>
      </div>
    </div>
  );
}
