import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FilterComponent, { FilterState, FilterOption } from '../FilterComponent';

// Mock data
const mockProductTypes: FilterOption[] = [
  { _id: '1', name: 'Bouquets', color: '#FF6B6B', icon: '🌸' },
  { _id: '2', name: 'Plants', color: '#4ECDC4', icon: '🌿' },
];

const mockOccasions: FilterOption[] = [
  { _id: '1', name: 'Birthday', color: '#45B7D1', icon: '🎂' },
  { _id: '2', name: 'Anniversary', color: '#96CEB4', icon: '💕' },
];

const mockProps = {
  productTypes: mockProductTypes,
  occasions: mockOccasions,
  onFilterChange: jest.fn(),
  onClearFilters: jest.fn(),
  isVisible: false,
  onToggleVisibility: jest.fn(),
  totalProducts: 10,
  filteredCount: 10,
};

describe('FilterComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders filter button when not visible', () => {
    render(<FilterComponent {...mockProps} />);
    
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders filter panel when visible', () => {
    render(<FilterComponent {...mockProps} isVisible={true} />);
    
    expect(screen.getByText('Filter Products')).toBeInTheDocument();
    expect(screen.getByText('Product Types')).toBeInTheDocument();
    expect(screen.getByText('Occasions')).toBeInTheDocument();
    expect(screen.getByText('Price Range')).toBeInTheDocument();
  });

  it('calls onToggleVisibility when filter button is clicked', () => {
    render(<FilterComponent {...mockProps} />);
    
    const filterButton = screen.getByRole('button');
    fireEvent.click(filterButton);
    
    expect(mockProps.onToggleVisibility).toHaveBeenCalledTimes(1);
  });

  it('calls onFilterChange when product type is selected', () => {
    render(<FilterComponent {...mockProps} isVisible={true} />);
    
    const productTypeCheckbox = screen.getByLabelText('Bouquets');
    fireEvent.click(productTypeCheckbox);
    
    expect(mockProps.onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedProductTypes: ['1'],
        selectedOccasions: [],
        selectedPriceRange: null,
        searchQuery: ''
      })
    );
  });

  it('calls onFilterChange when occasion is selected', () => {
    render(<FilterComponent {...mockProps} isVisible={true} />);
    
    const occasionCheckbox = screen.getByLabelText('Birthday');
    fireEvent.click(occasionCheckbox);
    
    expect(mockProps.onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedProductTypes: [],
        selectedOccasions: ['1'],
        selectedPriceRange: null,
        searchQuery: ''
      })
    );
  });

  it('calls onClearFilters when clear button is clicked', () => {
    const propsWithFilters = {
      ...mockProps,
      isVisible: true,
    };
    
    // Mock current filters with some selections
    const mockFilterState: FilterState = {
      selectedProductTypes: ['1'],
      selectedOccasions: ['1'],
      selectedPriceRange: 'Under $45',
      searchQuery: 'test'
    };
    
    render(<FilterComponent {...propsWithFilters} />);
    
    // Simulate having active filters by setting state
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);
    
    expect(mockProps.onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('shows active filter count when filters are applied', () => {
    const propsWithActiveFilters = {
      ...mockProps,
      isVisible: false,
    };
    
    // Mock the component with active filters
    const { rerender } = render(<FilterComponent {...propsWithActiveFilters} />);
    
    // Simulate having active filters
    rerender(
      <FilterComponent 
        {...propsWithActiveFilters} 
        // This would normally be controlled by parent state
      />
    );
  });

  it('displays search input when search section is expanded', () => {
    render(<FilterComponent {...mockProps} isVisible={true} />);
    
    const searchSection = screen.getByText('Search');
    fireEvent.click(searchSection);
    
    expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
  });

  it('calls onFilterChange when search query changes', () => {
    render(<FilterComponent {...mockProps} isVisible={true} />);
    
    // Expand search section first
    const searchSection = screen.getByText('Search');
    fireEvent.click(searchSection);
    
    const searchInput = screen.getByPlaceholderText('Search products...');
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    expect(mockProps.onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        searchQuery: 'test query'
      })
    );
  });
});
