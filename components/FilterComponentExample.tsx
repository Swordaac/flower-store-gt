'use client';

import React, { useState, useEffect } from 'react';
import FilterComponent, { FilterState, FilterOption } from './FilterComponent';

// Example usage of FilterComponent
export const FilterComponentExample: React.FC = () => {
  const [productTypes, setProductTypes] = useState<FilterOption[]>([]);
  const [occasions, setOccasions] = useState<FilterOption[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    selectedProductTypes: [],
    selectedOccasions: [],
    selectedPriceRange: null,
    searchQuery: '',
    selectedColors: [],
    bestSeller: false,
    minPrice: null,
    maxPrice: null
  });

  // Mock data - in real app, this would come from API
  useEffect(() => {
    setProductTypes([
      { _id: '1', name: 'Bouquets', color: '#FF6B6B', icon: '🌸' },
      { _id: '2', name: 'Plants', color: '#4ECDC4', icon: '🌿' },
      { _id: '3', name: 'Arrangements', color: '#45B7D1', icon: '💐' },
      { _id: '4', name: 'Wreaths', color: '#96CEB4', icon: '🌹' },
    ]);

    setOccasions([
      { _id: '1', name: 'Birthday', color: '#45B7D1', icon: '🎂' },
      { _id: '2', name: 'Anniversary', color: '#96CEB4', icon: '💕' },
      { _id: '3', name: 'Wedding', color: '#FECA57', icon: '💒' },
      { _id: '4', name: 'Sympathy', color: '#A55EEA', icon: '🕊️' },
      { _id: '5', name: 'Get Well Soon', color: '#26DE81', icon: '🌻' },
    ]);
  }, []);

  const handleFilterChange = (filters: FilterState) => {
    setCurrentFilters(filters);
    console.log('Filters changed:', filters);
  };

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
    });
    console.log('Filters cleared');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Filter Component Example</h1>
      
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
        <h2 className="text-lg font-semibold mb-4">Usage Instructions:</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Click the "Filters" button to open the filter panel</li>
          <li>Select product types, occasions, or price ranges</li>
          <li>Use the search input to filter by product name or description</li>
          <li>Click "Clear All" to reset all filters</li>
          <li>Click the "X" button to close the filter panel</li>
        </ol>
      </div>
    </div>
  );
};

export default FilterComponentExample;
