# FilterComponent

A reusable filter component for filtering products by occasions, product types, and pricing ranges.

## Features

- **Product Types Filter**: Multi-select checkboxes for different product categories
- **Occasions Filter**: Multi-select checkboxes for different occasions (with seasonal indicators)
- **Price Range Filter**: Radio button selection for predefined price ranges
- **Search Filter**: Text input for searching products by name, description, or tags
- **Collapsible Sections**: Each filter section can be expanded/collapsed
- **Active Filter Count**: Shows number of active filters in the button
- **Clear All**: Button to reset all filters at once
- **Responsive Design**: Works on desktop and mobile devices

## Usage

```tsx
import FilterComponent, { FilterState, FilterOption } from '@/components/FilterComponent';

const MyComponent = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    selectedProductTypes: [],
    selectedOccasions: [],
    selectedPriceRange: null,
    searchQuery: ''
  });

  const handleFilterChange = (filters: FilterState) => {
    setCurrentFilters(filters);
    // Apply filters to your product list
  };

  const handleClearFilters = () => {
    setCurrentFilters({
      selectedProductTypes: [],
      selectedOccasions: [],
      selectedPriceRange: null,
      searchQuery: ''
    });
  };

  return (
    <FilterComponent
      productTypes={productTypes}
      occasions={occasions}
      onFilterChange={handleFilterChange}
      onClearFilters={handleClearFilters}
      isVisible={showFilters}
      onToggleVisibility={() => setShowFilters(!showFilters)}
      totalProducts={products.length}
      filteredCount={filteredProducts.length}
    />
  );
};
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `productTypes` | `FilterOption[]` | Yes | Array of product type options |
| `occasions` | `FilterOption[]` | Yes | Array of occasion options |
| `priceRanges` | `PriceRange[]` | No | Array of price range options (defaults to predefined ranges) |
| `onFilterChange` | `(filters: FilterState) => void` | Yes | Callback when filters change |
| `onClearFilters` | `() => void` | Yes | Callback when clear filters is clicked |
| `isVisible` | `boolean` | Yes | Whether the filter panel is visible |
| `onToggleVisibility` | `() => void` | Yes | Callback to toggle filter panel visibility |
| `totalProducts` | `number` | Yes | Total number of products |
| `filteredCount` | `number` | Yes | Number of products after filtering |
| `className` | `string` | No | Additional CSS classes |

## Types

### FilterOption
```tsx
interface FilterOption {
  _id: string;
  name: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
  isSeasonal?: boolean;
  sortOrder?: number;
}
```

### FilterState
```tsx
interface FilterState {
  selectedProductTypes: string[];
  selectedOccasions: string[];
  selectedPriceRange: string | null;
  searchQuery: string;
}
```

### PriceRange
```tsx
interface PriceRange {
  min: number;
  max: number;
  label: string;
}
```

## Default Price Ranges

The component comes with predefined price ranges (in cents):
- Under $45 (0 - 4500)
- $45 - $55 (4500 - 5500)
- $60 - $80 (6000 - 8000)
- $80 - $120 (8000 - 12000)
- $100 - $150 (10000 - 15000)
- Over $150 (15000+)

## Styling

The component uses a consistent theme object that matches the existing design:
- Background: `#F0E7F2`
- Primary: `#664b39`
- Secondary: `#E07A5F`
- Text colors and borders are defined in the theme

## Example Integration

See `FilterComponentExample.tsx` for a complete working example of how to integrate the FilterComponent into your application.

## Testing

The component includes comprehensive tests in `__tests__/FilterComponent.test.tsx` covering:
- Rendering in different states
- User interactions
- Filter state changes
- Clear functionality
- Search functionality
